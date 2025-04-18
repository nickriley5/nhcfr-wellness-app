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

const WorkoutScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(false);
  const [currentProgram, setCurrentProgram] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTime, setSelectedTime] = useState('20');
  const [selectedEquipment, setSelectedEquipment] = useState('None');
  const [selectedIntensity, setSelectedIntensity] = useState('Medium');

  const handleGenerateQuickWorkout = () => {
    Alert.alert(
      'Workout Generated',
      `Duration: ${selectedTime} min\nEquipment: ${selectedEquipment}\nIntensity: ${selectedIntensity}`
    );
  };

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
        <Text style={styles.title}>🏋️‍♂️ Workout Hub</Text>
        <Text style={styles.subtitle}>Train smart. Recover better. Perform longer.</Text>
        <View style={{ width: '100%', height: 1, backgroundColor: '#333', marginVertical: 12 }} />

        <Pressable
          style={styles.dropdownToggle}
          onPress={() => setShowFilters(prev => !prev)}
        >
          <Ionicons name={showFilters ? 'chevron-up' : 'chevron-down'} size={18} color="#fff" />
          <Text style={styles.dropdownText}>Quick Workout Generator</Text>
        </Pressable>

        {showFilters && (
          <View style={styles.filterBox}>
            <Text style={styles.filterHeader}>Select Duration</Text>
            <View style={styles.buttonGroup}>
              {['10', '20', '30'].map(time => (
                <Pressable
                  key={time}
                  style={[styles.filterButton, selectedTime === time && styles.filterButtonSelected]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Text style={styles.filterButtonText}>{time} min</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.filterHeader}>Available Equipment</Text>
            <View style={styles.buttonGroup}>
              {['None', 'Kettlebell', 'Bands'].map(eq => (
                <Pressable
                  key={eq}
                  style={[styles.filterButton, selectedEquipment === eq && styles.filterButtonSelected]}
                  onPress={() => setSelectedEquipment(eq)}
                >
                  <Text style={styles.filterButtonText}>{eq}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.filterHeader}>Intensity</Text>
            <View style={styles.buttonGroup}>
              {['Low', 'Medium', 'High'].map(level => (
                <Pressable
                  key={level}
                  style={[styles.filterButton, selectedIntensity === level && styles.filterButtonSelected]}
                  onPress={() => setSelectedIntensity(level)}
                >
                  <Text style={styles.filterButtonText}>{level}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.generateButton} onPress={handleGenerateQuickWorkout}>
              <Ionicons name="flash-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Generate Quick Workout</Text>
            </Pressable>
          </View>
        )}

        {currentProgram && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Current Program</Text>
            <Text style={styles.cardText}>
              Day {currentProgram.currentDay}: {currentProgram.days[currentProgram.currentDay - 1].title}
            </Text>
            <Pressable style={styles.button} onPress={() => navigation.navigate('WorkoutDetail', undefined)}>
              <Text style={styles.buttonText}>View Today's Workout</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={() => navigation.navigate('AdaptWorkout')}>
                  <Text style={styles.buttonText}>Adapt Today’s Workout</Text>
            </Pressable>
          </View>
        )}

        {!currentProgram && (
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

        <Pressable style={styles.button} onPress={() => navigation.navigate('ExerciseLibrary')}>
          <Ionicons name="book" size={20} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Explore Exercise Library</Text>
        </Pressable>

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
    marginTop: 16,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 12,
    textAlign: 'center',
  },
  dropdownToggle: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#d32f2f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  dropdownText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterBox: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  button: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#d32f2f',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginBottom: 16,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
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
    textAlign: 'center',
  },
  filterHeader: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
    fontSize: 15,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  filterButton: {
    backgroundColor: '#444',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    margin: 6,
  },
  filterButtonSelected: {
    backgroundColor: '#d32f2f',
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  generateButton: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#d32f2f',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
});

export default WorkoutScreen;
