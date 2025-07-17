import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  LayoutAnimation,
  UIManager,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MacroBarChart from '../components/macro/MacroBarChart';
import ZonePieChart from '../components/macro/ZonePieChart';
import ZoneLegend from '../components/macro/ZoneLegend';
import styles from '../styles/MacroPlanOverview.styles';
import MacroDayEditor from '../components/MacroDayEditor';
import { useAuth } from '../providers/AuthProvider';
import { calculateCalories } from '../components/macroUtils';

// ✅ NEW: premium unified button
import DashboardButton from '../components/Common/DashboardButton';

// Enable LayoutAnimation on Android for smooth transitions
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MacroPlanOverviewScreen = () => {
  const { userProfile } = useAuth();
  const displayName = userProfile?.fullName || 'Firefighter';

  const route = useRoute<RouteProp<RootStackParamList, 'MacroPlanOverview'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const userWeight = userProfile?.weight ?? 180; // fallback if profile incomplete

  const colors = {
    protein: '#4FC3F7',
    carbs: '#81C784',
    fat: '#F06292',
  };

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const {
  proteinGrams,
  fatGrams,
  carbGrams,
  dietMethod,
  goalType,
} = route.params;

// Calculate zone blocks dynamically
const zoneProteinBlocks = Math.floor(proteinGrams / 7);
const zoneCarbBlocks = Math.floor(carbGrams / 9);
const zoneFatBlocks = Math.floor(fatGrams / 3);

const zoneBlocks = {
  protein: zoneProteinBlocks,
  carbs: zoneCarbBlocks,
  fats: zoneFatBlocks,
};


  const [selectedMode, setSelectedMode] = useState<'standard' | 'zone'>(
    dietMethod === 'zone' ? 'zone' : 'standard'
  );
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Initial plan values for the whole week
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

  // Sync MacroDayEditor inputs when selectedDay changes
  const [editProtein, setEditProtein] = useState<number>(proteinGrams);
  const [editCarbs, setEditCarbs] = useState<number>(carbGrams);
  const [editFat, setEditFat] = useState<number>(fatGrams);

  useEffect(() => {
    const d = weeklyData[selectedDayIndex];
    LayoutAnimation.easeInEaseOut();
    setEditProtein(d.protein);
    setEditCarbs(d.carbs);
    setEditFat(d.fat);
  }, [selectedDayIndex, weeklyData]);

  const currentDayCalories = calculateCalories(editProtein, editCarbs, editFat);

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
          {/* Recap card for initial baseline */}
          <View style={styles.recapCard}>
            <Text style={styles.recapText}>
              Default Plan:{' '}
              {calculateCalories(proteinGrams, carbGrams, fatGrams)} kcal · P {proteinGrams}g · C{' '}
              {carbGrams}g · F {fatGrams}g
            </Text>
          </View>

          {/* Toggle Standard vs Zone */}
          <View style={styles.toggleContainer}>
            {['standard', 'zone'].map((mode) => (
              <Pressable
                key={mode}
                style={[
                  styles.toggleButton,
                  selectedMode === mode && styles.toggleActive,
                ]}
                onPress={() => setSelectedMode(mode as 'standard' | 'zone')}
              >
                <Text
                  style={[
                    styles.toggleText,
                    selectedMode === mode && styles.toggleTextActive,
                  ]}
                >
                  {mode === 'standard' ? 'Standard Macros' : 'Zone Blocks'}
                </Text>
              </Pressable>
            ))}
          </View>

          {selectedMode === 'standard' ? (
            <>
              <Text style={styles.chartLabel}>Weekly Macro Overview</Text>

              {/* Interactive weekly bar chart */}
              <MacroBarChart
                weeklyData={weeklyData}
                selectedDayIndex={selectedDayIndex}
                onSelectDay={(index) => setSelectedDayIndex(index)}
              />


              {/* Selected day macro summary */}
              <Text style={styles.chartLabel}>
                Editing {weeklyData[selectedDayIndex].day} · {currentDayCalories} kcal
              </Text>

              {/* Editor for that specific day */}
              <MacroDayEditor
                selectedDay={weeklyData[selectedDayIndex].day}
                currentCalories={currentDayCalories}
                currentProtein={
                  weeklyData[selectedDayIndex].protein || Math.round(userWeight * 1.0)
                }
                currentCarbPct={60}
                onApply={(protein, carbs, fat, _calories, applyToAll) => {
  let updated;
  if (applyToAll) {
    // ✅ Update every day with same values
    updated = weeklyData.map((d) => ({
      ...d,
      protein,
      carbs,
      fat,
    }));
  } else {
    // ✅ Update only selected day
    updated = weeklyData.map((d, i) =>
      i === selectedDayIndex ? { ...d, protein, carbs, fat } : d
    );
  }
  setWeeklyData(updated);
}}

              />
            </>
          ) : (
            <>
              <View style={styles.zoneSection}>
  <Text style={styles.chartLabel}>Zone Block Distribution</Text>

  {zoneBlocks.protein + zoneBlocks.carbs + zoneBlocks.fats > 0 ? (
    <ZonePieChart
      protein={zoneBlocks.protein}
      carbs={zoneBlocks.carbs}
      fats={zoneBlocks.fats}
    />
  ) : (
    <Text style={styles.infoText}>No blocks available yet.</Text>
  )}

  <ZoneLegend colors={colors} />

  <Text style={styles.totalBlocks}>
    Total: {zoneBlocks.protein + zoneBlocks.carbs + zoneBlocks.fats} Blocks
  </Text>
</View>


              <View style={styles.dayDetailCard}>
                <Text style={styles.label}>Meal Breakdown (example):</Text>
                <Text style={styles.summary}>
  🥞 Breakfast: {Math.round(zoneBlocks.protein * 0.25)}P/
  {Math.round(zoneBlocks.carbs * 0.25)}C/
  {Math.round(zoneBlocks.fats * 0.25)}F blocks{'\n'}
  🍎 Snack: 2 blocks{'\n'}
  🥗 Lunch: {Math.round(zoneBlocks.protein * 0.4)} blocks{'\n'}
  🍲 Dinner: {Math.round(zoneBlocks.protein * 0.35)} blocks
</Text>

              </View>
            </>
          )}

          {/* Info text */}
          <Text style={styles.infoText}>
            You can now view your macro plan and begin logging apand activity from the Meal Plan tab.
          </Text>

          {/* ✅ Premium button instead of Pressable */}
          <DashboardButton
            text="View Macro Plan & Log Food"
            variant="default"
            onPress={() => navigation.navigate('MealPlan')}
          />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default MacroPlanOverviewScreen;
