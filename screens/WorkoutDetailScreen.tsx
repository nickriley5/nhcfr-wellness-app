// screens/WorkoutDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { auth, firestore } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

// ✅ Navigation type
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const WorkoutDetailScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [workout, setWorkout] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const today = new Date().toISOString().split('T')[0];
        const docRef = doc(firestore, 'workouts', uid + '_' + today);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setWorkout(docSnap.data().exercises || []);
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

  return (
    <LinearGradient colors={['#0f0f0f', '#1c1c1c', '#121212']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.header}>Today's Workout</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#d32f2f" />
        ) : (
          workout.map((exercise, idx) => (
            <View key={idx} style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseDetail}>
                {exercise.sets} sets × {exercise.reps} reps
              </Text>
            </View>
          ))
        )}

        <Pressable style={styles.completeButton}>
          <Text style={styles.completeText}>Mark Workout Complete ✅</Text>
        </Pressable>

        {/* ✅ Optional: Return to Dashboard Button */}
        <Pressable
          style={[styles.completeButton, { backgroundColor: '#d32f2f', marginTop: 16 }]}
          onPress={() => navigation.navigate('Main', { screen: 'Dashboard' })}
        >
          <Text style={styles.completeText}>Return to Dashboard</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    padding: 24,
    alignItems: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 16,
    textAlign: 'center',
  },
  exerciseCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: '100%',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  exerciseDetail: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4,
  },
  completeButton: {
    backgroundColor: '#388e3c',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  completeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WorkoutDetailScreen;