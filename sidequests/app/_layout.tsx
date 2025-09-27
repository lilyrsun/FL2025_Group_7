import { Stack, Redirect } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { hasSeenOnboarding } from "../lib/onboarding";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function RootNavigator() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [seenOnboarding, setSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const seen = await hasSeenOnboarding();
        setSeenOnboarding(seen);
      } catch (e) {
        console.error("Error loading onboarding state:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return null; // Could replace with a splash screen

  // Redirect logic
  if (!user && !seenOnboarding) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  if (!user && seenOnboarding) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(main)/home" />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <GestureHandlerRootView>
        <Stack screenOptions={{ headerShown: false }} />
        <RootNavigator />
      </GestureHandlerRootView>
    </AuthProvider>
  );
}