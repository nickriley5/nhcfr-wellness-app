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
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import Toast from '../components/Toast';
import Video from 'react-native-video';
import { suggestReplacements, UserContext, SlotRule, ExerciseLite } from '../utils/selectExercises';
import { RULES } from '../utils/slotRule';



// Define the shape of an exercise object
interface Exercise {
  name: string;
  equipment?: string;
  focusArea?: string;
  tags: string[];
  videoUri?: string;
  thumbnailUri?: string;
}

const fallbackVideos: Record<string, string> = {
  Pushups: 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Bent-over Rows': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Overhead Press': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Air Squat': 'https://www.w3schools.com/html/mov_bbb.mp4',
};

const AdaptWorkoutScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [_workoutExercises, setWorkoutExercises] = useState<Exercise[]>([]);
  const [adaptedExercises, setAdaptedExercises] = useState<Exercise[]>([]);
  const [similar, setSimilar] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [showAllReplacements, setShowAllReplacements] = useState(false);
  const [ruleKey, setRuleKey] = useState<string | null>(null);


  useEffect(() => {
    const fetchWorkout = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {return;}

      const docRef = doc(db, 'users', uid, 'program', 'active');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        const day = data.currentDay - 1;
        // try to derive a RULES key from the day title ("Week X: Push" -> "PUSH")
const rawTitle = data.days[day]?.title ?? '';
const afterColon = rawTitle.includes(':') ? rawTitle.split(':')[1].trim() : rawTitle;
const key = afterColon ? afterColon.toUpperCase().replace(/\s+/g, '_') : 'FULL_BODY';
setRuleKey(key);

        const todayExercises: Exercise[] = data.days[day].exercises.map((ex: any) => ({
          ...ex,
          videoUri: fallbackVideos[ex.name] || fallbackVideos.Pushups,
        }));
        setWorkoutExercises(todayExercises);
        setAdaptedExercises(todayExercises);
      }
      setLoading(false);
    };

    fetchWorkout();
  }, []);

  useEffect(() => {
  const fetchSimilar = async () => {
    if (currentIndex === null || !adaptedExercises[currentIndex]) {return;}

    // current exercise from today's plan
    const cur = adaptedExercises[currentIndex];

    // load full exercise library (Firestore) into ExerciseLite[]
    const snapshot = await getDocs(collection(db, 'exercises'));
    const library: ExerciseLite[] = snapshot.docs.map(d => {
      const r = d.data() as any;
      return {
        id: d.id,
        name: r.name,
        tags: r.tags ?? [],
        goalTags: r.goalTags ?? [],
        patterns: r.patterns,       // ok if undefined
        equipment: r.equipment,     // ok if undefined
        coreSet: r.coreSet,         // ok if undefined
        status: r.status,           // ok if undefined
      } as ExerciseLite;
    });

    // find the matching library item by name (if present)
    const currentLite =
      library.find(e => e.name?.toLowerCase() === cur.name.toLowerCase()) ||
      ({
        id: '__current__',
        name: cur.name,
        tags: cur.tags ?? [],
        patterns: undefined,
        equipment: undefined,
      } as ExerciseLite);

    // build user context (fallbacks are safe if you don't have profile data here)
    const userCtx: UserContext = {
      goal: 'balanced',
      level: 'intermediate',
      equipment: ['db', 'kb', 'barbell', 'pullup_bar', 'rings', 'jumprope', 'medball', 'ghd', 'sled', 'none'],
    };

    // pick a slot rule from RULES using the day title; fall back to the exercise's own tags
    const baseRule: SlotRule =
      (ruleKey && (RULES as any)[ruleKey]) ||
      { includeTags: currentLite.tags ?? [], requireCoreSet: false };

    // get deterministic, rule-aware suggestions
    const suggestions = suggestReplacements(currentLite, library, userCtx, baseRule, 8);

    // map to your local Exercise shape (add video/thumbnail fallbacks)
    const mapped = suggestions.map(s => ({
      name: s.name || '',
      equipment: Array.isArray(s.equipment) ? s.equipment.join(', ') : (s.equipment as any) || undefined,
      focusArea: undefined,
      tags: s.tags ?? [],
      videoUri: fallbackVideos[s.name || ''] || fallbackVideos.Pushups,
      thumbnailUri: (snapshot.docs.find(d => (d.data() as any).name === s.name)?.data() as any)?.thumbnailUri,
    })) as Exercise[];

    setSimilar(mapped);
  };

  fetchSimilar();
}, [currentIndex, adaptedExercises, ruleKey]);


  const handleAdapt = (index: number) => {
    setCurrentIndex(index);
    setModalVisible(true);
  };

  const selectReplacement = (replacement: Exercise) => {
    if (currentIndex === null) {return;}
    const updated = [...adaptedExercises];
    updated[currentIndex] = {
      ...updated[currentIndex],
      name: replacement.name,
      videoUri: replacement.videoUri,
      thumbnailUri: replacement.thumbnailUri,
    };
    setAdaptedExercises(updated);
    setModalVisible(false);
    setCurrentIndex(null);
    setShowAllReplacements(false);
  };

  const handleSave = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {return;}

      const docRef = doc(db, 'users', uid, 'program', 'active');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        const day = data.currentDay - 1;
        // Merge only name, video, and thumbnail into original structure
        const updatedDay = data.days[day];
        const mergedExercises = updatedDay.exercises.map((original: any, i: number) => {
          const adapted = adaptedExercises?.[i];
          return {
            ...original,
            name: adapted?.name ?? original.name,
            videoUri: adapted?.videoUri ?? original.videoUri ?? '',
            thumbnailUri: adapted?.thumbnailUri ?? original.thumbnailUri ?? '',
          };
        });        data.days[day].exercises = mergedExercises;
        await setDoc(docRef, data);
        setShowToast(true);
        setTimeout(() => {
          navigation.navigate('WorkoutDetail', {
            day: data.days[day],
            weekIdx: data.currentWeek ?? 0,
            dayIdx: day,
            adapt: true,
          });
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

  // Prepare the list of similar exercises when modal is open

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
            navigation.navigate('AppDrawer', {
  screen: 'MainTabs',
  params: { screen: 'Workout' },
})
          }
        >
          <Ionicons name="arrow-back" size={20} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Back to Workout Hub</Text>
        </Pressable>
      </ScrollView>

      {/* Replacement Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {currentIndex !== null && (
              <>
                <Text style={styles.modalTitle}>
                  Replacing:{' '}
                  <Text style={styles.replacementName}>
                    {adaptedExercises[currentIndex].name}
                  </Text>
                </Text>
                <Text style={styles.modalSubTitle}>Choose a replacement:</Text>

                <FlatList
                  data={(similar || []).slice(0, showAllReplacements ? undefined : 3)}
                  keyExtractor={item => item.name}
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.replacementItem}
                      onPress={() => selectReplacement(item)}
                    >
                      <View style={styles.rowAlignCenter}>
                        {item.thumbnailUri && (
                          <Image
                            source={{ uri: item.thumbnailUri }}
                            style={styles.thumbnailImage}
                          />
                        )}
                        <View>
                          <Text style={styles.replacementText}>{item.name}</Text>
                          <Text style={styles.replacementTag}>
                            🏷 {item.equipment || 'No Equipment'}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  )}
                />

                {similar.length > 3 && (
                  <Pressable
                    onPress={() => setShowAllReplacements(prev => !prev)}
                    style={styles.showMoreButton}
                  >
                    <Text style={styles.showMoreText}>
                      {showAllReplacements ? '➖ Show Less' : '➕ Show More'}
                    </Text>
                  </Pressable>
                )}
              </>
            )}

            <Pressable
              style={[styles.button, styles.buttonMarginTop]}
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
  replacementTag: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 2,
    fontStyle: 'italic',
  },
  secondaryButton: {
    marginTop: 10,
    borderColor: '#888',
  },
  replacementName: {
    color: '#4fc3f7',
  },
  rowAlignCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailImage: {
    width: 50,
    height: 50,
    marginRight: 10,
    borderRadius: 8,
  },
  showMoreButton: {
    alignItems: 'center',
    marginVertical: 8,
  },
  showMoreText: {
    color: '#4fc3f7',
    fontSize: 14,
  },
  buttonMarginTop: {
    marginTop: 12,
  },
});

export default AdaptWorkoutScreen;
