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
const sleepQualityOptions = ['😫', '😴', '😐', '😊', '✨'];
const sorenessOptions = ['😌', '😐', '😬', '😣', '🔥'];
const stressOptions = ['😌', '😐', '😓', '😰', '🤯'];
const readinessOptions = ['😩', '😕', '😐', '💪', '🔥'];

const CheckInScreen = () => {
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [sleepHours, setSleepHours] = useState('');
  const [soreness, setSoreness] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [readiness, setReadiness] = useState<number | null>(null);
  const [onShift, setOnShift] = useState(false);
  const [callVolume, setCallVolume] = useState<number | null>(null);
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

    if (!uid || mood === null || energy === null || sleepQuality === null || soreness === null || stress === null || readiness === null) {
      showCustomToast('Please complete all required fields.', 'error');
      return;
    }

    // Validate sleep hours
    const sleepNum = parseFloat(sleepHours);
    if (!sleepHours || isNaN(sleepNum) || sleepNum < 0 || sleepNum > 24) {
      showCustomToast('Please enter valid sleep hours (0-24).', 'error');
      return;
    }

    try {
      await addDoc(collection(db, 'users', uid, 'checkIns'), {
        uid,
        mood,
        energy,
        sleepQuality,
        sleepHours: sleepNum,
        soreness,
        stress,
        readiness,
        onShift,
        callVolume: onShift ? callVolume : null,
        notes,
        timestamp: serverTimestamp(),
      });

      // Reset all fields
      setMood(null);
      setEnergy(null);
      setSleepQuality(null);
      setSleepHours('');
      setSoreness(null);
      setStress(null);
      setReadiness(null);
      setOnShift(false);
      setCallVolume(null);
      setNotes('');
      showCustomToast('Check-in submitted!', 'success');

      setTimeout(() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
          return;
        }

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
      <Text style={styles.subtitle}>Help your AI coach understand your readiness</Text>

      {/* Sleep Quality */}
      <Text style={styles.sectionTitle}>How did you sleep? 💤</Text>
      <View style={styles.buttonRow}>
        {sleepQualityOptions.map((emoji, index) => (
          <Pressable
            key={index}
            style={[
              styles.emojiButton,
              sleepQuality === index + 1 && styles.selectedButton,
            ]}
            onPress={() => setSleepQuality(index + 1)}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.scaleLabel}>Poor → Excellent</Text>

      {/* Sleep Hours */}
      <Text style={styles.sectionTitle}>Hours of sleep?</Text>
      <TextInput
        value={sleepHours}
        onChangeText={setSleepHours}
        placeholder="e.g., 7.5"
        placeholderTextColor="#888"
        keyboardType="decimal-pad"
        style={styles.numberInput}
      />

      {/* Energy Level */}
      <Text style={styles.sectionTitle}>Energy level today? ⚡</Text>
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
      <Text style={styles.scaleLabel}>Exhausted → Energized</Text>

      {/* Soreness */}
      <Text style={styles.sectionTitle}>Muscle soreness? 💪</Text>
      <View style={styles.buttonRow}>
        {sorenessOptions.map((emoji, index) => (
          <Pressable
            key={index}
            style={[
              styles.emojiButton,
              soreness === index + 1 && styles.selectedButton,
            ]}
            onPress={() => setSoreness(index + 1)}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.scaleLabel}>None → Very Sore</Text>

      {/* Stress Level */}
      <Text style={styles.sectionTitle}>Stress level? 🧠</Text>
      <View style={styles.buttonRow}>
        {stressOptions.map((emoji, index) => (
          <Pressable
            key={index}
            style={[
              styles.emojiButton,
              stress === index + 1 && styles.selectedButton,
            ]}
            onPress={() => setStress(index + 1)}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.scaleLabel}>Calm → Overwhelmed</Text>

      {/* Readiness to Train */}
      <Text style={styles.sectionTitle}>Ready to train? 🔥</Text>
      <View style={styles.buttonRow}>
        {readinessOptions.map((emoji, index) => (
          <Pressable
            key={index}
            style={[
              styles.emojiButton,
              readiness === index + 1 && styles.selectedButton,
            ]}
            onPress={() => setReadiness(index + 1)}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.scaleLabel}>Not at all → Let's go!</Text>

      {/* Mood */}
      <Text style={styles.sectionTitle}>Overall mood? 😊</Text>
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
      <Text style={styles.scaleLabel}>Terrible → Great</Text>

      {/* Firefighter-Specific */}
      <View style={styles.shiftSection}>
        <Pressable
          style={styles.shiftToggle}
          onPress={() => setOnShift(!onShift)}
        >
          <View style={[styles.checkbox, onShift && styles.checkboxSelected]}>
            {onShift && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.shiftLabel}>On shift in last 24 hours?</Text>
        </Pressable>

        {onShift && (
          <View style={styles.callVolumeSection}>
            <Text style={styles.sectionTitle}>Call volume?</Text>
            <View style={styles.callVolumeRow}>
              {[1, 2, 3, 4, 5].map((num) => (
                <Pressable
                  key={num}
                  style={[
                    styles.callVolumeButton,
                    callVolume === num && styles.selectedCallVolume,
                  ]}
                  onPress={() => setCallVolume(num)}
                >
                  <Text style={[
                    styles.callVolumeText,
                    callVolume === num && styles.selectedCallVolumeText,
                  ]}>{num}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.scaleLabel}>Quiet → Slammed</Text>
          </View>
        )}
      </View>

      {/* Notes */}
      <Text style={styles.sectionTitle}>Additional notes (optional)</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Injury, illness, personal stress, etc."
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
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    alignSelf: 'flex-start',
    marginTop: 20,
    marginBottom: 10,
  },
  scaleLabel: {
    fontSize: 12,
    color: '#888',
    alignSelf: 'center',
    marginTop: -8,
    marginBottom: 8,
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
  numberInput: {
    backgroundColor: '#1e1e1e',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 10,
    color: '#fff',
    padding: 12,
    fontSize: 16,
    width: '100%',
    marginBottom: 16,
  },
  shiftSection: {
    width: '100%',
    marginTop: 20,
    marginBottom: 10,
  },
  shiftToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#555',
    backgroundColor: '#1e1e1e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    borderColor: '#d32f2f',
    backgroundColor: '#d32f2f',
  },
  checkmark: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  shiftLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  callVolumeSection: {
    width: '100%',
    paddingLeft: 40,
  },
  callVolumeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  callVolumeButton: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCallVolume: {
    borderColor: '#d32f2f',
    backgroundColor: '#2a2a2a',
  },
  callVolumeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  selectedCallVolumeText: {
    color: '#d32f2f',
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
