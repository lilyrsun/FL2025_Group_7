import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { hasSeenOnboarding } from "../../lib/onboarding";

export default function AuthLayout() {

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="login" />
    </Stack>
  );
}