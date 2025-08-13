import React, { useState, useEffect } from 'react';
import {
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Modal,
  View,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  useNavigation,
  CompositeNavigationProp,
  useFocusEffect,
} from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { TabParamList, RootStackParamList } from '../App';
import MealGoalsModal from '../components/MealGoalsModal';
import PerformanceGoalsModal from '../components/PerformanceGoalsModal';
import EnvironmentCalendarModal from '../components/EnvironmentCalendarModal';
import GoalSettingsScreen from './GoalSettingsScreen'; // ✅ Import Goal Settings

import { generateProgramFromGoals } from '../utils/programGenerator';
import ReminderCard from '../components/Dashboard/ReminderCard';
import ProfileCompletionBanner from '../components/Profile/ProfileCompletionBanner';
import MoodEnergySection from '../components/Dashboard/MoodEnergySection';
import QuickViews from '../components/Dashboard/QuickViews';
import AICoachBox from '../components/Dashboard/AICoachBox';
import GenerateButtons from '../components/Dashboard/GenerateButtons';
import CheckInButton from '../components/Dashboard/CheckInButton';
import { useDashboardData } from '../hooks/useDashboardData';
import { auth, db } from '../firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';



export default function DashboardScreen() {
  const navigation = useNavigation<
    CompositeNavigationProp<
      BottomTabNavigationProp<TabParamList, 'Dashboard'>,
      NativeStackNavigationProp<RootStackParamList>
    >
  >();

  const [view, setView] = useState<'week' | 'month' | 'all'>('week');
  const [pulseAnim] = useState(new Animated.Value(1));

  const [showMealModal, setShowMealModal] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [bump, setBump] = useState(0);

  // ✅ NEW: GoalSettings modal state
  const [showGoalSettingsModal, setShowGoalSettingsModal] = useState(false);

  const {
    moodData,
    energyData,
    hasCheckedInToday,
    completionPercent,
    currentWeight,
    programExists,
    mealPlanExists,
    exerciseLibrary,
  } = useDashboardData(view, bump);

  useFocusEffect(React.useCallback(() => {
  setBump(b => b + 1);
  return () => {};
}, []));

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
          // ✅ Instead of old MealGoalsModal, open GoalSettingsScreen as modal
          onGenerateMeal={() => setShowGoalSettingsModal(true)}
          onGenerateProgram={() => setShowWorkoutModal(true)}
          onViewPrograms={() =>
            navigation
              .getParent<NativeStackNavigationProp<RootStackParamList>>()
              ?.navigate('ProgramList')
          }
          onSetSchedule={() => setShowCalendarModal(true)}
          onViewHistory={() => navigation.navigate('WorkoutHistory')}
        />

{__DEV__ && (
  <View style={styles.devSection}>
    <Text style={styles.devLabel}>Dev</Text>
    <Text
      onPress={async () => {
        const uid = auth.currentUser?.uid;
        if (!uid) {return;}
        await deleteDoc(doc(db, 'users', uid, 'program', 'active'));
        Alert.alert('Program', 'Active program reset.');
        setBump(b => b + 1);
      }}
      style={styles.resetProgramText}>
      Reset Active Program
    </Text>
  </View>
)}

      </ScrollView>

      {/* Old Meal modal stays available if needed elsewhere */}
      <MealGoalsModal
        visible={showMealModal}
        currentWeight={currentWeight}
        onClose={() => setShowMealModal(false)}
        onSaved={() => {
          setShowMealModal(false);
          // ✅ Navigate to MealPlan tab
          navigation
            .getParent<NativeStackNavigationProp<RootStackParamList>>()
            ?.navigate('MainTabs', { screen: 'MealPlan' });
        }}
      />

      {/* Performance goals modal */}
      <PerformanceGoalsModal
        visible={showWorkoutModal}
        onClose={() => setShowWorkoutModal(false)}
        onSaved={async (goals) => {
          setShowWorkoutModal(false);
          const uid = auth.currentUser?.uid;
          if (!uid) {
            return;
          }
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
          } catch (err) {
            Alert.alert('Error', 'There was an issue generating your workout program.');
          }
        }}
        fullExerciseLibrary={exerciseLibrary}
      />

      {/* Calendar modal */}
      <EnvironmentCalendarModal
        visible={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
      />

      {/* ✅ TRUE MODAL: GoalSettingsScreen overlay */}
      <Modal
        visible={showGoalSettingsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGoalSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
  <GoalSettingsScreen
    onClose={() => setShowGoalSettingsModal(false)}
    onGenerated={() => {
      // When goal settings are saved:
      setShowGoalSettingsModal(false);

      // ✅ Navigate to MealPlan tab inside MainTabs
      navigation
        .getParent<NativeStackNavigationProp<RootStackParamList>>()
        ?.navigate('MainTabs', { screen: 'MealPlan' });
    }}
  />
</View>
      </Modal>
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

  // ✅ Dark translucent overlay for modal background
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
  },

  // Dev section style
  devSection: {
    marginTop: 12,
  },
  devLabel: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 6,
  },
  resetProgramText: {
    color: '#ff6b6b',
    textDecorationLine: 'underline',
  },
});
