import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Slider from '@react-native-community/slider';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { format, addDays } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

import GoalTypeSelector from '../components/GoalSettings/GoalTypeSelector';
import WeightInputSection from '../components/GoalSettings/WeightInputSection';
import ActivityLevelSelector from '../components/GoalSettings/ActivityLevelSelector';
// ⛔️ Removed DietMethodSelector (Zone) – we’re standard-only now
import PreferencesSection from '../components/GoalSettings/PreferencesSection';
import AppButton from '../components/Common/AppButton';

/**
 * Props for GoalSettingsScreen
 * - onGenerated: Called when plan is generated in a modal context
 * - onClose: Optional close callback for modal overlay
 */
interface GoalSettingsProps {
  onGenerated?: (planData: any) => void;
  onClose?: () => void;
}

const GoalSettingsScreen: React.FC<GoalSettingsProps> = ({
  onGenerated,
  onClose: _onClose,
}) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const uid = auth.currentUser?.uid;

  // ✅ State for all fields
  const [weight, setWeight] = useState(0);
  const [targetWeight, setTargetWeight] = useState(0);
  const [rate, setRate] = useState(1.0);
  const [goalType, setGoalType] = useState<
    'fat_loss' | 'maintain' | 'muscle_gain'
  >('fat_loss');

  // 🔒 Lock diet method to standard (no Zone for now)
  const dietMethod: 'standard' = 'standard';

  const [activityLevel, setActivityLevel] = useState<
    'sedentary' | 'light' | 'moderate' | 'very_active'
  >('moderate');
  const [showActivityInfo, setShowActivityInfo] = useState(false);

  const [calorieTarget, setCalorieTarget] = useState(0);
  const [proteinGrams, setProteinGrams] = useState(0);
  const [fatGrams, setFatGrams] = useState(0);
  const [carbGrams, setCarbGrams] = useState(0);

  const [userProfile, setUserProfile] = useState<{ name?: string }>({});
  const [dietaryPreference, setDietaryPreference] = useState<
    'none' | 'carnivore' | 'paleo' | 'vegetarian' | 'vegan'
  >('none');
  const [dietaryRestriction, setDietaryRestriction] = useState<
    'none' | 'gluten_free' | 'dairy_free' | 'low_fodmap'
  >('none');

  // ✅ Load existing user profile if present
  useEffect(() => {
    if (!uid) {return;}
    const fetch = async () => {
      const ref = doc(db, 'users', uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const d = snap.data();
        if (d.weight) {setWeight(d.weight);}
        if (d.targetWeight) {setTargetWeight(d.targetWeight);}
        if (d.goalType) {setGoalType(d.goalType);}
        if (d.activityLevel) {setActivityLevel(d.activityLevel);}
        if (d.name) {setUserProfile({ name: d.name });}
        if (d.dietaryPreference) {setDietaryPreference(d.dietaryPreference);}
        if (d.dietaryRestriction) {setDietaryRestriction(d.dietaryRestriction);}
      }
    };
    fetch();
  }, [uid]);

  // ✅ Calculate macros dynamically when inputs change (Standard only)
  useEffect(() => {
    const multiplierMap = {
      sedentary: 12,
      light: 13,
      moderate: 14,
      very_active: 15,
    } as const;

    const multiplier = multiplierMap[activityLevel] || 12;
    const baseCalories = multiplier * weight;

    const adjustment =
      rate *
      500 *
      (goalType === 'fat_loss' ? -1 : goalType === 'muscle_gain' ? 1 : 0);

    const cals = Math.round(baseCalories + adjustment);

    // 🏋️ IMPROVED PROTEIN CALCULATION
    // More intelligent protein recommendations based on activity level, weight, and goals
    const calculateProteinTarget = (bodyWeight: number, activity: string, goal: string) => {
      // Base protein multipliers per activity level
      const proteinMultipliers = {
        sedentary: 0.7,    // 0.7g per lb for inactive individuals
        light: 0.8,        // 0.8g per lb for lightly active
        moderate: 0.9,     // 0.9g per lb for moderately active
        very_active: 1.0,  // 1.0g per lb for very active
      };

      // Goal adjustments
      const goalAdjustments = {
        fat_loss: 0.1,     // Slightly higher protein during fat loss to preserve muscle
        maintain: 0,       // No adjustment for maintenance
        muscle_gain: 0.1,  // Slightly higher protein for muscle building
      };

      const baseMultiplier = proteinMultipliers[activity as keyof typeof proteinMultipliers] || 0.8;
      const goalAdjustment = goalAdjustments[goal as keyof typeof goalAdjustments] || 0;
      const finalMultiplier = baseMultiplier + goalAdjustment;

      let protein = bodyWeight * finalMultiplier;

      // Safety caps to prevent excessive protein intake
      if (bodyWeight > 250) {
        // For heavier individuals, cap at reasonable maximum
        protein = Math.min(protein, 220); // Max 220g protein regardless of weight
      } else if (bodyWeight > 200) {
        // For moderately heavy individuals, cap at 200g
        protein = Math.min(protein, 200);
      }

      // Minimum protein floor for very light individuals
      protein = Math.max(protein, 80); // Minimum 80g protein

      return Math.round(protein);
    };

    const protein = calculateProteinTarget(weight, activityLevel, goalType);
    const fat = Math.round((cals * 0.25) / 9);
    const carbs = Math.round((cals - (protein * 4 + fat * 9)) / 4);

    setCalorieTarget(cals);
    setProteinGrams(protein);
    setFatGrams(fat);
    setCarbGrams(carbs);
  }, [weight, goalType, rate, activityLevel]);

  // ✅ Save field instantly when changed
  const saveField = async (field: string, value: any) => {
    if (uid) {
      await setDoc(doc(db, 'users', uid), { [field]: value }, { merge: true });
    }
  };

  // ✅ Calculate timeline
  const weightDiff = Math.abs(targetWeight - weight);
  const weeks = rate > 0 ? Math.ceil(weightDiff / rate) : 0;
  const endDate = addDays(new Date(), weeks * 7);

  // ✅ Main handler to save everything & generate plan (Standard only)
  const handleGenerateMealPlan = async () => {
    try {
      console.log('🔥 GoalSettings - Starting meal plan generation...');
      console.log('🔥 UID:', uid);
      
      if (!uid) {
        console.error('❌ No UID - user not authenticated!');
        return;
      }

      const convertedGoalType: 'maintain' | 'fatloss' | 'muscle' =
        goalType === 'fat_loss'
          ? 'fatloss'
          : goalType === 'muscle_gain'
          ? 'muscle'
          : 'maintain';

      const mealPlanData = {
        calorieTarget,
        proteinGrams,
        fatGrams,
        carbGrams,
        zoneBlocks: { protein: 0, carbs: 0, fats: 0 }, // Add default zoneBlocks for standard
        dietMethod, // 'standard'
        goalType: convertedGoalType,
        name: userProfile?.name || 'Firefighter',
        dietaryPreference,
        dietaryRestriction,
      };

      console.log('🔥 Meal Plan Data to save:', mealPlanData);
      console.log('🔥 Firestore path:', `users/${uid}/mealPlan/active`);

      // ✅ Save mealPlan into Firestore
      console.log('🔥 Attempting to write meal plan to Firestore...');
      await setDoc(doc(db, 'users', uid, 'mealPlan', 'active'), mealPlanData);
      console.log('✅ Meal plan saved successfully!');

      // ✅ Save profile updates
      const profileUpdates = {
        weight,
        targetWeight,
        weeklyRate: rate,
        calorieTarget,
        proteinGrams,
        fatGrams,
        carbGrams,
        goalType: convertedGoalType,
        dietaryPreference,
        dietaryRestriction,
        dietMethod, // keep for compatibility
        activityLevel,
      };
      
      console.log('🔥 Profile updates to save:', profileUpdates);
      console.log('🔥 Attempting to write profile updates...');
      
      await setDoc(
        doc(db, 'users', uid),
        profileUpdates,
        { merge: true }
      );
      console.log('✅ Profile updates saved successfully!');

      // ✅ If opened as a modal → call Dashboard callback
      if (onGenerated) {
        onGenerated(mealPlanData);
        return;
      }

      // ✅ Navigate to overview (standard-only params)
      navigation.navigate('MacroPlanOverview', mealPlanData);
    } catch (error) {
      console.error('Failed to generate plan:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#0f0f0f', '#1a1a1a']} style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoiding}
        >
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.heading}>Set Your Goal</Text>

            <GoalTypeSelector
              goalType={goalType}
              onChange={(g) => {
                setGoalType(g);
                saveField('goalType', g);
              }}
            />

            <WeightInputSection
              weight={weight}
              targetWeight={targetWeight}
              onChangeWeight={setWeight}
              onChangeTargetWeight={setTargetWeight}
              onSaveWeight={() => saveField('weight', weight)}
              onSaveTargetWeight={() => saveField('targetWeight', targetWeight)}
            />

            <ActivityLevelSelector
              activityLevel={activityLevel}
              onChange={(a) => {
                setActivityLevel(a);
                saveField('activityLevel', a);
              }}
              showInfo={showActivityInfo}
              onToggleInfo={() => setShowActivityInfo(!showActivityInfo)}
            />

            {/* Weekly Rate Section */}
            <View style={styles.card}>
              <Text style={styles.label}>Weekly Rate of Change (lbs/week)</Text>
              <Slider
                minimumValue={0.25}
                maximumValue={2.0}
                step={0.05}
                value={rate}
                onValueChange={(val: number) =>
                  setRate(parseFloat(val.toFixed(2)))
                }
                minimumTrackTintColor="#ff3c3c"
              />
              <Text style={styles.value}>{rate} lbs/week</Text>
              {rate > 1.5 && (
                <Text style={styles.warning}>
                  ⚠️ Rapid weight change can impact performance and recovery.
                </Text>
              )}
              <Text style={styles.value}>
                Estimated Completion Date: {format(endDate, 'PPP')}
              </Text>
              <Text style={styles.summary}>
                To reach your target, you'll need to{' '}
                {weight > targetWeight ? 'lose' : 'gain'} {rate} lbs/week for ~
                {weeks} weeks.
              </Text>
            </View>

            {/* ⛔️ Removed DietMethodSelector UI – standard is enforced */}

            <PreferencesSection
              dietaryPreference={dietaryPreference}
              dietaryRestriction={dietaryRestriction}
              onChangePreference={(p) => {
                setDietaryPreference(p);
                saveField('dietaryPreference', p);
              }}
              onChangeRestriction={(r) => {
                setDietaryRestriction(r);
                saveField('dietaryRestriction', r);
              }}
            />

            <View style={styles.card}>
              <Text style={styles.label}>Workout Tailoring</Text>
              <Text style={styles.summary}>
                Your selected goal will be used to shape your upcoming workout
                program structure — intensity, volume, rest days, and
                progression.
              </Text>
            </View>

            {/* Final Generate Button */}
            <AppButton
              title="Generate My Plan"
              onPress={handleGenerateMealPlan}
              variant="redSolid"
              disabled={!weight || !targetWeight || !rate}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f0f0f' },
  container: { flex: 1 },
  keyboardAvoiding: { flex: 1 },
  scroll: {
    paddingTop: 16,
    paddingBottom: 48,
    paddingHorizontal: 16,
  },
  heading: {
    fontSize: 22,
    color: '#fff',
    marginBottom: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#1f1f1f',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  label: { color: '#fff', fontSize: 16, marginBottom: 8 },
  value: { color: '#fff', marginTop: 8 },
  warning: { color: '#ff6b6b', marginTop: 8 },
  summary: { color: '#aaa', marginTop: 8, fontSize: 13 },
});

export default GoalSettingsScreen;
