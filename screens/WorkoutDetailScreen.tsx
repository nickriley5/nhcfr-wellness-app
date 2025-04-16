// screens/WorkoutDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TabParamList, RootStackParamList } from '../App';
import { auth, firestore } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// Navigation prop type
type WorkoutDetailNavProp = NativeStackNavigationProp<RootStackParamList>;

const WorkoutDetailScreen: React.FC = () => {
  const navigation = useNavigation<WorkoutDetailNavProp>();
  const [workout, setWorkout] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedMsg, setCompletedMsg] = useState<string | null>(null); // ✅ state for inline feedback

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const today = new Date().toISOString().split('T')[0];
        const ref = doc(firestore, 'workouts', `${uid}_${today}`);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setWorkout(snap.data().exercises || []);
        } else {
          setWorkout([
            { name: 'Pushups', sets: 3, reps: 20 },
            { name: 'Air Squats', sets: 3, reps: 25 },
            { name: 'Plank', sets: 3, reps: '1 min' },
          ]);
        }
      } catch (err) {
        console.error('Error loading workout:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkout();
  }, []);

  // 💾 Handle workout completion
  const handleComplete = async () => {
    // ✅ provide immediate inline feedback
    setCompletedMsg('Great job! Workout marked complete.');

    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('No user');

      const today = new Date().toISOString().split('T')[0];
      const ref = doc(firestore, 'workouts', `${uid}_${today}`);

      await setDoc(
        ref,
        {
          exercises: workout,
          completed: true,
          completedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Error marking complete:', err);
      // ❌ fallback alert on error
      Alert.alert('Error', "Couldn't save your workout. Please try again.");
    }
  };

  return (
    <LinearGradient
      colors={['#0f0f0f', '#1c1c1c', '#121212']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.header}>Today's Workout</Text>

        {/* 📣 Inline feedback message */}
        {completedMsg && (
          <Text style={styles.completedMessage}>{completedMsg}</Text>
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#d32f2f" />
        ) : (
          workout.map((ex, idx) => (
            <View key={idx} style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>{ex.name}</Text>
              <Text style={styles.exerciseDetail}>
                {ex.sets} sets × {ex.reps} reps
              </Text>
            </View>
          ))
        )}

        <Pressable style={styles.completeButton} onPress={handleComplete}>
          <Text style={styles.completeText}>Mark Workout Complete ✅</Text>
        </Pressable>

        <View style={styles.footerButtons}>
          <Pressable
            style={[styles.smallButton, { backgroundColor: '#555' }]}
            onPress={() =>
              navigation.navigate('Main', {
                screen: 'MainTabs',
                params: { screen: 'Dashboard' },
              })
            }
          >
            <Text style={styles.smallText}>← Dashboard</Text>
          </Pressable>

          <Pressable
            style={[styles.smallButton, { backgroundColor: '#777' }]}
            onPress={() =>
              navigation.navigate('Main', {
                screen: 'MainTabs',
                params: { screen: 'Workout' },
              })
            }
          >
            <Text style={styles.smallText}>More Workouts →</Text>
          </Pressable>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 24, alignItems: 'center' },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 8,
    textAlign: 'center',
  },
  completedMessage: {
    fontSize: 16,
    color: '#4caf50',
    marginBottom: 12,
    textAlign: 'center',
  },
  exerciseCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: '100%',
  },
  exerciseName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  exerciseDetail: { fontSize: 14, color: '#ccc', marginTop: 4 },
  completeButton: {
    backgroundColor: '#388e3c',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  completeText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 24,
    width: '100%',
  },
  smallButton: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  smallText: { color: '#fff', fontSize: 13, fontWeight: '500' },
});

export default WorkoutDetailScreen;
