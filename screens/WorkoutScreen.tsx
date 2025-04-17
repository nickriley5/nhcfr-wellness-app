import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { auth, firestore } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const WorkoutScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [loading, setLoading] = useState(false);
  const [currentProgram, setCurrentProgram] = useState<any>(null);

  useEffect(() => {
    const fetchProgram = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const docRef = doc(firestore, 'programs', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setCurrentProgram(docSnap.data());
      }
    };

    fetchProgram();
  }, []);

  const generateProgram = async () => {
    try {
      setLoading(true);
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('User not signed in');

      const program = [
        {
          day: 1,
          title: 'Upper Body Strength',
          exercises: [
            { name: 'Pushups', sets: 4, reps: 12 },
            { name: 'Bent-over Rows', sets: 4, reps: 10 },
            { name: 'Overhead Press', sets: 3, reps: 8 },
          ],
        },
        {
          day: 2,
          title: 'Lower Body Strength',
          exercises: [
            { name: 'Goblet Squat', sets: 4, reps: 15 },
            { name: 'Lunges', sets: 3, reps: 12 },
            { name: 'Glute Bridge', sets: 3, reps: 20 },
          ],
        },
        {
          day: 3,
          title: 'Conditioning & Core',
          exercises: [
            { name: 'Jump Rope', sets: 5, reps: '1 min' },
            { name: 'Plank', sets: 3, reps: '1 min' },
            { name: 'Mountain Climbers', sets: 3, reps: 40 },
          ],
        },
        {
          day: 4,
          title: 'Active Recovery',
          exercises: [
            { name: 'Walking', sets: 1, reps: '20-30 mins' },
            { name: 'Deep Breathing', sets: 1, reps: '5 mins' },
          ],
        },
        {
          day: 5,
          title: 'Full Body Power',
          exercises: [
            { name: 'Kettlebell Swings', sets: 5, reps: 15 },
            { name: 'Burpees', sets: 4, reps: 12 },
            { name: 'Squat to Press', sets: 3, reps: 10 },
          ],
        },
        {
          day: 6,
          title: 'Mobility & Flexibility',
          exercises: [
            { name: 'Hip Flexor Stretch', sets: 2, reps: '1 min/side' },
            { name: 'Cat Cow', sets: 2, reps: 10 },
            { name: 'Hamstring Stretch', sets: 2, reps: '1 min/side' },
          ],
        },
        {
          day: 7,
          title: 'Rest Day',
          exercises: [
            { name: 'Full Rest', sets: 1, reps: 'Enjoy it' },
          ],
        },
      ];

      await setDoc(doc(firestore, 'programs', uid), {
        createdAt: serverTimestamp(),
        days: program,
        currentDay: 1,
        completedDays: [],
      });

      Alert.alert('Success', 'Program generated!');
      setCurrentProgram({
        days: program,
        currentDay: 1,
        completedDays: [],
      });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to generate program.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Workout Hub 🏋️‍♂️</Text>
        <Text style={styles.subtitle}>Train smart. Recover better. Perform longer.</Text>

        {/* Show current program info if available */}
        {currentProgram ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Current Program</Text>
            <Text style={styles.cardText}>
              Day {currentProgram.currentDay}: {currentProgram.days[currentProgram.currentDay - 1].title}
            </Text>
            <Pressable
              style={[styles.button, styles.secondaryButton]}
              onPress={() => navigation.navigate('WorkoutDetail')}
            >
              <Text style={styles.buttonText}>View Today's Workout</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.button} onPress={generateProgram}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="flash" size={20} color="#fff" style={styles.icon} />
                <Text style={styles.buttonText}>Generate Program</Text>
              </>
            )}
          </Pressable>
        )}

        <Pressable
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate('ExerciseLibrary')}
        >
          <Ionicons name="book" size={20} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Explore Exercise Library</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔥 AI Coach</Text>
          <Text style={styles.cardText}>
            Personalized workouts coming soon. Stay tuned for AI adaptation!
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#d32f2f',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#d32f2f',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginBottom: 16,
    width: '100%',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: '#444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  icon: {
    marginRight: 8,
  },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    color: '#d32f2f',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  cardText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 12,
  },
});

export default WorkoutScreen;
