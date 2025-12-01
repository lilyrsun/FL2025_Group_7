import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
};

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  iconName,
  iconSize = 20,
}) => {
  const isDisabled = disabled || loading;
  const displayText = loading ? 'Loading...' : title;

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      disabled={isDisabled}
    >
      <LinearGradient
        colors={isDisabled ? ['#a8a8a8', '#888888'] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.buttonGradient, iconName && styles.buttonGradientWithIcon]}
      >
        {iconName && (
          <Ionicons name={iconName} size={iconSize} color="#fff" />
        )}
        <Text style={[styles.buttonText, textStyle]}>
          {displayText}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  buttonGradient: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 20,
  },
  buttonGradientWithIcon: {
    flexDirection: 'row',
    gap: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default PrimaryButton;

