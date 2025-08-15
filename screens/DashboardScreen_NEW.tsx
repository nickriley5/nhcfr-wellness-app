// screens/DashboardScreen_NEW.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  View,
  Alert,
  Pressable,
  Platform,
  PermissionsAndroid,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  useNavigation,
  CompositeNavigationProp,
  useFocusEffect,
} from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  CameraOptions,
  ImageLibraryOptions,
} from 'react-native-image-picker';
import Toast from 'react-native-toast-message';

import { TabParamList, RootStackParamList } from '../App';
import ProfileCompletionBanner from '../components/Profile/ProfileCompletionBanner';
import MoodEnergySection from '../components/Dashboard/MoodEnergySection';
import WeightTrackingCard, { WeightTrackingCardRef } from '../components/Dashboard/WeightTrackingCard';
import MacroCard from '../components/mealplan/MacroCard';
import MealLoggingModal, { MealContext } from '../components/mealplan/MealLoggingModal';
import DescribeMealModal from '../components/mealplan/DescribeMealModal';
import CameraModal from '../components/mealplan/CameraModal';
import QuickFavoritesModal from '../components/mealplan/QuickFavorites';
import EnvironmentCalendarModal from '../components/EnvironmentCalendarModal';
import { useDashboardData } from '../hooks/useDashboardData';
import { auth, db } from '../firebase';
import { doc, deleteDoc, getDoc, collection, query, where, limit, getDocs, orderBy, setDoc, updateDoc } from 'firebase/firestore';

const { width: screenWidth } = Dimensions.get('window');
const SECTION_WIDTH = screenWidth - 32; // Account for padding

export default function DashboardScreen_NEW() {
  const navigation = useNavigation<
    CompositeNavigationProp<
      BottomTabNavigationProp<TabParamList, 'Dashboard'>,
      NativeStackNavigationProp<RootStackParamList>
    >
  >();

  const [view, setView] = useState<'week' | 'month' | 'all'>('week');
  const [pulseAnim] = useState(new Animated.Value(1));
  const [bump, setBump] = useState(0);

  // NEW: Wellness tracking states
  const [hydrationToday, setHydrationToday] = useState({ currentOz: 0, goalOz: 64 });
  const [sleepLastNight, _setSleepLastNight] = useState({ hours: 0, quality: 0 });
  const [readinessScore, setReadinessScore] = useState(0);
  const [_nextShift, _setNextShift] = useState<Date | null>(null);
  const [_showGlobalCalendar, _setShowGlobalCalendar] = useState(false);

  // ✅ MODAL STATES
  const [showMealLoggingModal, setShowMealLoggingModal] = useState(false);
  const [showDescribeModal, setShowDescribeModal] = useState(false);
  const [showQuickFavoritesModal, setShowQuickFavoritesModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showEnvironmentCalendar, setShowEnvironmentCalendar] = useState(false);
  const [showHydrationGoalModal, setShowHydrationGoalModal] = useState(false);

  // ✅ CAMERA & PHOTO STATES
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);

  // ✅ MEAL CONTEXT STATE
  const [currentMealContext, setCurrentMealContext] = useState<MealContext | null>(null);
  const [initialDescribeQuery, setInitialDescribeQuery] = useState<string>('');

  // ✅ PROGRAM INFO STATE
  const [tomorrowInfo, setTomorrowInfo] = useState<{
    isRestDay: boolean;
    day: any;
    weekIdx: number;
    dayIdx: number;
    environment: string;
  } | null>(null);

  const weightTrackingRef = useRef<WeightTrackingCardRef>(null);

  const [programInfo, setProgramInfo] = useState<{
    daysPerWeek: number;
    hasSchedule: boolean;
    currentDayName: string;
    isRestDay: boolean;
    todayEnvironment: string; // 'gym', 'station', 'home', 'off'
  } | null>(null);

  // ✅ WORKOUT COMPLETION STATE
  const [todayWorkoutSummary, setTodayWorkoutSummary] = useState<{
    isCompleted: boolean;
    dayTitle: string;
    totalTime: string;
    setsCompleted: number;
    setsPlanned: number;
    completedAt: Date;
    prMessages: string[];
  } | null>(null);

  // ✅ STREAK & CONSISTENCY STATE
  const [consistencyData, setConsistencyData] = useState({
    workoutStreak: 0,
    workoutsCompleted: 0,
    workoutsPlanned: 0,
    mealsLogged: 0,
    hydrationDays: 0,
    recentPRs: [] as string[],
  });

  const {
    moodData,
    energyData,
    hasCheckedInToday,
    completionPercent,
    programExists,
    todayInfo,
    macrosToday,
  } = useDashboardData(view, bump);

  useFocusEffect(
    React.useCallback(() => {
      setBump((b) => b + 1);
      return () => {};
    }, [])
  );

  // NEW: Calculate readiness score based on available data
  useEffect(() => {
    const calculateReadiness = () => {
      const lastMood = moodData[moodData.length - 1] || 0;
      const lastEnergy = energyData[energyData.length - 1] || 0;

      // Only calculate if we have mood/energy data
      if (lastMood === 0 || lastEnergy === 0) {
        setReadinessScore(0);
        return;
      }

      // Sleep component (0-5 scale)
      const sleepScore = sleepLastNight.hours > 0
        ? (sleepLastNight.hours / 8) * (sleepLastNight.quality / 5) * 5
        : 3; // Default neutral if no sleep data

      // Hydration component (0-5 scale)
      const hydrationScore = Math.min(5, (hydrationToday.currentOz / hydrationToday.goalOz) * 5);

      // Weighted readiness calculation
      const score = (
        lastMood * 0.35 +           // 35% mood
        lastEnergy * 0.35 +         // 35% energy
        sleepScore * 0.20 +         // 20% sleep
        hydrationScore * 0.10       // 10% hydration
      );

      setReadinessScore(score);
    };

    calculateReadiness();
  }, [moodData, energyData, sleepLastNight, hydrationToday]);

  // ✅ Load program information and schedule status
  useEffect(() => {
    const loadProgramInfo = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {return;}

      try {
        // Get active program
        const programDoc = await getDoc(doc(db, 'users', uid, 'program', 'active'));
        if (!programDoc.exists()) {
          setProgramInfo(null);
          return;
        }

        const programData = programDoc.data();
        const daysPerWeek = programData.template?.daysPerWeek || 4;

        // Get user profile to check schedule
        const profileDoc = await getDoc(doc(db, 'users', uid));
        const profile = profileDoc.data();
        const hasSchedule = !!profile?.schedule?.environmentMap;

        // Determine current day status
        const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
        const dayMap = {
          Sunday: 'Sun', Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
          Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat',
        };
        const todayKey = dayMap[today as keyof typeof dayMap] || today;

        let currentDayName = 'No current workout';
        let isRestDay = true;
        let todayEnvironment = 'off'; // Default to off

        if (hasSchedule && profile.schedule.environmentMap[todayKey]) {
          todayEnvironment = profile.schedule.environmentMap[todayKey];
          isRestDay = todayEnvironment === 'off';

          if (!isRestDay) {
            // Count how many workout days have passed this week to determine program day
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday

            const workoutDaysThisWeek = [];
            for (let i = 0; i < 7; i++) {
              const checkDate = new Date(weekStart);
              checkDate.setDate(weekStart.getDate() + i);
              const checkDay = checkDate.toLocaleDateString('en-US', { weekday: 'short' });
              const checkDayKey = dayMap[checkDay as keyof typeof dayMap] || checkDay;

              if (profile.schedule.environmentMap[checkDayKey] !== 'off') {
                workoutDaysThisWeek.push(checkDayKey);
              }
            }

            // Find which workout day of the week today is
            const todayIndex = workoutDaysThisWeek.indexOf(todayKey);
            if (todayIndex >= 0) {
              const programDayIndex = todayIndex % daysPerWeek;
              const programDay = programData.template?.days?.[programDayIndex];
              currentDayName = programDay?.title || `Day ${programDayIndex + 1}`;
            }
          }
        }

        setProgramInfo({
          daysPerWeek,
          hasSchedule,
          currentDayName,
          isRestDay,
          todayEnvironment,
        });
      } catch (error) {
        console.error('Error loading program info:', error);
        setProgramInfo(null);
      }
    };

    loadProgramInfo();
  }, [bump]);

  // ✅ Load tomorrow's workout info
  useEffect(() => {
    const loadTomorrowInfo = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid || !programExists) {
        setTomorrowInfo(null);
        return;
      }

      try {
        // Get the active program
        const progSnap = await getDoc(doc(db, 'users', uid, 'program', 'active'));
        if (!progSnap.exists()) {
          setTomorrowInfo(null);
          return;
        }

        const prog: any = progSnap.data();
        const days: any[] = prog.days || [];
        const curDay = prog.metadata?.currentDay ?? 1;

        // Get next day (tomorrow's workout)
        const nextDayIndex = curDay; // curDay is 1-based, so curDay gives us next day's 0-based index

        // Handle cycling through program
        const actualIndex = nextDayIndex % days.length;
        const nextWorkoutDay = days[actualIndex];

        if (!nextWorkoutDay) {
          setTomorrowInfo(null);
          return;
        }

        // Get tomorrow's date and check if it's a rest day
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDay = tomorrow.toLocaleDateString('en-US', { weekday: 'short' });

        const dayMap = {
          Sunday: 'Sun', Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
          Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat',
        };
        const tomorrowKey = dayMap[tomorrowDay as keyof typeof dayMap] || tomorrowDay;

        // Get user schedule to check if tomorrow is a rest day
        const profileDoc = await getDoc(doc(db, 'users', uid));
        const profile = profileDoc.data();
        const environmentMap = profile?.schedule?.environmentMap;

        let isRestDay = true;
        let environment = 'off';

        if (environmentMap && environmentMap[tomorrowKey]) {
          environment = environmentMap[tomorrowKey];
          isRestDay = environment === 'off';
        }

        setTomorrowInfo({
          isRestDay,
          day: nextWorkoutDay,
          weekIdx: (nextWorkoutDay as any).week - 1,
          dayIdx: (nextWorkoutDay as any).day - 1,
          environment,
        });
      } catch (error) {
        console.error('Error getting tomorrow info:', error);
        setTomorrowInfo(null);
      }
    };

    loadTomorrowInfo();
  }, [bump, programExists]);

  // ✅ Load today's workout completion status
  useEffect(() => {
    const loadWorkoutSummary = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {return;}

      try {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

        // Query today's workout logs
        const workoutLogsQuery = query(
          collection(db, 'users', uid, 'workoutLogs'),
          where('completedAt', '>=', todayStart),
          where('completedAt', '<', todayEnd),
          orderBy('completedAt', 'desc'),
          limit(1)
        );

        const snapshot = await getDocs(workoutLogsQuery);
        if (!snapshot.empty) {
          const workoutData = snapshot.docs[0].data();
          const prMessages: string[] = [];

          // Calculate summary stats
          const elapsedSec = workoutData.elapsedSec || 0;
          const totalTime = Math.floor(elapsedSec / 60) + ' min';
          const setsCompleted = workoutData.exercises?.reduce((total: number, ex: any) =>
            total + (ex.sets?.filter((set: any) => set.reps || set.weight).length || 0), 0) || 0;
          const setsPlanned = workoutData.exercises?.reduce((total: number, ex: any) =>
            total + (ex.sets?.length || 0), 0) || 0;

          // Check for PRs (simple detection from weight data)
          if (workoutData.exercises) {
            const exercisePRs: Record<string, number> = {};
            workoutData.exercises.forEach((ex: any) => {
              ex.sets?.forEach((set: any) => {
                const weight = Number(set.weight);
                if (!isNaN(weight) && weight > 0) {
                  exercisePRs[ex.name] = Math.max(exercisePRs[ex.name] || 0, weight);
                }
              });
            });

            Object.entries(exercisePRs).forEach(([exerciseName, weight]) => {
              if (weight > 0) {
                prMessages.push(`${exerciseName}: ${weight} lbs`);
              }
            });
          }

          setTodayWorkoutSummary({
            isCompleted: true,
            dayTitle: workoutData.dayTitle || 'Workout',
            totalTime,
            setsCompleted,
            setsPlanned,
            completedAt: workoutData.completedAt?.toDate() || new Date(),
            prMessages: prMessages.slice(0, 3), // Limit to top 3 PRs
          });
        } else {
          setTodayWorkoutSummary(null);
        }
      } catch (error) {
        console.error('Error loading workout summary:', error);
        setTodayWorkoutSummary(null);
      }
    };

    loadWorkoutSummary();
  }, [bump]);

  // ✅ CALCULATE CONSISTENCY DATA
  useEffect(() => {
    const calculateConsistency = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid || !programExists) {
        return;
      }

      try {
        // Calculate last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // 1. WORKOUT CONSISTENCY - Based on program schedule
        const programDoc = await getDoc(doc(db, 'users', uid, 'program', 'active'));
        let workoutsCompleted = 0;
        let workoutsPlanned = 0;

        if (programDoc.exists()) {
          const program = programDoc.data();
          const daysPerWeek = program.metadata?.daysPerWeek || 4;

          // Get workout logs from last 7 days
          const workoutLogsQuery = query(
            collection(db, 'users', uid, 'workoutLogs'),
            where('completedAt', '>=', sevenDaysAgo),
            orderBy('completedAt', 'desc')
          );

          const workoutSnapshot = await getDocs(workoutLogsQuery);
          workoutsCompleted = workoutSnapshot.size;
          workoutsPlanned = daysPerWeek; // Per week
        }

        // 2. MEAL CONSISTENCY - Days with at least 3 meals logged
        let mealsLogged = 0;

        // First, check today's meals from real-time data
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // Get today's meal count from Firebase
        const todayMealsQuery = query(
          collection(db, 'users', uid, 'mealLogs', todayStr, 'meals')
        );
        const todayMealsSnapshot = await getDocs(todayMealsQuery);
        if (todayMealsSnapshot.size >= 3) {
          mealsLogged++; // Today counts if 3+ meals
        }

        // Then check the past 6 days
        for (let i = 1; i < 7; i++) {
          const checkDate = new Date();
          checkDate.setDate(checkDate.getDate() - i);
          const dateStr = checkDate.toISOString().split('T')[0];

          const mealsQuery = query(
            collection(db, 'users', uid, 'mealLogs', dateStr, 'meals')
          );

          const mealSnapshot = await getDocs(mealsQuery);
          if (mealSnapshot.size >= 3) { // At least 3 meals logged
            mealsLogged++;
          }
        }
        // 3. HYDRATION CONSISTENCY - Days hitting 80% of goal
        let hydrationDays = 0;
        for (let i = 0; i < 7; i++) {
          const checkDate = new Date();
          checkDate.setDate(checkDate.getDate() - i);
          const dateStr = checkDate.toISOString().split('T')[0];

          const hydrationQuery = query(
            collection(db, 'users', uid, 'hydrationLogs'),
            where('date', '==', dateStr)
          );

          const hydrationSnapshot = await getDocs(hydrationQuery);
          if (!hydrationSnapshot.empty) {
            const hydrationData = hydrationSnapshot.docs[0].data();
            const percentage = (hydrationData.currentOz || 0) / (hydrationData.goalOz || 64);
            if (percentage >= 0.8) { // Hit 80% of goal
              hydrationDays++;
            }
          }
        }

        // 4. RECENT PRS - Last 3 PRs from workout logs
        const recentPRs: string[] = [];
        const prQuery = query(
          collection(db, 'users', uid, 'workoutLogs'),
          orderBy('completedAt', 'desc'),
          limit(10) // Look at last 10 workouts for PRs
        );

        const prSnapshot = await getDocs(prQuery);
        prSnapshot.docs.forEach(logDoc => {
          const logData = logDoc.data();
          if (logData.exercises) {
            logData.exercises.forEach((ex: any) => {
              ex.sets?.forEach((set: any) => {
                if (set.isPR && recentPRs.length < 3) {
                  recentPRs.push(`${ex.name}: ${set.weight}lbs x ${set.reps}`);
                }
              });
            });
          }
        });

        // 5. CALCULATE STREAK - Days hitting all 3 metrics
        const currentStreak = Math.min(workoutsCompleted, mealsLogged, hydrationDays);

        setConsistencyData({
          workoutStreak: currentStreak,
          workoutsCompleted,
          workoutsPlanned,
          mealsLogged,
          hydrationDays,
          recentPRs,
        });

      } catch (error) {
        console.error('Error calculating consistency:', error);
      }
    };

    calculateConsistency();
  }, [programExists, bump]);

  // ✅ LOAD HYDRATION DATA
  useEffect(() => {
    const loadHydrationData = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        return;
      }

      try {
        const today = new Date().toISOString().split('T')[0];
        const hydrationDoc = await getDoc(doc(db, 'users', uid, 'hydrationLogs', today));

        if (hydrationDoc.exists()) {
          const data = hydrationDoc.data();
          setHydrationToday({
            currentOz: data.currentOz || 0,
            goalOz: data.goalOz || 64,
          });
        } else {
          // Load user's default goal from profile
          const profileDoc = await getDoc(doc(db, 'users', uid));
          const defaultGoal = profileDoc.exists() ? profileDoc.data().hydrationGoalOz || 64 : 64;
          setHydrationToday({ currentOz: 0, goalOz: defaultGoal });
        }
      } catch (error) {
        console.error('Error loading hydration data:', error);
      }
    };

    loadHydrationData();
  }, [bump]);

  // NEW: Readiness helper functions
  const getReadinessColor = (score: number) => {
    if (score >= 4) { return '#33d6a6'; }  // High - green
    if (score >= 3) { return '#ffa726'; }  // Medium - orange
    return '#ff6b47';                      // Low - red
  };

  const getReadinessLevel = (score: number) => {
    if (score >= 4) { return 'High'; }
    if (score >= 3) { return 'Medium'; }
    return 'Low';
  };

  const getReadinessMessage = (score: number) => {
    if (score >= 4.5) { return 'Perfect day to push for PRs!'; }
    if (score >= 4) { return 'High readiness - go for it!'; }
    if (score >= 3.5) { return 'Good to go with planned workout'; }
    if (score >= 3) { return 'Moderate readiness - listen to your body'; }
    if (score >= 2) { return 'Consider lighter intensity today'; }
    return 'Focus on recovery and rest';
  };

  // ✅ HYDRATION FUNCTIONS
  const updateHydrationGoal = async (newGoal: number) => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      await setDoc(doc(db, 'users', uid, 'hydrationLogs', today), {
        currentOz: hydrationToday.currentOz,
        goalOz: newGoal,
        date: today,
      });

      // Also save as default in profile
      await updateDoc(doc(db, 'users', uid), {
        hydrationGoalOz: newGoal,
      });

      setHydrationToday(prev => ({ ...prev, goalOz: newGoal }));
    } catch (error) {
      console.error('Error updating hydration goal:', error);
    }
  };

  const addHydration = async (ozToAdd: number) => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      return;
    }

    const newTotal = Math.min(hydrationToday.currentOz + ozToAdd, hydrationToday.goalOz);

    try {
      const today = new Date().toISOString().split('T')[0];
      await setDoc(doc(db, 'users', uid, 'hydrationLogs', today), {
        currentOz: newTotal,
        goalOz: hydrationToday.goalOz,
        date: today,
      });

      setHydrationToday(prev => ({ ...prev, currentOz: newTotal }));
      setBump(b => b + 1); // Refresh consistency calculation
    } catch (error) {
      console.error('Error updating hydration:', error);
    }
  };

  // Environment helper functions
  const getEnvironmentIcon = (environment: string) => {
    switch (environment) {
      case 'gym': return '🏋️';
      case 'station': return '🚒';
      case 'home': return '🏠';
      case 'off': return '🛌';
      default: return '💪';
    }
  };

  const getEnvironmentLabel = (environment: string) => {
    switch (environment) {
      case 'gym': return 'Gym Workout';
      case 'station': return 'Station Workout';
      case 'home': return 'Home Workout';
      case 'off': return 'Rest Day';
      default: return 'Workout';
    }
  };

  const getTimeUntilTomorrow = () => {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(6, 0, 0, 0); // Assume workouts start at 6 AM

    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getTomorrowPreview = () => {
    const tomorrowData = tomorrowInfo;

    if (!tomorrowData) {
      return (
        <View style={styles.noPreviewContainer}>
          <Text style={styles.noPreviewText}>📋 Set up your weekly schedule</Text>
          <Text style={styles.noPreviewSubtext}>to see tomorrow's workout preview</Text>
        </View>
      );
    }

    if (tomorrowData.isRestDay) {
      return (
        <View style={styles.restPreviewNew}>
          <View style={styles.restHeaderNew}>
            <Text style={styles.restTitleNew}>🛌 Rest Day</Text>
            <View style={styles.restBadge}>
              <Text style={styles.restBadgeText}>Recovery</Text>
            </View>
          </View>
          <Text style={styles.restSubtitleNew}>Focus on recovery and preparation</Text>
          <View style={styles.restActivities}>
            <View style={styles.restActivity}>
              <Text style={styles.restActivityIcon}>🧘‍♂️</Text>
              <Text style={styles.restActivityText}>Mobility</Text>
            </View>
            <View style={styles.restActivity}>
              <Text style={styles.restActivityIcon}>💧</Text>
              <Text style={styles.restActivityText}>Hydration</Text>
            </View>
            <View style={styles.restActivity}>
              <Text style={styles.restActivityIcon}>😴</Text>
              <Text style={styles.restActivityText}>Sleep</Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.workoutPreviewNew}>
        <View style={styles.previewHeaderNew}>
          <View>
            <Text style={styles.previewTitleNew}>
              {getEnvironmentIcon(tomorrowData.environment)} {tomorrowData.day?.title || 'Workout'}
            </Text>
            <Text style={styles.previewMetaNew}>
              {getEnvironmentLabel(tomorrowData.environment)} • {summarizeMains(tomorrowData.day)}
            </Text>
          </View>
          <View style={styles.intensityBadge}>
            <Text style={styles.intensityBadgeText}>💪 PUSH</Text>
          </View>
        </View>

        <View style={styles.previewStatsNew}>
          <View style={styles.previewStatNew}>
            <Text style={styles.previewStatIconNew}>🏋️</Text>
            <Text style={styles.previewStatNumberNew}>{(tomorrowData.day?.exercises || []).length}</Text>
            <Text style={styles.previewStatLabelNew}>exercises</Text>
          </View>
          <View style={styles.previewStatNew}>
            <Text style={styles.previewStatIconNew}>📊</Text>
            <Text style={styles.previewStatNumberNew}>{countSets(tomorrowData.day)}</Text>
            <Text style={styles.previewStatLabelNew}>sets</Text>
          </View>
          <View style={styles.previewStatNew}>
            <Text style={styles.previewStatIconNew}>⏱️</Text>
            <Text style={styles.previewStatNumberNew}>{estimateTime(tomorrowData.day)}</Text>
            <Text style={styles.previewStatLabelNew}>min</Text>
          </View>
        </View>

        {/* Highlight Exercise Preview */}
        <View style={styles.highlightExercise}>
          <Text style={styles.highlightTitle}>Featured Exercise</Text>
          <Text style={styles.highlightExerciseName}>
            🔥 {tomorrowData.day?.exercises?.[0]?.name || 'Primary Movement'}
          </Text>
        </View>
      </View>
    );
  };  // ✅ Camera permission handler
  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {return true;}
    try {
      const cameraPermission = PermissionsAndroid.PERMISSIONS.CAMERA;
      const statusCheck1 = await PermissionsAndroid.check(cameraPermission);
      const statusCheck2 = await PermissionsAndroid.check('android.permission.CAMERA');
      if (statusCheck1 || statusCheck2) {
        Toast.show({ type: 'success', text1: 'Permission Already Granted', position: 'bottom' });
        return true;
      }
      const result = await PermissionsAndroid.request(cameraPermission, {
        title: 'Camera Access',
        message: 'Allow camera access to take meal photos?',
        buttonNeutral: 'Ask Later',
        buttonNegative: 'No',
        buttonPositive: 'Yes',
      });
      const afterRequestStatus = await PermissionsAndroid.check(cameraPermission);
      if (result === PermissionsAndroid.RESULTS.GRANTED || afterRequestStatus) {
        Toast.show({ type: 'success', text1: 'Camera Permission Granted!', position: 'bottom' });
        return true;
      }
      Toast.show({
        type: 'error',
        text1: 'Permission Issue',
        text2: `Result: ${result}`,
        position: 'bottom',
        visibilityTime: 4000,
      });
      return false;
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Permission Error',
        text2: 'Unable to request camera permission',
        position: 'bottom',
      });
      return false;
    }
  };

  // ✅ Photo picking handlers
  const handlePickPhoto = () => {
    Alert.alert('Add Photo', 'Choose a photo source', [
      {
        text: 'Take Photo',
        onPress: async () => {
          const hasPermission = await requestCameraPermission();
          if (hasPermission) {openCamera();}
        },
      },
      { text: 'Choose from Gallery', onPress: () => openImageLibrary() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const openCamera = async () => {
    const options: CameraOptions = { mediaType: 'photo', maxWidth: 1024, maxHeight: 1024 };
    launchCamera(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {return;}
      if (response.errorMessage) {
        Toast.show({ type: 'error', text1: 'Camera Error', text2: response.errorMessage, position: 'bottom' });
        return;
      }
      if (response.assets && response.assets[0]?.uri) {
        setSelectedImageUri(response.assets[0].uri);
        setShowCameraModal(true);
      }
    });
  };

  const openImageLibrary = () => {
    const options: ImageLibraryOptions = { mediaType: 'photo', maxWidth: 1024, maxHeight: 1024 };
    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {return;}
      if (response.errorMessage) {
        Toast.show({ type: 'error', text1: 'Gallery Error', text2: response.errorMessage, position: 'bottom' });
        return;
      }
      if (response.assets && response.assets[0]?.uri) {
        setSelectedImageUri(response.assets[0].uri);
        setShowCameraModal(true);
      }
    });
  };

  // ✅ Modal handlers for meal logging
  const handleOpenDescribeModal = (mealContext: MealContext) => {
    setInitialDescribeQuery('');
    setPendingPhotoUri(null);
    setCurrentMealContext(mealContext);
    setShowDescribeModal(true);
  };

  const handleOpenQuickAdd = (mealContext: MealContext) => {
    setCurrentMealContext(mealContext);
    setShowQuickFavoritesModal(true);
  };

  // Weight tracking helper functions
  const getWeeklyAverage = () => {
    // This would need to access weight data from the component
    // For now, return a placeholder
    return '182.3';
  };

  const getWeeklyChange = () => {
    // This would calculate weekly change
    // For now, return a placeholder
    return -1.2;
  };

  const handleCameraModalComplete = (meal: any) => {
    if (meal.source === 'OPEN_DESCRIBE_MODAL') {
      setPendingPhotoUri(meal.photoUri);
      setShowCameraModal(false);
      setSelectedImageUri(null);
      setTimeout(() => setShowDescribeModal(true), 300);
    }
  };

  const handleFoodLogged = () => {
    // Navigate to meal plan after successful food logging
    setTimeout(() => {
      navigation
        .getParent<NativeStackNavigationProp<RootStackParamList>>()
        ?.navigate('MainTabs', { screen: 'MealPlan' });
    }, 300);
  };

  const handleMealLogged = (_meal: any) => {
    // Navigate to meal plan after successful meal logging
    setTimeout(() => {
      navigation
        .getParent<NativeStackNavigationProp<RootStackParamList>>()
        ?.navigate('MainTabs', { screen: 'MealPlan' });
    }, 300);
  };

  return (
    <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header with Calendar Button */}
        <View style={styles.headerRow}>
          <View style={styles.headerContent}>
            <Text style={styles.header}>Your Dashboard</Text>
            <Text style={styles.subheader}>Train for duty. Fuel for life. 🔥</Text>
          </View>
          <Pressable
            style={styles.calendarButton}
            onPress={() => console.log('Calendar pressed')} // Placeholder for now
          >
            <Text style={styles.calendarIcon}>📅</Text>
          </Pressable>
        </View>

        <ProfileCompletionBanner
          percent={completionPercent}
          pulseAnim={pulseAnim}
          onPress={() => navigation.navigate('Profile')}
        />

        {/* SECTION 1: Wellness & Readiness */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>🔥 Wellness & Readiness</Text>

          {/* Unified Readiness + Trends Card */}
          <View style={styles.tile}>
            <View style={styles.headerRow}>
              <Text style={styles.tileHeader}>Today's Readiness</Text>
              {hasCheckedInToday && (
                <Pressable
                  style={styles.checkInButton}
                  onPress={() => navigation.navigate('CheckIn')}
                >
                  <Text style={styles.checkInButtonText}>Update</Text>
                </Pressable>
              )}
            </View>

            {hasCheckedInToday ? (
              <>
                {/* Readiness Score Row */}
                <View style={styles.readinessRow}>
                  <View style={styles.readinessMain}>
                    <Text style={[styles.readinessScore, { color: getReadinessColor(readinessScore) }]}>
                      {readinessScore.toFixed(1)}/5.0
                    </Text>
                    <Text style={[styles.readinessLevel, { color: getReadinessColor(readinessScore) }]}>
                      {getReadinessLevel(readinessScore)}
                    </Text>
                  </View>

                  {/* Current Stats */}
                  <View style={styles.currentStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{moodData[moodData.length - 1] || '–'}</Text>
                      <Text style={styles.readinessStatLabel}>Mood</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{energyData[energyData.length - 1] || '–'}</Text>
                      <Text style={styles.readinessStatLabel}>Energy</Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.readinessMessageCard, { backgroundColor: getReadinessColor(readinessScore) + '20', borderColor: getReadinessColor(readinessScore) }]}>
                  <Text style={[styles.readinessMessage, { color: getReadinessColor(readinessScore) }]}>
                    {getReadinessMessage(readinessScore)}
                  </Text>
                </View>

                {/* Embedded Trends Chart */}
                <View style={styles.embeddedChart}>
                  <MoodEnergySection
                    view={view}
                    moodData={moodData}
                    energyData={energyData}
                    onViewChange={setView}
                  />
                </View>
              </>
            ) : (
              <View style={styles.noCheckInState}>
                <Text style={styles.noCheckInIcon}>📊</Text>
                <Text style={styles.mutedText}>No check-in today</Text>
                <Text style={styles.helperText}>
                  Track your mood & energy to get your daily readiness score
                </Text>
                <Pressable
                  style={[styles.btn, styles.btnPrimary]}
                  onPress={() => navigation.navigate('CheckIn')}
                >
                  <Text style={styles.btnPrimaryText}>Check-In Now</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {/* SECTION 2: Today's Training */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Training</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
            contentContainerStyle={styles.horizontalContent}
          >
            {/* Today's Workout */}
            <View style={styles.horizontalCard}>
              <Text style={styles.tileHeader}>Today's Workout</Text>
              {programExists && programInfo ? (
                <>
                  {!programInfo.hasSchedule ? (
                    <>
                      <Text style={styles.mutedText}>Schedule your weekly training</Text>
                      <Text style={styles.helperText}>
                        Your program requires {programInfo.daysPerWeek} workout days per week.
                        Set up your weekly schedule to see today's workout.
                      </Text>
                      <Pressable
                        style={[styles.btn, styles.btnPrimary]}
                        onPress={() => setShowEnvironmentCalendar(true)}
                      >
                        <Text style={styles.btnPrimaryText}>Set Weekly Schedule</Text>
                      </Pressable>
                    </>
                  ) : programInfo.isRestDay ? (
                    <>
                      <Text style={styles.workoutTitle}>🛌 Rest Day</Text>
                      <Text style={styles.workoutMeta}>Recovery and restoration day</Text>
                      <Text style={styles.helperText}>
                        Take time to rest, stretch, or do light activities. Your next workout is coming up!
                      </Text>
                      <Pressable
                        style={styles.linkWrap}
                        onPress={() => setShowEnvironmentCalendar(true)}
                      >
                        <Text style={styles.linkText}>Adjust Weekly Schedule</Text>
                      </Pressable>
                    </>
                  ) : todayWorkoutSummary?.isCompleted ? (
                    <>
                      <Text style={styles.workoutTitle}>
                        ✅ {todayWorkoutSummary.dayTitle} Complete
                      </Text>
                      <Text style={styles.workoutMeta}>
                        Completed at {todayWorkoutSummary.completedAt.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>

                      {/* Workout Summary Stats */}
                      <View style={styles.summaryStats}>
                        <View style={styles.statBlock}>
                          <Text style={styles.statNumber}>{todayWorkoutSummary.totalTime}</Text>
                          <Text style={styles.statLabel}>Total Time</Text>
                        </View>
                        <View style={styles.statBlock}>
                          <Text style={styles.statNumber}>
                            {todayWorkoutSummary.setsCompleted}/{todayWorkoutSummary.setsPlanned}
                          </Text>
                          <Text style={styles.statLabel}>Sets Completed</Text>
                        </View>
                        <View style={styles.statBlock}>
                          <Text style={styles.statNumber}>{todayWorkoutSummary.prMessages.length}</Text>
                          <Text style={styles.statLabel}>PRs Today</Text>
                        </View>
                      </View>

                      {/* PR Messages */}
                      {todayWorkoutSummary.prMessages.length > 0 && (
                        <View style={styles.prSection}>
                          <Text style={styles.prTitle}>🔥 Personal Records Today!</Text>
                          {todayWorkoutSummary.prMessages.map((pr, idx) => (
                            <Text key={idx} style={styles.prText}>
                              {pr}
                            </Text>
                          ))}
                        </View>
                      )}

                      <Pressable
                        style={styles.linkWrap}
                        onPress={() =>
                          navigation
                            .getParent<NativeStackNavigationProp<RootStackParamList>>()
                            ?.navigate('WorkoutHistory')
                        }
                      >
                        <Text style={styles.linkText}>View History</Text>
                      </Pressable>
                    </>
                  ) : todayInfo && !programInfo.isRestDay ? (
                    <>
                      <Text style={styles.workoutTitle}>
                        {getEnvironmentIcon(programInfo.todayEnvironment)} {todayInfo.day.title ?? 'Workout'}
                      </Text>
                      <Text style={styles.workoutMeta}>
                        {getEnvironmentLabel(programInfo.todayEnvironment)} • {summarizeMains(todayInfo.day)} • {countSets(todayInfo.day)} sets • ~
                        {estimateTime(todayInfo.day)} min
                      </Text>

                      <View style={styles.rowButtons}>
                        <Pressable
                          style={[styles.btn, styles.btnPrimary]}
                          onPress={() =>
                            navigation.navigate('WorkoutDetail', {
                              day: todayInfo!.day,
                              weekIdx: todayInfo!.weekIdx,
                              dayIdx: todayInfo!.dayIdx,
                            })
                          }
                        >
                          <Text style={styles.btnPrimaryText}>Start</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.btn, styles.btnSecondary]}
                          onPress={() => navigation.navigate('AdaptWorkout')}
                        >
                          <Text style={styles.btnSecondaryText}>Adapt</Text>
                        </Pressable>
                      </View>

                      <Pressable
                        style={styles.linkWrap}
                        onPress={() =>
                          navigation
                            .getParent<NativeStackNavigationProp<RootStackParamList>>()
                            ?.navigate('WorkoutHistory')
                        }
                      >
                        <Text style={styles.linkText}>View History</Text>
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <Text style={styles.workoutTitle}>No Workout Scheduled</Text>
                      <Text style={styles.helperText}>
                        Check your weekly schedule or browse available workouts.
                      </Text>
                      <View style={styles.rowButtons}>
                        <Pressable
                          style={[styles.btn, styles.btnSecondary]}
                          onPress={() => setShowEnvironmentCalendar(true)}
                        >
                          <Text style={styles.btnSecondaryText}>Adjust Schedule</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.btn, styles.btnSecondary]}
                          onPress={() => navigation.navigate('ProgramList')}
                        >
                          <Text style={styles.btnSecondaryText}>Browse Programs</Text>
                        </Pressable>
                      </View>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.workoutTitle}>No Program Active</Text>
                  <Text style={styles.helperText}>
                    Select a workout program to get started with structured training.
                  </Text>
                  <Pressable
                    style={[styles.btn, styles.btnPrimary]}
                    onPress={() => navigation.navigate('ProgramList')}
                  >
                    <Text style={styles.btnPrimaryText}>Choose Program</Text>
                  </Pressable>
                </>
              )}
            </View>

            {/* Streak & Achievements Card */}
            <View style={styles.horizontalCard}>
              <View style={styles.streakHeader}>
                <Text style={styles.tileHeader}>🔥 Dedication</Text>
                <View style={styles.streakBadge}>
                  <Text style={styles.streakNumber}>{consistencyData.workoutStreak}</Text>
                  <Text style={styles.streakLabel}>day streak</Text>
                </View>
              </View>

              {/* Consistency Metrics */}
              <View style={styles.consistencyGrid}>
                <View style={styles.consistencyItem}>
                  <Text style={styles.consistencyEmoji}>💪</Text>
                  <Text style={styles.consistencyValue}>
                    {consistencyData.workoutsCompleted}/{consistencyData.workoutsPlanned}
                  </Text>
                  <Text style={styles.consistencyLabel}>Workouts</Text>
                </View>
                <View style={styles.consistencyItem}>
                  <Text style={styles.consistencyEmoji}>🍎</Text>
                  <Text style={styles.consistencyValue}>{consistencyData.mealsLogged}/7</Text>
                  <Text style={styles.consistencyLabel}>Meals</Text>
                </View>
                <View style={styles.consistencyItem}>
                  <Text style={styles.consistencyEmoji}>💧</Text>
                  <Text style={styles.consistencyValue}>{consistencyData.hydrationDays}/7</Text>
                  <Text style={styles.consistencyLabel}>Hydration</Text>
                </View>
              </View>

              {/* Recent PRs */}
              <View style={styles.prSection}>
                <Text style={styles.prHeader}>🏆 Recent PRs</Text>
                {consistencyData.recentPRs.length > 0 ? (
                  consistencyData.recentPRs.map((pr, idx) => (
                    <Text key={idx} style={styles.prItem}>• {pr}</Text>
                  ))
                ) : (
                  <Text style={styles.prItem}>• No recent PRs - time to push!</Text>
                )}
              </View>
            </View>

            {/* Enhanced Coming Up Preview */}
            <View style={styles.horizontalCard}>
              <LinearGradient
                colors={['rgba(51, 214, 166, 0.1)', 'rgba(76, 195, 247, 0.05)']}
                style={styles.comingUpGradient}
              >
                <View style={styles.comingUpHeader}>
                  <View>
                    <Text style={styles.tileHeader}>📅 Coming Up</Text>
                    <Text style={styles.comingUpSubtitle}>
                      {getTimeUntilTomorrow()} until next session
                    </Text>
                  </View>
                  <View style={styles.dayIndicator}>
                    <Text style={styles.dayIndicatorText}>
                      {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
                    </Text>
                  </View>
                </View>

                {getTomorrowPreview()}

                <View style={styles.comingUpActions}>
                  <Pressable
                    style={[styles.btn, styles.btnPreview]}
                    onPress={() => setShowEnvironmentCalendar(true)}
                  >
                    <Text style={styles.btnPreviewText}>📋 Weekly Plan</Text>
                  </Pressable>
                  {!tomorrowInfo?.isRestDay && (
                    <Pressable
                      style={[styles.btn, styles.btnPreviewSecondary]}
                      onPress={() => {
                        const tomorrowData = tomorrowInfo;
                        if (tomorrowData?.day) {
                          navigation.navigate('WorkoutDetail', {
                            day: tomorrowData.day,
                            weekIdx: tomorrowData.weekIdx,
                            dayIdx: tomorrowData.dayIdx,
                          });
                        }
                      }}
                    >
                      <Text style={styles.btnPreviewSecondaryText}>👁️ Preview</Text>
                    </Pressable>
                  )}
                </View>
              </LinearGradient>
            </View>
          </ScrollView>
        </View>

        {/* SECTION 3: Progress & Nutrition */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Nutrition & Weight</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
            contentContainerStyle={styles.horizontalContent}
          >
            {/* Macro Cards Grid */}
            <View style={styles.horizontalCard}>
              <Text style={styles.tileHeader}>Today's Nutrtion</Text>

              <View style={styles.macroGrid}>
                <MacroCard
                  label="Calories"
                  logged={macrosToday.calories.eaten}
                  target={macrosToday.calories.goal || 2000}
                  unit="kcal"
                  variant="calories"
                />
                <MacroCard
                  label="Protein"
                  logged={macrosToday.protein.eaten}
                  target={macrosToday.protein.goal || 150}
                  unit="g"
                  variant="protein"
                />
                <MacroCard
                  label="Carbs"
                  logged={macrosToday.carbs.eaten}
                  target={macrosToday.carbs.goal || 200}
                  unit="g"
                  variant="carb"
                />
                <MacroCard
                  label="Fat"
                  logged={macrosToday.fat.eaten}
                  target={macrosToday.fat.goal || 80}
                  unit="g"
                  variant="fat"
                />
              </View>

              {/* Elegant Log Food Separator */}
              <View style={styles.logFoodSeparator}>
                <View style={styles.separatorLine} />
                <Pressable
                  style={styles.logFoodButtonCentered}
                  onPress={() => setShowMealLoggingModal(true)}
                >
                  <Text style={styles.logFoodButtonCenteredText}>+ Log Food</Text>
                </Pressable>
                <View style={styles.separatorLine} />
              </View>

              {/* Hydration Tracker */}
              <View style={styles.hydrationSection}>
                <View style={styles.hydrationHeader}>
                  <Text style={styles.hydrationTitle}>💧 Hydration</Text>
                  <Pressable
                    style={styles.changeGoalButton}
                    onPress={() => setShowHydrationGoalModal(true)}
                  >
                    <Text style={styles.changeGoalText}>
                      {hydrationToday.currentOz}/{hydrationToday.goalOz} oz
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.dropletsContainer}>
                  {(() => {
                    // Dynamic droplet count based on goal size
                    const dropletCount = hydrationToday.goalOz <= 64 ? 8 :
                                        hydrationToday.goalOz <= 96 ? 12 : 16;
                    const filledDroplets = Math.floor((hydrationToday.currentOz / hydrationToday.goalOz) * dropletCount);
                    const ozPerDroplet = hydrationToday.goalOz / dropletCount;

                    return Array.from({ length: dropletCount }, (_, i) => {
                      const filled = i < filledDroplets;
                      return (
                        <Pressable
                          key={i}
                          onPress={() => addHydration(ozPerDroplet)}
                          style={styles.waterDroplet}
                        >
                          <Text style={[styles.dropletIcon, filled && styles.dropletFilled]}>💧</Text>
                        </Pressable>
                      );
                    });
                  })()}
                </View>
              </View>
            </View>

            {/* Weight Tracking */}
            <View style={styles.horizontalCard}>
              <WeightTrackingCard
                ref={weightTrackingRef}
                onWeightUpdated={() => setBump((b) => b + 1)}
              />

              {/* Enhanced Footer Section */}
              <View style={styles.weightTrackingFooter}>
                <Pressable
                  style={[styles.btn, styles.btnWeightLog]}
                  onPress={() => {
                    weightTrackingRef.current?.openWeightModal();
                  }}
                >
                  <Text style={styles.btnWeightLogText}>Log Weight</Text>
                </Pressable>

                <View style={styles.weeklyAverageContainer}>
                  <Text style={styles.weeklyAverageLabel}>7-Day Average</Text>
                  <Text style={styles.weeklyAverageValue}>{getWeeklyAverage()} lbs</Text>
                  <Text style={styles.weeklyAverageChange}>
                    {getWeeklyChange() > 0 ? '↗️' : getWeeklyChange() < 0 ? '↘️' : '➡️'}
                    {Math.abs(getWeeklyChange()).toFixed(1)} from last week
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* DEV: Reset completed workout */}
        {__DEV__ && todayWorkoutSummary?.isCompleted && (
          <View style={styles.devSection}>
            <Text style={styles.devLabel}>DEV: Reset today's workout</Text>
            <Pressable
              onPress={async () => {
                const uid = auth.currentUser?.uid;
                if (!uid) {return;}
                const today = new Date().toISOString().split('T')[0];
                const completedWorkoutsQuery = query(
                  collection(db, 'users', uid, 'completedWorkouts'),
                  where('date', '==', today)
                );
                const snapshot = await getDocs(completedWorkoutsQuery);
                for (const docSnap of snapshot.docs) {
                  await deleteDoc(docSnap.ref);
                }
                setBump((b) => b + 1);
              }}
            >
              <Text style={styles.resetProgramText}>Reset Today's Workout</Text>
            </Pressable>
          </View>
        )}

        {/* DEV: Reset program */}
        {__DEV__ && (
          <View style={styles.devSection}>
            <Text style={styles.devLabel}>Dev</Text>
            <Pressable
              onPress={async () => {
                const uid = auth.currentUser?.uid;
                if (!uid) {return;}
                await deleteDoc(doc(db, 'users', uid, 'program', 'active'));
                Alert.alert('Program', 'Active program reset.');
                setBump((b) => b + 1);
              }}
            >
              <Text style={styles.resetProgramText}>Reset Active Program</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* ✅ ALL MODALS - exactly as in original */}
      <MealLoggingModal
        visible={showMealLoggingModal}
        onClose={() => setShowMealLoggingModal(false)}
        onOpenDescribeModal={handleOpenDescribeModal}
        onOpenQuickAdd={handleOpenQuickAdd}
        onOpenCamera={handlePickPhoto}
      />

      <DescribeMealModal
        visible={showDescribeModal}
        onClose={() => {
          setShowDescribeModal(false);
          setPendingPhotoUri(null);
          setCurrentMealContext(null);
          setInitialDescribeQuery('');
        }}
        onMealLogged={handleMealLogged}
        pendingPhotoUri={pendingPhotoUri}
        mealContext={currentMealContext}
        initialQuery={initialDescribeQuery}
        reDescribeMode={false}
        existingItems={[]}
        onApplyRedescribe={() => {}}
      />

      <QuickFavoritesModal
        visible={showQuickFavoritesModal}
        onClose={() => {
          setShowQuickFavoritesModal(false);
          setCurrentMealContext(null);
        }}
        onFoodLogged={handleFoodLogged}
        mealContext={currentMealContext}
      />

      <CameraModal
        visible={showCameraModal}
        onClose={() => {
          setShowCameraModal(false);
          setSelectedImageUri(null);
          setCurrentMealContext(null);
        }}
        imageUri={selectedImageUri}
        onMealLogged={handleCameraModalComplete}
      />

      {/* Environment Calendar Modal */}
      <EnvironmentCalendarModal
        visible={showEnvironmentCalendar}
        onClose={() => {
          setShowEnvironmentCalendar(false);
          // Refresh the dashboard data to pick up schedule changes
          setBump((b) => b + 1);
        }}
      />

      {/* Hydration Goal Modal */}
      {showHydrationGoalModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.hydrationModal}>
            <Text style={styles.modalTitle}>Set Daily Hydration Goal</Text>
            <Text style={styles.modalSubtitle}>Choose your target water intake</Text>

            <View style={styles.goalOptionsGrid}>
              {[48, 64, 80, 96, 112, 128, 144, 160, 192].map(oz => (
                <Pressable
                  key={oz}
                  style={[
                    styles.goalOption,
                    hydrationToday.goalOz === oz && styles.goalOptionSelected,
                  ]}
                  onPress={() => {
                    updateHydrationGoal(oz);
                    setShowHydrationGoalModal(false);
                  }}
                >
                  <Text style={[
                    styles.goalOptionText,
                    hydrationToday.goalOz === oz && styles.goalOptionTextSelected,
                  ]}>
                    {oz} oz
                  </Text>
                  <Text style={[
                    styles.goalOptionSubtext,
                    hydrationToday.goalOz === oz && styles.goalOptionSubtextSelected,
                  ]}>
                    {oz === 48 ? '6 cups' :
                     oz === 64 ? '8 cups' :
                     oz === 80 ? '10 cups' :
                     oz === 96 ? '12 cups' :
                     oz === 112 ? '14 cups' :
                     oz === 128 ? '1 gallon' :
                     oz === 144 ? '1.1 gal' :
                     oz === 160 ? '1.25 gal' :
                     '1.5 gal'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setShowHydrationGoalModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

/* -------------------- Helpers -------------------- */

function estimateTime(day: any) {
  if (day?.estTimeMin) {return day.estTimeMin;}
  const sets = countSets(day);
  return Math.max(15, Math.round(sets * 2.5 + 8));
}

function countSets(day: any) {
  if (!day) {return 0;}
  const all = [...(day.warmup || []), ...(day.exercises || []), ...(day.cooldown || [])];
  return all.reduce((acc, ex) => acc + (Array.isArray(ex?.sets) ? ex.sets.length : 1), 0);
}

function summarizeMains(day: any) {
  const mains = (day?.exercises || []).slice(0, 3).map((x: any) => x?.name).filter(Boolean);
  return mains.length ? mains.join(' • ') : '—';
}

/* -------------------- Styles -------------------- */

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 10,
  },
  headerContent: {
    flex: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  subheader: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 20,
    fontWeight: '500',
  },
  calendarButton: {
    backgroundColor: '#2a2a2a',
    padding: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  calendarIcon: {
    fontSize: 20,
  },

  // ✨ NEW: Section styles
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    marginLeft: 4,
  },
  horizontalScroll: {
    flexGrow: 0,
  },
  horizontalContent: {
    paddingRight: 16,
  },
  horizontalCard: {
    width: SECTION_WIDTH * 0.85, // Slightly smaller than screen width
    backgroundColor: '#1f1f1f',
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#333',
  },

  // ✨ MealPlan aesthetic - dark theme
  tile: {
    width: '100%',
    backgroundColor: '#1f1f1f',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  tileHeader: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 12,
    fontSize: 20,
  },

  workoutTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  workoutMeta: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },

  rowButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  btnPrimary: {
    backgroundColor: '#33d6a6',
    borderColor: '#33d6a6',
    shadowColor: '#33d6a6',
    shadowOpacity: 0.3,
  },
  btnPrimaryText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
  },
  btnSecondary: {
    borderColor: '#444',
    backgroundColor: 'rgba(68, 68, 68, 0.2)',
  },
  btnSecondaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },

  linkWrap: { marginTop: 14 },
  linkText: {
    color: '#4FC3F7',
    textDecorationLine: 'underline',
    fontSize: 13,
    fontWeight: '500',
  },

  mutedText: {
    color: '#aaa',
    fontSize: 15,
    lineHeight: 22,
  },
  helperText: {
    color: '#fff',
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.8,
  },

  // NEW: Readiness display styles
  readinessDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  readinessScore: {
    fontSize: 24,
    fontWeight: '800',
  },
  readinessLevel: {
    fontSize: 16,
    fontWeight: '600',
  },
  readinessMessage: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
    textAlign: 'center',
    fontWeight: '600',
  },
  readinessMessageCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },

  devSection: { marginTop: 16, width: '100%' },
  devLabel: { color: '#aaa', fontSize: 12, marginBottom: 8 },
  resetProgramText: { color: '#ff6b6b', textDecorationLine: 'underline' },

  // ✨ Enhanced Workout Summary Styles
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    marginBottom: 12,
    paddingVertical: 16,
    backgroundColor: '#1f1f1f',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  statBlock: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4FC3F7',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    fontWeight: '500',
    opacity: 0.9,
  },
  prSection: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#2a1f28',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b47',
    borderWidth: 1,
    borderColor: '#3d2d35',
  },
  prTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ff6b47',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  prText: {
    fontSize: 13,
    color: '#ffb3a6',
    marginBottom: 3,
    lineHeight: 18,
  },

  // Macro grid styles
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logFoodButton: {
    backgroundColor: '#33d6a6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logFoodButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 13,
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  // Elegant Log Food Separator Styles
  logFoodSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 16,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  logFoodButtonCentered: {
    backgroundColor: '#33d6a6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: '#33d6a6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  logFoodButtonCenteredText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },

  // Chart centering
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },

  // Enhanced readiness styles
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4FC3F7',
    marginBottom: 2,
  },
  readinessStatLabel: {
    fontSize: 11,
    color: '#aaa',
    fontWeight: '500',
  },
  noCheckInState: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  noCheckInIcon: {
    fontSize: 32,
    marginBottom: 8,
  },

  // Unified readiness card styles
  checkInButton: {
    backgroundColor: 'rgba(79, 195, 247, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4FC3F7',
  },
  checkInButtonText: {
    color: '#4FC3F7',
    fontSize: 12,
    fontWeight: '600',
  },
  readinessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  readinessMain: {
    flex: 1,
  },
  currentStats: {
    flexDirection: 'row',
    gap: 16,
  },
  embeddedChart: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 16,
  },

  // Streak & Achievements Styles
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakBadge: {
    backgroundColor: '#ff4757',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
  },
  streakNumber: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  streakLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  consistencyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  consistencyItem: {
    alignItems: 'center',
    flex: 1,
  },
  consistencyEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  consistencyValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  consistencyLabel: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  prHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffa502',
    marginBottom: 8,
  },
  prItem: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 3,
  },

  // Upcoming Workout Preview Styles
  restPreview: {
    marginBottom: 16,
  },
  restTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4FC3F7',
    marginBottom: 4,
  },
  restSubtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
  },
  restTips: {
    gap: 4,
  },
  tipItem: {
    fontSize: 12,
    color: '#aaa',
  },
  workoutPreview: {
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#33d6a6',
    marginBottom: 4,
  },
  previewMeta: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewStat: {
    alignItems: 'center',
    flex: 1,
  },
  previewStatNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  previewStatLabel: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: '500',
  },

  // Enhanced Coming Up Styles
  comingUpGradient: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },

  // Weight Tracking Footer Styles
  weightTrackingFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  btnWeightLog: {
    backgroundColor: '#33d6a6',
    marginBottom: 16,
  },
  btnWeightLogText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  weeklyAverageContainer: {
    backgroundColor: '#1f1f1f',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  weeklyAverageLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  weeklyAverageValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#33d6a6',
    marginBottom: 6,
  },
  weeklyAverageChange: {
    fontSize: 13,
    color: '#aaa',
    fontWeight: '500',
  },

  comingUpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  comingUpSubtitle: {
    fontSize: 12,
    color: '#4FC3F7',
    marginTop: 4,
    fontWeight: '500',
  },
  dayIndicator: {
    backgroundColor: 'rgba(51, 214, 166, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#33d6a6',
  },
  dayIndicatorText: {
    color: '#33d6a6',
    fontSize: 12,
    fontWeight: '600',
  },

  // No Preview State
  noPreviewContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noPreviewText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
    marginBottom: 4,
  },
  noPreviewSubtext: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
  },

  // Enhanced Rest Preview
  restPreviewNew: {
    marginBottom: 16,
  },
  restHeaderNew: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  restTitleNew: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4FC3F7',
  },
  restBadge: {
    backgroundColor: 'rgba(76, 195, 247, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  restBadgeText: {
    color: '#4FC3F7',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  restSubtitleNew: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
  },
  restActivities: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  restActivity: {
    alignItems: 'center',
    flex: 1,
  },
  restActivityIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  restActivityText: {
    fontSize: 11,
    color: '#aaa',
    fontWeight: '500',
  },

  // Enhanced Workout Preview
  workoutPreviewNew: {
    marginBottom: 16,
  },
  previewHeaderNew: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  previewTitleNew: {
    fontSize: 16,
    fontWeight: '600',
    color: '#33d6a6',
    marginBottom: 4,
  },
  previewMetaNew: {
    fontSize: 13,
    color: '#888',
  },
  intensityBadge: {
    backgroundColor: 'rgba(51, 214, 166, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  intensityBadgeText: {
    color: '#33d6a6',
    fontSize: 10,
    fontWeight: '600',
  },
  previewStatsNew: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  previewStatNew: {
    alignItems: 'center',
    flex: 1,
  },
  previewStatIconNew: {
    fontSize: 16,
    marginBottom: 4,
  },
  previewStatNumberNew: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  previewStatLabelNew: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  highlightExercise: {
    backgroundColor: 'rgba(51, 214, 166, 0.1)',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#33d6a6',
  },
  highlightTitle: {
    fontSize: 11,
    color: '#33d6a6',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  highlightExerciseName: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },

  // Coming Up Actions
  comingUpActions: {
    flexDirection: 'row',
    gap: 8,
  },
  btnPreview: {
    backgroundColor: '#33d6a6',
    flex: 1,
  },
  btnPreviewText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  btnPreviewSecondary: {
    backgroundColor: 'rgba(51, 214, 166, 0.2)',
    flex: 1,
    borderWidth: 1,
    borderColor: '#33d6a6',
  },
  btnPreviewSecondaryText: {
    color: '#33d6a6',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Hydration Styles
  hydrationSection: {
    marginTop: 20,
  },
  hydrationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  hydrationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4FC3F7',
  },
  hydrationProgress: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  waterDroplet: {
    padding: 4,
  },
  dropletIcon: {
    fontSize: 24,
    opacity: 0.3,
  },
  dropletFilled: {
    opacity: 1,
  },
  setGoalButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'center',
  },
  setGoalText: {
    color: '#4FC3F7',
    fontSize: 12,
    fontWeight: '600',
  },

  // Updated Hydration Styles
  changeGoalButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeGoalText: {
    color: '#4FC3F7',
    fontSize: 14,
    fontWeight: '600',
  },
  dropletsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 8,
  },

  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  hydrationModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  goalOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  goalOption: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '30%',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalOptionSelected: {
    backgroundColor: '#4FC3F7',
    borderColor: '#4FC3F7',
  },
  goalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  goalOptionTextSelected: {
    color: '#000',
  },
  goalOptionSubtext: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },
  goalOptionSubtextSelected: {
    color: '#000',
  },
  modalButtons: {
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#333',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalCancelText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
});
