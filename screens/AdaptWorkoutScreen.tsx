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
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { auth, firestore } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Toast from '../components/Toast';
import Video from 'react-native-video';

const equipmentOptions = ['Bodyweight', 'Kettlebell', 'Bands'];
const fallbackVideos: Record<string, string> = {
  Pushups: 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Bent-over Rows': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Overhead Press': 'https://www.w3schools.com/html/mov_bbb.mp4',
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AdaptWorkoutScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [exercises, setExercises] = useState<any[]>([]);
  const [adaptedExercises, setAdaptedExercises] = useState<any[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState('Bodyweight');
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchWorkout = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const docRef = doc(firestore, 'programs', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const day = data.currentDay - 1;
        const todayExercises = data.days[day].exercises.map((ex: any) => ({
          ...ex,
          videoUri: fallbackVideos[ex.name] || fallbackVideos['Pushups'],
        }));
        setExercises(todayExercises);
        setAdaptedExercises(todayExercises);
      }
      setLoading(false);
    };

    fetchWorkout();
  }, []);

  const handleAdapt = (index: number) => {
    const adapted = [...adaptedExercises];
    adapted[index] = {
      ...adapted[index],
      name: 'Air Squat',
      videoUri: fallbackVideos['Pushups'],
    };
    setAdaptedExercises(adapted);
  };

  const handleSave = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const docRef = doc(firestore, 'programs', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const day = data.currentDay - 1;
        data.days[day].exercises = adaptedExercises;
        await setDoc(docRef, data);
        setShowToast(true);
        setTimeout(() => {
          navigation.navigate('WorkoutDetail');
        }, 2000);
      }
    } catch (err) {
      console.error('Save error:', err);
      Alert.alert('Error', 'Failed to save adapted workout.');
    }
  };

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
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>Adapt Today’s Workout</Text>

        {adaptedExercises.map((ex, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.cardTitle}>{ex.name}</Text>
            <Pressable onPress={() => togglePlay(i)} style={styles.videoBox}>
              {playingIndex === i ? (
                <Video
                  source={{ uri: ex.videoUri }}
                  style={styles.video}
                  resizeMode="cover"
                  paused={false}
                  controls
                  onEnd={() => setPlayingIndex(null)}
                />
              ) : (
                <View style={styles.playOverlay}>
                  <Ionicons name="play-circle-outline" size={42} color="#fff" />
                  <Text style={styles.playText}>Preview</Text>
                </View>
              )}
            </Pressable>
            <Pressable style={styles.button} onPress={() => handleAdapt(i)}>
              <Text style={styles.buttonText}>Swap Exercise</Text>
            </Pressable>
          </View>
        ))}

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="save" size={20} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Save Adapted Workout</Text>
        </Pressable>
      </ScrollView>
      {showToast && (
        <Toast message="Adapted workout saved!" onClose={() => setShowToast(false)} />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, alignItems: 'center' },
  topBar: { alignSelf: 'flex-start', marginBottom: 12, marginTop: 8 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#d32f2f',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8 },
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
  button: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#d32f2f',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#2a2a2a',
    borderColor: '#d32f2f',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 12,
    alignItems: 'center',
    width: '100%',
  },
  icon: { marginRight: 8 },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default AdaptWorkoutScreen;
