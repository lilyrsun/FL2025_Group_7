import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";
import { setHasSeenOnboarding } from "../../lib/onboarding";
import React from 'react'

const Onboarding = () => {
  const router = useRouter()

  async function signup() {
    await setHasSeenOnboarding()
    router.replace("/signup")
  }

  async function login() {
    await setHasSeenOnboarding()
    router.replace("/login")
  }

  return (
    <View>
      <Text>Welcome to Sidequests</Text>
      <Button title="Get Started" onPress={signup} />
      <Button title="Login" onPress={login} />
    </View>
  )
}

export default Onboarding