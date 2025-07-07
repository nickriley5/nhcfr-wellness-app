// DashboardButton.tsx
import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';

interface Props {
  text: string;
  onPress: () => void;
  variant?: 'default' | 'green' | 'blue' | 'redSolid';
  disabled?: boolean;
  style?: ViewStyle;
}

const DashboardButton = ({
  text,
  onPress,
  variant = 'default',
  disabled = false,
  style,
}: Props) => {
  const getButtonStyle = () => {
    switch (variant) {
      case 'green':
        return styles.green;
      case 'blue':
        return styles.blue;
      case 'redSolid':
        return styles.redSolid;
      default:
        return styles.default;
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        getButtonStyle(),
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.text}>{text}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  default: {
    backgroundColor: '#2a2a2a',
    borderColor: '#d32f2f',
  },
  green: {
    backgroundColor: '#388e3c',
    borderColor: '#388e3c',
  },
  blue: {
    backgroundColor: '#1e88e5',
    borderColor: '#1e88e5',
  },
  redSolid: {
    backgroundColor: '#d32f2f',
    borderColor: '#d32f2f',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingLeft: 10,
    paddingRight: 10,
  },
});

export default DashboardButton;
