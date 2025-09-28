import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import GoogleSignInButton from "../../components/google-sign-in-button";
import { RootStackParamList } from "../../types/nav";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "login">;

const Login = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <LinearGradient
      colors={["#6a11cb", "#2575fc"]}
      style={styles.container}
    >
      <BlurView intensity={90} tint="light" style={styles.glassCard}>
        <Text style={styles.title}>Welcome back ✨</Text>
        <Text style={styles.subtitle}>Login to continue your Sidequests</Text>

        <View style={styles.buttons}>
          <GoogleSignInButton />

          {/* Signup Button */}
          <TouchableOpacity
            style={styles.signupBtn}
            onPress={() => navigation.navigate("signup")}
          >
            <Text style={styles.signupText}>Don't have an account? Sign up</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </LinearGradient>
  );
};

export default Login;

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
  signupBtn: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    alignItems: "center",
  },
  signupText: {
    color: "#fff",
    fontWeight: "600",
  },
});
