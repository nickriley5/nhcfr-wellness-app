import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getApp } from 'firebase/app';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

const moodOptions = ['😩', '😕', '😐', '🙂', '😄'];
const energyOptions = ['😴', '😓', '😐', '💪', '⚡'];

const CheckInScreen = () => {
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleSubmit = async () => {
    const auth = getAuth(getApp());
    const db = getFirestore(getApp());
    const uid = auth.currentUser?.uid;

    if (!uid || mood === null || energy === null) {
      Alert.alert('Please select both mood and energy.');
      return;
    }

    try {
      await addDoc(collection(db, 'checkins'), {
        uid,
        mood,
        energy,
        notes,
        timestamp: serverTimestamp(),
      });

      Alert.alert('Check-In Submitted', 'Your check-in has been saved.');
      setMood(null);
      setEnergy(null);
      setNotes('');
      navigation.navigate('Main', { screen: 'Home' }); // 👈 return to tabbed Home screen
    } catch (err) {
      console.error('Check-In Error:', err);
      Alert.alert('Error', 'Something went wrong while saving your check-in.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#121212' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Daily Check-In</Text>

        <Text style={styles.sectionTitle}>How’s your mood today?</Text>
        <View style={styles.buttonRow}>
          {moodOptions.map((emoji, index) => (
            <Pressable
              key={index}
              style={[
                styles.emojiButton,
                mood === index + 1 && styles.selectedButton,
              ]}
              onPress={() => setMood(index + 1)}
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>How’s your energy level?</Text>
        <View style={styles.buttonRow}>
          {energyOptions.map((emoji, index) => (
            <Pressable
              key={index}
              style={[
                styles.emojiButton,
                energy === index + 1 && styles.selectedButton,
              ]}
              onPress={() => setEnergy(index + 1)}
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Anything on your mind?</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional note (sore, bad sleep, stress, etc.)"
          placeholderTextColor="#888"
          multiline
          style={styles.input}
        />

        <Pressable style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>Submit Check-In</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    color: '#d32f2f',
    fontWeight: '600',
    fontSize: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  emojiButton: {
    backgroundColor: '#1e1e1e',
    padding: 12,
    borderRadius: 12,
    width: 55,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#333',
    borderWidth: 1,
  },
  selectedButton: {
    borderColor: '#d32f2f',
    backgroundColor: '#2a2a2a',
  },
  emoji: {
    fontSize: 24,
  },
  input: {
    backgroundColor: '#1e1e1e',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 10,
    color: '#fff',
    padding: 12,
    fontSize: 14,
    marginBottom: 24,
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#d32f2f',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CheckInScreen;
