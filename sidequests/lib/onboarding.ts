import AsyncStorage from "@react-native-async-storage/async-storage";

const HAS_SEEN_ONBOARDING_KEY = "hasSeenOnboarding";

export async function hasSeenOnboarding(): Promise<boolean> {
  const value = await AsyncStorage.getItem(HAS_SEEN_ONBOARDING_KEY);
  return value === "true";
}

export async function setHasSeenOnboarding() {
  await AsyncStorage.setItem(HAS_SEEN_ONBOARDING_KEY, "true");
}