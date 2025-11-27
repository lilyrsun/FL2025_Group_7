import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type GradientButtonProps = {
  onPress: () => void;
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  isActive?: boolean;
  position?: 'bottom-right' | 'custom';
  customStyle?: ViewStyle;
};

const GradientButton: React.FC<GradientButtonProps> = ({
  onPress,
  iconName,
  label,
  isActive = false,
  position = 'bottom-right',
  customStyle,
}) => {
  const borderStyle: ViewStyle = position === 'bottom-right' 
    ? styles.bottomRightPosition
    : customStyle || {};

  return (
    <LinearGradient
      colors={['#6a5acd', '#00c6ff', '#9b59b6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.buttonBorder, borderStyle]}
    >
      <TouchableOpacity
        style={[styles.button, isActive && styles.buttonActive]}
        onPress={onPress}
      >
        <Ionicons
          name={iconName}
          size={20}
          color="#fff"
        />
        <Text style={styles.buttonText}>
          {label}
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  buttonBorder: {
    borderRadius: 22,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 1000,
  },
  bottomRightPosition: {
    position: 'absolute',
    bottom: 90, // 60px (tab bar) + 20px (padding) + 10px (extra space)
    right: 20,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonActive: {
    backgroundColor: 'rgba(255, 99, 71, 0.3)',
    borderColor: 'rgba(255, 99, 71, 0.5)',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default GradientButton;
