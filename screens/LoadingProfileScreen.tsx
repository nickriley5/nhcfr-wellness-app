import React, { useState } from 'react';
import { Text, TextInput, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const fitnessLevels = [
  { label: 'Beginner', description: 'New to working out or inconsistent routine' },
  { label: 'Intermediate', description: 'Works out 2-4 times per week consistently' },
  { label: 'Advanced', description: 'Works out 5+ times weekly with structured plan' },
];

const activityLevels = [
  { label: 'Sedentary', description: 'Desk job, minimal physical activity' },
  { label: 'Lightly Active', description: 'Walks occasionally, active job with sitting' },
  { label: 'Moderately Active', description: 'Walks regularly, light workouts 2-3x/week' },
  { label: 'Very Active', description: 'Works out 4+ times/week or high-step count' },
  { label: 'Rigorous', description: 'Manual labor job or intense training (NOT firefighter)' },
];

const dietaryPreferences = [
  { label: 'Standard', description: 'No specific restrictions or preference' },
  { label: 'Paleo', description: 'Grain-free, focuses on meats and veggies' },
  { label: 'Carnivore', description: 'Animal products only' },
  { label: 'Vegetarian', description: 'No meat, may eat eggs/dairy' },
  { label: 'Vegan', description: 'No animal products at all' },
];

const dietaryRestrictions = ['Gluten-Free', 'Dairy-Free', 'Low FODMAP', 'Nut Allergy', 'Soy-Free'];

const ProfileSetupScreen = ({ navigation }: any) => {
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [fitnessLevel, setFitnessLevel] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [dietPreference, setDietPreference] = useState('');
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [goalWeight, setGoalWeight] = useState('');
  const [timeline, setTimeline] = useState('');

  const toggleRestriction = (item: string) => {
    setRestrictions(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleSubmit = async () => {
    const uid = auth().currentUser?.uid;
    if (!uid) {return;}

    try {
      await firestore().collection('users').doc(uid).set({
        fullName,
        dob,
        height,
        weight,
        fitnessLevel,
        activityLevel,
        dietPreference,
        restrictions,
        goalWeight,
        timeline,
        profileComplete: true,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      navigation.replace('Main');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Complete Your Profile</Text>
      <TextInput placeholder="Full Name" placeholderTextColor="#aaa" value={fullName} onChangeText={setFullName} style={styles.input} />
      <TextInput placeholder="Date of Birth (MM/DD/YYYY)" placeholderTextColor="#aaa" value={dob} onChangeText={setDob} style={styles.input} />
      <TextInput placeholder="Height (in)" placeholderTextColor="#aaa" value={height} onChangeText={setHeight} style={styles.input} />
      <TextInput placeholder="Weight (lbs)" placeholderTextColor="#aaa" value={weight} onChangeText={setWeight} style={styles.input} />

      <Text style={styles.sectionTitle}>Fitness Level</Text>
      {fitnessLevels.map(({ label, description }) => (
        <Pressable
          key={label}
          onPress={() => setFitnessLevel(label)}
          style={[styles.optionButton, fitnessLevel === label && styles.selected]}>
          <Text style={styles.optionText}>{label} - {description}</Text>
        </Pressable>
      ))}

      <Text style={styles.sectionTitle}>Activity Level</Text>
      {activityLevels.map(({ label, description }) => (
        <Pressable
          key={label}
          onPress={() => setActivityLevel(label)}
          style={[styles.optionButton, activityLevel === label && styles.selected]}>
          <Text style={styles.optionText}>{label} - {description}</Text>
        </Pressable>
      ))}

      <Text style={styles.sectionTitle}>Dietary Preference</Text>
      {dietaryPreferences.map(({ label, description }) => (
        <Pressable
          key={label}
          onPress={() => setDietPreference(label)}
          style={[styles.optionButton, dietPreference === label && styles.selected]}>
          <Text style={styles.optionText}>{label} - {description}</Text>
        </Pressable>
      ))}

      <Text style={styles.sectionTitle}>Dietary Restrictions</Text>
      {dietaryRestrictions.map(item => (
        <Pressable
          key={item}
          onPress={() => toggleRestriction(item)}
          style={[
            styles.optionButton,
            restrictions.includes(item) && styles.selected,
          ]}>
          <Text style={styles.optionText}>{item}</Text>
        </Pressable>
      ))}

      <TextInput placeholder="Goal Weight (lbs)" placeholderTextColor="#aaa" value={goalWeight} onChangeText={setGoalWeight} style={styles.input} />
      <TextInput placeholder="Goal Timeline (e.g., 12 weeks)" placeholderTextColor="#aaa" value={timeline} onChangeText={setTimeline} style={styles.input} />

      {/* 🔥 Styled Submit Button */}
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
