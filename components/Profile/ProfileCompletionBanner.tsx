import React from 'react';
import { Pressable, Text, StyleSheet, Animated } from 'react-native';

interface Props {
  percent: number;
  pulseAnim: Animated.Value;
  onPress: () => void;
}

const ProfileCompletionBanner = ({ percent, pulseAnim, onPress }: Props) => {
  if (percent >= 80) {return null;}

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <Pressable style={[styles.outlinedButton, styles.pulsing]} onPress={onPress}>
        <Text style={styles.buttonText}>🧠 Complete Profile</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outlinedButton: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4fc3f7',
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
  },
  pulsing: {
    borderColor: '#4fc3f7',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default ProfileCompletionBanner;
