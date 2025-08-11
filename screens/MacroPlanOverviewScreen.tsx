import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import MacroBarChart from '../components/macro/MacroBarChart';
import styles from '../styles/MacroPlanOverview.styles';
import MacroDayEditor from '../components/MacroDayEditor';
import DashboardButton from '../components/Common/DashboardButton';
import { useAuth } from '../providers/AuthProvider';
import { calculateCalories } from '../components/macroUtils';

// Enable LayoutAnimation on Android for smooth transitions
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MacroPlanOverviewScreen = () => {
  const { userProfile } = useAuth();
  const displayName = userProfile?.fullName || 'Firefighter';

  const route = useRoute<RouteProp<RootStackParamList, 'MacroPlanOverview'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const userWeight = userProfile?.weight ?? 180;

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const {
    proteinGrams,
    fatGrams,
    carbGrams,
    goalType,
  } = route.params;

  // initial weekly dataset = same macros each day (editable per-day)
  const initialWeekly = dayLabels.map((day) => ({
    day,
    protein: proteinGrams,
    carbs: carbGrams,
    fat: fatGrams,
  }));

  type WeeklyMacro = {
    day: string;
    protein: number;
    carbs: number;
    fat: number;
  };

  const [weeklyData, setWeeklyData] = useState<WeeklyMacro[]>(initialWeekly);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const currentDay = weeklyData[selectedDayIndex];
  const currentDayCalories = calculateCalories(currentDay.protein, currentDay.carbs, currentDay.fat);

  useEffect(() => {
    LayoutAnimation.easeInEaseOut();
  }, [selectedDayIndex]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#0f0f0f', '#1a1a1a']} style={styles.container}>
        {/* Greeting Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.greeting}>Hi, {displayName}</Text>
          <View style={styles.goalTag}>
            <Text style={styles.goalText}>
              🎯 Goal:{' '}
              {goalType === 'maintain'
                ? 'Maintain Weight'
                : goalType === 'fatloss'
                ? 'Lose Fat'
                : 'Build Muscle'}
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Recap card */}
          <View style={styles.recapCard}>
            <Text style={styles.recapText}>
              Plan: {calculateCalories(proteinGrams, carbGrams, fatGrams)} kcal · P {proteinGrams}g · C {carbGrams}g · F {fatGrams}g
            </Text>
          </View>

          {/* Weekly Macro Overview */}
          <Text style={styles.chartLabel}>Weekly Macro Overview</Text>

          <MacroBarChart
            weeklyData={weeklyData}
            selectedDayIndex={selectedDayIndex}
            onSelectDay={(index) => setSelectedDayIndex(index)}
          />

          <Text style={styles.chartLabel}>
            Editing {weeklyData[selectedDayIndex].day} · {currentDayCalories} kcal
          </Text>

          <MacroDayEditor
            selectedDay={weeklyData[selectedDayIndex].day}
            currentCalories={currentDayCalories}
            currentProtein={currentDay.protein || Math.round(userWeight * 1.0)}
            currentCarbPct={60}
            onApply={(protein, carbs, fat, _calories, applyToAll) => {
              let updated: WeeklyMacro[];
              if (applyToAll) {
                updated = weeklyData.map((d) => ({ ...d, protein, carbs, fat }));
              } else {
                updated = weeklyData.map((d, i) =>
                  i === selectedDayIndex ? { ...d, protein, carbs, fat } : d
                );
              }
              setWeeklyData(updated);
            }}
          />

          <Text style={styles.infoText}>
            You can now view your macro plan and begin logging meal activity from the Meal Plan tab.
          </Text>

          <DashboardButton
            text="Go to Meal Plan"
            variant="default"
            onPress={() => {
              navigation.navigate('AppDrawer', {
                screen: 'MainTabs',
                params: { screen: 'MealPlan' },
              });
            }}
          />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default MacroPlanOverviewScreen;
