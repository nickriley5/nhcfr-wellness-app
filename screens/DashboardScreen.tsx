// screens/DashboardScreen.tsx
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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
import MacroCard from '../components/mealplan/MacroCard'; // ✅ fixed path
import MealLoggingModal, { MealContext } from '../components/mealplan/MealLoggingModal';
import DescribeMealModal from '../components/mealplan/DescribeMealModal';
import CameraModal from '../components/mealplan/CameraModal';
import QuickFavoritesModal from '../components/mealplan/QuickFavorites';
import EnvironmentCalendarModal from '../components/EnvironmentCalendarModal';
import { useDashboardData } from '../hooks/useDashboardData';
import { auth, db } from '../firebase';
import { doc, deleteDoc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

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
  } = useDashboardData(view, bump); // ✅ removed unused currentWeight/exerciseLibrary

  useFocusEffect(
    React.useCallback(() => {
      setBump((b) => b + 1);
      return () => {};
    }, [])
  );

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

            // Find today's position in the workout week
            const todayWorkoutIndex = workoutDaysThisWeek.indexOf(todayKey);

            if (todayWorkoutIndex >= 0 && todayInfo?.day) {
              currentDayName = todayInfo.day.title || `Day ${todayInfo.dayIdx + 1}`;
            } else if (todayWorkoutIndex >= 0) {
              currentDayName = `Workout Day ${todayWorkoutIndex + 1}`;
            } else {
              currentDayName = 'Workout Day';
            }
          } else {
            currentDayName = 'Rest Day';
          }
        }

        setProgramInfo({
          daysPerWeek,
          hasSchedule,
          currentDayName,
          isRestDay,
        });

        // ✅ Check for today's completed workout
        await checkTodayWorkoutCompletion(uid, todayInfo);
      } catch (error) {
        console.error('Error loading program info:', error);
      }
    };

    // ✅ Function to check if today's workout was completed
    const checkTodayWorkoutCompletion = async (uid: string, _currentTodayInfo: any) => {
      try {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

        // Query today's workout logs
        const workoutLogsQuery = query(
          collection(db, `users/${uid}/workoutLogs`),
          where('completedAt', '>=', todayStart),
          where('completedAt', '<', todayEnd),
          orderBy('completedAt', 'desc'),
          limit(1)
        );

        const querySnapshot = await getDocs(workoutLogsQuery);

        if (!querySnapshot.empty) {
          const logDoc = querySnapshot.docs[0];
          const logData = logDoc.data();

          // Calculate summary stats
          const elapsedSec = logData.elapsedSec || 0;
          const totalTime = fmtTime(elapsedSec);
          const setsCompleted = logData.exercises?.reduce((total: number, ex: any) =>
            total + (ex.sets?.filter((set: any) => set.reps || set.weight).length || 0), 0) || 0;
          const setsPlanned = logData.exercises?.reduce((total: number, ex: any) =>
            total + (ex.sets?.length || 0), 0) || 0;

          // Check for PRs (simple detection from weight data)
          const prMessages: string[] = [];
          if (logData.exercises) {
            const exercisePRs: Record<string, number> = {};
            logData.exercises.forEach((ex: any) => {
              ex.sets?.forEach((set: any) => {
                const weight = Number(set.weight);
                if (!isNaN(weight) && weight > 0) {
                  exercisePRs[ex.id] = Math.max(exercisePRs[ex.id] || 0, weight);
                }
              });
            });

            Object.entries(exercisePRs).forEach(([exerciseId, weight]) => {
              if (weight > 0) {
                prMessages.push(`${exerciseId}: ${weight} lbs`);
              }
            });
          }

          setTodayWorkoutSummary({
            isCompleted: true,
            dayTitle: logData.dayTitle || 'Workout',
            totalTime,
            setsCompleted,
            setsPlanned,
            completedAt: logData.completedAt.toDate(),
            prMessages: prMessages.slice(0, 3), // Limit to top 3 PRs
          });
        } else {
          setTodayWorkoutSummary(null);
        }
      } catch (error) {
        console.error('Error checking workout completion:', error);
        setTodayWorkoutSummary(null);
      }
    };

    if (programExists) {
      loadProgramInfo();
    }
  }, [programExists, todayInfo, bump]);

  // Helper function to format time (copied from WorkoutDetailScreen)
  const fmtTime = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Permission Request Failed',
        text2: `${err}`,
        position: 'bottom',
        visibilityTime: 4000,
      });
      return false;
    }
  };

  // ✅ Camera + gallery handlers
  const handleOpenCamera = (mealContext: MealContext) => {
    setCurrentMealContext(mealContext);
    Alert.alert('Add Meal Photo', 'How would you like to add a photo?', [
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
        <Text style={styles.header}>Your Dashboard</Text>
        <Text style={styles.subheader}>Train for duty. Fuel for life. 🔥</Text>

        <ProfileCompletionBanner
          percent={completionPercent}
          pulseAnim={pulseAnim}
          onPress={() => navigation.navigate('Profile')}
        />

        {/* Today’s Workout */}
        <View style={styles.tile}>
          <Text style={styles.tileHeader}>Today’s Workout</Text>
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
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </Text>

                  <View style={styles.summaryStats}>
                    <View style={styles.statBlock}>
                      <Text style={styles.statNumber}>{todayWorkoutSummary.totalTime}</Text>
                      <Text style={styles.statLabel}>Total Time</Text>
                    </View>
                    <View style={styles.statBlock}>
                      <Text style={styles.statNumber}>
                        {todayWorkoutSummary.setsCompleted}/{todayWorkoutSummary.setsPlanned}
                      </Text>
                      <Text style={styles.statLabel}>Sets</Text>
                    </View>
                    {todayWorkoutSummary.prMessages.length > 0 && (
                      <View style={styles.statBlock}>
                        <Text style={styles.statNumber}>🔥</Text>
                        <Text style={styles.statLabel}>PRs</Text>
                      </View>
                    )}
                  </View>

                  {todayWorkoutSummary.prMessages.length > 0 && (
                    <View style={styles.prSection}>
                      <Text style={styles.prTitle}>🔥 New PRs Today:</Text>
                      {todayWorkoutSummary.prMessages.map((pr, idx) => (
                        <Text key={idx} style={styles.prText}>• {pr}</Text>
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
                    <Text style={styles.linkText}>View All Workouts</Text>
                  </Pressable>
                </>
              ) : todayInfo?.day ? (
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
                        .getParent<NativeStackNavigationProp<RootStackParamList>>() // ✅ parent stack navigate
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
                      style={[styles.btn, styles.btnPrimary]}
                      onPress={() => navigation.navigate('AdaptWorkout')}
                    >
                      <Text style={styles.btnPrimaryText}>Browse Workouts</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </>
          ) : programExists && todayInfo?.day ? (
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
                    .getParent<NativeStackNavigationProp<RootStackParamList>>() // ✅ parent stack navigate
                    ?.navigate('WorkoutHistory')
                }
              >
                <Text style={styles.linkText}>View History</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.mutedText}>No active program.</Text>
              <Text style={styles.helperText}>
                Pick a prebuilt plan to get started.
              </Text>
              <Pressable
                style={[styles.btn, styles.btnPrimary]}
                onPress={() =>
                  navigation
                    .getParent<NativeStackNavigationProp<RootStackParamList>>()
                    ?.navigate('ProgramList')
                }
              >
                <Text style={styles.btnPrimaryText}>Browse Programs</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* Readiness */}
        <View style={styles.tile}>
          <Text style={styles.tileHeader}>Readiness</Text>
          {hasCheckedInToday ? (
            <Text style={styles.mutedText}>
              Ready to roll. Keep the streak going.
            </Text>
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

        {/* Mood & Energy Trends */}
        <MoodEnergySection
          view={view}
          moodData={moodData}
          energyData={energyData}
          onViewChange={setView}
        />

        {/* Macro Snapshot — uses MacroCard to match Meal Plan */}
        <View style={styles.tile}>
          <View style={styles.tileHeaderRow}>
            <Text style={styles.tileHeader}>Macro Snapshot</Text>
            <Pressable
              style={styles.logFoodButton}
              onPress={() => setShowMealLoggingModal(true)}
            >
              <Ionicons name="add" size={20} color="#0b0f14" />
            </Pressable>
          </View>
          {macrosToday.hasMeals || macrosToday.calories.goal != null ? (
            <>
              <Text style={styles.macroRemaining}>
                Remaining:{' '}
                {macrosToday.calories.remaining != null
                  ? `${macrosToday.calories.remaining.toFixed(0)} kcal`
                  : '—'}
              </Text>

              <View style={styles.macroGrid}>
                <MacroCard
                  label="Calories"
                  logged={macrosToday.calories.eaten}
                  target={macrosToday.calories.goal ?? 0}
                  unit="kcal"
                  variant="calories"
                />
                <MacroCard
                  label="Protein"
                  logged={macrosToday.protein.eaten}
                  target={macrosToday.protein.goal ?? 0}
                  unit="g"
                  variant="protein"
                />
                <MacroCard
                  label="Carbs"
                  logged={macrosToday.carbs.eaten}
                  target={macrosToday.carbs.goal ?? 0}
                  unit="g"
                  variant="carb"
                />
                <MacroCard
                  label="Fat"
                  logged={macrosToday.fat.eaten}
                  target={macrosToday.fat.goal ?? 0}
                  unit="g"
                  variant="fat"
                />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.mutedText}>No meals logged yet.</Text>
              <Text style={styles.helperText}>
                Log a meal to see Remaining • Eaten / Goal for today.
              </Text>
              <Pressable
                style={[styles.btn, styles.btnSecondary]}
                onPress={() =>
                  navigation
                    .getParent<NativeStackNavigationProp<RootStackParamList>>()
                    ?.navigate('MainTabs', { screen: 'MealPlan' })
                }
              >
                <Text style={styles.btnSecondaryText}>Log Food</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* Dev helper */}
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

      {/* ✅ All Meal Logging Modals */}
      <MealLoggingModal
        visible={showMealLoggingModal}
        onClose={() => setShowMealLoggingModal(false)}
        onOpenDescribeModal={handleOpenDescribeModal}
        onOpenQuickAdd={handleOpenQuickAdd}
        onOpenCamera={handleOpenCamera}
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
  content: { padding: 24, alignItems: 'center' },

  header: { fontSize: 26, fontWeight: '700', color: '#d32f2f', marginBottom: 4 },
  subheader: { fontSize: 16, color: '#ccc', marginBottom: 16 },

  tile: {
    width: '100%',
    backgroundColor: '#0c151f',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#152436',
  },
  tileHeader: {
    color: '#e6edf3',
    fontWeight: '700',
    marginBottom: 8,
    fontSize: 16,
  },
  tileHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logFoodButton: {
    backgroundColor: '#33d6a6',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  workoutTitle: { color: '#e6edf3', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  workoutMeta: { color: '#8ea0b6', fontSize: 12, marginBottom: 10 },

  rowButtons: { flexDirection: 'row', gap: 10 },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  btnPrimary: { backgroundColor: '#33d6a6', borderColor: '#33d6a6' },
  btnPrimaryText: { color: '#0b0f14', fontWeight: '700' },
  btnSecondary: { borderColor: '#2a3a52' },
  btnSecondaryText: { color: '#c2cfdd', fontWeight: '600' },

  linkWrap: { marginTop: 10 },
  linkText: { color: '#8ea0b6', textDecorationLine: 'underline', fontSize: 12 },

  mutedText: { color: '#8ea0b6' },
  helperText: { color: '#c2cfdd', marginTop: 4 },

  macroRemaining: { color: '#e6edf3', fontWeight: '700', marginBottom: 8 },
  macroGrid: {
    marginTop: 4,
    rowGap: 10,
    columnGap: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  devSection: { marginTop: 12, width: '100%' },
  devLabel: { color: '#aaa', fontSize: 12, marginBottom: 6 },
  resetProgramText: { color: '#ff6b6b', textDecorationLine: 'underline' },

  // ✅ Workout Summary Styles
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 12,
    backgroundColor: '#1a2332',
    borderRadius: 12,
  },
  statBlock: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#33d6a6',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#8ea0b6',
    textAlign: 'center',
  },
  prSection: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#2a1f1f',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#ff6b47',
  },
  prTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff6b47',
    marginBottom: 4,
  },
  prText: {
    fontSize: 12,
    color: '#ffb3a6',
    marginBottom: 2,
  },
});
