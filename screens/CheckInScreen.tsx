// screens/CheckInScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';

const CheckInScreen = () => {
  const [mood, setMood] = useState('');
  const [energy, setEnergy] = useState('');

  const handleSubmit = () => {
    // TODO: Save to Firestore
    Alert.alert('Check-In Submitted', `Mood: ${mood}\nEnergy: ${energy}`);
    setMood('');
    setEnergy('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily Check-In</Text>

      <Text style={styles.label}>Mood (1-10)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={mood}
        onChangeText={setMood}
        placeholder="e.g., 7"
        placeholderTextColor="#aaa"
      />

      <Text style={styles.label}>Energy Level (1-10)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={energy}
        onChangeText={setEnergy}
        placeholder="e.g., 6"
        placeholderTextColor="#aaa"
      />

      <Pressable style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit Check-In</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    color: '#d32f2f',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#d32f2f',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CheckInScreen;
