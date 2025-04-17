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
import { auth, firestore } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Video from 'react-native-video';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface Exercise {
  name: string;
  sets: number;
  reps: string | number;
  videoUri: string;
}

interface SetData {
  reps: string;
  weight: string;
}

const WorkoutDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [loading, setLoading] = useState(true);
  const [dayTitle, setDayTitle] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [progress, setProgress] = useState<SetData[][]>([]);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const docRef = doc(firestore, 'programs', uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const today = data.currentDay - 1;
          const raw = data.days[today].exercises;

          // Add placeholder videos for demo purposes
          const enriched = raw.map((ex: any) => ({
            ...ex,
            videoUri: 'https://www.w3schools.com/html/mov_bbb.mp4', // swap this later
          }));

          setDayTitle(data.days[today].title);
          setExercises(enriched);

          const initialProgress = enriched.map((ex: Exercise) =>
            Array.from({ length: ex.sets }, () => ({ reps: '', weight: '' }))
          );
          setProgress(initialProgress);
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

  const isExerciseComplete = (sets: SetData[]) =>
    sets.every(set => set.reps && set.weight);

  const togglePlay = (index: number) => {
    setPlayingIndex(prev => (prev === index ? null : index));
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

          return (
            <View
              key={exIndex}
              style={[
                styles.exerciseCard,
                complete && styles.exerciseCardCompleted,
              ]}
            >
              <View style={styles.exerciseHeader}>
                <Text
                  style={[
                    styles.exerciseName,
                    complete && styles.exerciseNameCompleted,
                  ]}
                >
                  {ex.name}
                </Text>
                {complete && (
                  <Ionicons name="checkmark-circle" size={22} color="#4caf50" />
                )}
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

              {sets.map((set, setIndex) => (
                <View key={setIndex} style={styles.setRow}>
                  <Text style={styles.setLabel}>Set {setIndex + 1}:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Reps"
                    keyboardType="numeric"
                    value={set.reps}
                    onChangeText={text =>
                      handleInputChange(exIndex, setIndex, 'reps', text)
                    }
                    placeholderTextColor="#999"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Weight"
                    keyboardType="numeric"
                    value={set.weight}
                    onChangeText={text =>
                      handleInputChange(exIndex, setIndex, 'weight', text)
                    }
                    placeholderTextColor="#999"
                  />
                </View>
              ))}
            </View>
          );
        })}

        <Pressable
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Back to Workout Hub</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, alignItems: 'center' },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#d32f2f',
    marginBottom: 20,
    textAlign: 'center',
  },
  exerciseCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  exerciseCardCompleted: {
    backgroundColor: '#1e1e1e',
    borderColor: '#4caf50',
    borderWidth: 1,
    opacity: 0.6,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  exerciseName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  exerciseNameCompleted: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  recommendation: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  setLabel: {
    color: '#ccc',
    width: 55,
  },
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
  video: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#d32f2f',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 24,
    width: '100%',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: '#444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  icon: {
    marginRight: 8,
  },
});

export default WorkoutDetailScreen;