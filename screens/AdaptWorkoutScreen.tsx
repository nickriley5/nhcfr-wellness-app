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
import Video from 'react-native-video';
import Toast from '../components/Toast';
import { useProgram } from '../src/hooks/useProgram';

const fallbackVideos: Record<string, string> = {
  Pushups: 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Bent-over Rows': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Overhead Press': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Air Squat': 'https://www.w3schools.com/html/mov_bbb.mp4',
};

const similarExercises: Record<string, { name: string; videoUri: string; thumbnailUri: string }[]> = {
  Pushups: [
    { name: 'Incline Pushup', videoUri: fallbackVideos.Pushups, thumbnailUri: 'https://via.placeholder.com/100' },
    { name: 'Kneeling Pushup', videoUri: fallbackVideos.Pushups, thumbnailUri: 'https://via.placeholder.com/100' },
    { name: 'Wide Pushup', videoUri: fallbackVideos.Pushups, thumbnailUri: 'https://via.placeholder.com/100' },
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
};

const AdaptWorkoutScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { program, loading, error, saveAdaptedWorkout } = useProgram();

  const [adaptedExercises, setAdaptedExercises] = useState<any[]>([]);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [showAllReplacements, setShowAllReplacements] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // When program loads, pull today’s exercises into state
  useEffect(() => {
    if (program) {
      const dayIdx = program.currentDay - 1;
      const today = program.days[dayIdx].exercises.map((ex: any) => ({
        ...ex,
        videoUri: fallbackVideos[ex.name] || fallbackVideos.Pushups,
      }));
      setAdaptedExercises(today);
    }
  }, [program]);

  // Loader state
  if (loading) {
    return (
      <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </LinearGradient>
    );
  }

  // Error state
  if (error || !program) {
    return (
      <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Failed to load your program.</Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.primaryButton}>
            <Text style={styles.buttonText}>Go Back</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  // Swap modal controls
  const handleAdapt = (idx: number) => {
    setCurrentIndex(idx);
    setModalVisible(true);
  };

  const selectReplacement = (rep: { name: string; videoUri: string }) => {
    if (currentIndex === null) return;
    const updated = [...adaptedExercises];
    updated[currentIndex] = { ...updated[currentIndex], name: rep.name, videoUri: rep.videoUri };
    setAdaptedExercises(updated);
    setModalVisible(false);
    setShowAllReplacements(false);
    setCurrentIndex(null);
  };

  // Save adapted workout
  const handleSave = async () => {
    try {
      const dayIdx = program.currentDay - 1;
      await saveAdaptedWorkout(dayIdx, adaptedExercises);
      setShowToast(true);
      setTimeout(() => navigation.navigate('WorkoutDetail', { adapt: true }), 1500);
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    }
  };

  // Video preview toggle
  const togglePlay = (idx: number) => setPlayingIndex(prev => (prev === idx ? null : idx));

  return (
    <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Back */}
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>Adapt Today’s Workout</Text>

        {/* Exercise Cards */}
        {adaptedExercises.map((ex, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.cardTitle}>{ex.name}</Text>
            <Pressable onPress={() => togglePlay(i)} style={styles.videoBox}>
              {playingIndex === i ? (
                <Video source={{ uri: ex.videoUri }} style={styles.video} controls paused={false} onEnd={() => setPlayingIndex(null)} />
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

        {/* Save & Cancel */}
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="save" size={20} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Save Adapted Workout</Text>
        </Pressable>
        <Pressable
          style={[styles.saveButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('Main', { screen: 'MainTabs', params: { screen: 'Workout' } })}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Back to Workout Hub</Text>
        </Pressable>
      </ScrollView>

      {/* Swap Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {currentIndex !== null && (
              <>
                <Text style={styles.modalTitle}>
                  Replacing: <Text style={{ color: '#4fc3f7' }}>{adaptedExercises[currentIndex].name}</Text>
                </Text>
                <Text style={styles.modalSubTitle}>Choose a replacement:</Text>
                <FlatList
                  data={
                    showAllReplacements
                      ? similarExercises[adaptedExercises[currentIndex].name] || []
                      : (similarExercises[adaptedExercises[currentIndex].name] || []).slice(0, 3)
                  }
                  keyExtractor={item => item.name}
                  renderItem={({ item }) => (
                    <Pressable style={styles.replacementItem} onPress={() => selectReplacement(item)}>
                      <Image source={{ uri: item.thumbnailUri }} style={styles.thumbnail} />
                      <View style={styles.replacementInfo}>
                        <Text style={styles.replacementText}>{item.name}</Text>
                        <Text style={styles.replacementTag}>🏷 No Equipment</Text>
                      </View>
                    </Pressable>
                  )}
                />
                {(similarExercises[adaptedExercises[currentIndex].name] || []).length > 3 && (
                  <Pressable style={styles.moreToggle} onPress={() => setShowAllReplacements(prev => !prev)}>
                    <Text style={styles.moreToggleText}>{showAllReplacements ? '➖ Show Less' : '➕ More Options'}</Text>
                  </Pressable>
                )}
              </>
            )}
            <Pressable style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Toast */}
      {showToast && <Toast message="Adapted workout saved!" onClose={() => setShowToast(false)} />}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#2a2a2a',
    borderColor: '#d32f2f',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    width: '100%',
  },
  cancelButton: {
    marginTop: 12,
    borderColor: '#888',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  content: {
    alignItems: 'center',
    padding: 24,
  },
  icon: {
    marginRight: 8,
  },
  moreToggle: {
    alignItems: 'center',
    marginVertical: 8,
  },
  moreToggleText: {
    color: '#4fc3f7',
    fontSize: 14,
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
    width: '80%',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    flex: 1,
    justifyContent: 'center',
  },
  modalSubTitle: {
    color: '#bbb',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
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
  primaryButton: {
    backgroundColor: '#d32f2f',
  },
  playBox: {},
  profileImage: {},
  saveButton: {
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderColor: '#d32f2f',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    width: '100%',
  },
  secondaryButton: {
    borderColor: '#888',
  },
  thumbnail: {
    borderRadius: 8,
    height: 50,
    marginRight: 10,
    width: 50,
  },
  topBar: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    marginTop: 8,
  },
  video: {
    height: '100%',
    width: '100%',
  },
  videoBox: {
    alignItems: 'center',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    width: '100%',
  },
  replacementItem: {
    alignItems: 'center',
    borderBottomColor: '#333',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  replacementInfo: {
    justifyContent: 'center',
  },
  replacementTag: {
    color: '#aaa',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  replacementText: {
    color: '#fff',
    fontSize: 16,
  },
  title: {
    color: '#d32f2f',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  errorText: { 
    color: '#fff', 
    fontSize: 16, 
    marginBottom: 12 
  },
});

export default AdaptWorkoutScreen;
