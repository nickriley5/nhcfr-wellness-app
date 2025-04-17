import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import Ionicons from 'react-native-vector-icons/Ionicons';

type ExerciseDetailRouteProp = RouteProp<RootStackParamList, 'ExerciseDetail'>;

interface Exercise {
  id: string;
  name: string;
  category: string;
  equipment: string[];
  description: string;
  thumbnail: { uri: string };
}

const EXERCISES: Exercise[] = [
  {
    id: 'push_up',
    name: 'Push‑Up',
    category: 'Upper Body',
    equipment: ['Bodyweight'],
    description: 'Standard push‑up focusing on chest and triceps.',
    thumbnail: { uri: 'https://via.placeholder.com/200' },
  },
  {
    id: 'goblet_squat',
    name: 'Goblet Squat',
    category: 'Lower Body',
    equipment: ['Dumbbell'],
    description: 'Hold a dumbbell at chest level and squat.',
    thumbnail: { uri: 'https://via.placeholder.com/200' },
  },
  {
    id: 'plank',
    name: 'Plank',
    category: 'Core',
    equipment: ['None'],
    description: 'Maintain a straight body line on elbows or hands.',
    thumbnail: { uri: 'https://via.placeholder.com/200' },
  },
];

const ExerciseDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const { params } = useRoute<ExerciseDetailRouteProp>();
  const { exerciseId } = params;

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay or fetch logic
    const loadExercise = () => {
      const found = EXERCISES.find((e) => e.id === exerciseId);
      setExercise(found ?? null);
      setLoading(false);
    };

    loadExercise();
  }, [exerciseId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Exercise not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Image source={exercise.thumbnail} style={styles.image} />
      <Text style={styles.name}>{exercise.name}</Text>
      <Text style={styles.category}>{exercise.category}</Text>
      <Text style={styles.equipment}>Equipment: {exercise.equipment.join(', ')}</Text>
      <Text style={styles.desc}>{exercise.description}</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#121212',
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
    marginBottom: 16,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 6,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  category: {
    fontSize: 18,
    fontWeight: '500',
    color: '#d32f2f',
    marginBottom: 4,
  },
  equipment: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 12,
  },
  desc: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
  },
  error: {
    fontSize: 18,
    color: '#f00',
  },
});

export default ExerciseDetailScreen;
