import React from 'react';
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

const exercises = [
  {
    id: 'push_up',
    name: 'Pushups',
    description: 'Great for upper body strength, especially chest and triceps.',
    videoUri: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnailUri: 'https://via.placeholder.com/100',
    equipment: 'Bodyweight',
    muscles: ['Chest', 'Triceps', 'Shoulders'],
    tips: 'Keep a straight back and engage your core.',
  },
  {
    id: 'goblet_squat',
    name: 'Goblet Squat',
    description: 'Targets legs and glutes. A fundamental lower-body movement.',
    videoUri: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnailUri: 'https://via.placeholder.com/100',
    equipment: 'Bodyweight',
    muscles: ['Quads', 'Glutes', 'Hamstrings'],
    tips: 'Keep your heels on the ground and knees behind toes.',
  },
  {
    id: 'plank',
    name: 'Plank',
    description: 'Great for core stability and endurance.',
    videoUri: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnailUri: 'https://via.placeholder.com/100',
    equipment: 'None',
    muscles: ['Abs', 'Back', 'Shoulders'],
    tips: 'Maintain a straight line from head to heels.',
  },
];

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const ExerciseLibraryScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();

  return (
    <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* ✅ Back Button */}
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>Exercise Library</Text>

        {exercises.map((ex, index) => (
          <Pressable
            key={index}
            style={styles.card}
            onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: ex.id })}
          >
            <View style={styles.row}>
              <Image source={{ uri: ex.thumbnailUri }} style={styles.thumbnail} />
              <View style={{ flex: 1 }}>
                <Text style={styles.exerciseName}>{ex.name}</Text>
                <Text style={styles.description}>{ex.description}</Text>
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
  content: {
    padding: 24,
  },
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
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
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
