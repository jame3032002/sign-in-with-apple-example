const express = require('express')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bodyParser = require('body-parser')
const UserModel = require('./models/UserModel')
const { jwtVerify } = require('jose/jwt/verify')
const { createRemoteJWKSet } = require('jose/jwks/remote')
const app = express()
const PORT = 2000
const APPLE_AUTH_KEY_URL = 'https://appleid.apple.com/auth/keys'

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.post('/authentication', async (req, res) => {
  const { token } = req.body

  try {
    const JWKS = createRemoteJWKSet(new URL(APPLE_AUTH_KEY_URL))
    const verified = await jwtVerify(token, JWKS)
    const isExpired = (new Date().getTime()) > (verified.payload.exp * 1000)

    if (isExpired) {
      throw Error('Token is expired')
    }

    const { email, sub: appleUid } = verified.payload
    const isExists = await UserModel.findOne({ email })
    let user

    // ถ้าไม่มีให้ Register
    if (!isExists) {
      user = await UserModel({ email, appleUid }).save()
    } else { // ถ้ามีให้ update updatedAt
      user = await UserModel.findOneAndUpdate({ email }, { $set: { updatedAt: Date.now() } }, { new: true })
    }

    const accessToken = jwt.sign({ appleUid, email }, process.env.ACCESS_TOKEN_SIGNATURE, { expiresIn: '30 days' })

    return res.json({ user, accessToken })
  } catch (error) {
    console.log(error.message)
    return res.status(400).json({ result: false, message: 'Invalid token' })
  }
})

app.get('/me', async (req, res) => {
  const accessToken = req.headers['x-access-token']
  let user = null

  if (accessToken) {
    const isValid = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SIGNATURE)

    if (isValid) {
      const { email } = isValid
      user = await UserModel.findOneAndUpdate({ email }, { $set: { updatedAt: Date.now() } }, { new: true })
    }
  }

  return res.json({ user })
})


app.listen(PORT, () => {
  console.log(`Ready to run on: http://localhost:${PORT}`)
})

const mongooseConfig = {
  useFindAndModify: false,
  useNewUrlParser: true,
  useUnifiedTopology: true
}

mongoose.connect(process.env.MONGO_SERVER, mongooseConfig)
const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', () => { console.log('mongoose connected!') })