// screens/DashboardScreen.tsx
import React, { useState, useEffect } from 'react';
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
import { WeightTrackingTile } from '../components/Dashboard/WeightTrackingTile';
// import TodaysReadinessCard from '../components/Dashboard/TodaysReadinessCard'; // COMMENTED OUT FOR PHASE 2
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
import { dashboardStyles } from '../styles/DashboardScreen.styles';

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
    macrosToday,
  } = useDashboardData(view, bump);

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

  useFocusEffect(
    React.useCallback(() => {
      setBump((b) => b + 1);
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
              onWeightUpdated={() => setBump((b) => b + 1)}
            />
          </ScrollView>
        </View>
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
