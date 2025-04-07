import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getAuth, signOut } from 'firebase/auth';
import { getApp } from 'firebase/app';

const DashboardScreen = () => {
  const handleLogout = async () => {
    try {
      const auth = getAuth(getApp());
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <LinearGradient
      colors={['#0f0f0f', '#1c1c1c', '#121212']}
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

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#121212',
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 420,
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
  logoutButton: {
    marginTop: 20,
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default DashboardScreen;
