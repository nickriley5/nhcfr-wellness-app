import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const DashboardScreen = () => {
  return (
    <LinearGradient
      colors={['#0f0f0f', '#1c1c1c', '#121212']} // ✅ Updated gradient
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.header}>🚒 Firefighter Wellness App</Text>
        <Text style={styles.subtext}>Train for duty. Fuel for life. 🔥</Text>

        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Generate Meal Plan</Text>
        </Pressable>

        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Generate Workout</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#d32f2f',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DashboardScreen;
