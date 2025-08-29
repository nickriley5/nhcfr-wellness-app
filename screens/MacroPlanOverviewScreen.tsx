import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
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
          {/* Enhanced Summary Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Your Nutrition Plan</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStatBlock}>
                <Text style={styles.summaryStatNumber}>{calculateCalories(proteinGrams, carbGrams, fatGrams)}</Text>
                <Text style={styles.summaryStatLabel}>Calories</Text>
              </View>
              <View style={styles.summaryStatBlock}>
                <Text style={[styles.summaryStatNumber, styles.proteinColor]}>{proteinGrams}g</Text>
                <Text style={styles.summaryStatLabel}>Protein</Text>
              </View>
              <View style={styles.summaryStatBlock}>
                <Text style={[styles.summaryStatNumber, styles.carbColor]}>{carbGrams}g</Text>
                <Text style={styles.summaryStatLabel}>Carbs</Text>
              </View>
              <View style={styles.summaryStatBlock}>
                <Text style={[styles.summaryStatNumber, styles.fatColor]}>{fatGrams}g</Text>
                <Text style={styles.summaryStatLabel}>Fat</Text>
              </View>
            </View>
          </View>

          {/* Weekly Macro Overview with Legend */}
          <Text style={styles.chartLabel}>Weekly Macro Overview</Text>

          {/* Macro Legend */}
          <View style={styles.macroLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.proteinLegendColor]} />
              <Text style={styles.legendText}>Protein</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.carbLegendColor]} />
              <Text style={styles.legendText}>Carbs</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.fatLegendColor]} />
              <Text style={styles.legendText}>Fat</Text>
            </View>
          </View>

          <MacroBarChart
            weeklyData={weeklyData}
            selectedDayIndex={selectedDayIndex}
            onSelectDay={(index) => setSelectedDayIndex(index)}
          />

          {/* Selected Day Details */}
          <View style={styles.selectedDayCard}>
            <Text style={styles.selectedDayTitle}>
              {weeklyData[selectedDayIndex].day} · {currentDayCalories} kcal
            </Text>
            <View style={styles.selectedDayMacros}>
              <Text style={[styles.selectedDayMacro, styles.proteinColor]}>
                P: {currentDay.protein}g
              </Text>
              <Text style={[styles.selectedDayMacro, styles.carbColor]}>
                C: {currentDay.carbs}g
              </Text>
              <Text style={[styles.selectedDayMacro, styles.fatColor]}>
                F: {currentDay.fat}g
              </Text>
            </View>
          </View>

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

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Pressable
              style={[styles.btn, styles.btnSecondary]}
              onPress={() => {
                // Reset to original recommended values
                const resetWeekly = dayLabels.map((day) => ({
                  day,
                  protein: proteinGrams,
                  carbs: carbGrams,
                  fat: fatGrams,
                }));
                setWeeklyData(resetWeekly);
              }}
            >
              <Text style={styles.btnSecondaryText}>↻ Reset to Recommended</Text>
            </Pressable>
          </View>

          {/* Weekly Averages */}
          <View style={styles.weeklyAverages}>
            <Text style={styles.weeklyAveragesTitle}>Weekly Averages</Text>
            <View style={styles.weeklyStats}>
              <View style={styles.weeklyStatBlock}>
                <Text style={styles.weeklyStatNumber}>
                  {Math.round(weeklyData.reduce((sum, day) => sum + calculateCalories(day.protein, day.carbs, day.fat), 0) / 7)}
                </Text>
                <Text style={styles.weeklyStatLabel}>Avg Calories</Text>
              </View>
              <View style={styles.weeklyStatBlock}>
                <Text style={[styles.weeklyStatNumber, styles.proteinColor]}>
                  {Math.round(weeklyData.reduce((sum, day) => sum + day.protein, 0) / 7)}g
                </Text>
                <Text style={styles.weeklyStatLabel}>Avg Protein</Text>
              </View>
              <View style={styles.weeklyStatBlock}>
                <Text style={[styles.weeklyStatNumber, styles.carbColor]}>
                  {Math.round(weeklyData.reduce((sum, day) => sum + day.carbs, 0) / 7)}g
                </Text>
                <Text style={styles.weeklyStatLabel}>Avg Carbs</Text>
              </View>
              <View style={styles.weeklyStatBlock}>
                <Text style={[styles.weeklyStatNumber, styles.fatColor]}>
                  {Math.round(weeklyData.reduce((sum, day) => sum + day.fat, 0) / 7)}g
                </Text>
                <Text style={styles.weeklyStatLabel}>Avg Fat</Text>
              </View>
            </View>
          </View>

          <Text style={styles.infoText}>
            Your personalized nutrition plan is ready! You can now log meals and track your progress from the Meal Plan tab.
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
