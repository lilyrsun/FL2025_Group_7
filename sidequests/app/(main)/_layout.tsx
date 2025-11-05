import { Stack, useRouter, useSegments } from "expo-router";
import { Image, Animated, TouchableOpacity, View, StyleSheet } from "react-native";
import { useRef, useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

// Animated Icon Component
function AnimatedTabIcon({ 
  source, 
  size, 
  focused,
  onPress 
}: { 
  source: any; 
  size: number; 
  focused: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (focused) {
      // Animate press down effect, then scale up when focused
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 0.85,
          useNativeDriver: true,
          friction: 3,
          tension: 40,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1.1,
          useNativeDriver: true,
          friction: 3,
          tension: 40,
        }),
      ]).start();
    } else {
      // Scale back to normal when not focused
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 3,
        tension: 40,
      }).start();
    }
  }, [focused]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Image
          source={source}
          style={{ width: size*2.5, height: size*2.5, resizeMode: "contain" }}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

// Custom Tab Bar Component
function CustomTabBar({ onNavigate }: { onNavigate?: (route: string, previousRoute: string) => void }) {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  
  // Determine which tab is active based on current route
  const currentRoute = segments[segments.length - 1] || 'home';
  const isHome = currentRoute === 'home';
  const isPlot = currentRoute === 'your-plot';
  const isProfile = currentRoute === 'profile' || segments.includes('profile');

  const handleNavigation = (route: string) => {
    if (onNavigate) {
      onNavigate(route, currentRoute);
    }
    if (route === 'home' && !isHome) {
      router.replace('/(main)/home');
    } else if (route === 'plot' && !isPlot) {
      router.replace('/(main)/your-plot');
    } else if (route === 'profile' && !isProfile) {
      router.replace('/(main)/profile');
    }
  };

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom }]}>
      <AnimatedTabIcon
        source={require("../../assets/icons/map.png")}
        size={24}
        focused={isHome}
        onPress={() => handleNavigation('home')}
      />
      <AnimatedTabIcon
        source={require("../../assets/icons/plot.png")}
        size={24}
        focused={isPlot}
        onPress={() => handleNavigation('plot')}
      />
      <AnimatedTabIcon
        source={require("../../assets/icons/profile.png")}
        size={24}
        focused={isProfile}
        onPress={() => handleNavigation('profile')}
      />
    </View>
  );
}

// Helper to determine animation direction based on route order
function getAnimationDirection(currentRoute: string, previousRoute: string): 'slide_from_right' | 'slide_from_left' {
  // Define route order: home (left) < your-plot (middle) < profile (right)
  const routeOrder: { [key: string]: number } = {
    'home': 0,
    'your-plot': 1,
    'profile': 2,
  };

  const currentOrder = routeOrder[currentRoute] ?? 1;
  const previousOrder = routeOrder[previousRoute] ?? 1;

  // If moving right (higher order), slide from right
  // If moving left (lower order), slide from left
  if (currentOrder > previousOrder) {
    return 'slide_from_right';
  } else {
    return 'slide_from_left';
  }
}

export default function MainLayout() {
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1] || 'home';
  const previousRouteRef = useRef<string>('home');
  
  // Track previous route when navigation happens
  useEffect(() => {
    // This will run after navigation completes
    const timer = setTimeout(() => {
      if (currentRoute !== previousRouteRef.current) {
        previousRouteRef.current = currentRoute;
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [currentRoute]);

  const handleNavigation = (route: string, prevRoute: string) => {
    // Store the previous route before navigation
    previousRouteRef.current = prevRoute;
  };

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          presentation: 'card',
          animationTypeForReplace: 'push',
        }}
      >
        <Stack.Screen 
          name="home" 
          getId={() => `home-${previousRouteRef.current}`}
          options={() => {
            const prevRoute = previousRouteRef.current || 'home';
            return {
              animation: getAnimationDirection('home', prevRoute),
            };
          }}
        />
        <Stack.Screen 
          name="your-plot" 
          getId={() => `plot-${previousRouteRef.current}`}
          options={() => {
            const prevRoute = previousRouteRef.current || 'home';
            return {
              animation: getAnimationDirection('your-plot', prevRoute),
            };
          }}
        />
        <Stack.Screen 
          name="profile" 
          getId={() => `profile-${previousRouteRef.current}`}
          options={() => {
            const prevRoute = previousRouteRef.current || 'home';
            return {
              animation: getAnimationDirection('profile', prevRoute),
            };
          }}
        />
      </Stack>
      <CustomTabBar onNavigate={handleNavigation} />
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#DCF2F9',
    height: 60,
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
});