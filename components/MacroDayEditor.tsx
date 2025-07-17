import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import Slider from '@react-native-community/slider';
import styles from '../styles/MacroPlanOverview.styles';

export function generateDayMacrosMacroFactorStyle(
  totalCalories: number,
  proteinG: number,
  carbSplitPct: number // carbs% of leftover; fats auto = 100 - carbs
) {
  const proteinCal = proteinG * 4;
  const remainingCal = Math.max(totalCalories - proteinCal, 0);

  const carbCalExact = remainingCal * (carbSplitPct / 100);
  const fatCalExact = remainingCal * ((100 - carbSplitPct) / 100);

  const carbsG = Math.round(carbCalExact / 4);
  const fatG = Math.round(fatCalExact / 9);

  const proteinPctExact = (proteinCal / totalCalories) * 100;
  const carbsPctExact = (carbCalExact / totalCalories) * 100;

  const roundedProteinPct = Math.round(proteinPctExact);
  const roundedCarbsPct = Math.round(carbsPctExact);
  const roundedFatsPct = Math.max(100 - roundedProteinPct - roundedCarbsPct, 0);

  return {
    protein: proteinG,
    carbs: carbsG,
    fat: fatG,
    calories: totalCalories,
    percentages: {
      proteinPct: roundedProteinPct,
      carbsPct: roundedCarbsPct,
      fatsPct: roundedFatsPct,
    },
  };
}

interface MacroDayEditorProps {
  selectedDay: string;
  currentCalories: number;
  currentProtein: number;
  currentCarbPct: number;
  onApply: (
    protein: number,
    carbs: number,
    fat: number,
    calories: number,
    applyToAll?: boolean
  ) => void;
}


const MacroDayEditor: React.FC<MacroDayEditorProps> = ({
  selectedDay,
  currentCalories,
  currentProtein,
  currentCarbPct,
  onApply,
}) => {
  const [calories, setCalories] = useState(currentCalories);
  const [protein, setProtein] = useState(currentProtein);
  const [carbPct, setCarbPct] = useState(currentCarbPct);

  const [macros, setMacros] = useState(
    generateDayMacrosMacroFactorStyle(currentCalories, currentProtein, currentCarbPct)
  );

  useEffect(() => {
  setCalories(currentCalories);
  setProtein(currentProtein);
  setCarbPct(currentCarbPct);
}, [selectedDay, currentCalories, currentProtein, currentCarbPct]);

  useEffect(() => {
    const updated = generateDayMacrosMacroFactorStyle(calories, protein, carbPct);
    setMacros(updated);
  }, [calories, protein, carbPct]);

  return (
    <View style={styles.editCard}>
      {/* Section Header */}
      <Text style={styles.editTitle}>Edit {selectedDay} Plan</Text>

      {/* Calories Input */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sliderLabel}>Target Calories</Text>
        <TextInput
          style={styles.numberInput}
          keyboardType="numeric"
          value={String(calories)}
          onChangeText={(txt) => setCalories(parseInt(txt, 10) || 0)}
        />
      </View>

      {/* Protein Input with +/- buttons */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sliderLabel}>Protein (g)</Text>
        <View style={styles.inputRow}>
          <Pressable
            style={styles.adjustBtn}
            onPress={() => setProtein(Math.max(protein - 1, 0))}
          >
            <Text style={styles.adjustTxt}>-</Text>
          </Pressable>

          <TextInput
            style={styles.numberInput}
            keyboardType="numeric"
            value={String(protein)}
            onChangeText={(txt) => setProtein(parseInt(txt, 10) || 0)}
          />

          <Pressable
            style={styles.adjustBtn}
            onPress={() => setProtein(protein + 1)}
          >
            <Text style={styles.adjustTxt}>+</Text>
          </Pressable>
        </View>
      </View>

      {/* Quick Preset Buttons */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sliderLabel}>Carb/Fat Split Presets</Text>
        <View style={styles.inputRow}>
          <Pressable
            style={[
              styles.presetBtn,
              carbPct === 30 && styles.presetBtnActive,
            ]}
            onPress={() => setCarbPct(30)}
          >
            <Text
              style={[
                styles.presetTxt,
                carbPct === 30 && styles.presetTxtActive,
              ]}
            >
              Low-Carb
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.presetBtn,
              carbPct === 50 && styles.presetBtnActive,
            ]}
            onPress={() => setCarbPct(50)}
          >
            <Text
              style={[
                styles.presetTxt,
                carbPct === 50 && styles.presetTxtActive,
              ]}
            >
              Balanced
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.presetBtn,
              carbPct === 70 && styles.presetBtnActive,
            ]}
            onPress={() => setCarbPct(70)}
          >
            <Text
              style={[
                styles.presetTxt,
                carbPct === 70 && styles.presetTxtActive,
              ]}
            >
              High-Carb
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Carb/Fat Slider */}
      <View style={styles.sectionBlock}>
        <Text style={styles.sliderLabel}>Carbs vs Fats (remaining calories)</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          step={1}
          value={carbPct}
          onValueChange={(val: number) => setCarbPct(val)}
          minimumTrackTintColor="#81C784"
          maximumTrackTintColor="#F06292"
          thumbTintColor="#FFD54F"
        />
      </View>

      {/* Macro Preview */}
      <View style={styles.resultsPreview}>
        <Text style={styles.resultsTxt}>
          <Text style={styles.proteinColor}>Protein:</Text> {macros.protein}g ({macros.percentages.proteinPct}%) {' • '}
          <Text style={styles.carbColor}>Carbs:</Text> {macros.carbs}g ({macros.percentages.carbsPct}%) {' • '}
          <Text style={styles.fatColor}>Fat:</Text> {macros.fat}g ({macros.percentages.fatsPct}%)
        </Text>
      </View>

      {/* Apply Button */}
      {/* Apply Buttons */}
<View style={styles.editButtons}>
  {/* Apply only to selected day */}
  <Pressable
    style={styles.darkActionButton}
    onPress={() =>
      onApply(macros.protein, macros.carbs, macros.fat, macros.calories)
    }
  >
    <Text style={styles.darkActionButtonText}>✅ Apply to {selectedDay}</Text>
  </Pressable>

  {/* Apply to ALL days */}
  <Pressable
    style={styles.darkActionButton}
    onPress={() =>
      onApply(macros.protein, macros.carbs, macros.fat, macros.calories, true)
    }
  >
    <Text style={styles.darkActionButtonText}>📅 Apply to ALL Days</Text>
  </Pressable>
</View>

    </View>
  );
};

export default MacroDayEditor;
