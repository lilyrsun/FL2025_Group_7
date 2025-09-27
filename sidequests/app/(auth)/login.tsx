import React from "react";
import { View, Text, StyleSheet } from "react-native";
import GoogleSignInButton from "../../components/google-sign-in-button";

const Login = () => {
  console.log("login")
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back to Sidequests</Text>
      <Text style={styles.subtitle}>Login to continue</Text>

      <View style={styles.buttons}>
        <GoogleSignInButton />
      </View>
    </View>
  );
}

export default Login

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
    marginBottom: 32,
  },
  buttons: {
    width: "100%",
    gap: 16,
  },
});