import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { auth, db } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  writeBatch,
  increment,
} from 'firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Video from 'react-native-video';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import PRCelebration from '../components/PRCelebration';
import Toast from '../components/Toast';
import { RouteProp } from '@react-navigation/native';
import { checkAndAdjustRestDays } from '../utils/performanceMonitor';

// Types for raw vs. enriched exercises
interface RawExercise {
  name: string;
  videoUri?: string;
  videoUrl?: string;
  sets?: number;
  reps?: number;
  repsOrTime?: number;
  type?: 'reps' | 'time';
}
interface EnrichedExercise extends RawExercise {
  videoUri: string;
  setsCount: number;
  repsCount: number;
}

type WorkoutDetailRoute = RouteProp<RootStackParamList, 'WorkoutDetail'>;

const WorkoutDetailScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'WorkoutDetail'>>();
  const route = useRoute<WorkoutDetailRoute>();
  const fromAdapt = route.params?.adapt ?? false;

  const [loading, setLoading] = useState<boolean>(true);
  const [dayTitle, setDayTitle] = useState<string>('');
  const [exercises, setExercises] = useState<EnrichedExercise[]>([]);
  const [progress, setProgress] = useState<{ reps: string; weight: string }[][]>([]);
  const [lastSession, setLastSession] = useState<Record<string, { reps: string; weight: string }[]> | null>(null);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [showPR, setShowPR] = useState<boolean>(false);
  const [prMessages, setPRMessages] = useState<string[]>([]);
  const [showToast, setShowToast] = useState<boolean>(false);

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        // Load active program
        const progRef = doc(db, 'users', uid, 'program', 'active');
        const progSnap = await getDoc(progRef);
        if (!progSnap.exists()) throw new Error('No active program');
        const progData: any = progSnap.data();

        const idx = (progData.currentDay || 1) - 1;
        const day = progData.days[idx];
        setDayTitle(day.title);

        // Enrich raw exercises
        const enriched = (day.exercises as RawExercise[]).map((ex: RawExercise): EnrichedExercise => ({
          ...ex,
          videoUri: ex.videoUri || ex.videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4',
          setsCount: ex.sets ?? 3,
          repsCount: ex.reps ?? ex.repsOrTime ?? 10,
        }));

        setExercises(enriched);
        setProgress(
          enriched.map(ex =>
            Array.from({ length: ex.setsCount }, () => ({ reps: '', weight: '' }))
          )
        );

        // Load last session for comparison
        const logsRef = collection(db, 'users', uid, 'workoutLogs');
        const logsQ = query(logsRef, orderBy('completedAt', 'desc'));
        const logsSnap = await getDocs(logsQ);
        const lastData: Record<string, { reps: string; weight: string }[]> = {};
        const latest = logsSnap.docs[0]?.data();
        if (latest) {
          (latest.exercises as any[]).forEach((ex: any) => {
            lastData[ex.name] = ex.sets;
          });
        }
        setLastSession(lastData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkout();
  }, []);

  const handleInputChange = (
    exIndex: number,
    setIndex: number,
    field: 'reps' | 'weight',
    value: string
  ) => {
    setProgress(prev => {
      const updated = [...prev];
      updated[exIndex][setIndex][field] = value;
      return updated;
    });
  };

  const isComplete = (sets: { reps: string; weight: string }[]) =>
    sets.every(s => s.reps && s.weight);

  const togglePlay = (index: number) =>
    setPlayingIndex(prev => (prev === index ? null : index));

  const saveWorkoutProgress = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const now = new Date();
    const id = now.toISOString().replace(/[:.]/g, '-');
    const log = {
      dayTitle,
      completedAt: Timestamp.fromDate(now),
      exercises: exercises.map((ex, i) => ({ name: ex.name, sets: progress[i] })),
    };

    try {
      // Batch: write log + increment day
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', uid, 'workoutLogs', id), log);
      batch.update(doc(db, 'users', uid, 'program', 'active'), { currentDay: increment(1) });
      await batch.commit();

      await checkAndAdjustRestDays(uid);

      // PR detection
      const allLogs = await getDocs(collection(db, 'users', uid, 'workoutLogs'));
      const PRs: Record<string, number> = {};
      allLogs.forEach(d => {
        const data: any = d.data();
        (data.exercises as any[]).forEach(ex =>
          ex.sets.forEach((s: any) => {
            const w = parseFloat(s.weight);
            if (!isNaN(w)) PRs[ex.name] = Math.max(PRs[ex.name] || 0, w);
          })
        );
      });
      const newPRs: string[] = [];
      log.exercises.forEach(ex =>
        ex.sets.forEach((s: any) => {
          const w = parseFloat(s.weight);
          if (!isNaN(w) && w > (PRs[ex.name] || 0)) newPRs.push(`${ex.name}: ${w} lbs`);
        })
      );

      setShowToast(true);
      if (newPRs.length) {
        setPRMessages(newPRs);
        setShowPR(true);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to save workout');
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{dayTitle}</Text>

        {exercises.map((ex, i) => {
          const sets = progress[i];
          const complete = isComplete(sets);
          const last = lastSession?.[ex.name] ?? [];
          const playing = playingIndex === i;

          return (
            <View key={i} style={[styles.card, complete && styles.cardComplete]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, complete && styles.cardTitleComplete]}>
                  {ex.name}
                </Text>
                <Pressable
                  onPress={() =>
                    navigation.navigate('ProgressChart', { exerciseName: ex.name })
                  }
                >
                  <Ionicons name="stats-chart" size={20} color="#4fc3f7" />
                </Pressable>
              </View>

              <Text style={styles.recommendation}>
                Recommended: {ex.setsCount}×{ex.repsCount}{' '}
                {ex.type === 'time' ? 'sec' : 'reps'}
              </Text>

              <TouchableOpacity onPress={() => togglePlay(i)} style={styles.videoBox}>
                {playing ? (
                  <Video
                    source={{ uri: ex.videoUri }}
                    style={styles.video}
                    controls
                    paused={false}
                    onEnd={() => setPlayingIndex(null)}
                  />
                ) : (
                  <View style={styles.playOverlay}>
                    <Ionicons name="play-circle-outline" size={42} color="#fff" />
                    <Text style={styles.playText}>Play Video</Text>
                  </View>
                )}
              </TouchableOpacity>

              {sets.map((s, si) => (
                <View key={si} style={styles.setBlock}>
                  <View style={styles.setRow}>
                    <Text style={styles.setLabel}>Set {si + 1}:</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="reps"
                      placeholderTextColor="#777"
                      keyboardType="numeric"
                      value={s.reps}
                      onChangeText={t => handleInputChange(i, si, 'reps', t)}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="(lbs)"
                      placeholderTextColor="#777"
                      keyboardType="numeric"
                      value={s.weight}
                      onChangeText={t => handleInputChange(i, si, 'weight', t)}
                    />
                  </View>
                  {last[si] && (
                    <Text style={styles.lastWorkoutText}>
                      Last: {last[si].reps} reps @ {last[si].weight} lbs
                    </Text>
                  )}
                </View>
              ))}
            </View>
          );
        })}

        <Pressable style={styles.saveButton} onPress={saveWorkoutProgress}>
          <Ionicons name="save" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.buttonText}>Save Workout</Text>
        </Pressable>

        <Pressable
          style={[styles.saveButton, styles.secondaryButton]}
          onPress={() =>
            navigation.navigate('Main', {
              screen: 'MainTabs',
              params: { screen: 'Workout' },
            })
          }
        >
          <Ionicons name="arrow-back" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.buttonText}>Back to Workout Hub</Text>
        </Pressable>

        {showPR && (
          <PRCelebration
            visible={showPR}
            messages={prMessages}
            onClose={() => setShowPR(false)}
          />
        )}
      </ScrollView>

      {showToast && <Toast message="Workout saved successfully!" onClose={() => setShowToast(false)} />}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#d32f2f',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  cardComplete: {
    opacity: 0.6,
    borderColor: '#4caf50',
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  cardTitleComplete: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  recommendation: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  setBlock: { marginBottom: 6 },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setLabel: { color: '#ccc', width: 55 },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    padding: 8,
    borderRadius: 6,
    width: 80,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  lastWorkoutText: {
    color: '#999',
    fontSize: 12,
    fontStyle: 'italic',
    marginLeft: 55,
    marginBottom: 4,
  },
  videoBox: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: { width: '100%', height: '100%' },
  playOverlay: { alignItems: 'center', justifyContent: 'center' },
  playText: { color: '#fff', fontSize: 14, marginTop: 4 },
  saveButton: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1.5,
    borderColor: '#d32f2f',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 24,
    justifyContent: 'center',
  },
  secondaryButton: {
    marginTop: 12,
    borderColor: '#888',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WorkoutDetailScreen;
