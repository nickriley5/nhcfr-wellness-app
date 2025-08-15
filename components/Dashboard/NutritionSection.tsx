// components/Dashboard/NutritionSection.tsx
import React from 'react';
import {
  Text,
  StyleSheet,
  View,
  Pressable,
} from 'react-native';

interface NutritionSectionProps {
  macrosToday: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  navigation: any;
}

export default function NutritionSection({
  macrosToday,
  navigation,
}: NutritionSectionProps) {
  const getMacroPercentage = (current: number, goal: number): number => {
    return goal > 0 ? Math.min(100, (current / goal) * 100) : 0;
  };

  // Sample goals - these could come from user preferences
  const goals = {
    calories: 2200,
    protein: 165,
    carbs: 275,
    fat: 73,
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>🍎 Nutrition</Text>

      {/* Macro Overview */}
      <View style={styles.tile}>
        <Text style={styles.tileHeader}>Today's Macros</Text>

        {/* Calories */}
        <View style={styles.macroRow}>
          <Text style={styles.macroLabel}>Calories</Text>
          <View style={styles.macroBar}>
            <View
              style={[
                styles.macroFill,
                {
                  width: `${getMacroPercentage(macrosToday.calories, goals.calories)}%`,
                },
                styles.caloriesFill,
              ]}
            />
          </View>
          <Text style={styles.macroValue}>
            {macrosToday.calories}/{goals.calories}
          </Text>
        </View>

        {/* Protein */}
        <View style={styles.macroRow}>
          <Text style={styles.macroLabel}>Protein</Text>
          <View style={styles.macroBar}>
            <View
              style={[
                styles.macroFill,
                {
                  width: `${getMacroPercentage(macrosToday.protein, goals.protein)}%`,
                },
                styles.proteinFill,
              ]}
            />
          </View>
          <Text style={styles.macroValue}>
            {macrosToday.protein}g/{goals.protein}g
          </Text>
        </View>

        {/* Carbs */}
        <View style={styles.macroRow}>
          <Text style={styles.macroLabel}>Carbs</Text>
          <View style={styles.macroBar}>
            <View
              style={[
                styles.macroFill,
                {
                  width: `${getMacroPercentage(macrosToday.carbs, goals.carbs)}%`,
                },
                styles.carbsFill,
              ]}
            />
          </View>
          <Text style={styles.macroValue}>
            {macrosToday.carbs}g/{goals.carbs}g
          </Text>
        </View>

        {/* Fat */}
        <View style={styles.macroRow}>
          <Text style={styles.macroLabel}>Fat</Text>
          <View style={styles.macroBar}>
            <View
              style={[
                styles.macroFill,
                {
                  width: `${getMacroPercentage(macrosToday.fat, goals.fat)}%`,
                },
                styles.fatFill,
              ]}
            />
          </View>
          <Text style={styles.macroValue}>
            {macrosToday.fat}g/{goals.fat}g
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.tile}>
        <Text style={styles.tileHeader}>Meal Logging</Text>
        <View style={styles.quickActions}>
          <Pressable
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('MealPlan')}
          >
            <Text style={styles.quickActionText}>🍽️ Log Meal</Text>
          </Pressable>
          <Pressable
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('MacroCalculator')}
          >
            <Text style={styles.quickActionText}>⚖️ Calculator</Text>
          </Pressable>
        </View>
      </View>

      {/* Meal Plan Preview */}
      <View style={styles.tile}>
        <Text style={styles.tileHeader}>Today's Plan</Text>
        <Text style={styles.mutedText}>Tap to view your meal schedule</Text>
        <Pressable
          style={[styles.btn, styles.btnSecondary]}
          onPress={() => navigation.navigate('MealPlan')}
        >
          <Text style={styles.btnSecondaryText}>View Meal Plan</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 320,
    paddingRight: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  tile: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  tileHeader: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  macroLabel: {
    color: '#cccccc',
    fontSize: 14,
    width: 60,
    fontWeight: '600',
  },
  macroBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#333333',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  macroFill: {
    height: '100%',
    borderRadius: 4,
  },
  caloriesFill: {
    backgroundColor: '#ff6b47',
  },
  proteinFill: {
    backgroundColor: '#33d6a6',
  },
  carbsFill: {
    backgroundColor: '#ffd700',
  },
  fatFill: {
    backgroundColor: '#ff9500',
  },
  macroValue: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    width: 80,
    textAlign: 'right',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  mutedText: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 12,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  btnSecondary: {
    borderColor: '#444',
    borderWidth: 1,
  },
  btnSecondaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
