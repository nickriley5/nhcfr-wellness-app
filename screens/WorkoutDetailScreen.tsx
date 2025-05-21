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

const WorkoutDetailScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'WorkoutDetail'>>();
  const fromAdapt = route.params?.adapt ?? false;

  const [loading, setLoading] = useState(true);
  const [dayTitle, setDayTitle] = useState('');
  const [exercises, setExercises] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[][]>([]);
  const [lastSession, setLastSession] = useState<Record<string, any[]> | null>(null);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [showPR, setShowPR] = useState(false);
  const [prMessages, setPRMessages] = useState<string[]>([]);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const docRef = doc(db, 'users', uid, 'program', 'active');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const today = data.currentDay - 1;
          const raw = data.days[today].exercises;

          const enriched = raw.map((ex: any) => ({
            ...ex,
            videoUri: 'https://www.w3schools.com/html/mov_bbb.mp4',
          }));

          setDayTitle(data.days[today].title);
          setExercises(enriched);

          const initialProgress = enriched.map((ex: any) =>
            Array.from({ length: Number(ex.sets || 3) }, () => ({ reps: '', weight: '' }))
          );

          setProgress(initialProgress);

          const logRef = collection(db, 'users', uid, 'workoutLogs');
          const q = query(logRef, orderBy('completedAt', 'desc'));
          const logsSnap = await getDocs(q);

          const latest = logsSnap.docs[0]?.data();
          if (latest) {
            const lastData: Record<string, any[]> = {};
            latest.exercises.forEach((ex: any) => {
              lastData[ex.name] = ex.sets;
            });
            setLastSession(lastData);
          }
        }
      } catch (err) {
        console.error(err);
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

  const isExerciseComplete = (sets: any[]) =>
    sets.every(set => set.reps && set.weight);

  const togglePlay = (index: number) => {
    setPlayingIndex(prev => (prev === index ? null : index));
  };

  const saveWorkoutProgress = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const now = new Date();
    const workoutId = now.toISOString().replace(/[:.]/g, '-');
    
    const logData = {
      dayTitle: dayTitle, // KEEP THIS CLEAN – don't include time here
      completedAt: Timestamp.fromDate(now), // Save actual DateTime object
      exercises: exercises.map((ex, exIndex) => ({
        name: ex.name,
        sets: progress[exIndex],
      })),
    };
    

// Save it to Firestore
await setDoc(doc(db, 'users', uid, 'workoutLogs', workoutId), logData);

await checkAndAdjustRestDays(uid);


    try {
      const prRef = collection(db, 'users', uid, 'workoutLogs');
      const snapshot = await getDocs(prRef);

      const currentPRs: Record<string, number> = {};

      snapshot.forEach(doc => {
        const data = doc.data();
        data.exercises.forEach((ex: any) => {
          ex.sets.forEach((set: any) => {
            const weight = parseFloat(set.weight);
            if (!isNaN(weight)) {
              if (!currentPRs[ex.name] || weight > currentPRs[ex.name]) {
                currentPRs[ex.name] = weight;
              }
            }
          });
        });
      });

      setShowToast(true);

      const newPRs: string[] = [];

      logData.exercises.forEach((ex: any) => {
        ex.sets.forEach((set: any) => {
          const weight = parseFloat(set.weight);
          if (!isNaN(weight) && weight > (currentPRs[ex.name] || 0)) {
            newPRs.push(`${ex.name}: ${weight} lbs`);
          }
        });
      });

      if (newPRs.length > 0) {
        setPRMessages(newPRs);
        setShowPR(true);
      }
    } catch (error) {
      console.error('Error saving workout or checking PRs:', error);
      alert('Failed to save workout.');
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

        {exercises.map((ex, exIndex) => {
          const sets = progress[exIndex];
          const complete = isExerciseComplete(sets);
          const isPlaying = playingIndex === exIndex;
          const last = lastSession?.[ex.name];

          return (
            <View
              key={exIndex}
              style={[styles.card, complete && styles.cardComplete]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, complete && styles.cardTitleComplete]}>
                  {ex.name}
                </Text>
                <Pressable onPress={() => navigation.navigate('ProgressChart', { exerciseName: ex.name })}>
                  <Ionicons name="stats-chart" size={20} color="#4fc3f7" />
                </Pressable>
              </View>

              <Text style={styles.recommendation}>
                Recommended: {ex.sets} sets × {ex.reps} reps
              </Text>

              <TouchableOpacity onPress={() => togglePlay(exIndex)} style={styles.videoBox}>
                {isPlaying ? (
                  <Video
                    source={{ uri: ex.videoUri }}
                    style={styles.video}
                    resizeMode="cover"
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

              {sets.map((set, setIndex) => {
                const lastSet = last?.[setIndex];
                return (
                  <View key={setIndex} style={styles.setBlock}>
                    <View style={styles.setRow}>
                      <Text style={styles.setLabel}>Set {setIndex + 1}:</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="reps"
                        placeholderTextColor="#777"
                        keyboardType="numeric"
                        value={set.reps}
                        onChangeText={text => handleInputChange(exIndex, setIndex, 'reps', text)}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="(lbs)"
                        placeholderTextColor="#777"
                        keyboardType="numeric"
                        value={set.weight}
                        onChangeText={text => handleInputChange(exIndex, setIndex, 'weight', text)}
                      />
                    </View>
                    {lastSet && (
                      <Text style={styles.lastWorkoutText}>
                        Last: {lastSet.reps} reps @ {lastSet.weight} lbs
                      </Text>
                    )}
                  </View>
                );
              })}
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
          <PRCelebration visible={showPR} messages={prMessages} onClose={() => setShowPR(false)} />
        )}
      </ScrollView>

      {showToast && (
        <Toast message="Workout saved successfully!" onClose={() => setShowToast(false)} />
      )}
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
