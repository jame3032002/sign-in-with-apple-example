const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserSchema = new Schema({
  name: String,
  email: String,
  appleUid: String
}, { timestamps: true, collection: 'user' })

const UserModel = mongoose.model('User', UserSchema)

module.exports = UserModel
