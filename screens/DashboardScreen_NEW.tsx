// screens/DashboardScreen_NEW.tsx
import React, { useState, useEffect } from 'react';
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
import MoodEnergyChart from '../components/MoodEnergyChart';
import WeightTrackingCard from '../components/Dashboard/WeightTrackingCard';
import MacroCard from '../components/mealplan/MacroCard';
import MealLoggingModal, { MealContext } from '../components/mealplan/MealLoggingModal';
import DescribeMealModal from '../components/mealplan/DescribeMealModal';
import CameraModal from '../components/mealplan/CameraModal';
import QuickFavoritesModal from '../components/mealplan/QuickFavorites';
import EnvironmentCalendarModal from '../components/EnvironmentCalendarModal';
import { useDashboardData } from '../hooks/useDashboardData';
import { auth, db } from '../firebase';
import { doc, deleteDoc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';

const { width: screenWidth } = Dimensions.get('window');
const SECTION_WIDTH = screenWidth - 32; // Account for padding

export default function DashboardScreen_NEW() {
  const navigation = useNavigation<
    CompositeNavigationProp<
      BottomTabNavigationProp<TabParamList, 'Dashboard'>,
      NativeStackNavigationProp<RootStackParamList>
    >
  >();

  const [view, _setView] = useState<'week' | 'month' | 'all'>('week');
  const [pulseAnim] = useState(new Animated.Value(1));
  const [bump, setBump] = useState(0);

  // NEW: Wellness tracking states
  const [hydrationToday, _setHydrationToday] = useState({ currentOz: 0, goalOz: 64 });
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

  // ✅ CAMERA & PHOTO STATES
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);

  // ✅ MEAL CONTEXT STATE
  const [currentMealContext, setCurrentMealContext] = useState<MealContext | null>(null);
  const [initialDescribeQuery, setInitialDescribeQuery] = useState<string>('');

  // ✅ PROGRAM INFO STATE
  const [programInfo, setProgramInfo] = useState<{
    daysPerWeek: number;
    hasSchedule: boolean;
    currentDayName: string;
    isRestDay: boolean;
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

        if (hasSchedule && profile.schedule.environmentMap[todayKey]) {
          const todayEnvironment = profile.schedule.environmentMap[todayKey];
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
        });
      } catch (error) {
        console.error('Error loading program info:', error);
        setProgramInfo(null);
      }
    };

    loadProgramInfo();
  }, [bump]);

  // ✅ Load today's workout completion status
  useEffect(() => {
    const loadWorkoutSummary = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {return;}

      try {
        const today = new Date().toISOString().split('T')[0];
        const completedWorkoutsQuery = query(
          collection(db, 'users', uid, 'completedWorkouts'),
          where('date', '==', today),
          limit(1)
        );

        const snapshot = await getDocs(completedWorkoutsQuery);
        if (!snapshot.empty) {
          // If multiple workouts today, get the most recent by comparing completedAt
          let mostRecentWorkout = snapshot.docs[0].data();
          let mostRecentTime = mostRecentWorkout.completedAt?.toDate() || new Date(0);

          snapshot.docs.forEach(docRef => {
            const workoutData = docRef.data();
            const completedAt = workoutData.completedAt?.toDate() || new Date(0);
            if (completedAt > mostRecentTime) {
              mostRecentWorkout = workoutData;
              mostRecentTime = completedAt;
            }
          });

          const workoutData = mostRecentWorkout;
          const prMessages = [];

          // Check for PRs
          if (workoutData.exercises) {
            for (const exercise of workoutData.exercises) {
              if (exercise.sets) {
                for (const set of exercise.sets) {
                  if (set.isPR) {
                    prMessages.push(`🔥 PR: ${exercise.name} - ${set.weight}lbs x ${set.reps}`);
                  }
                }
              }
            }
          }

          setTodayWorkoutSummary({
            isCompleted: true,
            dayTitle: workoutData.dayTitle || 'Workout',
            totalTime: workoutData.totalTime || '0 min',
            setsCompleted: workoutData.setsCompleted || 0,
            setsPlanned: workoutData.setsPlanned || 0,
            completedAt: workoutData.completedAt?.toDate() || new Date(),
            prMessages,
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
            contentContainerStyle={styles.horizontalContent}
          >
            {/* Readiness Card */}
            <View style={styles.horizontalCard}>
              <Text style={styles.tileHeader}>Readiness</Text>
              {hasCheckedInToday ? (
                <>
                  {readinessScore > 0 ? (
                    <>
                      <View style={styles.readinessDisplay}>
                        <Text style={[styles.readinessScore, { color: getReadinessColor(readinessScore) }]}>
                          {readinessScore.toFixed(1)}/5.0
                        </Text>
                        <Text style={[styles.readinessLevel, { color: getReadinessColor(readinessScore) }]}>
                          {getReadinessLevel(readinessScore)}
                        </Text>
                      </View>
                      <Text style={styles.readinessMessage}>
                        {getReadinessMessage(readinessScore)}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.mutedText}>
                      Ready to roll. Keep the streak going.
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.mutedText}>No check-in today.</Text>
                  <Text style={styles.helperText}>
                    Log mood & energy to populate readiness.
                  </Text>
                  <Pressable
                    style={[styles.btn, styles.btnPrimary]}
                    onPress={() => navigation.navigate('CheckIn')}
                  >
                    <Text style={styles.btnPrimaryText}>Check-In</Text>
                  </Pressable>
                </>
              )}
            </View>

            {/* Mood & Energy Chart */}
            <View style={styles.horizontalCard}>
              <MoodEnergyChart
                moodData={moodData}
                energyData={energyData}
              />
            </View>
          </ScrollView>
        </View>

        {/* SECTION 2: Today's Training */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>💪 Today's Training</Text>
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
                      <Text style={styles.workoutTitle}>Rest Day</Text>
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
                  ) : todayInfo ? (
                    <>
                      <Text style={styles.workoutTitle}>
                        {todayInfo.day.title ?? 'Workout'}
                      </Text>
                      <Text style={styles.workoutMeta}>
                        {summarizeMains(todayInfo.day)} • {countSets(todayInfo.day)} sets • ~
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

            {/* Training Performance Card - Placeholder */}
            <View style={styles.horizontalCard}>
              <Text style={styles.tileHeader}>Performance</Text>
              <Text style={styles.mutedText}>Track your progress</Text>
              <Text style={styles.helperText}>View detailed analytics</Text>
              <Pressable
                style={[styles.btn, styles.btnSecondary]}
                onPress={() => navigation.navigate('ProgressChart', { exerciseName: 'Overview' })}
              >
                <Text style={styles.btnSecondaryText}>View Charts</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>

        {/* SECTION 3: Progress & Nutrition */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>📊 Progress & Nutrition</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
            contentContainerStyle={styles.horizontalContent}
          >
            {/* Macro Cards Grid */}
            <View style={styles.horizontalCard}>
              <View style={styles.macroHeader}>
                <Text style={styles.tileHeader}>Today's Macros</Text>
                <Pressable
                  style={styles.logFoodButton}
                  onPress={() => setShowMealLoggingModal(true)}
                >
                  <Text style={styles.logFoodButtonText}>+ Log Food</Text>
                </Pressable>
              </View>

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
            </View>

            {/* Weight Tracking */}
            <View style={styles.horizontalCard}>
              <WeightTrackingCard
                onWeightUpdated={() => setBump((b) => b + 1)}
              />
            </View>

            {/* Charts Card */}
            <View style={styles.horizontalCard}>
              <Text style={styles.tileHeader}>Progress Charts</Text>
              <Text style={styles.mutedText}>View detailed analytics</Text>
              <Text style={styles.helperText}>Mood, energy, weight, performance trends</Text>
              <Pressable
                style={[styles.btn, styles.btnSecondary]}
                onPress={() => navigation.navigate('ProgressChart', { exerciseName: 'Overview' })}
              >
                <Text style={styles.btnSecondaryText}>View All Charts</Text>
              </Pressable>
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
});
