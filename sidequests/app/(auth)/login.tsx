import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import AuthForm from '../../components/AuthForm'
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth'

const Login = () => {
  useSupabaseAuth()

  return (
    <View style={styles.container}>
      <Text>Login</Text>
      <AuthForm />
    </View>
  )
}

export default Login

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    width: "100%"
  },
});