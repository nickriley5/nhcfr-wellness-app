import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
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
  const [height, setHeight] = useState(0); // inches
  const [age, setAge] = useState(0);
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
  const [dietaryRestrictions, setDietaryRestrictions] = useState<
    Array<'gluten_free' | 'dairy_free' | 'low_fodmap'>
  >([]);

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
        if (d.height) {setHeight(d.height);}
        if (d.age) {setAge(d.age);}
        if (d.goalType) {setGoalType(d.goalType);}
        if (d.activityLevel) {setActivityLevel(d.activityLevel);}
        if (d.name) {setUserProfile({ name: d.name });}
        if (d.dietaryPreference) {setDietaryPreference(d.dietaryPreference);}
        if (d.dietaryRestrictions && Array.isArray(d.dietaryRestrictions)) {
          setDietaryRestrictions(d.dietaryRestrictions);
        } else if (d.dietaryRestriction && d.dietaryRestriction !== 'none') {
          // Migrate old single restriction to array format
          setDietaryRestrictions([d.dietaryRestriction]);
        }
      }
    };
    fetch();
  }, [uid]);

  // ✅ Calculate macros dynamically when inputs change (Standard only)
  useEffect(() => {
    // Skip if missing required data
    if (!weight || !height || !age) {
      return;
    }

    // Calculate BMR using Mifflin-St Jeor equation (most accurate for athletes)
    // Using male formula as baseline for firefighters (adjust if needed)
    const heightCm = height * 2.54; // inches to cm
    const weightKg = weight * 0.453592; // lbs to kg
    const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;

    // TDEE activity multipliers (more accurate than simple cal/lb)
    const activityMultiplierMap = {
      sedentary: 1.2,      // Little to no exercise
      light: 1.375,        // Light exercise 1-3 days/week
      moderate: 1.55,      // Moderate exercise 3-5 days/week
      very_active: 1.725,  // Hard exercise 6-7 days/week
    } as const;

    const tdee = bmr * (activityMultiplierMap[activityLevel] || 1.55);

    // Calculate daily calorie adjustment based on rate of change
    const adjustment =
      rate *
      500 *
      (goalType === 'fat_loss' ? -1 : goalType === 'muscle_gain' ? 1 : 0);

    let cals = Math.round(tdee + adjustment);

    // Safety floor: never go below minimum safe calories
    const minCalories = 1500; // Safe minimum for active firefighters
    if (cals < minCalories && goalType === 'fat_loss') {
      cals = minCalories;
    }

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

    let protein = calculateProteinTarget(weight, activityLevel, goalType);
    let fat = Math.round((cals * 0.25) / 9);
    let carbs = Math.round((cals - (protein * 4 + fat * 9)) / 4);

    // ✅ MACRO VALIDATION
    // Ensure protein doesn't exceed safe maximum
    if (protein > 250) {
      console.warn('⚠️ Protein capped at 250g for safety');
      protein = 250;
    }

    // Ensure carbs don't go below minimum for performance
    const minCarbs = 100; // Minimum for firefighter performance
    if (carbs < minCarbs) {
      console.warn('⚠️ Carbs below minimum, adjusting macros');
      // Recalculate: prioritize protein, then carbs, then fat
      carbs = minCarbs;
      const remainingCals = cals - (protein * 4 + carbs * 4);
      fat = Math.max(Math.round(remainingCals / 9), 40); // Min 40g fat
    }

    // Ensure fat doesn't go below minimum for hormones
    const minFat = 40;
    if (fat < minFat) {
      console.warn('⚠️ Fat below minimum, adjusting to 40g');
      fat = minFat;
      // Recalculate carbs with reduced fat
      carbs = Math.round((cals - (protein * 4 + fat * 9)) / 4);
    }

    setCalorieTarget(cals);
    setProteinGrams(protein);
    setFatGrams(fat);
    setCarbGrams(carbs);
  }, [weight, height, age, goalType, rate, activityLevel]);

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
        dietaryRestrictions,
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
        height,
        age,
        weeklyRate: rate,
        calorieTarget,
        proteinGrams,
        fatGrams,
        carbGrams,
        goalType: convertedGoalType,
        dietaryPreference,
        dietaryRestrictions,
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

            {/* Height & Age Section */}
            <View style={styles.card}>
              <Text style={styles.label}>Height (inches)</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={height ? height.toString() : ''}
                  onChangeText={(val) => setHeight(parseFloat(val) || 0)}
                  onBlur={() => saveField('height', height)}
                  placeholder="72"
                  placeholderTextColor="#666"
                />
                <Text style={styles.inputHint}>{"Example: 5'10\" = 70 inches"}</Text>
              </View>
              
              <Text style={[styles.label, { marginTop: 16 }]}>Age (years)</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={age ? age.toString() : ''}
                  onChangeText={(val) => setAge(parseFloat(val) || 0)}
                  onBlur={() => saveField('age', age)}
                  placeholder="30"
                  placeholderTextColor="#666"
                />
                <Text style={styles.inputHint}>Used for accurate calorie calculation</Text>
              </View>
              
              {(!height || !age) && (
                <Text style={styles.warning}>
                  ⚠️ Height and age are required for accurate nutrition calculations
                </Text>
              )}
            </View>

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
              {rate > 1.5 && rate <= 2.0 && (
                <Text style={styles.warning}>
                  ⚠️ Rapid weight change can impact performance and recovery. Consider 1.0-1.5 lbs/week for sustainable results.
                </Text>
              )}
              {rate > 2.0 && (
                <Text style={[styles.warning, { color: '#ff3b30', fontWeight: '700' }]}>
                  🚨 EXTREME RATE: This is not recommended and may harm your health, performance, and metabolism. Maximum safe rate is 2 lbs/week.
                </Text>
              )}
              {rate < 0.5 && goalType !== 'maintain' && (
                <Text style={styles.summary}>
                  💡 Very slow rate - excellent for maintaining strength and minimizing muscle loss during fat loss.
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
              dietaryRestrictions={dietaryRestrictions}
              onChangePreference={(p) => {
                setDietaryPreference(p);
                saveField('dietaryPreference', p);
              }}
              onToggleRestriction={(r) => {
                const newRestrictions = dietaryRestrictions.includes(r)
                  ? dietaryRestrictions.filter(item => item !== r)
                  : [...dietaryRestrictions, r];
                setDietaryRestrictions(newRestrictions);
                saveField('dietaryRestrictions', newRestrictions);
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

            {/* Macro Preview Card */}
            {weight && height && age && (
              <View style={styles.card}>
                <Text style={styles.label}>Your Nutrition Targets</Text>
                <View style={styles.macroPreview}>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{calorieTarget}</Text>
                    <Text style={styles.macroLabel}>Calories</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{proteinGrams}g</Text>
                    <Text style={styles.macroLabel}>Protein</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{carbGrams}g</Text>
                    <Text style={styles.macroLabel}>Carbs</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{fatGrams}g</Text>
                    <Text style={styles.macroLabel}>Fat</Text>
                  </View>
                </View>
                {calorieTarget === 1500 && goalType === 'fat_loss' && (
                  <Text style={styles.warning}>
                    ⚠️ At minimum safe calorie level. Consider slower rate of change.
                  </Text>
                )}
              </View>
            )}

            {/* Final Generate Button */}
            <AppButton
              title="Generate My Plan"
              onPress={handleGenerateMealPlan}
              variant="redSolid"
              disabled={!weight || !targetWeight || !height || !age || !rate}
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
  warning: { color: '#ff6b6b', marginTop: 8, fontSize: 13 },
  summary: { color: '#aaa', marginTop: 8, fontSize: 13 },
  inputRow: { marginBottom: 8 },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  inputHint: { color: '#999', fontSize: 12, marginTop: 4 },
  macroPreview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  macroItem: { alignItems: 'center' },
  macroValue: {
    color: '#4fc3f7',
    fontSize: 24,
    fontWeight: '700',
  },
  macroLabel: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
});

export default GoalSettingsScreen;
