import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { firebaseApp, auth } from '../firebase';
import { exercises as localExercises } from '../data/exercises';

const db = getFirestore(firebaseApp);

const categoryIcons: Record<string, string> = {
  'Upper Body': 'barbell-outline',
  'Lower Body': 'walk-outline',
  Core: 'body-outline',
  Conditioning: 'flash-outline',
  'Full Body': 'fitness-outline',
  'Mobility & Flexibility': 'accessibility-outline',
  'Recovery / Rest': 'bed-outline',
};

const ExerciseLibraryScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'ExerciseLibrary'>>();
  const [exercises, setExercises] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const uid = auth.currentUser?.uid;

        // Load exercises from Firebase every time
        const snapshot = await getDocs(collection(db, 'exercises'));
        const exercisesList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        // If Firebase has data, use it; otherwise fall back to local data
        const finalExercises = exercisesList.length > 0 ? exercisesList : localExercises;
        setExercises(finalExercises);

        // Load favorites
        if (uid) {
          const favSnapshot = await getDoc(doc(db, 'users', uid, 'favorites', 'list'));
          if (favSnapshot.exists()) {
            const favs = new Set<string>(favSnapshot.data().ids || []);
            setFavorites(favs);
          }
        }
      } catch (error) {
        console.error('Failed to load exercise library:', error);
        // Fallback to local data on error
        setExercises(localExercises);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);  const toggleFavorite = async (exerciseId: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) {return;}

    const newFavorites = new Set(favorites);
    if (favorites.has(exerciseId)) {
      newFavorites.delete(exerciseId);
    } else {
      newFavorites.add(exerciseId);
    }
    setFavorites(newFavorites);

    await setDoc(doc(db, 'users', uid, 'favorites', 'list'), {
      ids: Array.from(newFavorites),
    });
  };

  if (loading) {
    return (
      <View style={styles.safeArea}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
          <ActivityIndicator size="large" color="#d32f2f" />
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>Exercise Library</Text>

        {exercises.map((ex) => (
          <Pressable
            key={ex.id}
            style={styles.card}
            onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: ex.id })}
          >
            <View style={styles.row}>
              <Ionicons
                name={categoryIcons[ex.category] ?? 'fitness-outline'}
                size={36}
                color="#d32f2f"
                style={styles.icon}
              />
              <Image source={{ uri: ex.thumbnailUri }} style={styles.thumbnail} />
              <View style={styles.flex1}>
                <Text style={styles.exerciseName}>{ex.name}</Text>
                <Text style={styles.description}>{ex.coachingNotes}</Text>
              </View>
              <Pressable onPress={() => toggleFavorite(ex.id)}>
                <Ionicons
                  name={favorites.has(ex.id) ? 'star' : 'star-outline'}
                  size={20}
                  color="#fbc02d"
                />
              </Pressable>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
  },
  content: { padding: 24 },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#d32f2f',
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    marginRight: 8,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  description: {
    color: '#ccc',
    fontSize: 14,
  },
  flex1: {
    flex: 1,
  },
});

export default ExerciseLibraryScreen;
