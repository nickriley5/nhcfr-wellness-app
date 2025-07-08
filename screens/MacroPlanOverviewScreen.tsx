// screens/MacroPlanOverviewScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
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
import ZonePieChart from '../components/macro/ZonePieChart';
import { calculateCalories } from '../components/macroUtils';
import MacroEditor from '../components/macro/MacroEditor';
import ZoneLegend from '../components/macro/ZoneLegend';
import styles from '../styles/MacroPlanOverview.styles';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}


// Define barWidth and barSpacing outside the component for use in styles

const MacroPlanOverviewScreen = () => {
  const route = useRoute<
    RouteProp<RootStackParamList, 'MacroPlanOverview'>
  >();
  const navigation = useNavigation<
    NativeStackNavigationProp<RootStackParamList>
  >();



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
  zoneBlocks = { protein: 0, carbs: 0, fats: 0 }, // fallback default
  dietMethod,
  goalType,
  name,
} = route.params;


  const [selectedMode, setSelectedMode] = useState<'standard' | 'zone'>(
    dietMethod === 'zone' ? 'zone' : 'standard'
  );
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);




  // Calorie calculation

  const targetCalories = calculateCalories(proteinGrams, carbGrams, fatGrams);


  // Weekly data state
  const initialWeekly = [
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
    'Sun',
  ].map(day => ({
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


  // Editors
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

  const diff = currentDayCalories - targetCalories;
  const saveDisabled = currentDayCalories !== targetCalories;

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#0f0f0f', '#1a1a1a']}
        style={styles.container}
      >

        <View style={styles.headerContainer}>
  <Text style={styles.greeting}>Hi, {name}</Text>
  <View style={styles.goalTag}>
    <Text style={styles.goalText}>🎯 Goal: {goalType === 'maintain' ? 'Maintain Weight' : goalType === 'fatloss' ? 'Lose Fat' : 'Build Muscle'}</Text>
  </View>
</View>


        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.recapCard}>
            <Text style={styles.recapText}>
              Target: {targetCalories} kcal · P {proteinGrams}g · C {carbGrams}g · F {fatGrams}g
            </Text>
          </View>

          <View style={styles.toggleContainer}>
  {['standard', 'zone'].map(mode => (
    <TouchableOpacity
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
    </TouchableOpacity>
  ))}
</View>


          {selectedMode === 'standard' ? (
            <>
              <Text style={styles.chartLabel}>
                Weekly Macro Overview
              </Text>


              <MacroBarChart
  weeklyData={weeklyData}
  selectedDayIndex={selectedDayIndex}
  onSelectDay={(index) => setSelectedDayIndex(index)}
/>



              <View style={styles.dayLabelsRow}>
  {dayLabels.map((label, i) => (
    <Text key={i} style={styles.dayLabel}>
      {label}
    </Text>
  ))}
</View>


              <Text
                style={[
                  styles.diffText,
                  diff > 0 ? styles.over : styles.under,
                ]}
              >
                {diff === 0
                  ? 'On target'
                  : diff > 0
                  ? `+ ${diff} kcal over`
                  : `${Math.abs(diff)} kcal under`}
              </Text>

              <MacroEditor
  selectedDay={weeklyData[selectedDayIndex].day}
  protein={editProtein}
  carbs={editCarbs}
  fat={editFat}
  onChange={(macro, value) => {
    if (macro === 'protein') {
  setEditProtein(value);
} else if (macro === 'carbs') {
  setEditCarbs(value);
} else {
  setEditFat(value);
}
  }}
  onCancel={() => {
    const d = weeklyData[selectedDayIndex];
    setEditProtein(d.protein);
    setEditCarbs(d.carbs);
    setEditFat(d.fat);
  }}
  onSave={() => {
    const updated = weeklyData.map((d, i) =>
      i === selectedDayIndex
        ? { ...d, protein: editProtein, carbs: editCarbs, fat: editFat }
        : d
    );
    setWeeklyData(updated);
  }}
  saveDisabled={saveDisabled}
  targetCalories={targetCalories}
/>

            </>
          ) : (
            <>
              <Text style={styles.chartLabel}>
                Zone Block Distribution
              </Text>


              {zoneBlocks.protein + zoneBlocks.carbs + zoneBlocks.fats > 0 && (
  <ZonePieChart
    protein={zoneBlocks.protein}
    carbs={zoneBlocks.carbs}
    fats={zoneBlocks.fats}
  />
)}

              <ZoneLegend colors={colors} />

<Text style={styles.totalBlocks}>
  Total: {zoneBlocks.protein + zoneBlocks.carbs + zoneBlocks.fats} Blocks
</Text>



              <View style={styles.dayDetailCard}>
                <Text style={styles.label}>
                  Meal Breakdown (mock):
                </Text>
                <Text style={styles.summary}>
  🥞 Breakfast: {zoneBlocks.protein}P/{zoneBlocks.carbs}C/{zoneBlocks.fats}F blocks{'\n'}
  🍎 Snack: 2 blocks{'\n'}
  🥗 Lunch: 4 blocks{'\n'}
  🍲 Dinner: 4 blocks
</Text>
              </View>
            </>
          )}
          <Text style={styles.infoText}>
  You can now view your macro plan and begin logging food and activity from the Meal Plan tab.
</Text>

          <Pressable
  style={styles.viewPlanButton}
  onPress={() => navigation.navigate('MealPlan')}
>
  <Text style={styles.viewPlanText}>View Macro Plan & Log Food</Text>
</Pressable>


        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};


export default MacroPlanOverviewScreen;
