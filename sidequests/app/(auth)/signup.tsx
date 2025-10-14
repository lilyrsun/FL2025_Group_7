import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import GoogleSignInButton from "../../components/google-sign-in-button";
import { RootStackParamList } from "../../types/nav";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "signup">;

const Signup = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <LinearGradient
      colors={["#6a5acd", "#00c6ff", "#9b59b6"]}
      style={styles.container}
    >
      <BlurView intensity={90} tint="light" style={styles.glassCard}>
        <Text style={styles.title}>Welcome! ✨</Text>
        <Text style={styles.subtitle}>Sign up to start your sidequesting</Text>

        <View style={styles.buttons}>
          <GoogleSignInButton />

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate("login")}
          >
            <Text style={styles.loginText}>
              Already have an account? Log in
            </Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </LinearGradient>
  );
};

export default Signup;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  glassCard: {
    width: "90%",
    padding: 28,
    borderRadius: 24,
    overflow: "hidden",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 32,
    textAlign: "center",
  },
  buttons: {
    width: "100%",
    gap: 16,
  },
  loginBtn: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    alignItems: "center",
  },
  loginText: {
    color: "#fff",
    fontWeight: "600",
  },
});