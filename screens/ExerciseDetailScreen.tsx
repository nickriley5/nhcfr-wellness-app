import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import {
  useRoute,
  RouteProp,
  useNavigation,
} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import { WebView } from 'react-native-webview';
import { doc, getDoc, getFirestore, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { firebaseApp, auth } from '../firebase';
import { RootStackParamList } from '../App';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { exercises } from '../data/exercises';


type ExerciseDetailRouteProp = RouteProp<RootStackParamList, 'ExerciseDetail'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

const ExerciseDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { params } = useRoute<ExerciseDetailRouteProp>();
  const { exerciseId } = params;

  const [exercise, setExercise] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);

  const db = getFirestore(firebaseApp);

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        const docRef = doc(db, 'exercises', exerciseId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const exerciseData = docSnap.data();

          // If videoUrl is empty or undefined, try to find from local data
          if (!exerciseData.videoUrl) {
            const localExercise = exercises.find(ex => ex.id === exerciseId);
            if (localExercise && localExercise.videoUrl) {
              setExercise({
                ...exerciseData,
                videoUrl: localExercise.videoUrl,
              });
            } else {
              setExercise(exerciseData);
            }
          } else {
            setExercise(exerciseData);
          }
        } else {
          // If not found in Firebase, try local data
          const localExercise = exercises.find(ex => ex.id === exerciseId);
          if (localExercise) {
            setExercise(localExercise);
          } else {
            console.warn('Exercise not found.');
          }
        }

        const uid = auth.currentUser?.uid;
        if (uid) {
          const userDoc = await getDoc(doc(db, 'users', uid));
          const favorites = userDoc.data()?.favorites || [];
          setFavorited(favorites.includes(exerciseId));
        }
      } catch (error) {
        console.error('Error fetching exercise:', error);
        // Fallback to local data on error
        const localExercise = exercises.find(ex => ex.id === exerciseId);
        if (localExercise) {
          setExercise(localExercise);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchExercise();
  }, [exerciseId, db]);

  const toggleFavorite = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {return;}
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        favorites: favorited ? arrayRemove(exerciseId) : arrayUnion(exerciseId),
      });
      setFavorited(!favorited);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.safeArea}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#d32f2f" />
        </View>
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={styles.safeArea}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View style={styles.container}>
          <Text style={styles.error}>Exercise not found.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.container}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <View style={styles.headerRow}>
          <Text style={styles.name}>{exercise.name}</Text>
          <Pressable onPress={toggleFavorite}>
            <Ionicons name={favorited ? 'heart' : 'heart-outline'} size={26} color="#d32f2f" />
          </Pressable>
        </View>

        <Text style={styles.category}>{exercise.category}</Text>
        <Text style={styles.equipment}>Equipment: {exercise.equipment || 'Bodyweight'}</Text>
        <Text style={styles.level}>Level: {exercise.level || 'All Levels'}</Text>

        {(exercise.videoUrl || exercise.videoUri) && (
          <View style={styles.videoContainer}>
            {(() => {
              const videoUri = exercise.videoUrl || exercise.videoUri;
              const isYouTubeUrl = videoUri.includes('youtube.com') || videoUri.includes('youtu.be');

              if (isYouTubeUrl) {
                // Convert YouTube URL to embed format
                let videoId = '';
                if (videoUri.includes('youtube.com/watch?v=')) {
                  videoId = videoUri.split('v=')[1].split('&')[0];
                } else if (videoUri.includes('youtu.be/')) {
                  videoId = videoUri.split('youtu.be/')[1].split('?')[0];
                }
                const embedUrl = `https://www.youtube.com/embed/${videoId}?playsinline=1&controls=1`;

                return (
                  <WebView
                    style={styles.video}
                    source={{ uri: embedUrl }}
                    allowsInlineMediaPlayback
                    mediaPlaybackRequiresUserAction={false}
                  />
                );
              } else {
                return (
                  <Video
                    source={{ uri: videoUri }}
                    style={styles.video}
                    controls
                    resizeMode="contain"
                    paused={false}
                  />
                );
              }
            })()}
          </View>
        )}

        <Text style={styles.desc}>{exercise.description}</Text>

        {exercise.coachingNotes && (
          <Text style={styles.coachingNotes}>Coach’s Notes: {exercise.coachingNotes}</Text>
        )}

        {exercise.tags && (
          <View style={styles.tagContainer}>
            {exercise.tags.map((tag: string) => (
              <Text key={tag} style={styles.tag}>{tag}</Text>
            ))}
          </View>
        )}

        {exercise.goalTags && (
          <View style={styles.tagContainer}>
            {exercise.goalTags.map((tag: string) => (
              <Text key={tag} style={[styles.tag, styles.goalTag]}>{tag}</Text>
            ))}
          </View>
        )}

        <Pressable
          style={styles.progressButton}
          onPress={() =>
            navigation.navigate('ProgressChart', {
              exerciseName: exercise.name,
            })
          }
        >
          <Ionicons name="stats-chart" size={18} color="#4fc3f7" style={styles.iconMarginRight} />
          <Text style={styles.progressText}>View Progress</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
  },
  container: {
    padding: 24,
    paddingTop: 0,
    alignItems: 'center',
    paddingBottom: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  backButton: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    marginBottom: 12,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
  },
  category: {
    fontSize: 18,
    fontWeight: '600',
    color: '#d32f2f',
    marginBottom: 4,
  },
  equipment: {
    fontSize: 14,
    color: '#bbb',
    marginBottom: 4,
  },
  level: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  desc: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 16,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  coachingNotes: {
    fontSize: 14,
    color: '#4fc3f7',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#333',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    margin: 4,
    fontSize: 12,
  },
  goalTag: {
    backgroundColor: '#4fc3f7',
    color: '#000',
  },
  progressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
    borderWidth: 1.5,
    borderColor: '#4fc3f7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
    width: '90%',
    alignSelf: 'center',
  },
  progressText: {
    fontSize: 14,
    color: '#4fc3f7',
    fontWeight: '600',
  },
  error: {
    fontSize: 18,
    color: '#f00',
  },
  iconMarginRight: {
    marginRight: 6,
  },
});

export default ExerciseDetailScreen;
