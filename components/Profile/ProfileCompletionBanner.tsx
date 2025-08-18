import React, { useEffect, useState } from 'react';
import { Pressable, Text, StyleSheet, Animated } from 'react-native';

interface Props {
  percent: number;
  pulseAnim: Animated.Value;
  onPress: () => void;
}

const ProfileCompletionBanner = ({ percent, pulseAnim, onPress }: Props) => {
  const [borderColorAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (percent < 80) {
      // Start border color animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(borderColorAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(borderColorAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [percent, borderColorAnim]);

  if (percent >= 80) {return null;}

  const borderColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#4fc3f7', '#ff6b47'], // Blue to orange/red flash
  });

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <Animated.View style={[styles.outlinedButton, { borderColor }]}>
        <Pressable style={styles.pressableArea} onPress={onPress}>
          <Text style={styles.buttonText}>🧠 Complete Profile</Text>
          <Text style={styles.urgentText}>Tap to finish setup!</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outlinedButton: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#4fc3f7',
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
  },
  pressableArea: {
    width: '100%',
    alignItems: 'center',
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
  urgentText: {
    color: '#ff6b47',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    opacity: 0.9,
  },
});

export default ProfileCompletionBanner;
