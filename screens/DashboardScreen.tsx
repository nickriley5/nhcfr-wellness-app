import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  useNavigation,
  CompositeNavigationProp,
} from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { auth, db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import { TabParamList, RootStackParamList } from '../App';
import MoodEnergyChart from '../components/MoodEnergyChart';
import MealGoalsModal from '../components/MealGoalsModal';
import PerformanceGoalsModal from '../components/PerformanceGoalsModal';
import EnvironmentCalendarModal from '../components/EnvironmentCalendarModal';
import { generateProgramFromGoals } from '../utils/programGenerator';
import { Exercise } from '../types';

export default function DashboardScreen() {
  const navigation = useNavigation<
    CompositeNavigationProp<
      BottomTabNavigationProp<TabParamList, 'Dashboard'>,
      NativeStackNavigationProp<RootStackParamList>
    >
  >();

  const [view, setView] = useState<'week' | 'month' | 'all'>('week');
  const [moodData, setMoodData] = useState<number[]>([]);
  const [energyData, setEnergyData] = useState<number[]>([]);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(true);
  const [completionPercent, setCompletionPercent] = useState(0);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [showMealModal, setShowMealModal] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [currentWeight, setCurrentWeight] = useState(180);
  const [programExists, setProgramExists] = useState(false);
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const programSnap = await getDoc(doc(db, 'users', user.uid, 'program', 'active'));
      setProgramExists(programSnap.exists());

      const checkInQuery = query(
        collection(db, 'users', user.uid, 'checkIns'),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(checkInQuery);
      const entries = snapshot.docs.map(doc => doc.data());

      const today = new Date();
      if (!entries[0] || new Date(entries[0].timestamp?.toDate()).toDateString() !== today.toDateString()) {
        setHasCheckedInToday(false);
      }

      const limited =
        view === 'week' ? entries.slice(0, 7) : view === 'month' ? entries.slice(0, 30) : entries;
      limited.reverse();
      setMoodData(limited.map(e => e.mood ?? 0));
      setEnergyData(limited.map(e => e.energy ?? 0));

      const profileSnap = await getDoc(doc(db, 'users', user.uid));
      const profile = profileSnap.data();
      if (!profile) return;

      const completionFields = [
        profile?.fullName,
        profile?.dob,
        profile?.height,
        profile?.weight,
        profile?.profilePicture,
        profile?.bodyFatPct,
      ];
      const percent = Math.round(
        (completionFields.filter(Boolean).length / completionFields.length) * 100
      );

      setCompletionPercent(percent);
      setCurrentWeight(Number(profile?.weight) || 180);

      const librarySnap = await getDocs(collection(db, 'exercises'));
      const library = librarySnap.docs.map((doc) => doc.data() as Exercise);
      setExerciseLibrary(library);
    };

    fetchData();
  }, [view]);

  const QuickViews = () => (
    <View style={styles.quickContainer}>
      <View style={styles.quickCard}>
        <Text style={styles.quickTitle}>🍽️ Next Meal</Text>
        <Text style={styles.quickDetail}>Grilled chicken, rice, broccoli</Text>
      </View>
      <Pressable
        style={styles.quickCard}
        onPress={() => navigation.navigate('WorkoutDetail')}
      >
        <Text style={styles.quickTitle}>🏋️ Today's Workout</Text>
        <Text style={styles.quickDetail}>Kettlebell circuit & mobility</Text>
        <Text style={styles.quickHint}>Tap to view full workout</Text>
      </Pressable>
    </View>
  );

  return (
    <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Your Dashboard</Text>
        <Text style={styles.subheader}>Train for duty. Fuel for life. 🔥</Text>

        {!hasCheckedInToday && (
          <View style={styles.reminderCard}>
            <Text style={styles.reminderText}>Don't forget to check in today!</Text>
          </View>
        )}

        {completionPercent < 80 && (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Pressable
              style={[styles.outlinedButton, styles.pulsing]}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.buttonText}>🧠 Complete Profile</Text>
            </Pressable>
          </Animated.View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mood & Energy Trends</Text>
          <View style={styles.toggleGroup}>
            {(['week', 'month', 'all'] as const).map((key) => (
              <Pressable
                key={key}
                style={[styles.toggleButton, view === key && styles.toggleActive]}
                onPress={() => setView(key)}
              >
                <Text style={styles.toggleText}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
              </Pressable>
            ))}
          </View>
          <MoodEnergyChart moodData={moodData} energyData={energyData} />
        </View>

        {!hasCheckedInToday && (
          <Pressable
            style={[styles.outlinedButton, styles.checkInButton]}
            onPress={() => navigation.navigate('CheckIn')}
          >
            <Text style={styles.buttonText}>Check In Now</Text>
          </Pressable>
        )}

        <QuickViews />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 AI Coach</Text>
          <Text style={styles.sectionText}>Personalized fitness & recovery tips coming soon.</Text>
        </View>

        {completionPercent >= 80 && (
          <>
            <Pressable style={styles.outlinedButton} onPress={() => setShowMealModal(true)}>
              <Text style={styles.buttonText}>Generate Meal Plan</Text>
            </Pressable>

            {!programExists ? (
              <Pressable style={styles.outlinedButton} onPress={() => setShowWorkoutModal(true)}>
                <Text style={styles.buttonText}>🛠 Generate Program</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.outlinedButton} onPress={() => navigation.navigate('ProgramPreview')}>
                <Text style={styles.buttonText}>📆 View Full Program</Text>
              </Pressable>
            )}

            <Pressable style={styles.outlinedButton} onPress={() => setShowCalendarModal(true)}>
              <Text style={styles.buttonText}>🗓 Set My Weekly Schedule</Text>
            </Pressable>
          </>
        )}

        <Pressable style={styles.outlinedButton} onPress={() => navigation.navigate('WorkoutHistory')}>
          <Text style={styles.buttonText}>📚 View Workout History</Text>
        </Pressable>
      </ScrollView>

      <MealGoalsModal
        visible={showMealModal}
        currentWeight={currentWeight}
        onClose={() => setShowMealModal(false)}
        onSaved={() => setShowMealModal(false)}
      />

      <PerformanceGoalsModal
        visible={showWorkoutModal}
        onClose={() => setShowWorkoutModal(false)}
        onSaved={async (goals) => {
          setShowWorkoutModal(false);
          const uid = auth.currentUser?.uid;
          if (!uid) return;

          try {
           const program = await generateProgramFromGoals({
  focus: Array.isArray(goals.focus) ? goals.focus : [goals.focus],
  daysPerWeek: goals.daysPerWeek,
  includeFireground: goals.includeFireground,
  durationWeeks: goals.durationWeeks,
  goalType: goals.goalType,
  experienceLevel: goals.experienceLevel,
  equipment: goals.equipment,
}, exerciseLibrary);

console.log('🧠 Generated Program:', JSON.stringify(program, null, 2));


            await setDoc(doc(db, 'users', uid, 'program', 'active'), {
              metadata: {
                startDate: new Date().toISOString(),
                currentDay: 1,
              },
              goals,
              days: program,
            });

            setProgramExists(true);
          } catch (err) {
            console.error('Program generation failed:', err);
            alert('There was an issue generating your workout program.');
          }
        }}
        fullExerciseLibrary={exerciseLibrary}
      />

      <EnvironmentCalendarModal
        visible={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 24, alignItems: 'center' },
  header: { fontSize: 26, fontWeight: '700', color: '#d32f2f', marginBottom: 4 },
  subheader: { fontSize: 16, color: '#ccc', marginBottom: 16 },
  reminderCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 20,
  },
  reminderText: { color: '#ffd54f', textAlign: 'center' },
  section: { width: '100%', marginBottom: 24 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#d32f2f',
    marginBottom: 12,
    textAlign: 'center',
  },
  sectionText: { fontSize: 14, color: '#ccc', textAlign: 'center' },
  toggleGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleButton: {
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  toggleActive: { backgroundColor: '#d32f2f' },
  toggleText: { color: '#fff', fontSize: 14 },
  quickContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d32f2f',
    marginBottom: 4,
  },
  quickDetail: { fontSize: 14, color: '#ccc' },
  quickHint: { fontSize: 12, color: '#aaa', marginTop: 6 },
  outlinedButton: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d32f2f',
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checkInButton: {
    backgroundColor: '#388e3c',
    borderColor: '#388e3c',
  },
  pulsing: {
    borderColor: '#4fc3f7',
  },
});
