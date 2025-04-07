import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const HomeScreen = () => {
  return (
    <LinearGradient
      colors={['#0f0f0f', '#1c1c1c', '#121212']} // Dark gradient like dashboard
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.header}>🏠 Home</Text>
        <Text style={styles.subtext}>This is your personalized home screen.</Text>
        <Text style={styles.subtext}>We’ll be adding stats, tips, and updates here!</Text>
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
    marginTop: 4,
  },
});

export default HomeScreen;
