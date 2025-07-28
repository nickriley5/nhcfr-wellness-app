import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface MealCardProps {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  photoUri?: string | null;
}

const MealCard: React.FC<MealCardProps> = ({ name, calories, protein, carbs, fat }) => (
  <View style={styles.mealCard}>
    <View style={styles.mealCardContent}>
      <Text style={styles.mealName}>{name}</Text>
      <Text style={styles.mealCalories}>{calories} kcal</Text>
      <View style={styles.mealMacroRow}>
        <Text style={[styles.mealMacro, styles.proteinColor]}>P {protein}g</Text>
        <Text style={[styles.mealMacro, styles.carbColor]}>C {carbs}g</Text>
        <Text style={[styles.mealMacro, styles.fatColor]}>F {fat}g</Text>
      </View>
    </View>
  </View>
);

export default MealCard;

const styles = StyleSheet.create({
  mealCard: {
    flexDirection: 'row',
    backgroundColor: '#1f1f1f',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  mealCardContent: { flex: 1 },
  mealName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mealCalories: {
    color: '#FFD54F',
    marginTop: 4,
  },
  mealMacroRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  mealMacro: {
    marginRight: 12,
    fontWeight: '500',
  },
  proteinColor: { color: '#4FC3F7' },
  carbColor: { color: '#81C784' },
  fatColor: { color: '#F06292' },
});
