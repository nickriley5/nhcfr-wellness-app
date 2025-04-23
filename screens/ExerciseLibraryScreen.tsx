import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { firebaseApp } from '../firebase';

// Map categories to icon names
const categoryIcons: Record<string, string> = {
  'Upper Body': 'barbell-outline',
  'Lower Body': 'walk-outline',
  Core: 'body-outline',
  Conditioning: 'flash-outline',
  'Full Body': 'fitness-outline',
  'Mobility & Flexibility': 'accessibility-outline',
  'Recovery / Rest': 'bed-outline',
};


const db = getFirestore(firebaseApp);

// 👇 MOVE THESE INSIDE THE COMPONENT
const ExerciseLibraryScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'ExerciseLibrary'>>();
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'exercises'));
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setExercises(list);
      } catch (error) {
        console.error('Failed to fetch exercises:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, []);

  return (
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
              <View style={{ flex: 1 }}>
                <Text style={styles.exerciseName}>{ex.name}</Text>
                <Text style={styles.description}>{ex.coachingNotes}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#888" />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
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
});

export default ExerciseLibraryScreen;
