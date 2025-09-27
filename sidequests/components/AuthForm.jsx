import React from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import GoogleSignInButton from './google-sign-in-button'
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function AuthForm() {
  return (
    <View style={styles.container}>

      <GoogleSignInButton />

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
    width: "100%"
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
})