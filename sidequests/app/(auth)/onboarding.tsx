import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { setHasSeenOnboarding } from "../../lib/onboarding";
import React from 'react'

const Onboarding = () => {
  console.log("onboarding")
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
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Sidequests</Text>

      <Text style={styles.subtitle}>New here?</Text>
      <TouchableOpacity style={styles.buttons} onPress={() => signup()}>
        <Text>Get Started</Text>
      </TouchableOpacity>

      <Text style={styles.subtitle}>Returning?</Text>
      <TouchableOpacity style={styles.buttons} onPress={() => login()}>
        <Text>Login</Text>
      </TouchableOpacity>

    </View>
  )
}

export default Onboarding

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginVertical: 32
  },
  buttons: {
    width: "100%",
    gap: 16,
    backgroundColor: 'lightgray',
    padding: 12
  },
});