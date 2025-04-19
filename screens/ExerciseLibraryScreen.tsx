// screens/ExerciseLibraryScreen.tsx

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
import { exercises } from '../data/exercises';

const categoryIcons: Record<string, string> = {
  'Upper Body': 'barbell-outline',
  'Lower Body': 'walk-outline',
  'Core': 'body-outline',
  'Conditioning': 'flash-outline',
  'Full Body': 'fitness-outline',
  'Mobility & Flexibility': 'accessibility-outline',
  'Recovery / Rest': 'bed-outline',
};

const ExerciseLibraryScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Back Button */}
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.title}>Exercise Library</Text>

        {exercises.map((exercise) => (
          <Pressable
            key={exercise.id}
            style={styles.card}
            onPress={() =>
              navigation.navigate('ExerciseDetail', { exerciseId: exercise.id })
            }
          >
            <View style={styles.row}>
              <Ionicons
                name={categoryIcons[exercise.category] || 'fitness-outline'}
                size={36}
                color="#d32f2f"
                style={styles.icon}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.description}>{exercise.description}</Text>
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