// screens/MacroCalculatorScreen.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';

import {
  calculateBMR,
  calculateTDEE,
  calculateMacros,
} from '../utils/macroCalculator';

import { useAuth } from '../providers/AuthProvider';
import type { RootStackParamList } from '../App';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Nav = NativeStackNavigationProp<RootStackParamList, 'MacroCalculator'>;

const MacroCalculatorScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { userProfile } = useAuth();

  const [activity, setActivity] = useState(1.4); // default: light
  const [goalType, setGoalType] = useState<'Lose' | 'Maintain' | 'Gain'>('Maintain');
  const [rateMode, setRateMode] = useState<'lbs' | 'bf%'>('lbs');
  const [rate, setRate] = useState(1); // either lbs/week or % bf/week
  const [dietStyle, setDietStyle] = useState<'Standard' | 'Zone' | 'Custom'>('Standard');
  const [customMacros, setCustomMacros] = useState({
    protein: 30,
    carbs: 40,
    fat: 30,
  });

  const overrideWarning = useMemo(() => {
    return (
      (rateMode === 'lbs' && rate > 2) ||
      (rateMode === 'bf%' && rate > 2)
    );
  }, [rate, rateMode]);

  // Convert units
  const heightCm = userProfile?.height ? userProfile.height * 2.54 : undefined;
  const weightKg = userProfile?.weight ? userProfile.weight * 0.453592 : undefined;

  const leanMassKg = weightKg && userProfile?.bodyFat !== undefined
    ? weightKg * (1 - userProfile.bodyFat / 100)
    : undefined;

  const zoneBlocks = useMemo(() => {
    if (dietStyle !== 'Zone' || !leanMassKg) {
      return null;
    }
    const proteinGrams = leanMassKg * 1.8; // ~0.8g/lb lean mass
    const blocks = Math.round(proteinGrams / 7);
    return {
      blocks,
      protein: blocks * 7,
      carbs: blocks * 9,
      fat: blocks * 1.5,
    };
  }, [dietStyle, leanMassKg]);

  const macroSplit = useMemo(() => {
    if (dietStyle === 'Zone') {
      return { protein: 0.3, carbs: 0.4, fat: 0.3 };
    }
    if (dietStyle === 'Custom') {
      const total = customMacros.protein + customMacros.carbs + customMacros.fat;
      return {
        protein: customMacros.protein / total,
        carbs: customMacros.carbs / total,
        fat: customMacros.fat / total,
      };
    }
    return { protein: 0.3, carbs: 0.4, fat: 0.3 }; // Standard
  }, [dietStyle, customMacros]);

  console.log('MacroCalculator - User Profile:', {
    exists: !!userProfile,
    age: userProfile?.age,
    sex: userProfile?.sex,
    weight: userProfile?.weight,
    height: userProfile?.height,
  });

  if (
    !userProfile ||
    userProfile.age === undefined ||
    !userProfile.sex ||
    !userProfile.weight ||
    !userProfile.height
  ) {
    const missing = [];
    if (!userProfile) missing.push('entire profile');
    else {
      if (userProfile.age === undefined) missing.push('age');
      if (!userProfile.sex) missing.push('sex');
      if (!userProfile.weight) missing.push('weight');
      if (!userProfile.height) missing.push('height');
    }
    
    console.log('MacroCalculator - Missing fields:', missing);
    
    return (
      <View style={styles.center}>
        <Text style={styles.warn}>
          Please complete your profile first.
        </Text>
        <Text style={styles.warnDetail}>
          Missing: {missing.join(', ')}
        </Text>
        <Pressable 
          style={[styles.backBtn, { marginTop: 16 }]} 
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.backTxt}>Complete Profile</Text>
        </Pressable>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backTxt}>Back</Text>
        </Pressable>
      </View>
    );
  }

  const bmr = calculateBMR({
    age: userProfile.age,
    sex: userProfile.sex,
    height: heightCm!,
    weight: weightKg!,
  });

  const tdee = calculateTDEE(bmr, activity);
  const macros = calculateMacros(tdee, goalType, rateMode === 'lbs' ? rate : 0, macroSplit);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40, backgroundColor: '#0f0f0f' }}>
        <Text style={styles.h1}>Macro Calculator</Text>

      {/* Activity Slider */}
      <Text style={styles.label}>Activity Factor: {activity.toFixed(2)}</Text>
      <Slider
        minimumValue={1.2}
        maximumValue={1.9}
        step={0.05}
        value={activity}
        onValueChange={setActivity}
      />

      {/* Goal Type Buttons */}
      <View style={styles.row}>
        {(['Lose', 'Maintain', 'Gain'] as const).map((g) => (
          <Pressable
            key={g}
            style={[styles.goalBtn, goalType === g && styles.goalBtnActive]}
            onPress={() => setGoalType(g)}
          >
            <Text style={[styles.goalTxt, goalType === g && styles.goalTxtActive]}>{g}</Text>
          </Pressable>
        ))}
      </View>

      {/* Rate Unit Toggle */}
      {goalType === 'Lose' && userProfile.bodyFat !== undefined && (
        <View style={styles.row}>
          <Text style={styles.label}>Track loss by:</Text>
          <View style={styles.row}>
            {(['lbs', 'bf%'] as const).map((unit) => (
              <Pressable
                key={unit}
                style={[styles.goalBtn, rateMode === unit && styles.goalBtnActive]}
                onPress={() => setRateMode(unit)}
              >
                <Text style={[styles.goalTxt, rateMode === unit && styles.goalTxtActive]}>
                  {unit === 'lbs' ? 'lbs/week' : '% body fat/week'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Rate Slider */}
      {goalType !== 'Maintain' && (
        <View style={styles.row}>
          <Text style={styles.label}>
            Rate: {rate.toFixed(2)} {rateMode === 'lbs' ? 'lbs/wk' : '% bf/wk'}
          </Text>
          <Slider
            minimumValue={rateMode === 'lbs' ? 0.25 : 0.5}
            maximumValue={rateMode === 'lbs' ? 2 : 3}
            step={0.05}
            value={rate}
            onValueChange={setRate}
          />
        </View>
      )}

      {/* ⚠️ Rapid warning */}
      {overrideWarning && (
        <Text style={[styles.warn, styles.warnRapid]}>
          ⚠ Rapid fat loss can cause muscle loss and rebound. Consider a slower rate.
        </Text>
      )}

      {/* Diet Style Toggle */}
      <Text style={styles.label}>Diet Style:</Text>
      <View style={styles.row}>
        {(['Standard', 'Zone', 'Custom'] as const).map((style) => (
          <Pressable
            key={style}
            style={[styles.goalBtn, dietStyle === style && styles.goalBtnActive]}
            onPress={() => setDietStyle(style)}
          >
            <Text style={[styles.goalTxt, dietStyle === style && styles.goalTxtActive]}>
              {style}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Custom Macro Sliders */}
      {dietStyle === 'Custom' && (
        <View>
          {(['protein', 'carbs', 'fat'] as const).map((macro) => (
            <View key={macro} style={styles.row}>
              <Text style={styles.label}>
                {macro.toUpperCase()}: {customMacros[macro]}%
              </Text>
              <Slider
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={customMacros[macro]}
                onValueChange={(val: number) => {
                  setCustomMacros((prev: { protein: number; carbs: number; fat: number }) => ({ ...prev, [macro]: val }));
                }}
              />
            </View>
          ))}
          {/* Total Check */}
          {customMacros.protein + customMacros.carbs + customMacros.fat !== 100 && (
            <Text style={[styles.warn, styles.error]}>
              Macro ratios must total 100%.
            </Text>
          )}
        </View>
      )}

      {/* Results */}
      <View style={styles.results}>
        <Text style={styles.resultsTxt}>Calories: {Math.round(macros.calories)} kcal</Text>
        <Text style={styles.resultsTxt}>Protein: {Math.round(macros.protein)}g</Text>
        <Text style={styles.resultsTxt}>Carbs: {Math.round(macros.carbs)}g</Text>
        <Text style={styles.resultsTxt}>Fat: {Math.round(macros.fat)}g</Text>

        {zoneBlocks && (
          <View style={styles.zoneBlockContainer}>
            <Text style={styles.resultsTxt}>
              Zone Blocks: {zoneBlocks.blocks}
            </Text>
            <Text style={styles.resultsTxt}>
              (Protein: {zoneBlocks.protein}g, Carbs: {zoneBlocks.carbs}g, Fat: {zoneBlocks.fat}g)
            </Text>
          </View>
        )}
      </View>

      <Pressable style={styles.saveBtn} onPress={() => {
        Alert.alert('Coming Soon', 'Saving to Firestore not implemented yet.');
      }}>
        <Text style={styles.saveTxt}>Save & Generate Plan</Text>
      </Pressable>
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#0f0f0f', flex: 1 },
  center   : { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#0f0f0f' },
  h1       : { fontSize: 24, fontWeight: '700', marginBottom: 24, color: '#fff' },
  label    : { color: '#fff', marginBottom: 8 },
  row      : { marginBottom: 20 },

  goalBtn       : { marginRight: 8, padding: 10, borderWidth: 1, borderColor: '#666', borderRadius: 6 },
  goalBtnActive : { backgroundColor: '#d32f2f', borderColor: '#d32f2f' },
  goalTxt       : { color: '#fff' },
  goalTxtActive : { color: '#fff', fontWeight: '700' },

  warn     : { color: '#f39c12', marginVertical: 8 },
  warnDetail: { color: '#f39c12', fontSize: 14, marginTop: 4 },
  warnRapid: { color: '#f39c12' },
  error    : { color: '#e74c3c' },
  results  : { marginTop: 24, padding: 20, backgroundColor: '#222', borderRadius: 8 },
  resultsTxt: { color: '#fff', marginBottom: 4 },

  zoneBlockContainer: { marginTop: 12 },

  saveBtn : { marginTop: 32, backgroundColor: '#d32f2f', padding: 14, borderRadius: 8 },
  saveTxt : { color: '#fff', textAlign: 'center', fontWeight: '600' },

  backBtn : { padding: 10, borderWidth: 1, borderColor: '#888', borderRadius: 6 },
  backTxt : { color: '#fff' },
});

export default MacroCalculatorScreen;
