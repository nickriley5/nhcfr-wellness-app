import React from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import styles from '../../styles/MacroPlanOverview.styles';

interface MacroEditorProps {
  selectedDay: string;
  protein: number;
  carbs: number;
  fat: number;
  onChange: (macro: 'protein' | 'carbs' | 'fat', value: number) => void;
  onCancel: () => void;
  onSave: () => void;
  saveDisabled: boolean;
  targetCalories: number;
}

const MacroEditor: React.FC<MacroEditorProps> = ({
  selectedDay,
  protein,
  carbs,
  fat,
  onChange,
  onCancel,
  onSave,
  saveDisabled,
  targetCalories,
}) => {
  return (
    <View style={styles.editCard}>
      <Text style={styles.editTitle}>Edit {selectedDay} Macros</Text>

      {(['protein', 'carbs', 'fat'] as const).map((macro) => {
        const val = macro === 'protein' ? protein : macro === 'carbs' ? carbs : fat;

        return (
          <View key={macro} style={styles.macroRow}>
            <Text style={styles.sliderLabel}>
              {macro.charAt(0).toUpperCase() + macro.slice(1)}: {val} g
            </Text>

            {/* ✅ New Numeric Input Row */}
            <View style={styles.inputRow}>
              {/* -1 Button */}
              <Pressable
                style={styles.adjustBtn}
                onPress={() => onChange(macro, Math.max(val - 1, 0))}
              >
                <Text style={styles.adjustTxt}>-1</Text>
              </Pressable>

              {/* Numeric Text Input */}
              <TextInput
                style={styles.numberInput}
                keyboardType="numeric"
                value={String(val)}
                onChangeText={(text) => {
                  const parsed = parseInt(text, 10) || 0;
                  onChange(macro, parsed);
                }}
              />

              {/* +1 Button */}
              <Pressable
                style={styles.adjustBtn}
                onPress={() => onChange(macro, val + 1)}
              >
                <Text style={styles.adjustTxt}>+1</Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      {/* ✅ Calories Validation */}
      <Text style={styles.warning}>
        {saveDisabled
          ? `Total calories must equal ${targetCalories} kcal`
          : 'Ready to save'}
      </Text>

      {/* ✅ Action Buttons */}
      <View style={styles.editButtons}>
        <Pressable
          style={[styles.saveButton, saveDisabled && styles.disabled]}
          disabled={saveDisabled}
          onPress={onSave}
        >
          <Text style={styles.saveText}>Save</Text>
        </Pressable>
        <Pressable onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default MacroEditor;
