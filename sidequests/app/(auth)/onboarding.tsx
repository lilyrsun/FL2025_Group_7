import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { setHasSeenOnboarding } from "../../lib/onboarding";
import { RootStackParamList } from "../../types/nav";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "onboarding">;

const Onboarding = () => {
  const navigation = useNavigation<NavigationProp>();

  async function handleSignup() {
    await setHasSeenOnboarding();
    navigation.replace("signup");
  }

  async function handleLogin() {
    await setHasSeenOnboarding();
    navigation.replace("login");
  }

  return (
    <LinearGradient colors={["#6a11cb", "#2575fc"]} style={styles.container}>
      <BlurView intensity={90} tint="light" style={styles.glassCard}>
        <Text style={styles.title}>Welcome to Sidequests ✨</Text>
        <Text style={styles.subtitle}>
          Choose your path to start your adventure
        </Text>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.ctaButton} onPress={handleSignup}>
            <Text style={styles.ctaText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleLogin}>
            <Text style={styles.secondaryText}>Login</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </LinearGradient>
  );
};

export default Onboarding;

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
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
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
  ctaButton: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  ctaText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  secondaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
