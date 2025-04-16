// screens/WorkoutDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../App'; // ✅ Import stack types from App.tsx

import { auth, firestore } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

// 🚀 Define navigation prop for this screen from RootStackParamList
type WorkoutDetailNavProp = NativeStackNavigationProp<RootStackParamList>;

const WorkoutDetailScreen: React.FC = () => {
  const navigation = useNavigation<WorkoutDetailNavProp>(); // ✅ Use stack navigation
  const [workout, setWorkout] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const today = new Date().toISOString().split('T')[0];
        const docRef = doc(firestore, 'workouts', `${uid}_${today}`);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setWorkout(docSnap.data().exercises || []);
        } else {
          // 👇 Default fallback if no workout found
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

        <View style={styles.footerButtons}>
          {/* ← Navigate back to Dashboard tab */}
          <Pressable
            style={[styles.smallButton, { backgroundColor: '#555' }]}
            onPress={() =>
              navigation.navigate('Main', {
                screen: 'MainTabs', // 🔄 drawer screen name
                params: { screen: 'Dashboard' }, // 🔄 nested tab name
              })
            }
          >
            <Text style={styles.smallText}>← Dashboard</Text>
          </Pressable>

          {/* → Navigate to Workout tab */}
          <Pressable
            style={[styles.smallButton, { backgroundColor: '#777' }]}
            onPress={() =>
              navigation.navigate('Main', {
                screen: 'MainTabs', // 🔄 drawer screen name
                params: { screen: 'Workout' }, // 🔄 nested tab name
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
  header: { fontSize: 22, fontWeight: 'bold', color: '#d32f2f', marginBottom: 16, textAlign: 'center' },
  exerciseCard: { backgroundColor: '#2a2a2a', borderRadius: 12, padding: 16, marginBottom: 12, width: '100%' },
  exerciseName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  exerciseDetail: { fontSize: 14, color: '#ccc', marginTop: 4 },
  completeButton: { backgroundColor: '#388e3c', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 10, marginTop: 20, width: '100%', alignItems: 'center' },
  completeText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footerButtons: { flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 24, width: '100%' },
  smallButton: { flex: 1, marginHorizontal: 6, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  smallText: { color: '#fff', fontSize: 13, fontWeight: '500' },
});

export default WorkoutDetailScreen;
