import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import {
  useRoute,
  RouteProp,
  useNavigation,
} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';

import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { firebaseApp } from '../firebase';

type ExerciseDetailRouteProp = RouteProp<RootStackParamList, 'ExerciseDetail'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

const ExerciseDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { params } = useRoute<ExerciseDetailRouteProp>();
  const { exerciseId } = params;

  const [exercise, setExercise] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const db = getFirestore(firebaseApp);

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        const docRef = doc(db, 'exercises', exerciseId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setExercise(docSnap.data());
        } else {
          console.warn('Exercise not found.');
        }
      } catch (error) {
        console.error('Error fetching exercise:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExercise();
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
    <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Text style={styles.name}>{exercise.name}</Text>
        <Text style={styles.category}>{exercise.category}</Text>
        <Text style={styles.equipment}>
          Equipment: {Array.isArray(exercise.equipment) ? exercise.equipment.join(', ') : exercise.equipment}
        </Text>
        <Text style={styles.desc}>{exercise.description}</Text>

        <Video
          source={{ uri: exercise.videoUrl || exercise.videoUri }}
          style={styles.video}
          resizeMode="cover"
          controls
        />

        {exercise.muscles && (
          <Text style={styles.detail}>Target Muscles: {exercise.muscles.join(', ')}</Text>
        )}

        {exercise.tips && (
          <Text style={styles.tipText}>🔥 Tip: <Text style={styles.tipInner}>{exercise.tips}</Text></Text>
        )}

        <Pressable
          style={styles.progressButton}
          onPress={() =>
            navigation.navigate('ProgressChart', {
              exerciseName: exercise.name,
            })
          }
        >
          <Ionicons name="stats-chart" size={18} color="#4fc3f7" style={{ marginRight: 6 }} />
          <Text style={styles.progressText}>View Progress</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: 'transparent',
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
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center',
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
    marginBottom: 8,
  },
  desc: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 16,
  },
  video: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
  },
  detail: {
    fontSize: 14,
    color: '#aaa',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  tipText: {
    fontSize: 14,
    color: '#4fc3f7',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 16,
  },
  tipInner: {
    fontStyle: 'italic',
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
});

export default ExerciseDetailScreen;