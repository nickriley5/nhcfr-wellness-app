// DashboardScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  Text,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  useNavigation,
  CompositeNavigationProp,
} from '@react-navigation/native';
import { Alert } from 'react-native';
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
import MealGoalsModal from '../components/MealGoalsModal';
import PerformanceGoalsModal from '../components/PerformanceGoalsModal';
import EnvironmentCalendarModal from '../components/EnvironmentCalendarModal';
import { generateProgramFromGoals } from '../utils/programGenerator';
import { Exercise } from '../types/Exercise';
import type { ProgramDay } from '../types/Exercise';
import ReminderCard from '../components/Dashboard/ReminderCard';
import ProfileCompletionBanner from '../components/Profile/ProfileCompletionBanner';
import MoodEnergySection from '../components/Dashboard/MoodEnergySection';
import QuickViews from '../components/Dashboard/QuickViews';
import AICoachBox from '../components/Dashboard/AICoachBox';
import GenerateButtons from '../components/Dashboard/GenerateButtons';
import CheckInButton from '../components/Dashboard/CheckInButton';


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
  const [mealPlanExists, setMealPlanExists] = useState(false);
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);


  const [_todayInfo, setTodayInfo] = useState<{
    day: ProgramDay;
    weekIdx: number;
    dayIdx: number;
  } | null>(null);

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
  }, [pulseAnim]);

  useEffect(() => {
    const fetchAll = async () => {
      const user = auth.currentUser;
      if (!user) {return;}

      const progSnap = await getDoc(doc(db, 'users', user.uid, 'program', 'active'));
      setProgramExists(progSnap.exists());

      const mealSnap = await getDoc(doc(db, 'users', user.uid, 'mealPlan', 'active'));
      setMealPlanExists(mealSnap.exists());

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
        } else {
          setTodayInfo(null);
        }
      } else {
        setTodayInfo(null);
      }

      const checkSnap = await getDocs(
        query(collection(db, 'users', user.uid, 'checkIns'), orderBy('timestamp', 'desc'))
      );
      const entries = checkSnap.docs.map((d) => d.data());
      const todayStr = new Date().toDateString();
      if (!entries[0] || new Date(entries[0].timestamp?.toDate()).toDateString() !== todayStr) {
        setHasCheckedInToday(false);
      }
      const limited =
        view === 'week' ? entries.slice(0, 7) : view === 'month' ? entries.slice(0, 30) : entries;
      limited.reverse();
      setMoodData(limited.map((e) => e.mood ?? 0));
      setEnergyData(limited.map((e) => e.energy ?? 0));

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
        setCompletionPercent(Math.round((fields.filter(Boolean).length / fields.length) * 100));
        setCurrentWeight(Number(profile.weight) || 180);
      }

      const libSnap = await getDocs(collection(db, 'exercises'));
      setExerciseLibrary(libSnap.docs.map((d) => d.data() as Exercise));
    };

    fetchAll();
  }, [view]);

  return (
    <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Your Dashboard</Text>
        <Text style={styles.subheader}>Train for duty. Fuel for life. 🔥</Text>

        {!hasCheckedInToday && (
  <ReminderCard text="Don't forget to check in today!" />
)}
        <ProfileCompletionBanner
  percent={completionPercent}
  pulseAnim={pulseAnim}
  onPress={() => navigation.navigate('Profile')}
/>

       <MoodEnergySection
  view={view}
  moodData={moodData}
  energyData={energyData}
  onViewChange={setView}
/>


        {!hasCheckedInToday && (
  <CheckInButton onPress={() => navigation.navigate('CheckIn')} />
)}

        <QuickViews />

        <AICoachBox />

        <GenerateButtons
  completionPercent={completionPercent}
  programExists={programExists}
  mealPlanExists={mealPlanExists}
  onGenerateMeal={() =>
    navigation
      .getParent<NativeStackNavigationProp<RootStackParamList>>()
      ?.navigate('GoalSettings')
  }
  onGenerateProgram={() => setShowWorkoutModal(true)}
  onViewPrograms={() =>
    navigation
      .getParent<NativeStackNavigationProp<RootStackParamList>>()
      ?.navigate('ProgramList')
  }
  onSetSchedule={() => setShowCalendarModal(true)}
  onViewHistory={() => navigation.navigate('WorkoutHistory')}
/>
      </ScrollView>

      <MealGoalsModal
        visible={showMealModal}
        currentWeight={currentWeight}
        onClose={() => setShowMealModal(false)}
        onSaved={() => {
          setMealPlanExists(true);
          setShowMealModal(false);
          navigation.getParent()?.navigate('MealPlan');
        }}
      />

      <PerformanceGoalsModal
        visible={showWorkoutModal}
        onClose={() => setShowWorkoutModal(false)}
        onSaved={async (goals) => {
          setShowWorkoutModal(false);
          const uid = auth.currentUser?.uid;
          if (!uid) {return;}
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
            Alert.alert('Error', 'There was an issue generating your workout program.');
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
  restDay: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 6,
  },
  exerciseLine: { fontSize: 14, color: '#ccc', marginBottom: 2 },
});

<QuickViews />;
