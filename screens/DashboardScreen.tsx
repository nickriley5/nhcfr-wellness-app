// screens/DashboardScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  ScrollView,
  Animated,
  View,
  Alert,
  Pressable,
  Platform,
  PermissionsAndroid,
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
import WeightTrackingCard, { WeightTrackingCardRef } from '../components/Dashboard/WeightTrackingCard';
import TodaysReadinessCard from '../components/Dashboard/TodaysReadinessCard';
import TodaysWorkoutCard from '../components/Dashboard/TodaysWorkoutCard';
import { DedicationCard } from '../components/Dashboard/DedicationCard';
import { ComingUpCard } from '../components/Dashboard/ComingUpCard';
import { TodaysNutritionCard } from '../components/Dashboard/TodaysNutritionCard';
import MealLoggingModal, { MealContext } from '../components/mealplan/MealLoggingModal';
import DescribeMealModal from '../components/mealplan/DescribeMealModal';
import CameraModal from '../components/mealplan/CameraModal';
import QuickFavoritesModal from '../components/mealplan/QuickFavorites';
import EnvironmentCalendarModal from '../components/EnvironmentCalendarModal';
import HydrationSettingsModal from '../components/Modals/HydrationSettingsModal';
import { useDashboardData } from '../hooks/useDashboardData';
import { useDashboardState } from '../hooks/useDashboardState';
import { auth, db } from '../firebase';
import { doc, deleteDoc, getDoc, collection, query, where, limit, getDocs, orderBy, setDoc, updateDoc } from 'firebase/firestore';
import { dashboardStyles } from '../styles/DashboardScreen.styles';

export default function DashboardScreen() {
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
  const [sleepLastNight, _setSleepLastNight] = useState({ hours: 0, quality: 0 });
  const [readinessScore, setReadinessScore] = useState(0);
  const [_nextShift, _setNextShift] = useState<Date | null>(null);
  const [_showGlobalCalendar, _setShowGlobalCalendar] = useState(false);

  // Use custom hook for dashboard state management
  const {
    hydrationToday,
    setHydrationToday,
    programInfo,
    tomorrowInfo,
    todayWorkoutSummary,
    consistencyData,
    updateHydrationGoal,
    updateContainerSize,
    addHydration,
  } = useDashboardState(bump, programExists);

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

  // ✅ PROGRAM INFO STATE - Now handled by useDashboardState hook

  const weightTrackingRef = useRef<WeightTrackingCardRef>(null);

  // ✅ WORKOUT COMPLETION STATE - Now handled by useDashboardState hook

  // ✅ STREAK & CONSISTENCY STATE - Now handled by useDashboardState hook

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
            containerOz: data.containerOz || 16,
          });
        } else {
          // Load user's default goal from profile
          const profileDoc = await getDoc(doc(db, 'users', uid));
          const defaultGoal = profileDoc.exists() ? profileDoc.data().hydrationGoalOz || 64 : 64;
          const defaultContainer = profileDoc.exists() ? profileDoc.data().hydrationContainerOz || 16 : 16;
          setHydrationToday({ currentOz: 0, goalOz: defaultGoal, containerOz: defaultContainer });
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

  const updateContainerSize = async (newContainerOz: number) => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      return;
    }

    try {
      // Save as default in profile
      await updateDoc(doc(db, 'users', uid), {
        hydrationContainerOz: newContainerOz,
      });

      setHydrationToday(prev => ({ ...prev, containerOz: newContainerOz }));
    } catch (error) {
      console.error('Error updating container size:', error);
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

  // ✅ Camera permission handler
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
    <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={dashboardStyles.screen}>
      <ScrollView contentContainerStyle={dashboardStyles.content}>
        {/* Header with Calendar Button */}
        <View style={dashboardStyles.headerRow}>
          <View style={dashboardStyles.headerContent}>
            <Text style={dashboardStyles.header}>Your Dashboard</Text>
            <Text style={dashboardStyles.subheader}>Train for duty. Fuel for life. 🔥</Text>
          </View>
          <Pressable
            style={dashboardStyles.calendarButton}
            onPress={() => console.log('Calendar pressed')} // Placeholder for now
          >
            <Text style={dashboardStyles.calendarIcon}>📅</Text>
          </Pressable>
        </View>

        <ProfileCompletionBanner
          percent={completionPercent}
          pulseAnim={pulseAnim}
          onPress={() => navigation.navigate('Profile')}
        />

        {/* SECTION 1: Wellness & Readiness */}
        <View style={dashboardStyles.sectionContainer}>
          <Text style={dashboardStyles.sectionTitle}>🔥 Wellness & Readiness</Text>

          {/* Unified Readiness + Trends Card */}
          <TodaysReadinessCard
            hasCheckedInToday={hasCheckedInToday}
            readinessScore={readinessScore}
            moodData={moodData}
            energyData={energyData}
            view={view}
            onViewChange={setView}
            navigation={navigation}
            getReadinessColor={getReadinessColor}
            getReadinessLevel={getReadinessLevel}
            getReadinessMessage={getReadinessMessage}
          />
        </View>

        {/* SECTION 2: Today's Training */}
        <View style={dashboardStyles.sectionContainer}>
          <Text style={dashboardStyles.sectionTitle}>Training</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={dashboardStyles.horizontalScroll}
            contentContainerStyle={dashboardStyles.horizontalContent}
          >
            {/* Today's Workout */}
            <TodaysWorkoutCard
              programExists={programExists}
              programInfo={programInfo}
              todayWorkoutSummary={todayWorkoutSummary}
              todayInfo={todayInfo}
              navigation={navigation}
              setShowEnvironmentCalendar={setShowEnvironmentCalendar}
              getEnvironmentIcon={getEnvironmentIcon}
              getEnvironmentLabel={getEnvironmentLabel}
              summarizeMains={summarizeMains}
              countSets={countSets}
              estimateTime={estimateTime}
            />

            {/* Streak & Achievements Card */}
            <DedicationCard consistencyData={consistencyData} />

            {/* Enhanced Coming Up Preview */}
            <ComingUpCard
              tomorrowInfo={tomorrowInfo}
              navigation={navigation}
              getEnvironmentIcon={getEnvironmentIcon}
              getEnvironmentLabel={getEnvironmentLabel}
              summarizeMains={summarizeMains}
              countSets={countSets}
              estimateTime={estimateTime}
            />
          </ScrollView>
        </View>

        {/* SECTION 3: Progress & Nutrition */}
        <View style={dashboardStyles.sectionContainer}>
          <Text style={dashboardStyles.sectionTitle}>Nutrition & Weight</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={dashboardStyles.horizontalScroll}
            contentContainerStyle={dashboardStyles.horizontalContent}
          >
            {/* Macro Cards Grid */}
            <TodaysNutritionCard
              macrosToday={macrosToday}
              hydrationToday={hydrationToday}
              setShowMealLoggingModal={setShowMealLoggingModal}
              setShowHydrationGoalModal={setShowHydrationGoalModal}
              addHydration={addHydration}
            />

            {/* Weight Tracking */}
            <View style={dashboardStyles.horizontalCard}>
              <WeightTrackingCard
                ref={weightTrackingRef}
                onWeightUpdated={() => setBump((b) => b + 1)}
              />

              {/* Enhanced Footer Section */}
              <View style={dashboardStyles.weightTrackingFooter}>
                <Pressable
                  style={[dashboardStyles.btn, dashboardStyles.btnWeightLog]}
                  onPress={() => {
                    weightTrackingRef.current?.openWeightModal();
                  }}
                >
                  <Text style={dashboardStyles.btnWeightLogText}>Log Weight</Text>
                </Pressable>

                <View style={dashboardStyles.weeklyAverageContainer}>
                  <Text style={dashboardStyles.weeklyAverageLabel}>7-Day Average</Text>
                  <Text style={dashboardStyles.weeklyAverageValue}>{getWeeklyAverage()} lbs</Text>
                  <Text style={dashboardStyles.weeklyAverageChange}>
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
          <View style={dashboardStyles.devSection}>
            <Text style={dashboardStyles.devLabel}>DEV: Reset today's workout</Text>
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
              <Text style={dashboardStyles.resetProgramText}>Reset Today's Workout</Text>
            </Pressable>
          </View>
        )}

        {/* DEV: Reset program */}
        {__DEV__ && (
          <View style={dashboardStyles.devSection}>
            <Text style={dashboardStyles.devLabel}>Dev</Text>
            <Pressable
              onPress={async () => {
                const uid = auth.currentUser?.uid;
                if (!uid) {return;}
                await deleteDoc(doc(db, 'users', uid, 'program', 'active'));
                Alert.alert('Program', 'Active program reset.');
                setBump((b) => b + 1);
              }}
            >
              <Text style={dashboardStyles.resetProgramText}>Reset Active Program</Text>
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

      {/* Hydration Settings Modal */}
      <HydrationSettingsModal
        visible={showHydrationGoalModal}
        onClose={() => setShowHydrationGoalModal(false)}
        hydrationToday={hydrationToday}
        updateHydrationGoal={updateHydrationGoal}
        updateContainerSize={updateContainerSize}
      />
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
  return all.reduce((acc, ex) => acc + (typeof ex?.sets === 'number' ? ex.sets : 1), 0);
}

function summarizeMains(day: any) {
  const mains = (day?.exercises || []).slice(0, 3).map((x: any) => x?.name).filter(Boolean);
  return mains.length ? mains.join(' • ') : '—';
}
