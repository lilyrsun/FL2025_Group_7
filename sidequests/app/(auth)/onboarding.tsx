import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Swiper from "react-native-swiper";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { setHasSeenOnboarding } from "../../lib/onboarding";

type RootStackParamList = {
  onboarding: undefined;
  login: undefined;
  signup: undefined;
};

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "onboarding"
>;

const { width } = Dimensions.get("window");

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
        <Swiper
          loop={false}
          showsButtons={false}
          dot={<View style={styles.dot} />}
          activeDot={<View style={styles.activeDot} />}
          paginationStyle={styles.pagination}
        >
          {/* Screen 1 */}
          <View style={styles.slide}>
            <Text style={styles.title}>✨ Welcome to Sidequests</Text>
            <Text style={styles.subtitle}>
              Find fun things to do nearby — from spontaneous hangouts to planned
              events. Your city is full of sidequests waiting to be discovered.
            </Text>
          </View>

          {/* Screen 2 */}
          <View style={styles.slide}>
            <Text style={styles.title}>📅 RSVP Events</Text>
            <Text style={styles.subtitle}>
              See upcoming events around you, RSVP with a tap, and check who’s
              already going. From food crawls to pickup games, your calendar just
              got more exciting.
            </Text>
          </View>

          {/* Screen 3 */}
          <View style={styles.slide}>
            <Text style={styles.title}>⚡ Spontaneous Mode</Text>
            <Text style={styles.subtitle}>
              Feeling free right now? Mark yourself as available, share what
              you're up to, and let others join in. Perfect for spontaneous
              adventures.
            </Text>
          </View>

          {/* Final CTA */}
          <View style={styles.slide}>
            <Text style={styles.title}>🎉 Ready to start?</Text>
            <Text style={styles.subtitle}>
              Sign up to join the community or log in if you're already with us.
            </Text>

            <View style={styles.buttons}>
              <TouchableOpacity style={styles.ctaButton} onPress={handleSignup}>
                <Text style={styles.ctaText}>Get Started</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleLogin}
              >
                <Text style={styles.secondaryText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Swiper>
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
    height: "75%",
    paddingVertical: 24,
    borderRadius: 24,
    overflow: "hidden",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  slide: {
    flex: 1,
    width: width * 0.9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 22,
  },
  pagination: {
    bottom: 20,
  },
  dot: {
    backgroundColor: "rgba(255,255,255,0.4)",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: "#fff",
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 3,
  },
  buttons: {
    marginTop: 32,
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
