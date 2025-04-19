// screens/AdaptWorkoutScreen.tsx

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
import { auth } from '../firebase';
import {
  getCurrentProgram,
  saveAdaptedWorkout,
} from '../src/services/programService';
import Toast from '../components/Toast';
import Video from 'react-native-video';

const fallbackVideos: Record<string, string> = {
  Pushups: 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Bent-over Rows': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Overhead Press': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Air Squat': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Goblet Squat': 'https://www.w3schools.com/html/mov_bbb.mp4',
  Lunges: 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Glute Bridge': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Jump Rope': 'https://www.w3schools.com/html/mov_bbb.mp4',
  Plank: 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Mountain Climbers': 'https://www.w3schools.com/html/mov_bbb.mp4',
  Walking: 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Deep Breathing': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Kettlebell Swings': 'https://www.w3schools.com/html/mov_bbb.mp4',
  Burpees: 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Squat to Press': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Hip Flexor Stretch': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Cat Cow': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Hamstring Stretch': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Full Rest': 'https://www.w3schools.com/html/mov_bbb.mp4',
};

const similarExercises: Record<
  string,
  { name: string; videoUri: string; thumbnailUri: string }[]
> = {
  // Upper Body
  Pushups: [
    {
      name: 'Incline Pushup',
      videoUri: fallbackVideos.Pushups,
      thumbnailUri: 'https://via.placeholder.com/100',
    },
    {
      name: 'Kneeling Pushup',
      videoUri: fallbackVideos.Pushups,
      thumbnailUri: 'https://via.placeholder.com/100',
    },
    {
      name: 'Wide Pushup',
      videoUri: fallbackVideos.Pushups,
      thumbnailUri: 'https://via.placeholder.com/100',
    },
  ],
  'Bent-over Rows': [
    {
      name: 'Band Rows',
      videoUri: fallbackVideos['Bent-over Rows'],
      thumbnailUri: 'https://via.placeholder.com/100',
    },
    {
      name: 'Single Arm Rows',
      videoUri: fallbackVideos['Bent-over Rows'],
      thumbnailUri: 'https://via.placeholder.com/100',
    },
  ],
  'Overhead Press': [
    {
      name: 'Pike Press',
      videoUri: fallbackVideos['Overhead Press'],
      thumbnailUri: 'https://via.placeholder.com/100',
    },
    {
      name: 'Band Press',
      videoUri: fallbackVideos['Overhead Press'],
      thumbnailUri: 'https://via.placeholder.com/100',
    },
  ],

  // Lower Body
  'Goblet Squat': [
    {
      name: 'Air Squat',
      videoUri: fallbackVideos['Air Squat'],
      thumbnailUri: 'https://via.placeholder.com/100',
    },
    {
      name: 'Split Squat',
      videoUri: fallbackVideos['Air Squat'],
      thumbnailUri: 'https://via.placeholder.com/100',
    },
  ],
  Lunges: [
    {
      name: 'Split Squat',
      videoUri: fallbackVideos.Lunges,
      thumbnailUri: 'https://via.placeholder.com/100',
    },
    {
      name: 'Step-Up',
      videoUri: fallbackVideos.Lunges,
      thumbnailUri: 'https://via.placeholder.com/100',
    },
  ],
  'Glute Bridge': [
    {
      name: 'Hip Thrust',
      videoUri: fallbackVideos['Glute Bridge'],
      thumbnailUri: 'https://via.placeholder.com/100',
    },
    {
      name: 'Single-Leg Glute Bridge',
      videoUri: fallbackVideos['Glute Bridge'],
      thumbnailUri: 'https://via.placeholder.com/100',
    },
  ],

  // Conditioning & Core
  'Jump Rope': [
    {
      name: 'Jumping Jacks',
      videoUri: fallbackVideos['Jump Rope'],
      thumbnailUri: 'https://via.placeholder.com/100',
    },
    {
      name: 'High Knees',
      videoUri: fallbackVideos['Jump Rope'],
      thumbnailUri: 'https://via.placeholder.com/100',
    },
  ],
  Plank: [
    {
      name: 'Side Plank',
      videoUri: fallbackVideos.Plank,
      thumbnailUri: 'https://via.placeholder.com/100',
    },
    {
      name: 'Forearm Plank',
      videoUri: fallbackVideos.Plank,
      thumbnailUri: 'https://via.placeholder.com/100',
    },
  ],
  'Mountain Climbers': [
    {
      name: 'Spider-Man Plank',
      videoUri: fallbackVideos['Mountain Climbers'],
      thumbnailUri: 'https://via.placeholder.com/100',
    },
    {
      name: 'Bear Crawl',
      videoUri: fallbackVideos['Mountain Climbers'],
      thumbnailUri: 'https://via.placeholder.com/100',
    },
  ],

  // Active Recovery
  Walking: [
    {
      name: 'March in Place',
      videoUri: fallbackVideos.Walking,
      thumbnailUri: 'https://via.placeholder.com/100',
    },
    {
      name: 'Side Steps',
      videoUri: fallbackVideos.Walking,
      thumbnailUri: 'https://via.placeholder.com/100',
    },
  ],
  'Deep Breathing': [
    {
      name: 'Box Breathing',
      videoUri: fallbackVideos['Deep Breathing'],
      thumbnailUri: 'https://via.placeholder.com/100',
    },
    {
      name: 'Diaphragmatic Breathing',
      videoUri: fallbackVideos['Deep Breathing'],
      thumbnailUri: 'https://via.placeholder.com/100',
    },
  ],

  // Full Body Power
  'Kettlebell Swings': [
    {
      name: 'Dumbbell Swings',
      videoUri: fallbackVideos['Kettlebell Swings'],
      thumbnailUri: 'https://via.placeholder.com/100',
    },
    {
      name: 'Hip Hinge',
      videoUri: fallbackVideos['Kettlebell Swings'],
      thumbnailUri: 'https://via.placeholder.com/100',
    },
  ],
  Burpees: [
    {
      name: 'Squat Thrusts',
      videoUri: fallbackVideos.Burpees,
      thumbnailUri: 'https://via.placeholder.com/100',
    },
    {
      name: 'Mountain Climbers',
      videoUri: fallbackVideos.Burpees,
      thumbnailUri: 'https://via.placeholder.com/100',
    },
  ],
  'Squat to Press': [
    {
      name: 'Thrusters',
      videoUri: fallbackVideos['Squat to Press'],
      thumbnailUri: 'https://via.placeholder.com/100',
    },
    {
      name: 'Goblet Squat',
      videoUri: fallbackVideos['Squat to Press'],
      thumbnailUri: 'https://via.placeholder.com/100',
    },
  ],

  // Mobility & Flexibility
  'Hip Flexor Stretch': [
    {
      name: 'Lunge Stretch',
      videoUri: fallbackVideos['Hip Flexor Stretch'],
      thumbnailUri: 'https://via.placeholder.com/100',
    },
    {
      name: 'Pigeon Pose',
      videoUri: fallbackVideos['Hip Flexor Stretch'],
      thumbnailUri: 'https://via.placeholder.com/100',
    },
  ],
  'Cat Cow': [
    {
      name: 'Child’s Pose',
      videoUri: fallbackVideos['Cat Cow'],
      thumbnailUri: 'https://via.placeholder.com/100',
    },
    {
      name: 'Seated Cat Cow',
      videoUri: fallbackVideos['Cat Cow'],
      thumbnailUri: 'https://via.placeholder.com/100',
    },
  ],
  'Hamstring Stretch': [
    {
      name: 'Forward Fold',
      videoUri: fallbackVideos['Hamstring Stretch'],
      thumbnailUri: 'https://via.placeholder.com/100',
    },
    {
      name: 'Hamstring Walks',
      videoUri: fallbackVideos['Hamstring Stretch'],
      thumbnailUri: 'https://via.placeholder.com/100',
    },
  ],

  // Rest
  'Full Rest': [],
};

const AdaptWorkoutScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [exercises, setExercises] = useState<any[]>([]);
  const [adaptedExercises, setAdaptedExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [showAllReplacements, setShowAllReplacements] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const program = await getCurrentProgram();
        if (!program) {
          Alert.alert('Error', 'No program found.');
          return;
        }
        const dayIdx = program.currentDay - 1;
        const today = program.days[dayIdx].exercises.map((ex: any) => ({
          ...ex,
          videoUri:
            fallbackVideos[ex.name] || fallbackVideos['Pushups'],
        }));
        setExercises(today);
        setAdaptedExercises(today);
      } catch (e) {
        console.error(e);
        Alert.alert('Error', (e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAdapt = (idx: number) => {
    const key = adaptedExercises[idx].name;
    if ((similarExercises[key] || []).length === 0) {
      return Alert.alert(
        'No swaps available',
        `Sorry, there are no replacement options for "${key}".`
      );
    }
    setCurrentIndex(idx);
    setModalVisible(true);
  };

  const selectReplacement = (replacement: {
    name: string;
    videoUri: string;
  }) => {
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
      const program = await getCurrentProgram();
      if (!program) throw new Error('No program');
      const dayIdx = program.currentDay - 1;
      await saveAdaptedWorkout(dayIdx, adaptedExercises);
      setShowToast(true);
      setTimeout(() => {
        navigation.navigate('WorkoutDetail', { adapt: true });
      }, 1500);
    } catch (e) {
      console.error(e);
      Alert.alert(
        'Error',
        (e as Error).message || 'Failed to save adaptations.'
      );
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#0f0f0f', '#1c1c1c']}
        style={styles.container}
      >
        <ActivityIndicator size="large" color="#d32f2f" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#0f0f0f', '#1c1c1c']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>Adapt Today’s Workout</Text>

        {adaptedExercises.map((ex, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.cardTitle}>{ex.name}</Text>
            <Pressable
              onPress={() => togglePlay(i)}
              style={styles.videoBox}
            >
              {playingIndex === i ? (
                <Video
                  source={{ uri: ex.videoUri }}
                  style={styles.video}
                  controls
                  paused={false}
                  resizeMode="cover"
                  onEnd={() => setPlayingIndex(null)}
                />
              ) : (
                <View style={styles.playOverlay}>
                  <Ionicons
                    name="play-circle-outline"
                    size={42}
                    color="#fff"
                  />
                  <Text style={styles.playText}>Preview</Text>
                </View>
              )}
            </Pressable>
            <Pressable
              style={[
                styles.button,
                (similarExercises[ex.name] || []).length === 0 &&
                  styles.buttonDisabled,
              ]}
              onPress={() => handleAdapt(i)}
            >
              <Text style={styles.buttonText}>
                Swap Exercise
              </Text>
            </Pressable>
          </View>
        ))}

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Ionicons
            name="save"
            size={20}
            color="#fff"
            style={styles.icon}
          />
          <Text style={styles.buttonText}>
            Save Adapted Workout
          </Text>
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
          <Ionicons
            name="arrow-back"
            size={20}
            color="#fff"
            style={styles.icon}
          />
          <Text style={styles.buttonText}>
            Back to Workout Hub
          </Text>
        </Pressable>
      </ScrollView>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {currentIndex !== null && (
              <>
                <Text style={styles.modalTitle}>
                  Replacing:{' '}
                  <Text style={{ color: '#4fc3f7' }}>
                    {adaptedExercises[currentIndex].name}
                  </Text>
                </Text>
                <Text style={styles.modalSubTitle}>
                  Choose a replacement:
                </Text>

                <FlatList
                  data={
                    showAllReplacements
                      ? similarExercises[
                          adaptedExercises[currentIndex].name
                        ]
                      : (
                          similarExercises[
                            adaptedExercises[currentIndex].name
                          ] || []
                        ).slice(0, 3)
                  }
                  keyExtractor={item => item.name}
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.replacementItem}
                      onPress={() => selectReplacement(item)}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        <Image
                          source={{ uri: item.thumbnailUri }}
                          style={{
                            width: 50,
                            height: 50,
                            marginRight: 10,
                            borderRadius: 8,
                          }}
                        />
                        <View>
                          <Text style={styles.replacementText}>
                            {item.name}
                          </Text>
                          <Text style={styles.replacementTag}>
                            🏷 No Equipment
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  )}
                />

                {/* Show more / less */}
                {(
                  similarExercises[
                    adaptedExercises[currentIndex].name
                  ] || []
                ).length > 3 && (
                  <Pressable
                    onPress={() =>
                      setShowAllReplacements(x => !x)
                    }
                    style={{ alignItems: 'center', marginVertical: 8 }}
                  >
                    <Text
                      style={{ color: '#4fc3f7', fontSize: 14 }}
                    >
                      {showAllReplacements
                        ? '➖ Show Less'
                        : '➕ Show More'}
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
        <Toast
          message="Adapted workout saved!"
          onClose={() => setShowToast(false)}
        />
      )}
    </LinearGradient>
  );
};

function togglePlay(index: number) {
  // pulled out-of-line for brevity
}

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
  buttonDisabled: {
    opacity: 0.5,
    borderColor: '#555',
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
  secondaryButton: {
    marginTop: 10,
    borderColor: '#888',
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
  replacementTag: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 2,
    fontStyle: 'italic',
  },
});

export default AdaptWorkoutScreen;
