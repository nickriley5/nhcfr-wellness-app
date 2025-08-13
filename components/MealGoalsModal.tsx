import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface MealGoalsModalProps {
  visible: boolean;
  currentWeight: number;
  onClose: () => void;
  onSaved: () => void;
}

const goals = ['Fat Loss', 'Muscle Gain', 'Recomp', 'Maintenance'] as const;
const stylesList = ['Balanced', 'Paleo', 'Keto', 'Low Carb', 'High Protein'] as const;
const restrictionsList = ['Gluten-free', 'Dairy-free', 'Vegan', 'Vegetarian', 'Low FODMAP', 'Nut-free'] as const;
const frequencies = ['2 meals/day', '3 meals/day', '3 + snack', '4 meals/day'] as const;

const MealGoalsModal: React.FC<MealGoalsModalProps> = ({ visible, currentWeight, onClose, onSaved }) => {
  const [goal, setGoal] = useState('');
  const [targetWeight, setTargetWeight] = useState(currentWeight);
  const [rate, setRate] = useState(1);
  const [estDate, setEstDate] = useState('');
  const [mealStyle, setMealStyle] = useState('');
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [mealFrequency, setMealFrequency] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);

  const isLoss = goal === 'Fat Loss';
  const maxRate = isLoss ? 1.5 : 1.0;

  useEffect(() => {
    const delta = Math.abs(targetWeight - currentWeight);
    const weeks = rate > 0 ? Math.ceil(delta / rate) : 0;
    const projected = new Date();
    projected.setDate(projected.getDate() + weeks * 7);
    setEstDate(projected.toLocaleDateString());
  }, [rate, targetWeight, goal, currentWeight]);

  const toggleRestriction = (item: string) => {
    setRestrictions(prev =>
      prev.includes(item) ? prev.filter(r => r !== item) : [...prev, item]
    );
  };

  const isComplete = goal && targetWeight && rate && mealStyle;

  const savePreferences = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !isComplete) {return;}
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', uid), {
        preferences: {
          nutrition: {
            goal,
            targetWeight,
            weeklyRate: rate,
            estimatedDate: estDate,
            mealStyle,
            restrictions,
            mealFrequency,
          },
        },
      });
      onSaved();
    } catch (err) {
      console.error('Error saving meal goals:', err);
    } finally {
      setSaving(false);
    }
  };

  const renderOptions = (label: string, values: readonly string[], selected: string, setter: (val: string) => void) => (
    <View style={styles.block}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionRow}>
        {values.map(v => (
          <Pressable
            key={v}
            onPress={() => setter(v)}
            style={[styles.option, selected === v && styles.selected]}
          >
            <Text style={styles.optionText}>{v}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>🍽️ Set Meal Plan Goals</Text>

            {renderOptions('Nutrition Goal', goals, goal, setGoal)}

            <View style={styles.block}>
              <Text style={styles.label}>Target Weight: {targetWeight} lbs</Text>
              <Slider
                minimumValue={currentWeight - 30}
                maximumValue={currentWeight + 30}
                step={1}
                value={targetWeight}
                onValueChange={setTargetWeight}
                minimumTrackTintColor="#d32f2f"
              />
            </View>

            <View style={styles.block}>
              <Text style={styles.label}>Weekly Rate: {rate.toFixed(1)} lbs/week</Text>
              <Slider
                minimumValue={0.25}
                maximumValue={maxRate}
                step={0.1}
                value={rate}
                onValueChange={setRate}
                minimumTrackTintColor={rate > maxRate * 0.8 ? '#ff9800' : '#4fc3f7'}
              />
              {rate > (isLoss ? 1.2 : 0.8) && (
                <Text style={styles.warning}>⚠️ Rapid changes may impact health or performance</Text>
              )}
            </View>

            <Text style={styles.projected}>📅 Estimated Completion: {estDate}</Text>

            <Pressable onPress={() => setShowAdvanced(!showAdvanced)}>
              <Text style={styles.advancedToggle}>{showAdvanced ? 'Hide' : 'Show'} Meal Preferences</Text>
            </Pressable>

            {showAdvanced && (
              <>
                {renderOptions('Meal Style', stylesList, mealStyle, setMealStyle)}
                {renderOptions('Meal Frequency', frequencies, mealFrequency, setMealFrequency)}
                <View style={styles.block}>
                  <Text style={styles.label}>Dietary Restrictions</Text>
                  <View style={styles.optionRow}>
                    {restrictionsList.map(r => (
                      <Pressable
                        key={r}
                        onPress={() => toggleRestriction(r)}
                        style={[styles.option, restrictions.includes(r) && styles.selected]}
                      >
                        <Text style={styles.optionText}>{r}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </>
            )}

            <Pressable
              style={[styles.saveButton, !isComplete && styles.disabled]}
              onPress={savePreferences}
              disabled={saving || !isComplete}
            >
              <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save Meal Plan'}</Text>
            </Pressable>

            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center' },
  modal: { backgroundColor: '#1e1e2e', margin: 20, borderRadius: 12, padding: 20 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  label: { color: '#aaa', fontSize: 14, marginBottom: 6 },
  block: { marginBottom: 16 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selected: { backgroundColor: '#d32f2f' },
  optionText: { color: '#fff', fontSize: 14 },
  warning: { color: '#ffd54f', fontSize: 12, marginTop: 4 },
  projected: { textAlign: 'center', color: '#4fc3f7', fontSize: 14, marginBottom: 12 },
  advancedToggle: {
    color: '#4fc3f7',
    textAlign: 'center',
    marginBottom: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4fc3f7',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  saveText: { fontWeight: '700', color: '#000', fontSize: 16 },
  disabled: { opacity: 0.5 },
  cancelButton: { alignItems: 'center', marginTop: 14 },
  cancelText: { color: '#aaa', fontSize: 14 },
  scrollContent: { paddingBottom: 20 },
});

export default MealGoalsModal;
