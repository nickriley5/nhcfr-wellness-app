import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Image,
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

const fallbackVideos: Record<string, string> = {
  Pushups: 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Bent-over Rows': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Overhead Press': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Air Squat': 'https://www.w3schools.com/html/mov_bbb.mp4',
};

const similarExercises: Record<string, { name: string; videoUri: string; thumbnailUri: string }[]> = {
    Pushups: [
      { name: 'Incline Pushup', videoUri: fallbackVideos['Pushups'], thumbnailUri: 'https://via.placeholder.com/100' },
      { name: 'Kneeling Pushup', videoUri: fallbackVideos['Pushups'], thumbnailUri: 'https://via.placeholder.com/100' },
      { name: 'Wide Pushup', videoUri: fallbackVideos['Pushups'], thumbnailUri: 'https://via.placeholder.com/100' },
    ],
    'Bent-over Rows': [
      { name: 'Band Rows', videoUri: fallbackVideos['Bent-over Rows'], thumbnailUri: 'https://via.placeholder.com/100' },
      { name: 'Single Arm Rows', videoUri: fallbackVideos['Bent-over Rows'], thumbnailUri: 'https://via.placeholder.com/100' },
    ],
    'Overhead Press': [
      { name: 'Pike Press', videoUri: fallbackVideos['Overhead Press'], thumbnailUri: 'https://via.placeholder.com/100' },
      { name: 'Band Press', videoUri: fallbackVideos['Overhead Press'], thumbnailUri: 'https://via.placeholder.com/100' },
    ],
    'Air Squat': [
      { name: 'Wall Sit', videoUri: fallbackVideos['Air Squat'], thumbnailUri: 'https://via.placeholder.com/100' },
      { name: 'Split Squat', videoUri: fallbackVideos['Air Squat'], thumbnailUri: 'https://via.placeholder.com/100' },
      { name: 'Step-Up', videoUri: fallbackVideos['Air Squat'], thumbnailUri: 'https://via.placeholder.com/100' },
    ],
    'Bodyweight Row': [
      { name: 'Inverted Row', videoUri: fallbackVideos['Bent-over Rows'], thumbnailUri: 'https://via.placeholder.com/100' },
      { name: 'Band Row', videoUri: fallbackVideos['Bent-over Rows'], thumbnailUri: 'https://via.placeholder.com/100' },
    ],
    'Plank': [
      { name: 'Side Plank', videoUri: fallbackVideos['Pushups'], thumbnailUri: 'https://via.placeholder.com/100' },
      { name: 'Forearm Plank', videoUri: fallbackVideos['Pushups'], thumbnailUri: 'https://via.placeholder.com/100' },
      { name: 'Plank with Reach', videoUri: fallbackVideos['Pushups'], thumbnailUri: 'https://via.placeholder.com/100' },
    ],
    'Split Squat': [
  { name: 'Wall Sit', videoUri: fallbackVideos['Air Squat'], thumbnailUri: 'https://via.placeholder.com/100' },
  { name: 'Step-Up', videoUri: fallbackVideos['Air Squat'], thumbnailUri: 'https://via.placeholder.com/100' },
],
  };
  

const AdaptWorkoutScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [exercises, setExercises] = useState<any[]>([]);
  const [adaptedExercises, setAdaptedExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [showAllReplacements, setShowAllReplacements] = useState(false);


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
    setCurrentIndex(index);
    setModalVisible(true);
  };

  const selectReplacement = (replacement: { name: string; videoUri: string }) => {
    if (currentIndex === null) return;
    const updated = [...adaptedExercises];
    updated[currentIndex] = {
      ...updated[currentIndex],
      name: replacement.name,
      videoUri: replacement.videoUri,
    };
    setAdaptedExercises(updated);
    setModalVisible(false);
    setCurrentIndex(null);
    setShowAllReplacements(false);
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
          navigation.navigate('WorkoutDetail', { adapt: true });
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
  <Text style={styles.buttonText}>Back to Workout Hub</Text>
</Pressable>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      {currentIndex !== null && (
        <>
          <Text style={styles.modalTitle}>
            Replacing: <Text style={{ color: '#4fc3f7' }}>{adaptedExercises[currentIndex]?.name}</Text>
          </Text>
          <Text style={styles.modalSubTitle}>Choose a replacement exercise:</Text>

          <FlatList
            data={
              showAllReplacements
                ? similarExercises[adaptedExercises[currentIndex]?.name] || []
                : (similarExercises[adaptedExercises[currentIndex]?.name] || []).slice(0, 3)
            }
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => (
              <Pressable style={styles.replacementItem} onPress={() => selectReplacement(item)}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image
                    source={{ uri: item.thumbnailUri }}
                    style={{ width: 50, height: 50, marginRight: 10, borderRadius: 8 }}
                  />
                  <View>
                    <Text style={styles.replacementText}>{item.name}</Text>
                    <Text style={styles.replacementTag}>🏷 No Equipment</Text>
                  </View>
                </View>
              </Pressable>
            )}
          />

          {similarExercises[adaptedExercises[currentIndex]?.name]?.length > 3 && (
            <Pressable
              onPress={() => setShowAllReplacements(prev => !prev)}
              style={{ alignItems: 'center', marginVertical: 8 }}
            >
              <Text style={{ color: '#4fc3f7', fontSize: 14 }}>
                {showAllReplacements ? '➖ Show Less' : '➕ Show More Options'}
              </Text>
            </Pressable>
          )}
        </>
      )}

      <Pressable
        style={[styles.button, { marginTop: 12 }]}
        onPress={() => {
          setModalVisible(false);
          setShowAllReplacements(false);
        }}
      >
        <Text style={styles.buttonText}>Cancel</Text>
      </Pressable>
    </View>
  </View>
</Modal>



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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalSubTitle: {
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
    marginBottom: 10,
  },
  
  replacementItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  replacementText: {
    color: '#fff',
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: 10,
    borderColor: '#888',
  },
  replacementTag: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 2,
    fontStyle: 'italic',
  },
});

export default AdaptWorkoutScreen;
