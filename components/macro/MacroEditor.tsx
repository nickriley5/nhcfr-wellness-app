import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Slider from '@react-native-community/slider';
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
          <View key={macro} style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>{macro.charAt(0).toUpperCase() + macro.slice(1)}: {val}g</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={targetCalories / (macro === 'fat' ? 9 : 4)}
              step={1}
              value={val}
              onValueChange={(value: number) => onChange(macro, value)}
            />
          </View>
        );
      })}

      <Text style={styles.warning}>
        {saveDisabled
          ? `Total calories must equal ${targetCalories} kcal`
          : 'Ready to save'}
      </Text>

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
