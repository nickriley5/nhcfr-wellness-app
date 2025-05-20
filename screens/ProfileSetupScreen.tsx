import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getApp } from 'firebase/app';

const sexOptions = ['Male', 'Female', 'Other'];

const ProfileSetupScreen = ({ navigation }: any) => {
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [sex, setSex] = useState('');

  const handleSubmit = async () => {
    const auth = getAuth(getApp());
    const db = getFirestore(getApp());
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      await setDoc(doc(db, 'users', uid), {
        fullName,
        dob,
        height,
        weight,
        sex,
        profileComplete: true,
        createdAt: serverTimestamp(),
      });

      await getAuth(getApp()).signOut();
    } catch (error) {
      console.error(error);
      alert('Failed to save profile');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Complete Your Profile</Text>
      <TextInput placeholder="Full Name" placeholderTextColor="#aaa" value={fullName} onChangeText={setFullName} style={styles.input} />
      <TextInput placeholder="Date of Birth (MM/DD/YYYY)" placeholderTextColor="#aaa" value={dob} onChangeText={setDob} style={styles.input} />
      <TextInput placeholder="Height (in)" placeholderTextColor="#aaa" value={height} onChangeText={setHeight} style={styles.input} />
      <TextInput placeholder="Weight (lbs)" placeholderTextColor="#aaa" value={weight} onChangeText={setWeight} keyboardType="numeric" style={styles.input} />

      <Text style={styles.sectionTitle}>Sex</Text>
      {sexOptions.map(option => (
        <Pressable
          key={option}
          onPress={() => setSex(option)}
          style={[styles.optionButton, sex === option && styles.selected]}
        >
          <Text style={styles.optionText}>{option}</Text>
        </Pressable>
      ))}

      <Pressable style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit Profile</Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#fff',
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#d32f2f',
    marginTop: 16,
    marginBottom: 8,
  },
  optionButton: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  selected: {
    borderColor: '#d32f2f',
    backgroundColor: '#2c2c2c',
  },
  optionText: {
    color: '#fff',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#d32f2f',
    padding: 16,
    borderRadius: 10,
    marginTop: 24,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProfileSetupScreen;
