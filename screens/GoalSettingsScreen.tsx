// GoalSettingsScreen.tsx
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
import DietMethodSelector from '../components/GoalSettings/DietMethodSelector';
import PreferencesSection from '../components/GoalSettings/PreferencesSection';
import AppButton from '../components/Common/AppButton';

const GoalSettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const uid = auth.currentUser?.uid;

  const [weight, setWeight] = useState(0);
  const [targetWeight, setTargetWeight] = useState(0);
  const [rate, setRate] = useState(1.0);
  const [goalType, setGoalType] = useState<'fat_loss' | 'maintain' | 'muscle_gain'>('fat_loss');
  const [dietMethod, setDietMethod] = useState<'standard' | 'zone'>('standard');
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'very_active'>('moderate');
  const [showActivityInfo, setShowActivityInfo] = useState(false);

  const [calorieTarget, setCalorieTarget] = useState(0);
  const [proteinGrams, setProteinGrams] = useState(0);
  const [fatGrams, setFatGrams] = useState(0);
  const [carbGrams, setCarbGrams] = useState(0);
  const [zoneBlocks, setZoneBlocks] = useState({ protein: 0, carbs: 0, fats: 0 });

  const [userProfile, setUserProfile] = useState<{ name?: string }>({});
  const [dietaryPreference, setDietaryPreference] = useState<'none' | 'carnivore' | 'paleo' | 'vegetarian' | 'vegan'>('none');
  const [dietaryRestriction, setDietaryRestriction] = useState<'none' | 'gluten_free' | 'dairy_free' | 'low_fodmap'>('none');

  useEffect(() => {
    if (!uid) {
      return;
    }
    const fetch = async () => {
      const ref = doc(db, 'users', uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const d = snap.data();
        if (d.weight) {setWeight(d.weight);}
        if (d.targetWeight) {setTargetWeight(d.targetWeight);}
        if (d.goalType) {setGoalType(d.goalType);}
        if (d.dietMethod) {setDietMethod(d.dietMethod);}
        if (d.activityLevel) {setActivityLevel(d.activityLevel);}
        if (d.name) {setUserProfile({ name: d.name });}
        if (d.dietaryPreference) {setDietaryPreference(d.dietaryPreference);}
        if (d.dietaryRestriction) {setDietaryRestriction(d.dietaryRestriction);}
      }
    };
    fetch();
  }, [uid]);

  useEffect(() => {
    const multiplierMap = {
      sedentary: 12,
      light: 13,
      moderate: 14,
      very_active: 15,
    };

    const multiplier = multiplierMap[activityLevel] || 12;
    const baseCalories = multiplier * weight;

    const adjustment =
      rate * 500 * (goalType === 'fat_loss' ? -1 : goalType === 'muscle_gain' ? 1 : 0);

    const cals = Math.round(baseCalories + adjustment);
    const protein = Math.round(weight * 1);
    const fat = Math.round((cals * 0.25) / 9);
    const carbs = Math.round((cals - (protein * 4 + fat * 9)) / 4);

    setCalorieTarget(cals);
    setProteinGrams(protein);
    setFatGrams(fat);
    setCarbGrams(carbs);
    setZoneBlocks({
      protein: Math.round(protein / 7),
      carbs: Math.round(carbs / 9),
      fats: Math.round(fat / 1.5),
    });
  }, [weight, goalType, rate, activityLevel]);

  const saveField = async (field: string, value: any) => {
    if (uid) {
      await setDoc(doc(db, 'users', uid), { [field]: value }, { merge: true });
    }
  };

  const weightDiff = Math.abs(targetWeight - weight);
  const weeks = rate > 0 ? Math.ceil(weightDiff / rate) : 0;
  const endDate = addDays(new Date(), weeks * 7);

  const handleGenerateMealPlan = async () => {
    try {
      if (!uid) {
        return;
      }

      const convertedGoalType: 'maintain' | 'fatloss' | 'muscle' =
        goalType === 'fat_loss' ? 'fatloss' : goalType === 'muscle_gain' ? 'muscle' : 'maintain';

      const mealPlanData = {
        calorieTarget,
        proteinGrams,
        fatGrams,
        carbGrams,
        zoneBlocks,
        dietMethod,
        goalType: convertedGoalType,
        name: userProfile?.name || 'Firefighter',
        dietaryPreference,
        dietaryRestriction,
      };

      await setDoc(doc(db, 'users', uid, 'mealPlan', 'active'), mealPlanData);

      await setDoc(doc(db, 'users', uid), {
        weight,
        targetWeight,
        weeklyRate: rate,
        calorieTarget,
        proteinGrams,
        fatGrams,
        carbGrams,
        zoneBlocks,
        goalType: convertedGoalType,
        dietaryPreference,
        dietaryRestriction,
        dietMethod,
        activityLevel,
      }, { merge: true });

      navigation.navigate('MacroPlanOverview', mealPlanData);
    } catch (error) {
      console.error('Failed to generate plan:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#0f0f0f', '#1a1a1a']} style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardAvoiding}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.heading}>Set Your Goal</Text>

            <GoalTypeSelector goalType={goalType} onChange={(g) => { setGoalType(g); saveField('goalType', g); }} />

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
              onChange={(a) => { setActivityLevel(a); saveField('activityLevel', a); }}
              showInfo={showActivityInfo}
              onToggleInfo={() => setShowActivityInfo(!showActivityInfo)}
            />

            <View style={styles.card}>
              <Text style={styles.label}>Weekly Rate of Change (lbs/week)</Text>
              <Slider
                minimumValue={0.25}
                maximumValue={2.0}
                step={0.05}
                value={rate}
                onValueChange={(val: number) => setRate(parseFloat(val.toFixed(2)))}
                minimumTrackTintColor="#ff3c3c"
              />
              <Text style={styles.value}>{rate} lbs/week</Text>
              {rate > 1.5 && <Text style={styles.warning}>⚠️ Rapid weight change can impact performance and recovery.</Text>}
              <Text style={styles.value}>Estimated Completion Date: {format(endDate, 'PPP')}</Text>
              <Text style={styles.summary}>
                To reach your target, you'll need to {weight > targetWeight ? 'lose' : 'gain'} {rate} lbs/week for ~{weeks} weeks.
              </Text>
            </View>

            <DietMethodSelector dietMethod={dietMethod} onChange={(m) => { setDietMethod(m); saveField('dietMethod', m); }} />

            <PreferencesSection
              dietaryPreference={dietaryPreference}
              dietaryRestriction={dietaryRestriction}
              onChangePreference={(p) => { setDietaryPreference(p); saveField('dietaryPreference', p); }}
              onChangeRestriction={(r) => { setDietaryRestriction(r); saveField('dietaryRestriction', r); }}
            />

            <View style={styles.card}>
              <Text style={styles.label}>Workout Tailoring</Text>
              <Text style={styles.summary}>
                Your selected goal will be used to shape your upcoming workout program structure — intensity, volume, rest days, and progression.
              </Text>
            </View>

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
  scroll: { paddingTop: 16, paddingBottom: 48, paddingHorizontal: 16 },
  heading: { fontSize: 22, color: '#fff', marginBottom: 16, fontWeight: '600' },
  card: { backgroundColor: '#1f1f1f', borderRadius: 16, padding: 16, marginBottom: 20 },
  label: { color: '#fff', fontSize: 16, marginBottom: 8 },
  value: { color: '#fff', marginTop: 8 },
  warning: { color: '#ff6b6b', marginTop: 8 },
  summary: { color: '#aaa', marginTop: 8, fontSize: 13 },
});

export default GoalSettingsScreen;
