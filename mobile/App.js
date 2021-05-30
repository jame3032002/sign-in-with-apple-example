import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { StatusBar } from 'expo-status-bar'
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native'
import * as AppleAuthentication from 'expo-apple-authentication'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function App() {
  const [me, setMe] = useState(null)

  useEffect(() => {
    const getMe = async () => {
      const accessToken = await AsyncStorage.getItem('accessToken')
      if (accessToken) {
        const response = await axios.get('http://192.168.1.38:2000/me', {
          headers: {
            'x-access-token': accessToken
          }
        })

        setMe(response.data.user)
      }
    }

    getMe()
  }, [])

  const handleLoginWithApple = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })

      const { identityToken } = credential
      const response = await axios.post('http://192.168.1.38:2000/authentication', { token: identityToken })
      const isLoggedIn = response.data.user
      if (isLoggedIn) {
        await AsyncStorage.setItem('accessToken', response.data.accessToken)
        setMe(response.data.user)
      }
    } catch (e) {
      if (e.code === 'ERR_CANCELED') {
        // handle that the user canceled the sign-in flow
      } else {
        // handle other errors
      }
    }
  }

  const handleLogout = async () => {
    await AsyncStorage.removeItem('accessToken')
    setMe(null)
  }

  return (
    <View style={styles.container}>
      {
        me ? <View>
          <Text>{me.email}</Text>
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.buttonStyle}>
            <Text style={styles.buttonTextStyle}>LOGOUT</Text>
          </TouchableOpacity>
        </View>
          : <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={5}
            style={{ width: 200, height: 44 }}
            onPress={handleLoginWithApple}
          />
      }
      <StatusBar style="auto" />
    </View >
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonStyle: {
    fontSize: 16,
    color: 'white',
    backgroundColor: 'green',
    padding: 5,
    marginTop: 32,
    minWidth: 250,
  },
  buttonTextStyle: {
    padding: 5,
    color: 'white',
    textAlign: 'center',
  },
})
