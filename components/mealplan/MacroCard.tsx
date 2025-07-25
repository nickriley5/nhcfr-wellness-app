import React, { useState } from 'react';
import { Pressable, Text, StyleSheet, Animated } from 'react-native';

interface MacroCardProps {
  label: string;
  logged: number;
  target: number;
  unit: string;
  variant: 'protein' | 'carb' | 'fat' | 'calories';
}

const MacroCard: React.FC<MacroCardProps> = ({ label, logged, target, unit, variant }) => {
  const colorStyles = {
    protein: styles.proteinColor,
    carb: styles.carbColor,
    fat: styles.fatColor,
    calories: styles.calorieColor,
  }[variant];

  const [flipped, setFlipped] = useState(false);
  const fadeAnim = useState(new Animated.Value(1))[0];
  const remaining = Math.max(0, target - logged);

  const toggleFlip = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start(() => setFlipped(!flipped));
  };

  return (
    <Pressable onPress={toggleFlip} style={[styles.macroCard, colorStyles]}>
      <Animated.View style={[{ opacity: fadeAnim }, styles.animatedContainer]}>
        {!flipped ? (
          <>
            <Text style={styles.macroValue}>
              {Math.min(logged, target)} / {target}
              {variant === 'calories' ? '' : ` ${unit}`}
            </Text>
            <Text style={styles.macroLabel}>{label}</Text>
          </>
        ) : (
          <>
            <Text style={styles.macroValue}>
              {remaining}
              {variant === 'calories' ? '' : ` ${unit}`}
            </Text>
            <Text style={styles.macroLabel}>Remaining</Text>
          </>
        )}
      </Animated.View>
    </Pressable>
  );
};

export default MacroCard;

const styles = StyleSheet.create({
  macroCard: {
    width: '48%',
    paddingVertical: 16,
    backgroundColor: '#1f1f1f',
    borderRadius: 14,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  animatedContainer: {
    alignItems: 'center',
  },
  macroValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  macroLabel: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  calorieColor: { borderColor: '#FFD54F' },
  proteinColor: { borderColor: '#4FC3F7', color: '#4FC3F7' },
  carbColor: { borderColor: '#81C784', color: '#81C784' },
  fatColor: { borderColor: '#F06292', color: '#F06292' },
});
