import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import Toast from '../components/Toast';
import DashboardButton from '../components/Common/DashboardButton';


const moodOptions = ['😩', '😕', '😐', '🙂', '😄'];
const energyOptions = ['😴', '😓', '😐', '💪', '⚡'];

const CheckInScreen = () => {
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const showCustomToast = (message: string, type: 'success' | 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const handleSubmit = async () => {
    const auth = getAuth(getApp());
    const db = getFirestore(getApp());
    const uid = auth.currentUser?.uid;

    if (!uid || mood === null || energy === null) {
      showCustomToast('Please select both mood and energy.', 'error');
      return;
    }

    try {
      await addDoc(collection(db, 'users', uid, 'checkIns'), {
        uid,
        mood,
        energy,
        notes,
        timestamp: serverTimestamp(),
      });

      setMood(null);
      setEnergy(null);
      setNotes('');
      showCustomToast('Check-in submitted!', 'success');

      setTimeout(() => {
        navigation.navigate('AppDrawer', {
          screen: 'MainTabs',
          params: { screen: 'Dashboard' },
        });
      }, 2000);
    } catch (err) {
      console.error('Check-In Error:', err);
      showCustomToast('Error saving your check-in.', 'error');
    }
  };

  return (
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

      <DashboardButton text="Submit Check-In" onPress={handleSubmit} variant="redSolid" />

      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#121212',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#d32f2f',
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    alignSelf: 'flex-start',
    marginTop: 16,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
    height: 100,
    width: '100%',
    textAlignVertical: 'top',
    marginBottom: 24,
  },
});

export default CheckInScreen;
