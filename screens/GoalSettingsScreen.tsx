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

  const weightDiff = Math.abs(targetWeight - weight);
  const weeks = rate > 0 ? Math.ceil(weightDiff / rate) : 0;
  const endDate = addDays(new Date(), weeks * 7);

  const saveField = async (field: string, value: any) => {
    if (uid) await setDoc(doc(db, 'users', uid), { [field]: value }, { merge: true });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f0f0f' }}>
      <LinearGradient colors={['#0f0f0f', '#1a1a1a']} style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.heading}>Set Your Goal</Text>

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
              {rate > 1.5 && (
                <Text style={styles.warning}>⚠️ Rapid weight change can impact performance and recovery.</Text>
              )}
              <Text style={styles.value}>Estimated Completion Date: {format(endDate, 'PPP')}</Text>
              <Text style={styles.summary}>
                To reach your target, you'll need to {weight > targetWeight ? 'lose' : 'gain'} {rate} lbs/week for approximately {weeks} weeks.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Goal Focus</Text>
              <View style={styles.optionsRow}>
                {['fat_loss', 'maintain', 'muscle_gain'].map((type) => (
                  <Pressable
                    key={type}
                    style={[styles.optionButton, goalType === type && styles.activeOption]}
                    onPress={() => { setGoalType(type as any); saveField('goalType', type); }}
                  >
                    <Ionicons
                      name={type === 'fat_loss' ? 'flame' : type === 'maintain' ? 'body' : 'barbell'}
                      size={24}
                      color="#fff"
                    />
                    <Text style={styles.optionText}>
                      {type === 'fat_loss' ? 'Fat Loss' : type === 'maintain' ? 'Maintain' : 'Muscle Gain'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.summary}>
                You’re currently focused on {goalType === 'fat_loss' ? 'Fat Loss' : goalType === 'maintain' ? 'Maintenance' : 'Muscle Gain'}.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Diet Strategy</Text>
              <View style={styles.optionsRow}>
                {['standard', 'zone', 'custom'].map((method) => (
                  <Pressable
                    key={method}
                    style={[styles.optionButton, dietMethod === method && styles.activeOption]}
                    onPress={() => { setDietMethod(method as any); saveField('dietMethod', method); }}
                  >
                    <Ionicons
                      name={method === 'standard' ? 'stats-chart' : method === 'zone' ? 'grid' : 'create'}
                      size={24}
                      color="#fff"
                    />
                    <Text style={styles.optionText}>
                      {method === 'standard' ? 'Standard' : method === 'zone' ? 'Zone' : 'Custom'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.summary}>
                {dietMethod === 'standard' && 'Macros will follow a standard evidence-based formula.'}
                {dietMethod === 'zone' && 'Macros will follow the 40/30/30 Zone Diet structure.'}
                {dietMethod === 'custom' && 'You’ll enter your own custom macros manually.'}
              </Text>
            </View>

            <View style={styles.card}>
  <Text style={styles.label}>Dietary Preference</Text>
  <View style={styles.optionsRow}>
    {['none', 'carnivore', 'paleo'].map((pref) => (
      <Pressable
        key={pref}
        style={[
          styles.optionButton,
          dietaryPreference === pref && styles.activeOption,
        ]}
        onPress={() => {
          setDietaryPreference(pref as any);
          saveField('dietaryPreference', pref);
        }}
      >
        <Text style={styles.optionText}>
          {pref.charAt(0).toUpperCase() + pref.slice(1)}
        </Text>
      </Pressable>
    ))}
  </View>
  <View style={[styles.optionsRow, { justifyContent: 'flex-start' }]}>
    {['vegetarian', 'vegan'].map((pref) => (
      <Pressable
        key={pref}
        style={[
          styles.optionButton,
          dietaryPreference === pref && styles.activeOption,
        ]}
        onPress={() => {
          setDietaryPreference(pref as any);
          saveField('dietaryPreference', pref);
        }}
      >
        <Text style={styles.optionText}>
          {pref.charAt(0).toUpperCase() + pref.slice(1)}
        </Text>
      </Pressable>
    ))}
  </View>
  <Text style={styles.summary}>
    Your preference will help guide food suggestions and recipe ideas in future
    features.
  </Text>
</View>


            <View style={styles.card}>
              <Text style={styles.label}>Dietary Restrictions</Text>
              <View style={styles.optionsRow}>
                {['none', 'gluten_free', 'dairy_free', 'low_fodmap'].map((restriction) => (
                  <Pressable
                    key={restriction}
                    style={[styles.optionButton, dietaryRestriction === restriction && styles.activeOption]}
                    onPress={() => { setDietaryRestriction(restriction as any); saveField('dietaryRestriction', restriction); }}
                  >
                    <Text style={styles.optionText}>
                      {restriction.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.summary}>
                Your restriction will help guide food suggestions and recipe ideas in future features.
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
