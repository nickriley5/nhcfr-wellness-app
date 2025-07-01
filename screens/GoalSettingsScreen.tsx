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

const GoalSettingsScreen = () => {
  const uid = auth.currentUser?.uid;
  const [weight, setWeight] = useState(0);
  const [targetWeight, setTargetWeight] = useState(0);
  const [rate, setRate] = useState(1.0);
  const [goalType, setGoalType] = useState<'fat_loss' | 'maintain' | 'muscle_gain'>('fat_loss');
  const [dietMethod, setDietMethod] = useState<'standard' | 'zone' | 'custom'>('standard');
  const [dietaryPreference, setDietaryPreference] = useState<'none' | 'carnivore' | 'paleo' | 'vegetarian' | 'vegan'>('none');
  const [dietaryRestriction, setDietaryRestriction] = useState<'none' | 'gluten_free' | 'dairy_free' | 'low_fodmap'>('none');

  useEffect(() => {
    if (!uid) return;
    const fetch = async () => {
      const ref = doc(db, 'users', uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const d = snap.data();
        if (d.weight) setWeight(d.weight);
        if (d.targetWeight) setTargetWeight(d.targetWeight);
        if (d.goalType) setGoalType(d.goalType);
        if (d.dietMethod) setDietMethod(d.dietMethod);
        if (d.dietaryPreference) setDietaryPreference(d.dietaryPreference);
        if (d.dietaryRestriction) setDietaryRestriction(d.dietaryRestriction);
      }
    };
    fetch();
  }, [uid]);

  const saveField = async (field: string, value: any) => {
    if (uid) await setDoc(doc(db, 'users', uid), { [field]: value }, { merge: true });
  };

  const weightDiff = Math.abs(targetWeight - weight);
  const weeks = rate > 0 ? Math.ceil(weightDiff / rate) : 0;
  const endDate = addDays(new Date(), weeks * 7);

  // Calorie estimate: Mifflin-St Jeor formula-ish approximation
  const baseCalories = 12 * weight;
  const adjustment = goalType === 'muscle_gain' ? 250 : goalType === 'fat_loss' ? -500 : 0;
  const calorieTarget = Math.round(baseCalories + adjustment);

  const proteinGrams = Math.round(weight * 1);
  const fatGrams = Math.round((calorieTarget * 0.25) / 9);
  const carbGrams = Math.round((calorieTarget - (proteinGrams * 4 + fatGrams * 9)) / 4);

  const zoneBlocks = {
    protein: Math.round(proteinGrams / 7),
    carbs: Math.round(carbGrams / 9),
    fats: Math.round(fatGrams / 1.5),
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f0f0f' }}>
      <LinearGradient colors={['#0f0f0f', '#1a1a1a']} style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.heading}>Set Your Goal</Text>

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

            {/* DIET METHOD */}
            <View style={styles.card}>
              <Text style={styles.label}>Diet Strategy</Text>
              <View style={styles.optionsRow}>
                {['standard', 'zone', 'custom'].map((method) => (
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
                {dietMethod === 'custom' && 'You’ll enter your own custom macros manually.'}
              </Text>
            </View>

            {/* MACRO CALCULATOR CARD */}
            <View style={styles.card}>
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
            </View>

            {/* DIETARY PREFERENCES */}
            <View style={styles.card}>
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
              <View style={[styles.optionsRow, { justifyContent: 'flex-start' }]}>
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
            </View>

            {/* RESTRICTIONS */}
            <View style={styles.card}>
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
            </View>

            {/* WORKOUT TAILORING CARD */}
            <View style={styles.card}>
              <Text style={styles.label}>Workout Tailoring</Text>
              <Text style={styles.summary}>
                Your selected goal will be used to shape your upcoming workout program structure — intensity, volume, rest days, and progression.
              </Text>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
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
    width: '30%',
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
});

export default GoalSettingsScreen;
