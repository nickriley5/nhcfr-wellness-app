// /screens/WorkoutScreen.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const WorkoutScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workout Generator 🏋️‍♂️</Text>
      <Text style={styles.text}>
        This will be the future home of your AI-powered workout plans.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 12,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
});

export default WorkoutScreen;
