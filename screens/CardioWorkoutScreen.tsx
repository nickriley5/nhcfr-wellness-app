import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { auth, db } from '../firebase';
import { doc, setDoc, Timestamp, collection, getDoc, getDocs, query, where, updateDoc } from 'firebase/firestore';
import Toast from 'react-native-toast-message';

type CardioWorkoutRouteProp = RouteProp<RootStackParamList, 'CardioWorkout'>;

interface CardioSession {
  dayOfWeek: string;
  type: string;
  duration: number;
  intensity: string;
  notes?: string;
  targetHeartRate?: string;
}

const CardioWorkoutScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<CardioWorkoutRouteProp>();
  
  const { session, weekNumber } = route.params || {};
  
  const [isActive, setIsActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [actualDuration, setActualDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [pace, setPace] = useState('');
  const [avgHeartRate, setAvgHeartRate] = useState('');
  const [maxHeartRate, setMaxHeartRate] = useState('');
  const [calories, setCalories] = useState('');
  const [feeling, setFeeling] = useState<'easy' | 'moderate' | 'hard' | 'max' | null>(null);
  const [userNotes, setUserNotes] = useState('');
  const [roundsCompleted, setRoundsCompleted] = useState('');

  // Detect if this is an interval/HIIT workout
  const isIntervalWorkout = session?.type?.toLowerCase().includes('hiit') || 
                           session?.type?.toLowerCase().includes('circuit') ||
                           session?.intensity?.toLowerCase().includes('interval') ||
                           session?.notes?.toLowerCase().includes('rounds');

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartStop = () => {
    setIsActive(!isActive);
  };

  const handleComplete = async () => {
    if (!isActive && elapsedSeconds === 0) {
      Toast.show({
        type: 'error',
        text1: 'Start Timer First',
        text2: 'Please start the workout timer',
      });
      return;
    }

    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        Toast.show({
          type: 'error',
          text1: 'Not logged in',
          text2: 'Please sign in to save workout',
        });
        return;
      }

      const finalDuration = actualDuration ? parseInt(actualDuration) : Math.floor(elapsedSeconds / 60);

      const cardioData = {
        dayTitle: `${session.type} - ${session.dayOfWeek}`,
        type: session.type,
        plannedDuration: session.duration,
        actualDuration: finalDuration,
        plannedIntensity: session.intensity,
        perceivedFeeling: feeling,
        roundsCompleted: roundsCompleted ? parseInt(roundsCompleted) : null,
        distance: distance ? parseFloat(distance) : null,
        pace: pace || null,
        avgHeartRate: avgHeartRate ? parseInt(avgHeartRate) : null,
        maxHeartRate: maxHeartRate ? parseInt(maxHeartRate) : null,
        calories: calories ? parseInt(calories) : null,
        notes: userNotes || session.notes || '',
        completedAt: Timestamp.now(),
        weekNumber,
        dayOfWeek: session.dayOfWeek,
        workoutType: 'cardio',
      };

      // Save to workout logs (matches WorkoutHistoryScreen collection name)
      const historyRef = doc(collection(db, 'users', uid, 'workoutLogs'));
      await setDoc(historyRef, cardioData);
      
      console.log('✅ Cardio workout saved to workoutLogs collection:', cardioData.dayTitle);

      // Mark the cardio day as complete in AI program if applicable
      try {
        const aiProgramsRef = collection(db, 'users', uid, 'aiPrograms');
        const activeQuery = query(aiProgramsRef, where('isActive', '==', true));
        const activeProgramSnap = await getDocs(activeQuery);
        
        if (!activeProgramSnap.empty) {
          const programDoc = activeProgramSnap.docs[0];
          const programData = programDoc.data();
          const completedCardioSessions = programData.completedCardioSessions || [];
          const sessionKey = `week${weekNumber}-${session.dayOfWeek}`;
          
          if (!completedCardioSessions.includes(sessionKey)) {
            await updateDoc(programDoc.ref, {
              completedCardioSessions: [...completedCardioSessions, sessionKey],
            });
            console.log('✅ Marked cardio session complete in AI program:', sessionKey);
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not update AI program cardio completion:', error);
      }

      Toast.show({
        type: 'success',
        text1: '🎉 Cardio Complete!',
        text2: `${session.type} - ${finalDuration} minutes`,
        visibilityTime: 3000,
      });

      navigation.goBack();
    } catch (error) {
      console.error('Error saving cardio workout:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to save',
        text2: 'Please try again',
      });
    }
  };

  if (!session) {
    return (
      <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No cardio session data</Text>
        </View>
      </LinearGradient>
    );
  }

  const feelingOptions = [
    { value: 'easy', label: 'Easy', icon: 'happy-outline', color: '#4CAF50' },
    { value: 'moderate', label: 'Moderate', icon: 'remove-circle-outline', color: '#FF9800' },
    { value: 'hard', label: 'Hard', icon: 'sad-outline', color: '#FF5722' },
    { value: 'max', label: 'Maxed Out', icon: 'flame-outline', color: '#d32f2f' },
  ];

  return (
    <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Cardio Workout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* SESSION INFO */}
        <View style={styles.sessionCard}>
          <View style={styles.sessionHeader}>
            <Ionicons name="fitness" size={32} color="#FF6B35" />
            <View style={{ flex: 1 }}>
              <Text style={styles.sessionType}>{session.type}</Text>
              <Text style={styles.sessionDay}>{session.dayOfWeek} • Week {weekNumber}</Text>
            </View>
          </View>
          <View style={styles.sessionDetails}>
            <View style={styles.sessionDetail}>
              <Text style={styles.sessionDetailLabel}>Planned Duration</Text>
              <Text style={styles.sessionDetailValue}>{session.duration} min</Text>
            </View>
            <View style={styles.sessionDetail}>
              <Text style={styles.sessionDetailLabel}>Target Intensity</Text>
              <Text style={styles.sessionDetailValue}>{session.intensity}</Text>
            </View>
          </View>
          {session.notes && (
            <View style={styles.sessionNotes}>
              <Text style={styles.sessionNotesLabel}>Coach Notes:</Text>
              <Text style={styles.sessionNotesText}>{session.notes}</Text>
            </View>
          )}
        </View>

        {/* TIMER */}
        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>Workout Timer</Text>
          <Text style={styles.timerDisplay}>{formatTime(elapsedSeconds)}</Text>
          <Pressable
            style={[styles.timerButton, isActive && styles.timerButtonActive]}
            onPress={handleStartStop}
          >
            <Ionicons name={isActive ? 'pause' : 'play'} size={32} color="#fff" />
            <Text style={styles.timerButtonText}>{isActive ? 'Pause' : 'Start'}</Text>
          </Pressable>
        </View>

        {/* WORKOUT DATA */}
        <View style={styles.dataCard}>
          <Text style={styles.dataCardTitle}>Workout Data (Optional)</Text>
          
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Actual Duration (min)</Text>
              <TextInput
                style={styles.input}
                placeholder={session.duration.toString()}
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={actualDuration}
                onChangeText={setActualDuration}
              />
            </View>
            {isIntervalWorkout ? (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Rounds Completed</Text>
                <TextInput
                  style={styles.input}
                  placeholder="8"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={roundsCompleted}
                  onChangeText={setRoundsCompleted}
                />
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Distance</Text>
                <TextInput
                  style={styles.input}
                  placeholder="3.5 mi"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={distance}
                  onChangeText={setDistance}
                />
              </View>
            )}
          </View>

          {!isIntervalWorkout && (
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Avg Pace</Text>
                <TextInput
                  style={styles.input}
                  placeholder="8:30/mi"
                  placeholderTextColor="#666"
                  value={pace}
                  onChangeText={setPace}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Calories</Text>
                <TextInput
                  style={styles.input}
                  placeholder="300"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={calories}
                  onChangeText={setCalories}
                />
              </View>
            </View>
          )}

          <View style={styles.inputRow}>
            {isIntervalWorkout && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Calories</Text>
                <TextInput
                  style={styles.input}
                  placeholder="300"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={calories}
                  onChangeText={setCalories}
                />
              </View>
            )}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Avg HR (bpm)</Text>
              <TextInput
                style={styles.input}
                placeholder="145"
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={avgHeartRate}
                onChangeText={setAvgHeartRate}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Max HR (bpm)</Text>
              <TextInput
                style={styles.input}
                placeholder="165"
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={maxHeartRate}
                onChangeText={setMaxHeartRate}
              />
            </View>
          </View>
        </View>

        {/* FEELING */}
        <View style={styles.feelingCard}>
          <Text style={styles.dataCardTitle}>How did it feel?</Text>
          <View style={styles.feelingOptions}>
            {feelingOptions.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.feelingOption,
                  feeling === option.value && { backgroundColor: option.color, borderColor: option.color }
                ]}
                onPress={() => setFeeling(option.value as any)}
              >
                <Ionicons 
                  name={option.icon as any} 
                  size={28} 
                  color={feeling === option.value ? '#fff' : option.color} 
                />
                <Text style={[
                  styles.feelingLabel,
                  feeling === option.value && { color: '#fff' }
                ]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* NOTES */}
        <View style={styles.notesCard}>
          <Text style={styles.dataCardTitle}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="How did the workout go? Any issues?"
            placeholderTextColor="#666"
            multiline
            numberOfLines={4}
            value={userNotes}
            onChangeText={setUserNotes}
          />
        </View>

        {/* COMPLETE BUTTON */}
        <Pressable style={styles.completeButton} onPress={handleComplete}>
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
          <Text style={styles.completeButtonText}>Complete Workout</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  sessionCard: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  sessionType: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  sessionDay: {
    fontSize: 14,
    color: '#FF9800',
    marginTop: 4,
  },
  sessionDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  sessionDetail: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 12,
  },
  sessionDetailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  sessionDetailValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  sessionNotes: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 12,
  },
  sessionNotesLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  sessionNotesText: {
    fontSize: 14,
    color: '#e0e0e0',
    fontStyle: 'italic',
  },
  timerCard: {
    backgroundColor: '#2a2a2a',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  timerLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  timerDisplay: {
    fontSize: 56,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 20,
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  timerButtonActive: {
    backgroundColor: '#FF9800',
  },
  timerButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  dataCard: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  dataCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  feelingCard: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  feelingOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  feelingOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#444',
  },
  feelingLabel: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
  notesCard: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  notesInput: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 12,
    marginTop: 8,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});

export default CardioWorkoutScreen;
