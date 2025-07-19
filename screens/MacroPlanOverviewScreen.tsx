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
import DashboardButton from '../components/Common/DashboardButton';
import { useAuth } from '../providers/AuthProvider';
import { calculateCalories } from '../components/macroUtils';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

// Enable LayoutAnimation on Android for smooth transitions
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MacroPlanOverviewScreen = () => {
  const { userProfile } = useAuth();
  const displayName = userProfile?.fullName || 'Firefighter';
  const userId = userProfile?.uid;

  const route = useRoute<RouteProp<RootStackParamList, 'MacroPlanOverview'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const userWeight = userProfile?.weight ?? 180;

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
    dietMethod: initialDietMethod,
    goalType,
  } = route.params;

  // ✅ Calculate zone blocks dynamically for preview
  const zoneBlocks = {
    protein: Math.floor(proteinGrams / 7),
    carbs: Math.floor(carbGrams / 9),
    fats: Math.floor(fatGrams / 3),
  };

  // ✅ State
  const [activeDietMethod, setActiveDietMethod] = useState<'standard' | 'zone'>(
    initialDietMethod === 'zone' ? 'zone' : 'standard'
  );
  const [previewDietMethod, setPreviewDietMethod] = useState<'standard' | 'zone' | null>(null);
  const [showPreviewBanner, setShowPreviewBanner] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

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

  /* ------------------------------------------
   ✅ When user toggles a different diet method
  -------------------------------------------*/
  const handleTogglePreview = (newMode: 'standard' | 'zone') => {
    if (newMode === activeDietMethod) {
      // ✅ They clicked their current plan → reset preview
      setPreviewDietMethod(null);
      setShowPreviewBanner(false);
      return;
    }

    // ✅ They are previewing the OTHER plan
    setPreviewDietMethod(newMode);
    setShowPreviewBanner(true);
  };

  /* ------------------------------------------
   ✅ Confirm & switch the plan
  -------------------------------------------*/
  const handleConfirmSwitch = async () => {
    if (!previewDietMethod || !userId) {
      return;
    }

    try {
      const planRef = doc(db, `users/${userId}/mealplan/active`);

      if (previewDietMethod === 'zone') {
        await updateDoc(planRef, {
          dietMethod: 'zone',
          zoneBlocks,
        });
      } else {
        await updateDoc(planRef, {
          dietMethod: 'standard',
          proteinGrams,
          carbGrams,
          fatGrams,
        });
      }

      // ✅ Now make the preview the active
      setActiveDietMethod(previewDietMethod);
      setPreviewDietMethod(null);
      setShowPreviewBanner(false);
    } catch (err) {
      console.error('Failed to switch meal plan:', err);
    }
  };

  // ✅ Decide what is currently visible (preview OR actual)
  const visibleMode = previewDietMethod || activeDietMethod;

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
          {/* Preview Banner */}
          {showPreviewBanner && (
            <View style={styles.previewBanner}>
              <Text style={styles.previewBannerText}>
                You are previewing {previewDietMethod === 'zone' ? 'Zone Blocks' : 'Standard Macros'}.
                Switching will overwrite your current plan.
              </Text>
              <View style={styles.previewButtonsRow}>
                <DashboardButton text="Cancel" variant="default" onPress={() => {
                  setPreviewDietMethod(null);
                  setShowPreviewBanner(false);
                }}/>
                <DashboardButton text="Confirm & Switch Plan" variant="redSolid" onPress={handleConfirmSwitch}/>
              </View>
            </View>
          )}

          {/* Recap card for current baseline */}
          <View style={styles.recapCard}>
            {visibleMode === 'standard' ? (
              <Text style={styles.recapText}>
                Default Plan:{' '}
                {calculateCalories(proteinGrams, carbGrams, fatGrams)} kcal · P {proteinGrams}g · C{' '}
                {carbGrams}g · F {fatGrams}g
              </Text>
            ) : (
              <Text style={styles.recapText}>
                Zone Blocks: P {zoneBlocks.protein} · C {zoneBlocks.carbs} · F {zoneBlocks.fats}
              </Text>
            )}
          </View>

          {/* Toggle Standard vs Zone */}
          <View style={styles.toggleContainer}>
            {['standard', 'zone'].map((mode) => {
              const isActive = visibleMode === mode;
              return (
                <Pressable
                  key={mode}
                  style={[
                    styles.toggleButton,
                    isActive && styles.toggleActive,
                  ]}
                  onPress={() => handleTogglePreview(mode as 'standard' | 'zone')}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      isActive && styles.toggleTextActive,
                    ]}
                  >
                    {mode === 'standard' ? 'Standard Macros' : 'Zone Blocks'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Show either Standard OR Zone preview */}
          {visibleMode === 'standard' ? (
            <>
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
                currentProtein={
                  weeklyData[selectedDayIndex].protein || Math.round(userWeight * 1.0)
                }
                currentCarbPct={60}
                onApply={(protein, carbs, fat, _calories, applyToAll) => {
                  let updated;
                  if (applyToAll) {
                    updated = weeklyData.map((d) => ({
                      ...d,
                      protein,
                      carbs,
                      fat,
                    }));
                  } else {
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
            You can now view your macro plan and begin logging meal activity from the Meal Plan tab.
          </Text>

          <DashboardButton
  text="Go to Meal Plan"
  variant="default"
  onPress={() => {
    navigation.navigate('AppDrawer', {
      screen: 'MainTabs',
      params: {
        screen: 'MealPlan',
      },
    }); // then select tab
  }}
/>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default MacroPlanOverviewScreen;
