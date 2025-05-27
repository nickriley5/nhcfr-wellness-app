import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
} from 'react-native';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { PerformanceGoals } from '../utils/buildProgramFromGoals';
import { generateProgramFromGoals } from '../utils/programGenerator';

interface PerformanceGoalsModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: (goals: PerformanceGoals) => void;
}

const goals = ['Lose Fat', 'Maintain', 'Build Muscle'] as const;
const stylesList = ['Strength', 'Conditioning', 'Functional', 'Mobility'] as const;
const experienceLevels = ['Beginner', 'Intermediate', 'Advanced'] as const;
const frequencies = ['3x/week', '4x/week', '5x/week', '6x/week'] as const;
const equipmentOptions = ['Dumbbells', 'Barbells', 'Bands', 'Kettlebells', 'Sled', 'Bunker Gear', 'Bodyweight'] as const;
const durations = ['4 Weeks', '6 Weeks', '8 Weeks', '12 Weeks'] as const;

const PerformanceGoalsModal: React.FC<PerformanceGoalsModalProps> = ({ visible, onClose, onSaved }) => {
  const [goalType, setGoalType] = useState('');
  const [duration, setDuration] = useState('');
  const [trainingStyle, setTrainingStyle] = useState('');
  const [firegroundReady, setFiregroundReady] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState('');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [frequency, setFrequency] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleEquipment = (item: string) => {
    setEquipment(prev =>
      prev.includes(item) ? prev.filter(e => e !== item) : [...prev, item]
    );
  };

  const isComplete = goalType && duration && trainingStyle && experienceLevel && frequency;

  const savePreferences = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !isComplete) return;
    setSaving(true);

    try {
      // Save preferences to user doc
      await updateDoc(doc(db, 'users', uid), {
        preferences: {
          performance: {
            goalType,
            duration,
            trainingStyle,
            firegroundReady,
            experienceLevel,
            frequency,
            equipment,
          },
        },
      });

      const daysPerWeek = parseInt(frequency.split('x')[0]);
      const durationWeeks = parseInt(duration.split(' ')[0]);

      const performanceGoals: PerformanceGoals = {
  focus: [trainingStyle.toLowerCase()],
  daysPerWeek,
  includeFireground: firegroundReady,
  durationWeeks,
  goalType: goalType as PerformanceGoals['goalType'],
  experienceLevel: experienceLevel as PerformanceGoals['experienceLevel'],
  equipment,
};


      const program = await generateProgramFromGoals(performanceGoals);

      await setDoc(doc(db, 'users', uid, 'program', 'active'), {
        ...program,
        createdAt: new Date().toISOString(),
        currentDay: 1,
      });

      onSaved(performanceGoals);
    } catch (err) {
      console.error('Error saving performance goals:', err);
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
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={styles.title}>🏋️ Set Performance Goals</Text>

            {renderOptions('Goal Type', goals, goalType, setGoalType)}
            {renderOptions('Program Duration', durations, duration, setDuration)}
            {renderOptions('Training Style', stylesList, trainingStyle, setTrainingStyle)}
            {renderOptions('Experience Level', experienceLevels, experienceLevel, setExperienceLevel)}

            <View style={[styles.block, { flexDirection: 'row', justifyContent: 'space-between' }]}>
              <Text style={styles.label}>Include Fireground Readiness</Text>
              <Switch value={firegroundReady} onValueChange={setFiregroundReady} />
            </View>

            <Pressable onPress={() => setShowAdvanced(!showAdvanced)}>
              <Text style={styles.advancedToggle}>
                {showAdvanced ? 'Hide' : 'Show'} Equipment & Frequency
              </Text>
            </Pressable>

            {showAdvanced && (
              <>
                {renderOptions('Training Frequency', frequencies, frequency, setFrequency)}
                <View style={styles.block}>
                  <Text style={styles.label}>Equipment Available</Text>
                  <View style={styles.optionRow}>
                    {equipmentOptions.map(e => (
                      <Pressable
                        key={e}
                        onPress={() => toggleEquipment(e)}
                        style={[styles.option, equipment.includes(e) && styles.selected]}
                      >
                        <Text style={styles.optionText}>{e}</Text>
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
              <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save Goals'}</Text>
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
});

export default PerformanceGoalsModal;
