// GoalSettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Slider from '@react-native-community/slider';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { format, addDays } from 'date-fns';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

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
      if (d.dietMethod) {setDietMethod(d.dietMethod);}
      if (d.activityLevel) {setActivityLevel(d.activityLevel);}
      if (d.name) {setUserProfile({ name: d.name });}
    }
  };

  fetch();
}, [uid]);


  useEffect(() => {
  const activityMultiplierMap = {
    sedentary: 12,
    light: 13,
    moderate: 14,
    very_active: 15,
  };

  const multiplier = activityMultiplierMap[activityLevel] || 1.2;
  const baseCalories = multiplier * weight;

  const calorieAdjustment =
    rate * 500 * (goalType === 'fat_loss' ? -1 : goalType === 'muscle_gain' ? 1 : 0);

  const cals = Math.round(baseCalories + calorieAdjustment);
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
    if (uid) {await setDoc(doc(db, 'users', uid), { [field]: value }, { merge: true });}
  };

  const weightDiff = Math.abs(targetWeight - weight);
  const weeks = rate > 0 ? Math.ceil(weightDiff / rate) : 0;
  const endDate = addDays(new Date(), weeks * 7);

  const handleGenerateMealPlan = async () => {
  try {

  if (!uid) {return;}

    const mealPlanData = {
      calorieTarget,
      proteinGrams,
      fatGrams,
      carbGrams,
      zoneBlocks,
      dietMethod,
      goalType: goalType as 'maintain' | 'fatloss' | 'muscle',
      name: userProfile?.name || 'Firefighter',
    };

    // Write to Firestore
    await setDoc(doc(db, 'users', uid, 'mealPlan', 'active'), mealPlanData);

    // Navigate to overview screen
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

            {/* GOAL TYPE */}
            <View style={styles.card}>
              <Text style={styles.label}>Goal Focus</Text>
              <View style={styles.optionsRow}>
                {['fat_loss', 'maintain', 'muscle_gain'].map((type) => (
                  <Pressable
                    key={type}
                    style={[styles.optionButton, goalType === type && styles.activeOption]}
                    onPress={() => { setGoalType(type as any); saveField('goalType', type); }}
                  >
                    <Ionicons name={type === 'fat_loss' ? 'flame' : type === 'maintain' ? 'body' : 'barbell'} size={24} color="#fff" />
                    <Text style={styles.optionText}>{type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.summary}>You’re currently focused on {goalType.replace('_', ' ')}</Text>
            </View>

            {/* WEIGHT INPUT */}
            <View style={styles.card}>
              <Text style={styles.label}>Current Weight (lbs)</Text>
              <TextInput
                keyboardType="numeric"
                value={weight.toString()}
                onChangeText={(val) => setWeight(parseFloat(val) || 0)}
                onBlur={() => saveField('weight', weight)}
                style={styles.input}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Target Weight (lbs)</Text>
              <TextInput
                keyboardType="numeric"
                value={targetWeight.toString()}
                onChangeText={(val) => setTargetWeight(parseFloat(val) || 0)}
                onBlur={() => saveField('targetWeight', targetWeight)}
                style={styles.input}
              />
            </View>

            {/* ACTIVITY LEVEL */}
<View style={styles.card}>
  <View style={styles.cardHeader}>
    <Text style={styles.label}>Activity Level</Text>
    <Pressable onPress={() => setShowActivityInfo(!showActivityInfo)}>
      <Ionicons name="help-circle-outline" size={20} color="#aaa" />
    </Pressable>
  </View>

  <View style={styles.optionsRow}>
    {[
      { key: 'sedentary', label: 'Sedentary' },
      { key: 'light', label: 'Light' },
      { key: 'moderate', label: 'Moderate' },
      { key: 'very_active', label: 'Very Active' },
    ].map(({ key, label }) => (
      <Pressable
        key={key}
        style={[styles.optionButton, activityLevel === key && styles.activeOption]}
        onPress={() => {
          setActivityLevel(key as any);
          saveField('activityLevel', key);
        }}
      >
        <Text style={styles.optionText}>{label}</Text>
      </Pressable>
    ))}
  </View>

  {showActivityInfo && (
    <Text style={styles.summary}>
      Choose the level that best matches your daily lifestyle:{'\n\n'}
      • <Text style={{ fontWeight: '700' as const }}>Sedentary</Text>: Desk job, minimal daily movement{'\n'}
      • <Text style={{ fontWeight: '700' as const }}>Light</Text>: Regular walking, light household tasks{'\n'}
      • <Text style={{ fontWeight: '700' as const }}>Moderate</Text>: Manual job or workouts 3–4x/week{'\n'}
      • <Text style={{ fontWeight: '700' as const }}>Very Active</Text>: Intense training or daily physical labor{'\n\n'}
      🔥 Firefighting doesn’t count unless you’re actively training or operating on scene.
    </Text>
  )}
</View>


            {/* RATE */}
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


            {/* DIET METHOD */}
            <View style={styles.card}>
              <Text style={styles.label}>Diet Strategy</Text>
              <View style={styles.optionsRow}>
                {['standard', 'zone'].map((method) => (
                  <Pressable
                    key={method}
                    style={[styles.optionButton, dietMethod === method && styles.activeOption]}
                    onPress={() => { setDietMethod(method as any); saveField('dietMethod', method); }}
                  >
                    <Ionicons name={method === 'standard' ? 'stats-chart' : method === 'zone' ? 'grid' : 'create'} size={24} color="#fff" />
                    <Text style={styles.optionText}>{method.charAt(0).toUpperCase() + method.slice(1)}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.summary}>
                {dietMethod === 'standard' && 'Macros will follow a standard evidence-based formula.'}
                {dietMethod === 'zone' && 'Macros follow 40/30/30 block ratios for carbs, protein, and fat.'}
              </Text>
            </View>



            {/* MACRO CALCULATOR CARD */}
            {/* <View style={styles.card}>
              <Text style={styles.label}>Estimated Macros</Text>
              <Text style={styles.value}>Calories: {calorieTarget} kcal/day</Text>
              <Text style={styles.value}>Protein: {proteinGrams}g</Text>
              <Text style={styles.value}>Carbs: {carbGrams}g</Text>
              <Text style={styles.value}>Fats: {fatGrams}g</Text>
              {dietMethod === 'zone' && (
                <Text style={styles.summary}>
                  Zone Blocks – Protein: {zoneBlocks.protein} | Carbs: {zoneBlocks.carbs} | Fats: {zoneBlocks.fats}
                </Text>
              )}
            </View> */}

            {/* DIETARY PREFERENCES */}
            <View style={styles.card}>
              <Text style={styles.label}>Nutrition Preferences</Text>
              <Text style={styles.placeholderText}>
                Dietary preferences and restrictions will be available in a future update to personalize meal planning and nutrition recommendations.
              </Text>
            </View>
            {/* <View style={styles.card}>
              <Text style={styles.label}>Dietary Preference</Text>
              <View style={styles.optionsRow}>
                {['none', 'carnivore', 'paleo'].map((pref) => (
                  <Pressable
                    key={pref}
                    style={[styles.optionButton, dietaryPreference === pref && styles.activeOption]}
                    onPress={() => { setDietaryPreference(pref as any); saveField('dietaryPreference', pref); }}
                  >
                    <Text style={styles.optionText}>{pref.charAt(0).toUpperCase() + pref.slice(1)}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={[styles.optionsRow, styles.justifyFlexStart]}>
                {['vegetarian', 'vegan'].map((pref) => (
                  <Pressable
                    key={pref}
                    style={[styles.optionButton, dietaryPreference === pref && styles.activeOption]}
                    onPress={() => { setDietaryPreference(pref as any); saveField('dietaryPreference', pref); }}
                  >
                    <Text style={styles.optionText}>{pref.charAt(0).toUpperCase() + pref.slice(1)}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.summary}>Preferences help shape future recipe suggestions.</Text>
            </View> */}

            {/* RESTRICTIONS */}
            {/* <View style={styles.card}>
              <Text style={styles.label}>Dietary Restrictions</Text>
              <View style={styles.optionsRow}>
                {['none', 'gluten_free', 'dairy_free', 'low_fodmap'].map((r) => (
                  <Pressable
                    key={r}
                    style={[styles.optionButton, dietaryRestriction === r && styles.activeOption]}
                    onPress={() => { setDietaryRestriction(r as any); saveField('dietaryRestriction', r); }}
                  >
                    <Text style={styles.optionText}>
                      {r.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.summary}>Restrictions will be used to filter future recipes.</Text>
            </View> */}

            {/* WORKOUT TAILORING CARD */}
            <View style={styles.card}>
              <Text style={styles.label}>Workout Tailoring</Text>
              <Text style={styles.summary}>
                Your selected goal will be used to shape your upcoming workout program structure — intensity, volume, rest days, and progression.
              </Text>
            </View>

            <Pressable
  style={[styles.optionButton, styles.generatePlanButton]}
  onPress={async () => {
  await handleGenerateMealPlan();// ✅ go to Meal Plan tab
}}

>
  <Text style={styles.generatePlanText}>Generate My Plan</Text>
</Pressable>





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
  input: { backgroundColor: '#2a2a2a', color: '#fff', padding: 12, borderRadius: 8, fontSize: 16 },
  value: { color: '#fff', marginTop: 8 },
  warning: { color: '#ff6b6b', marginTop: 8 },
  summary: { color: '#aaa', marginTop: 8, fontSize: 13 },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  optionButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2c2c2c',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 8,
    minWidth: '23%',
    flexGrow: 1,
    textAlign: 'center',
  },
  activeOption: {
    backgroundColor: '#ff3b30',
  },
  optionText: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
    flexWrap: 'nowrap',
    marginTop: 4,
  },
  justifyFlexStart: {
    justifyContent: 'flex-start',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    lineHeight: 20,
  },
  generatePlanButton: {
    backgroundColor: '#ff3c3c',
    alignSelf: 'center',
    paddingVertical: 14,
    marginTop: 12,
  },
  generatePlanText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});


export default GoalSettingsScreen;
