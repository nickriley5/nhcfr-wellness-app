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
  Modal,
  TouchableOpacity,
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
import AsyncStorage from '@react-native-async-storage/async-storage';

import { TabParamList, RootStackParamList } from '../App';
import ProfileCompletionBanner from '../components/Profile/ProfileCompletionBanner';
import { WeightTrackingTile } from '../components/Dashboard/WeightTrackingTile';
// import TodaysReadinessCard from '../components/Dashboard/TodaysReadinessCard'; // COMMENTED OUT FOR PHASE 2
import TodaysWorkoutCard from '../components/Dashboard/TodaysWorkoutCard';
import TodaysCardioCard from '../components/Dashboard/TodaysCardioCard';
import { CoachRecommendationBanner } from '../components/Dashboard/CoachRecommendationBanner';
import { WeeklyProgressionCard } from '../components/Dashboard/WeeklyProgressionCard';
import { DailyCheckInCard } from '../components/Dashboard/DailyCheckInCard';

import { ComingUpCard } from '../components/Dashboard/ComingUpCard';
import { TodaysNutritionCard } from '../components/Dashboard/TodaysNutritionCard';
import MealLoggingModal, { MealContext } from '../components/mealplan/MealLoggingModal';
import DescribeMealModal from '../components/mealplan/DescribeMealModal';
import QuickFavoritesModal from '../components/mealplan/QuickFavorites';
import EnvironmentCalendarModal from '../components/EnvironmentCalendarModal';
import HydrationSettingsModal from '../components/Modals/HydrationSettingsModal';
import { useDashboardData } from '../hooks/useDashboardData';
import { useDashboardState } from '../hooks/useDashboardState';
import { dashboardStyles } from '../styles/DashboardScreen.styles';
import { analyzeTrainingReadiness } from '../utils/ai/aiService';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { getApp } from 'firebase/app';

const logSafeError = (label: string, err: unknown) => {
  if (err instanceof Error) {
    console.error(label, err.message);
    return;
  }
  try {
    console.error(label, JSON.parse(JSON.stringify(err)));
  } catch {
    console.error(label, String(err));
  }
};

export default function DashboardScreen() {
  const navigation = useNavigation<
    CompositeNavigationProp<
      BottomTabNavigationProp<TabParamList, 'Dashboard'>,
      NativeStackNavigationProp<RootStackParamList>
    >
  >();

  const [view, _setView] = useState<'week' | 'month' | 'all'>('week'); // UNUSED - FOR PHASE 2
  const [pulseAnim] = useState(new Animated.Value(1));
  const [bump, setBump] = useState(0);

  // NEW: Wellness tracking states - COMMENTED OUT FOR PHASE 2
  const [_sleepLastNight, _setSleepLastNight] = useState({ hours: 0, quality: 0 }); // UNUSED - FOR PHASE 2
  const [_readinessScore, _setReadinessScore] = useState(0); // UNUSED - FOR PHASE 2
  const [_nextShift, _setNextShift] = useState<Date | null>(null);
  const [_showGlobalCalendar, _setShowGlobalCalendar] = useState(false);

  // Use custom hooks for dashboard data
  const {
    // moodData, energyData, hasCheckedInToday - COMMENTED OUT FOR PHASE 2
    completionPercent,
    programExists,
    todayInfo,
    aiWorkoutInfo,
    macrosToday,
  } = useDashboardData(view, bump);

  // Debug logging for AI program detection
  useEffect(() => {
    console.log('📊 Dashboard Data:', {
      programExists,
      hasTodayInfo: !!todayInfo,
      hasAiWorkoutInfo: !!aiWorkoutInfo,
      todayInfoTitle: todayInfo?.day?.title,
    });
  }, [programExists, todayInfo, aiWorkoutInfo]);

  // Start pulsing animation for incomplete profile
  useEffect(() => {
    if (completionPercent < 80) {
      const startPulse = () => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      };
      startPulse();
    } else {
      // Stop animation when profile is complete
      pulseAnim.setValue(1);
    }
  }, [completionPercent, pulseAnim]);

  const {
    hydrationToday,
    programInfo,
    tomorrowInfo,
    todayWorkoutSummary,
    todayCardioSummary,
    cardioScheduleInfo,
    consistencyData,
    updateHydrationGoal,
    updateContainerSize,
    addHydration,
  } = useDashboardState(bump, programExists);

  // ✅ MODAL STATES
  const [showMealLoggingModal, setShowMealLoggingModal] = useState(false);
  const [showDescribeModal, setShowDescribeModal] = useState(false);
  const [showQuickFavoritesModal, setShowQuickFavoritesModal] = useState(false);
  const [showEnvironmentCalendar, setShowEnvironmentCalendar] = useState(false);
  const [showHydrationGoalModal, setShowHydrationGoalModal] = useState(false);
  const [showLightWorkoutModal, setShowLightWorkoutModal] = useState(false);

  // ✅ CAMERA & PHOTO STATES
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);

  // ✅ COACH RECOMMENDATION STATES
  const [coachRecommendation, setCoachRecommendation] = useState<{
    shouldTrain: boolean;
    recommendation: 'train' | 'light' | 'rest';
    severity: 'none' | 'minor' | 'moderate' | 'severe';
    coachMessage: string;
    reasoning: string;
    adjustedIntensity?: number;
  } | null>(null);
  const [showCoachBanner, setShowCoachBanner] = useState(false);
  const [isAnalyzingReadiness, setIsAnalyzingReadiness] = useState(false);
  const [hasAnalyzedToday, setHasAnalyzedToday] = useState(false);
  const readinessAnalysisInFlightRef = useRef(false);

  // ✅ WEEKLY PROGRESSION STATES
  const [weeklyProgression, setWeeklyProgression] = useState<{
    weekNumber: number;
    coachMessage: string;
    summary: string;
    changes: Array<{
      exercise: string;
      dayNumber: number;
      change: 'increase' | 'maintain' | 'decrease';
      oldWeight?: number;
      newWeight?: number;
      oldReps?: string;
      newReps?: string;
      reason: string;
    }>;
  } | null>(null);
  const [showProgressionCard, setShowProgressionCard] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

  // ✅ MEAL CONTEXT STATE
  const [currentMealContext, setCurrentMealContext] = useState<MealContext | null>(null);
  const [initialDescribeQuery, setInitialDescribeQuery] = useState<string>('');

  useFocusEffect(
    React.useCallback(() => {
      setBump((b: number) => b + 1);
      return () => {};
    }, [])
  );

  // COMMENTED OUT FOR PHASE 2 - Readiness calculation will be replaced with wearable integration
  /*
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
  */

  // COMMENTED OUT FOR PHASE 2 - Readiness helper functions will be replaced with wearable integration
  /*
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
  */

  // ✅ NEW: AI-Powered Readiness Analysis
  // Only runs once per day after user checks in
  useEffect(() => {
    const checkTodaysReadiness = async () => {
      const auth = getAuth(getApp());
      const db = getFirestore(getApp());
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      try {
        // First, check if user has checked in today (regardless of AI analysis)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const checkInsQuery = query(
          collection(db, 'users', uid, 'checkIns'),
          where('timestamp', '>=', todayStart),
          orderBy('timestamp', 'desc'),
          limit(1)
        );

        const checkInSnapshot = await getDocs(checkInsQuery);
        const hasCheckedIn = !checkInSnapshot.empty;
        setHasCheckedInToday(hasCheckedIn);

        if (!hasCheckedIn) {
          // No check-in today, done
          return;
        }

        // Check if we've already analyzed today
        const today = new Date().toDateString();
        const lastAnalyzed = await AsyncStorage.getItem(`lastAIAnalysis_${uid}`);
        
        if (lastAnalyzed === today) {
          console.log('⏭️ AI analysis already completed today');
          return;
        }

        // Don't analyze if currently in progress (state + sync ref guard)
        if (isAnalyzingReadiness || readinessAnalysisInFlightRef.current) {
          console.log('⏭️ AI analysis already in progress');
          return;
        }

        // Mark as analyzing IMMEDIATELY to prevent duplicate calls
        readinessAnalysisInFlightRef.current = true;
        setIsAnalyzingReadiness(true);

        const checkInData = checkInSnapshot.docs[0].data();
        
        // Only trigger analysis if there are concerning flags
        const shouldAnalyze = 
          checkInData.energy <= 2 ||
          checkInData.sleepHours < 6 ||
          checkInData.soreness >= 4 ||
          checkInData.readiness <= 2 ||
          checkInData.stress >= 4 ||
          (checkInData.onShift && checkInData.callVolume >= 4);

        if (!shouldAnalyze) {
          // User is in good condition, no need for AI analysis
          console.log('✅ Check-in looks good - skipping AI analysis');
          setIsAnalyzingReadiness(false);
          await AsyncStorage.setItem(`lastAIAnalysis_${uid}`, today); // Mark as done
          return;
        }

        console.log('🔍 Running AI readiness analysis...');

        // Fetch recent workout history (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const workoutsQuery = query(
          collection(db, 'users', uid, 'workoutHistory'),
          where('completedAt', '>=', sevenDaysAgo),
          orderBy('completedAt', 'desc')
        );

        const workoutsSnapshot = await getDocs(workoutsQuery);
        const recentWorkouts = workoutsSnapshot.docs.map(doc => ({
          date: doc.data().completedAt,
          exercises: doc.data().exercises || [],
          feeling: doc.data().feeling,
          completed: doc.data().completed || true,
        }));

        // Get program context if available
        const programContext = programInfo ? {
          currentWeek: (programInfo as any).currentWeek || 1,
          totalWeeks: (programInfo as any).totalWeeks || 12,
          phase: (programInfo as any).phase || 'Training',
          isDeloadWeek: (programInfo as any).isDeloadWeek || false,
        } : undefined;

        // Run AI analysis
        const analysis = await analyzeTrainingReadiness(
          checkInData as any,
          recentWorkouts,
          programContext
        );

        setCoachRecommendation(analysis);
        setShowCoachBanner(true);
        await AsyncStorage.setItem(`lastAIAnalysis_${uid}`, today); // Mark as done

        console.log('🤖 AI Readiness Analysis:', analysis);
      } catch (error) {
        logSafeError('❌ Error analyzing readiness:', error);
        // Don't mark as done on error so it can retry next time
      } finally {
        readinessAnalysisInFlightRef.current = false;
        setIsAnalyzingReadiness(false);
      }
    };

    checkTodaysReadiness();
  }, [bump]); // Runs on dashboard focus, but AsyncStorage prevents duplicates

  // Environment helper functions
  const getEnvironmentIcon = (environment: string) => {
    const iconSize = 20;
    const iconColor = '#d32f2f';

    switch (environment) {
      case 'gym':
        return <Ionicons name="barbell-outline" size={iconSize} color={iconColor} />;
      case 'station':
        return <Ionicons name="business-outline" size={iconSize} color={iconColor} />;
      case 'home':
        return <Ionicons name="home-outline" size={iconSize} color={iconColor} />;
      case 'off':
        return <Ionicons name="bed-outline" size={iconSize} color={iconColor} />;
      default:
        return <Ionicons name="fitness-outline" size={iconSize} color={iconColor} />;
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

  // ✅ Coach Recommendation Banner Handlers
  const handleTakeRestDay = () => {
    setShowCoachBanner(false);
    Alert.alert(
      '🛏️ Rest Day Confirmed',
      'Smart choice! Your body will thank you. Focus on recovery today.',
      [{ text: 'Got it', style: 'default' }]
    );
  };

  const handleTrainAnyway = () => {
    if (coachRecommendation?.recommendation === 'light') {
      // Show light workout preview modal
      setShowLightWorkoutModal(true);
    } else {
      // For rest recommendations, dismiss and show override message
      setShowCoachBanner(false);
      Alert.alert(
        '💪 Override Accepted',
        'You know your body best. Stay safe and hydrate well!',
        [{ text: 'Let\'s go', style: 'default' }]
      );
    }
  };

  const handleDismissBanner = () => {
    setShowCoachBanner(false);
  };

  // ✅ Weekly Progression Handlers
  const handleViewProgressionDetails = () => {
    setShowProgressionCard(false);
    // Navigate to workout screen to see updated program
    navigation.navigate('Workout', { openQuickWorkout: false });
  };

  const handleDismissProgression = () => {
    setShowProgressionCard(false);
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
        setPendingPhotoUri(response.assets[0].uri);
        setShowDescribeModal(true);
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
        setPendingPhotoUri(response.assets[0].uri);
        setShowDescribeModal(true);
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
            <Text style={dashboardStyles.subheader}>Train for duty. Fuel for life.</Text>
          </View>
          <Pressable
            style={dashboardStyles.headerScheduleButton}
            onPress={() => setShowEnvironmentCalendar(true)}
          >
            <Ionicons name="calendar-outline" size={24} color="#d32f2f" />
            <Text style={dashboardStyles.headerScheduleText}>Schedule</Text>
          </Pressable>
        </View>

        <ProfileCompletionBanner
          percent={completionPercent}
          pulseAnim={pulseAnim}
          onPress={() => navigation.navigate('Profile')}
        />

        {/* ✅ Daily Check-In Card */}
        <DailyCheckInCard 
          hasCheckedInToday={hasCheckedInToday}
          onPress={() => navigation.navigate('CheckIn')}
        />

        {/* AI Coach Section */}
        <Pressable
          style={dashboardStyles.aiCoachCard}
          onPress={() => navigation.navigate('AIChat', { context: '' })}
        >
          <LinearGradient
            colors={['#6a11cb', '#2575fc']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={dashboardStyles.aiCoachGradient}
          >
            <View style={dashboardStyles.aiCoachContent}>
              <Ionicons name="chatbubbles" size={32} color="#fff" />
              <View style={dashboardStyles.aiCoachText}>
                <Text style={dashboardStyles.aiCoachTitle}>AI Fitness Coach</Text>
                <Text style={dashboardStyles.aiCoachSubtitle}>
                  Get personalized workout & nutrition advice
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            </View>
          </LinearGradient>
        </Pressable>

        {/* ✅ AI Coach Recommendation Banner */}
        {showCoachBanner && coachRecommendation && (
          <CoachRecommendationBanner
            recommendation={coachRecommendation.recommendation}
            severity={coachRecommendation.severity}
            coachMessage={coachRecommendation.coachMessage}
            onTakeRestDay={handleTakeRestDay}
            onTrainAnyway={handleTrainAnyway}
            onDismiss={handleDismissBanner}
          />
        )}

        {/* ✅ Weekly Progression Card */}
        {showProgressionCard && weeklyProgression && (
          <WeeklyProgressionCard
            weekNumber={weeklyProgression.weekNumber}
            coachMessage={weeklyProgression.coachMessage}
            summary={weeklyProgression.summary}
            changes={weeklyProgression.changes}
            onViewDetails={handleViewProgressionDetails}
            onDismiss={handleDismissProgression}
          />
        )}

        {/* SECTION 1: Wellness & Readiness - COMMENTED OUT FOR PHASE 2 WEARABLE INTEGRATION */}
        {/*
        <View style={dashboardStyles.sectionContainer}>
          <Text style={dashboardStyles.sectionTitle}>🔥 Wellness & Readiness</Text>

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
        */}

        {/* SECTION 1: Today's Training */}
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
              aiWorkoutInfo={aiWorkoutInfo}
              navigation={navigation}
              setShowEnvironmentCalendar={setShowEnvironmentCalendar}
              getEnvironmentIcon={getEnvironmentIcon}
              getEnvironmentLabel={getEnvironmentLabel}
              summarizeMains={summarizeMains}
              countSets={countSets}
              estimateTime={estimateTime}
              onRefresh={() => setBump(prev => prev + 1)}
            />

            <TodaysCardioCard
              cardioScheduleInfo={cardioScheduleInfo}
              todayCardioSummary={todayCardioSummary}
              navigation={navigation}
            />

            {/* Enhanced Coming Up Preview */}
            <ComingUpCard
              tomorrowInfo={tomorrowInfo}
              _navigation={navigation}
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
            <WeightTrackingTile
              onWeightUpdated={() => setBump((b: number) => b + 1)}
            />
          </ScrollView>
        </View>
      </ScrollView>

      {/* ✅ CONDITIONALLY RENDER MODALS - only mount when visible to prevent view recycling crashes */}
      {showMealLoggingModal && (
        <MealLoggingModal
          visible={showMealLoggingModal}
          onClose={() => setShowMealLoggingModal(false)}
          onOpenDescribeModal={handleOpenDescribeModal}
          onOpenQuickAdd={handleOpenQuickAdd}
          onOpenCamera={handlePickPhoto}
        />
      )}

      {showDescribeModal && (
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
      )}

      {showQuickFavoritesModal && (
        <QuickFavoritesModal
          visible={showQuickFavoritesModal}
          onClose={() => {
            setShowQuickFavoritesModal(false);
            setCurrentMealContext(null);
          }}
          onFoodLogged={handleFoodLogged}
          mealContext={currentMealContext}
        />
      )}

      {/* Environment Calendar Modal */}
      {showEnvironmentCalendar && (
        <EnvironmentCalendarModal
          visible={showEnvironmentCalendar}
          onClose={() => {
            setShowEnvironmentCalendar(false);
            // Refresh the dashboard data to pick up schedule changes
            setBump((b: number) => b + 1);
          }}
        />
      )}

      {/* Hydration Settings Modal */}
      {showHydrationGoalModal && (
        <HydrationSettingsModal
          visible={showHydrationGoalModal}
          onClose={() => setShowHydrationGoalModal(false)}
          hydrationToday={hydrationToday}
          updateHydrationGoal={updateHydrationGoal}
          updateContainerSize={updateContainerSize}
        />
      )}

      {/* Light Workout Preview Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showLightWorkoutModal}
        onRequestClose={() => setShowLightWorkoutModal(false)}
      >
        <View style={dashboardStyles.lightWorkoutModalOverlay}>
          <View style={dashboardStyles.lightWorkoutModalContent}>
            <View style={dashboardStyles.lightWorkoutModalHeader}>
              <Text style={dashboardStyles.lightWorkoutModalTitle}>⚡ Light Workout</Text>
              <TouchableOpacity onPress={() => setShowLightWorkoutModal(false)}>
                <Text style={dashboardStyles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 500 }}>
              <Text style={dashboardStyles.lightWorkoutIntensity}>
                {coachRecommendation?.adjustedIntensity || 70}% Intensity
              </Text>
              <Text style={dashboardStyles.lightWorkoutSubtext}>
                Reduced volume to match your recovery state. Listen to your body.
              </Text>

              {todayInfo?.day.exercises && todayInfo.day.exercises.length > 0 ? (
                <View style={dashboardStyles.lightWorkoutExercises}>
                  {todayInfo.day.exercises.map((ex: any, idx: number) => {
                    const intensity = coachRecommendation?.adjustedIntensity || 70;
                    const originalSets = ex.sets || 3;
                    const adjustedSets = Math.max(1, Math.round(originalSets * (intensity / 100)));
                    
                    return (
                      <View key={idx} style={dashboardStyles.lightWorkoutExercise}>
                        <Text style={dashboardStyles.lightWorkoutExerciseName}>
                          {idx + 1}. {ex.exerciseId?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </Text>
                        <View style={dashboardStyles.lightWorkoutDetails}>
                          <Text style={dashboardStyles.lightWorkoutOriginal}>
                            Original: {originalSets} × {ex.repsOrDuration}
                          </Text>
                          <Text style={dashboardStyles.lightWorkoutAdjusted}>
                            → Adjusted: {adjustedSets} × {ex.repsOrDuration}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={dashboardStyles.lightWorkoutNoData}>No workout data available</Text>
              )}

              <Text style={dashboardStyles.lightWorkoutNote}>
                💡 {coachRecommendation?.coachMessage || 'Take it easy today and focus on recovery.'}
              </Text>
            </ScrollView>

            <View style={dashboardStyles.lightWorkoutActions}>
              <TouchableOpacity
                style={[dashboardStyles.lightWorkoutButton, dashboardStyles.lightWorkoutAcceptButton]}
                onPress={() => {
                  setShowLightWorkoutModal(false);
                  setShowCoachBanner(false);
                  Alert.alert(
                    '⚠️ Training with Caution',
                    'Listen to your body and stop if needed.',
                    [{ text: 'Understood' }]
                  );
                }}
              >
                <Text style={dashboardStyles.lightWorkoutButtonText}>Start Light Workout</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[dashboardStyles.lightWorkoutButton, dashboardStyles.lightWorkoutCancelButton]}
                onPress={() => setShowLightWorkoutModal(false)}
              >
                <Text style={dashboardStyles.lightWorkoutButtonTextAlt}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
