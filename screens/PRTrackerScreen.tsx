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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

interface WorkoutLog {
  dayTitle: string;
  completedAt?: any;
  prs?: {
    exerciseName: string;
    weight: number;
    reps?: number;
    type?: string;
  }[];
  exercises: {
    name: string;
    sets: {
      weight: string;
      reps: string;
      isPR?: boolean;
    }[];
  }[];
}

type PRRecord = {
  name: string;
  weight: number;
  reps: number;
  date: string;
  workoutTitle: string;
};

const getLogTime = (id: string, log: WorkoutLog) => {
  const completedAt = log.completedAt;
  if (completedAt?.toMillis) {
    return completedAt.toMillis();
  }
  if (completedAt?.seconds) {
    return completedAt.seconds * 1000;
  }
  if (id.length === 13 && !isNaN(Number(id))) {
    return Number(id);
  }
  return 0;
};

const formatLogDate = (id: string, log: WorkoutLog) => {
  const time = getLogTime(id, log);
  return time ? new Date(time).toLocaleDateString() : 'Recent';
};

const PRTrackerScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [prData, setPrData] = useState<PRRecord[]>([]);

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

        const explicitPRs: PRRecord[] = [];
        Object.entries(logs).forEach(([id, log]) => {
          const logDate = formatLogDate(id, log);
          const workoutTitle = log.dayTitle || 'Workout';

          if (Array.isArray(log.prs) && log.prs.length > 0) {
            log.prs.forEach(pr => {
              explicitPRs.push({
                name: pr.exerciseName,
                weight: Number(pr.weight) || 0,
                reps: Number(pr.reps) || 0,
                date: logDate,
                workoutTitle,
              });
            });
            return;
          }

          log.exercises?.forEach(ex => {
            ex.sets?.forEach(set => {
              if (!set.isPR) {
                return;
              }

              const weight = parseFloat(set.weight);
              const reps = parseInt(set.reps, 10);
              if (!isNaN(weight) && !isNaN(reps)) {
                explicitPRs.push({
                  name: ex.name,
                  weight,
                  reps,
                  date: logDate,
                  workoutTitle,
                });
              }
            });
          });
        });

        const sorted = explicitPRs.length > 0
          ? explicitPRs.sort((a, b) => b.weight - a.weight)
          : Object.entries(logs)
            .sort((a, b) => getLogTime(a[0], a[1]) - getLogTime(b[0], b[1]))
            .reduce<{ records: PRRecord[]; previousMax: Record<string, number> }>((acc, [id, log]) => {
              const logDate = formatLogDate(id, log);
              const workoutTitle = log.dayTitle || 'Workout';

              log.exercises?.forEach(ex => {
                let workoutMax = 0;
                let workoutReps = 0;

                ex.sets?.forEach(set => {
                  const weight = parseFloat(set.weight);
                  const reps = parseInt(set.reps, 10);
                  if (!isNaN(weight) && !isNaN(reps) && weight > workoutMax) {
                    workoutMax = weight;
                    workoutReps = reps;
                  }
                });

                const previousMax = acc.previousMax[ex.name] || 0;
                if (workoutMax > previousMax) {
                  acc.previousMax[ex.name] = workoutMax;
                  acc.records.push({
                    name: ex.name,
                    weight: workoutMax,
                    reps: workoutReps,
                    date: logDate,
                    workoutTitle,
                  });
                }
              });

              return acc;
            }, { records: [], previousMax: {} })
            .records
            .sort((a, b) => b.weight - a.weight);

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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  container: {
    flex: 1,
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
