import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

type Variant = 'default' | 'green' | 'blue' | 'redSolid';

interface DashboardButtonProps {
  text?: string; // optional now (for future complex children)
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  children?: React.ReactNode; // allow luxury multi-line buttons later
}

const DashboardButton: React.FC<DashboardButtonProps> = ({
  text,
  onPress,
  variant = 'default',
  disabled = false,
  style,
  textStyle,
  children,
}) => {
  const buttonVariant = () => {
    switch (variant) {
      case 'green':
        return styles.greenVariant;
      case 'blue':
        return styles.blueVariant;
      case 'redSolid':
        return styles.redVariant;
      default:
        return styles.defaultVariant;
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.baseButton,
        buttonVariant(),
        pressed && styles.pressedButton,
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {children ? (
        children // luxury multi-line content support
      ) : (
        <Text style={[styles.buttonText, textStyle]}>{text}</Text>
      )}
    </Pressable>
  );
};

export default DashboardButton;

const styles = StyleSheet.create({
  // Base dark premium style
  baseButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,

    // Subtle premium shadow
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },

  // Variants with subtle glow
  defaultVariant: {
    backgroundColor: '#202124',
  paddingVertical: 14,
  borderRadius: 12,
  alignItems: 'center',
  marginTop: 16,
  shadowColor: '#FFD54F',
  shadowOpacity: 0.15,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 6,
  elevation: 3,
  },
  greenVariant: {
    backgroundColor: '#202124',
    borderWidth: 1,
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
  },
  blueVariant: {
    backgroundColor: '#202124',
    borderWidth: 1,
    borderColor: '#2196F3',
    shadowColor: '#2196F3',
  },
  redVariant: {
    backgroundColor: '#202124',
    borderWidth: 1,
    borderColor: '#F44336',
    shadowColor: '#F44336',
  },

  // Pressed tactile feel
  pressedButton: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },

  // Disabled style
  disabledButton: {
    opacity: 0.6,
    shadowOpacity: 0,
  },

  // Premium text styling
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});
