// screens/WorkoutDetailScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Video from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { RootStackParamList } from '../App';
import { useProgram } from '../src/hooks/useProgram';
import { collection, getDocs, orderBy, query, setDoc, doc } from 'firebase/firestore';
import { auth, firestore } from '../firebase';
import PRCelebration from '../components/PRCelebration';
import Toast from '../components/Toast';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'WorkoutDetail'>;
type RouteProps = RouteProp<RootStackParamList, 'WorkoutDetail'>;

const WorkoutDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const fromAdapt = route.params?.adapt ?? false;

  const { program, loading: progLoading, error: progError } = useProgram();

  const [loadingLogs, setLoadingLogs] = useState(true);
  const [dayTitle, setDayTitle] = useState('');
  const [exercises, setExercises] = useState<any[]>([]);
  const [progress, setProgress] = useState<{ reps: string; weight: string }[][]>([]);
  const [lastSession, setLastSession] = useState<Record<string, any[]> | null>(null);

  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [showPR, setShowPR] = useState(false);
  const [prMessages, setPRMessages] = useState<string[]>([]);
  const [showToast, setShowToast] = useState(false);

  // 1️⃣ Initialize screen from program hook
  useEffect(() => {
    if (!progLoading && program) {
      const dayIdx = program.currentDay - 1;
      const today = program.days[dayIdx];
      setDayTitle(today.title);

      // attach placeholder videoUri
      const enriched = today.exercises.map(ex => ({
        ...ex,
        videoUri: 'https://www.w3schools.com/html/mov_bbb.mp4',
      }));
      setExercises(enriched);

      // init progress inputs
      setProgress(
        enriched.map(ex => Array.from({ length: ex.sets }, () => ({ reps: '', weight: '' })))
      );
    }
  }, [progLoading, program]);

  // 2️⃣ Load last session logs for PR comparison
  useEffect(() => {
    const loadLogs = async () => {
      if (!program) return;
      try {
        const uid = auth.currentUser!.uid;
        const q = query(
          collection(firestore, 'users', uid, 'workoutLogs'),
          orderBy('completedAt', 'desc')
        );
        const snap = await getDocs(q);
        const latest = snap.docs[0]?.data();
        if (latest) {
          const map: Record<string, any[]> = {};
          latest.exercises.forEach((ex: any) => {
            map[ex.name] = ex.sets;
          });
          setLastSession(map);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingLogs(false);
      }
    };
    loadLogs();
  }, [program]);

  if (progLoading || loadingLogs) {
    return (
      <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </LinearGradient>
    );
  }

  if (progError) {
    Alert.alert('Error', progError);
  }

  const togglePlay = (idx: number) =>
    setPlayingIndex(prev => (prev === idx ? null : idx));

  const handleInputChange = (
    exIdx: number,
    setIdx: number,
    field: 'reps' | 'weight',
    val: string
  ) => {
    setProgress(p => {
      const copy = [...p];
      copy[exIdx][setIdx][field] = val;
      return copy;
    });
  };

  const isComplete = (sets: any[]) => sets.every(s => s.reps && s.weight);

  const saveWorkout = async () => {
    try {
      const uid = auth.currentUser!.uid;
      const todayId = new Date().toISOString().split('T')[0];
      const logData = {
        dayTitle,
        completedAt: new Date(),
        exercises: exercises.map((ex, i) => ({
          name: ex.name,
          sets: progress[i],
        })),
      };

      // fetch existing PRs
      const prSnap = await getDocs(collection(firestore, 'users', uid, 'workoutLogs'));
      const currentPRs: Record<string, number> = {};
      prSnap.forEach(doc => {
        doc.data().exercises.forEach((e: any) =>
          e.sets.forEach((s: any) => {
            const w = parseFloat(s.weight);
            if (!isNaN(w)) {
              currentPRs[e.name] = Math.max(currentPRs[e.name] || 0, w);
            }
          })
        );
      });

      // write the new log
      await setDoc(doc(firestore, 'users', uid, 'workoutLogs', todayId), logData);
      setShowToast(true);

      // detect new PRs
      const newPRs: string[] = [];
      logData.exercises.forEach(ex =>
        ex.sets.forEach((s: any) => {
          const w = parseFloat(s.weight);
          if (!isNaN(w) && w > (currentPRs[ex.name] || 0)) {
            newPRs.push(`${ex.name}: ${w} lbs`);
          }
        })
      );
      if (newPRs.length) {
        setPRMessages(newPRs);
        setShowPR(true);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{dayTitle}</Text>

        {exercises.map((ex, i) => {
          const complete = isComplete(progress[i]);
          const lastSets = lastSession?.[ex.name];
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
                Recommended: {ex.sets} × {ex.reps}
              </Text>

              <Pressable style={styles.videoContainer} onPress={() => togglePlay(i)}>
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
                    <Text style={styles.playText}>Play</Text>
                  </View>
                )}
              </Pressable>

              {progress[i].map((s, idx) => (
                <View key={idx} style={styles.setBlock}>
                  <View style={styles.setRow}>
                    <Text style={styles.setLabel}>Set {idx + 1}:</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="reps"
                      placeholderTextColor="#777"
                      keyboardType="numeric"
                      value={s.reps}
                      onChangeText={t => handleInputChange(i, idx, 'reps', t)}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="lbs"
                      placeholderTextColor="#777"
                      keyboardType="numeric"
                      value={s.weight}
                      onChangeText={t => handleInputChange(i, idx, 'weight', t)}
                    />
                  </View>
                  {lastSets?.[idx] && (
                    <Text style={styles.lastText}>
                      Last: {lastSets[idx].reps} @ {lastSets[idx].weight} lbs
                    </Text>
                  )}
                </View>
              ))}
            </View>
          );
        })}

        <Pressable style={styles.saveButton} onPress={saveWorkout}>
          <Ionicons name="save" size={20} color="#fff" style={styles.icon} />
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
          <Ionicons name="arrow-back" size={20} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>

        {showPR && (
          <PRCelebration
            visible={showPR}
            messages={prMessages}
            onClose={() => setShowPR(false)}
          />
        )}
      </ScrollView>

      {showToast && <Toast message="Workout saved!" onClose={() => setShowToast(false)} />}
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
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  cardComplete: {
    opacity: 0.6,
    borderWidth: 1,
    borderColor: '#4caf50',
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
    color: '#aaa',
    textDecorationLine: 'line-through',
  },
  recommendation: {
    fontStyle: 'italic',
    color: '#aaa',
    marginBottom: 12,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: { width: '100%', height: '100%' },
  playOverlay: { justifyContent: 'center', alignItems: 'center' },
  playText: { color: '#fff', marginTop: 4 },
  setBlock: { marginBottom: 10 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  setLabel: { width: 60, color: '#ccc' },
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
  lastText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 60,
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#d32f2f',
    borderRadius: 10,
    paddingVertical: 14,
    justifyContent: 'center',
    marginTop: 16,
  },
  secondaryButton: {
    borderColor: '#888',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  icon: { marginRight: 8 },
});

export default WorkoutDetailScreen;
