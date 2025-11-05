import React, { useRef } from 'react';
import { Animated, StyleSheet, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

interface AnimatedScreenProps {
  children: React.ReactNode;
  direction?: 'left' | 'right';
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AnimatedScreen({ children, direction = 'left' }: AnimatedScreenProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      // Set initial position - start completely off-screen
      const startX = direction === 'left' ? SCREEN_WIDTH : -SCREEN_WIDTH;
      slideAnim.setValue(startX);
      
      // Small delay to ensure previous screen is still visible
      setTimeout(() => {
        // Animate in when screen comes into focus - slide onto screen
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 40,
          velocity: 0.5,
        }).start();
      }, 50);

      return () => {
        // Reset position when leaving (for next time)
      };
    }, [slideAnim, direction])
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    flex: 1,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
});

