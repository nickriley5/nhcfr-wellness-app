// screens/MealPlanScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const mealPlan = {
  Breakfast: [
    '2 eggs scrambled with spinach (1 cup)',
    '½ avocado',
    '1 cup black coffee',
  ],
  Lunch: [
    '6 oz grilled chicken',
    '1 medium sweet potato',
    '1 cup steamed broccoli',
  ],
  Snack: [
    '1 scoop protein shake',
    'Handful of almonds (¼ cup)',
  ],
  Dinner: [
    '6 oz salmon',
    '¾ cup quinoa',
    '1 cup roasted asparagus',
  ],
};

const MealPlanScreen = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Your Meal Plan 🍽️</Text>
      {Object.entries(mealPlan).map(([meal, items]) => (
        <View key={meal} style={styles.card}>
          <Text style={styles.mealTitle}>{meal}</Text>
          {items.map((item, index) => (
            <Text key={index} style={styles.itemText}>• {item}</Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#121212',
    flexGrow: 1,
    paddingBottom: 80, // space for navbar
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderColor: '#d32f2f',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  mealTitle: {
    fontSize: 20,
    color: '#d32f2f',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  itemText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
  },
});

export default MealPlanScreen;
