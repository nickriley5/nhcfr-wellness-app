// PRTrackerScreen.tsx — with PR Date & Source Title
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  StatusBar,
  Platform,
} from 'react-native';
import { auth, db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

interface WorkoutLog {
  dayTitle: string;
  exercises: {
    name: string;
    sets: {
      weight: string;
      reps: string;
    }[];
  }[];
}

const PRTrackerScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [prData, setPrData] = useState<
    { name: string; weight: number; reps: number; date: string; workoutTitle: string }[]
  >([]);

  useEffect(() => {
    const fetchPRs = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {return;}

        const logRef = collection(db, 'users', uid, 'workoutLogs');
        const snapshot = await getDocs(logRef);
        const logs: Record<string, WorkoutLog> = {};

        snapshot.forEach(doc => {
          logs[doc.id] = doc.data() as WorkoutLog;
        });

        const exerciseMap: Record<string, { weight: number; reps: number; date: string; workoutTitle: string }> = {};

        Object.entries(logs).forEach(([id, log]) => {
          // Convert document ID to proper date if it looks like a timestamp
          let logDate = id;
          try {
            // Check if id is a timestamp or if log has a completedAt field
            const logData = log as any;
            if (logData.completedAt) {
              // Use completedAt field if available
              const date = new Date(logData.completedAt);
              logDate = date.toLocaleDateString();
            } else if (id.length === 13 && !isNaN(Number(id))) {
              // If ID looks like a timestamp, convert it
              const date = new Date(Number(id));
              logDate = date.toLocaleDateString();
            } else {
              // Otherwise just use a generic date format
              logDate = 'Recent';
            }
          } catch (error) {
            logDate = 'Recent';
          }

          log.exercises.forEach(ex => {
            ex.sets.forEach(set => {
              const weight = parseFloat(set.weight);
              const reps = parseInt(set.reps, 10);
              if (!isNaN(weight) && !isNaN(reps)) {
                if (!exerciseMap[ex.name] || weight > exerciseMap[ex.name].weight) {
                  exerciseMap[ex.name] = {
                    weight,
                    reps,
                    date: logDate,
                    workoutTitle: log.dayTitle || 'Workout',
                  };
                }
              }
            });
          });
        });

        const sorted = Object.entries(exerciseMap).map(([name, data]) => ({
          name,
          ...data,
        }));

        setPrData(sorted);
      } catch (err: any) {
        console.error('Failed to fetch PRs:', err?.message || err);
      } finally {
        setLoading(false);
      }
    };

    fetchPRs();
  }, []);

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>All-Time PRs</Text>

        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        {loading ? (
          <ActivityIndicator size="large" color="#d32f2f" />
        ) : prData.length === 0 ? (
          <Text style={styles.noPRText}>No PRs found yet. Start logging workouts!</Text>
        ) : (
          prData.map((pr, idx) => (
            <View key={idx} style={styles.prCard}>
              <Text style={styles.exerciseName}>{pr.name}</Text>
              <Text style={styles.prText}>🏋️ {pr.weight} lbs for {pr.reps} reps</Text>
              <Text style={styles.metaText}>📅 {pr.date} | 📓 {pr.workoutTitle}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
  },
  content: { padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#d32f2f',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  noPRText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  prCard: {
    backgroundColor: '#1e1e1e',
    padding: 14,
    borderRadius: 10,
    marginBottom: 14,
    borderColor: '#444',
    borderWidth: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4fc3f7',
    marginBottom: 4,
  },
  prText: {
    fontSize: 14,
    color: '#fff',
  },
  metaText: {
    fontSize: 12,
    color: '#bbb',
    marginTop: 4,
  },
});

export default PRTrackerScreen;
