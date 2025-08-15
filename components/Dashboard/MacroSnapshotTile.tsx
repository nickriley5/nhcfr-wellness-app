// components/dashboard/MacroSnapshotTile.tsx
import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

type MacroRow = { eaten: number; goal?: number; remaining?: number };

type Props = {
  calories: MacroRow; // { eaten, goal, remaining }
  protein: MacroRow;
  carbs: MacroRow;
  fat: MacroRow;
  onLogFoodPress: () => void;
};

export default memo(function MacroSnapshotTile({ calories, protein, carbs, fat, onLogFoodPress }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Macro Snapshot</Text>
        <Pressable onPress={onLogFoodPress} style={styles.logButton}>
          <Text style={styles.logButtonText}>+ Log Food</Text>
        </Pressable>
      </View>

      {/* 🔥 MacroCard Style Grid - Exactly like MealPlanScreen */}
      <View style={styles.macroRowTop}>
        {/* Calories Card */}
        <View style={[styles.macroCard, styles.calorieColor]}>
          <Text style={[styles.macroValue, styles.calorieText]}>
            {calories.eaten.toFixed(0)} / {calories.goal?.toFixed(0) || '0'}
          </Text>
          <Text style={styles.macroLabel}>Calories</Text>
        </View>

        {/* Protein Card */}
        <View style={[styles.macroCard, styles.proteinColor]}>
          <Text style={[styles.macroValue, styles.proteinText]}>
            {protein.eaten.toFixed(0)} / {protein.goal?.toFixed(0) || '0'} g
          </Text>
          <Text style={styles.macroLabel}>Protein</Text>
        </View>

        {/* Carbs Card */}
        <View style={[styles.macroCard, styles.carbColor]}>
          <Text style={[styles.macroValue, styles.carbText]}>
            {carbs.eaten.toFixed(0)} / {carbs.goal?.toFixed(0) || '0'} g
          </Text>
          <Text style={styles.macroLabel}>Carbs</Text>
        </View>

        {/* Fat Card */}
        <View style={[styles.macroCard, styles.fatColor]}>
          <Text style={[styles.macroValue, styles.fatText]}>
            {fat.eaten.toFixed(0)} / {fat.goal?.toFixed(0) || '0'} g
          </Text>
          <Text style={styles.macroLabel}>Fat</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  // ✨ MealPlan aesthetic
  container: {
    backgroundColor: '#1f1f1f',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  logButton: {
    backgroundColor: '#33d6a6',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  logButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },

  // 🔥 Exact MacroCard Style from MealPlan
  macroRowTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  macroCard: {
    width: '48%',
    paddingVertical: 16,
    backgroundColor: '#1f1f1f',
    borderRadius: 14,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
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

  // Macro Colors - Exact match to MacroCard
  calorieColor: { borderColor: '#FFD54F' },
  proteinColor: { borderColor: '#4FC3F7' },
  carbColor: { borderColor: '#81C784' },
  fatColor: { borderColor: '#F06292' },

  // Text Colors
  calorieText: { color: '#FFD54F' },
  proteinText: { color: '#4FC3F7' },
  carbText: { color: '#81C784' },
  fatText: { color: '#F06292' },
});
