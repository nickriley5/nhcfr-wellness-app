// DashboardScreen.tsx
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
import type { ProgramDay } from '../utils/types';

/* ------------ helpers ------------ */
const pretty = (id: string) =>
  id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/* ------------ component ------------ */
export default function DashboardScreen() {
  const navigation = useNavigation<
    CompositeNavigationProp<
      BottomTabNavigationProp<TabParamList, 'Dashboard'>,
      NativeStackNavigationProp<RootStackParamList>
    >
  >();

  /* ---------- state ---------- */
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

  const [todayInfo, setTodayInfo] = useState<{
    day: ProgramDay;
    weekIdx: number;
    dayIdx: number;
  } | null>(null);

  /* ---------- pulse animation ---------- */
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

  /* ---------- Firestore fetch ---------- */
  useEffect(() => {
    const fetchAll = async () => {
      const user = auth.currentUser;
      if (!user) return;

      /* --- active program --- */
      const progSnap = await getDoc(
        doc(db, 'users', user.uid, 'program', 'active')
      );
      setProgramExists(progSnap.exists());

      if (progSnap.exists()) {
        const prog: any = progSnap.data();
        const days: ProgramDay[] = prog.days || [];
        const curDay = prog.metadata?.currentDay ?? 1;
        const idx = Math.max(0, curDay - 1);

        if (days[idx]) {
          setTodayInfo({
            day: days[idx],
            weekIdx: days[idx].week - 1,
            dayIdx: days[idx].day - 1,
          });
        } else setTodayInfo(null);
      } else setTodayInfo(null);

      /* --- check-ins --- */
      const checkSnap = await getDocs(
        query(
          collection(db, 'users', user.uid, 'checkIns'),
          orderBy('timestamp', 'desc')
        )
      );
      const entries = checkSnap.docs.map((d) => d.data());
      const todayStr = new Date().toDateString();
      if (
        !entries[0] ||
        new Date(entries[0].timestamp?.toDate()).toDateString() !== todayStr
      ) {
        setHasCheckedInToday(false);
      }
      const limited =
        view === 'week'
          ? entries.slice(0, 7)
          : view === 'month'
          ? entries.slice(0, 30)
          : entries;
      limited.reverse();
      setMoodData(limited.map((e) => e.mood ?? 0));
      setEnergyData(limited.map((e) => e.energy ?? 0));

      /* --- profile completion --- */
      const profile = (await getDoc(doc(db, 'users', user.uid))).data();
      if (profile) {
        const fields = [
          profile.fullName,
          profile.dob,
          profile.height,
          profile.weight,
          profile.profilePicture,
          profile.bodyFatPct,
        ];
        setCompletionPercent(
          Math.round((fields.filter(Boolean).length / fields.length) * 100)
        );
        setCurrentWeight(Number(profile.weight) || 180);
      }

      /* --- exercise library for generator --- */
      const libSnap = await getDocs(collection(db, 'exercises'));
      setExerciseLibrary(libSnap.docs.map((d) => d.data() as Exercise));
    };

    fetchAll();
  }, [view]);

  /* ---------- Quick Preview ---------- */
  const QuickViews = () => {
  const title = todayInfo?.day.title ?? 'No program';
  const exercises = todayInfo?.day.exercises ?? [];

  return (
    <View style={styles.quickContainer}>
      {/* Meal preview */}
      <View style={styles.quickCard}>
        <Text style={styles.quickTitle}>🍽️ Next Meal</Text>
        <Text style={styles.quickDetail}>Grilled chicken, rice, broccoli</Text>
      </View>

      {/* Workout preview */}
      <Pressable
        style={styles.quickCard}
        disabled={!todayInfo}
        onPress={() => {
          if (!todayInfo) return;
          navigation.navigate('WorkoutDetail', {
            day: todayInfo.day,
            weekIdx: todayInfo.weekIdx,
            dayIdx: todayInfo.dayIdx,
          });
        }}
      >
        <Text style={styles.quickTitle}>🏋️ {title}</Text>

        {exercises.length === 0 ? (
          <Text style={styles.restDay}>Rest day 💆‍♂️</Text>
        ) : (
          exercises.slice(0, 3).map((blk, idx) => (
            <Text key={blk.id} style={styles.exerciseLine}>
              • {pretty(blk.id)}
            </Text>
          ))
        )}

        <Text style={styles.quickHint}>Tap to view full workout</Text>
      </Pressable>
    </View>
  );
};


  /* ---------- render ---------- */
  return (
    <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Your Dashboard</Text>
        <Text style={styles.subheader}>Train for duty. Fuel for life. 🔥</Text>

        {/* reminder + profile prompt */}
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

        {/* trend chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mood & Energy Trends</Text>
          <View style={styles.toggleGroup}>
            {(['week', 'month', 'all'] as const).map((k) => (
              <Pressable
                key={k}
                style={[
                  styles.toggleButton,
                  view === k && styles.toggleActive,
                ]}
                onPress={() => setView(k)}
              >
                <Text style={styles.toggleText}>
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
          <MoodEnergyChart moodData={moodData} energyData={energyData} />
        </View>

        {/* check-in button */}
        {!hasCheckedInToday && (
          <Pressable
            style={[styles.outlinedButton, styles.checkInButton]}
            onPress={() => navigation.navigate('CheckIn')}
          >
            <Text style={styles.buttonText}>Check In Now</Text>
          </Pressable>
        )}

        {/* quick cards */}
        <QuickViews />

        {/* AI Coach coming soon */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 AI Coach</Text>
          <Text style={styles.sectionText}>
            Personalized fitness & recovery tips coming soon.
          </Text>
        </View>

        {/* main buttons */}
        {completionPercent >= 80 && (
          <>
            <Pressable
              style={styles.outlinedButton}
              onPress={() => setShowMealModal(true)}
            >
              <Text style={styles.buttonText}>Generate Meal Plan</Text>
            </Pressable>

            {!programExists && (
              <>
                <Pressable
                  style={styles.outlinedButton}
                  onPress={() =>
                    navigation
                      .getParent<NativeStackNavigationProp<RootStackParamList>>()
                      ?.navigate('ProgramList')
                  }
                >
                  <Text style={styles.buttonText}>📋 View Training Programs</Text>
                </Pressable>

                <Pressable
                  style={styles.outlinedButton}
                  onPress={() => setShowWorkoutModal(true)}
                >
                  <Text style={styles.buttonText}>🛠 Generate Program</Text>
                </Pressable>
              </>
            )}

            <Pressable
              style={styles.outlinedButton}
              onPress={() => setShowCalendarModal(true)}
            >
              <Text style={styles.buttonText}>🗓 Set My Weekly Schedule</Text>
            </Pressable>
          </>
        )}

        <Pressable
          style={styles.outlinedButton}
          onPress={() => navigation.navigate('WorkoutHistory')}
        >
          <Text style={styles.buttonText}>📚 View Workout History</Text>
        </Pressable>
      </ScrollView>

      {/* ------------ Modals ------------ */}
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
            const program = await generateProgramFromGoals(
              {
                focus: Array.isArray(goals.focus) ? goals.focus : [goals.focus],
                daysPerWeek: goals.daysPerWeek,
                includeFireground: goals.includeFireground,
                durationWeeks: goals.durationWeeks,
                goalType: goals.goalType,
                experienceLevel: goals.experienceLevel,
                equipment: goals.equipment,
              },
              exerciseLibrary
            );

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

/* ------------ styles ------------ */
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

  /* quick cards */
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
  quickTitle: { fontSize: 16, fontWeight: '600', color: '#d32f2f', marginBottom: 4 },
  quickDetail: { fontSize: 14, color: '#ccc' },
  quickHint: { fontSize: 12, color: '#aaa', marginTop: 6 },

  /* buttons */
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
  checkInButton: { backgroundColor: '#388e3c', borderColor: '#388e3c' },
  pulsing: { borderColor: '#4fc3f7' },
  restDay: {
  fontSize: 14,
  color: '#888',
  fontStyle: 'italic',
  marginTop: 4,
  marginBottom: 6,
},

exerciseLine: {
  fontSize: 14,
  color: '#ccc',
  marginBottom: 2,
},
});
