import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import {
  PerformanceGoals,
  ProgramDay,
  buildProgramFromGoals,
} from '../utils/buildProgramFromGoals';

import { Exercise } from '../types/Exercise';


interface PerformanceGoalsModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: (goals: PerformanceGoals) => void;
  fullExerciseLibrary: Exercise[];
}

const goals = ['Build Muscle', 'Lose Fat', 'Maintain'] as const;
const experienceLevels = ['Beginner', 'Intermediate', 'Advanced'] as const;
const durations = ['6 Weeks', '12 Weeks'] as const;
const trainingFocusOptions = ['Strength', 'Conditioning', 'Hybrid', 'Mobility'] as const;
const equipmentOptions = ['Dumbbells', 'Barbells', 'Bands', 'Kettlebells', 'Sled', 'Bunker Gear', 'Bodyweight'] as const;
const frequencies = ['2', '3', '4', '5', '6', '7'] as const;

const PerformanceGoalsModal: React.FC<PerformanceGoalsModalProps> = ({
  visible,
  onClose,
  onSaved,
  fullExerciseLibrary,
}) => {
  const [goalType, setGoalType] = useState('');
  const [duration, setDuration] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [trainingFocus, setTrainingFocus] = useState<string[]>([]);
  const [firegroundReady, setFiregroundReady] = useState(false);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [frequency, setFrequency] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleMultiSelect = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    item: string
  ): void => {
    setList(prev =>
      prev.includes(item) ? prev.filter(e => e !== item) : [...prev, item]
    );
  };

  const isComplete =
    goalType && duration && experienceLevel && frequency && trainingFocus.length > 0;

  const savePreferences = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !isComplete) {return;}

    if (!fullExerciseLibrary || fullExerciseLibrary.length === 0) {
      Alert.alert('Error', 'Exercise library is not loaded. Try again later.');
      return;
    }

    setSaving(true);

    try {
      const daysPerWeek = parseInt(frequency, 10);
      const durationWeeks = parseInt(duration.split(' ')[0], 10);

      const performanceGoals: PerformanceGoals = {
        goalType: goalType as PerformanceGoals['goalType'],
        experienceLevel: experienceLevel as PerformanceGoals['experienceLevel'],
        focus: trainingFocus.map(f => f.toLowerCase()),
        includeFireground: firegroundReady,
        daysPerWeek,
        durationWeeks,
        equipment,
      };

      const rawProgram = buildProgramFromGoals(performanceGoals, fullExerciseLibrary);

      const sanitizedProgram = rawProgram.map((day: ProgramDay) => ({
        title: day.title,
        date: day.date,
        exercises: day.exercises.map((ex: Exercise) => {
          const cleanedExercise: any = {
            id: ex.id,
            name: ex.name,
            equipment: ex.equipment,
            tags: ex.tags,
            goalTags: ex.goalTags,
            level: ex.level,
          };

          if (ex.description) {cleanedExercise.description = ex.description;}
          if (ex.focusArea) {cleanedExercise.focusArea = ex.focusArea;}
          if (ex.coachingNotes) {cleanedExercise.coachingNotes = ex.coachingNotes;}
          if (ex.swapOptions) {cleanedExercise.swapOptions = ex.swapOptions;}
          if (ex.videoUrl) {cleanedExercise.videoUrl = ex.videoUrl;}
          if (ex.thumbnailUri) {cleanedExercise.thumbnailUri = ex.thumbnailUri;}

          if (ex.isTimed) {
            cleanedExercise.isTimed = true;
            cleanedExercise.timePerSet = ex.timePerSet ?? 30;
            cleanedExercise.sets = ex.sets ?? 3;
          } else {
            cleanedExercise.sets = ex.sets ?? 3;
            cleanedExercise.reps = ex.reps ?? 10;
          }

          return cleanedExercise;
        }),
      }));

      await updateDoc(doc(db, 'users', uid), {
        preferences: {
          performance: performanceGoals,
        },
      });

      await setDoc(doc(db, 'users', uid, 'program', 'active'), {
        program: sanitizedProgram,
        createdAt: new Date().toISOString(),
        currentDay: 1,
      });

      onSaved(performanceGoals);
    } catch (err) {
      console.error('Error saving performance goals:', err);
      Alert.alert('Error', 'Something went wrong while saving your program.');
    } finally {
      setSaving(false);
    }
  };

  const renderSingleSelect = (
    label: string,
    values: readonly string[],
    selected: string,
    setter: (val: string) => void
  ) => (
    <View style={styles.block}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionRow}>
        {values.map(v => (
          <Pressable key={v} onPress={() => setter(v)} style={[styles.option, selected === v && styles.selected]}>
            <Text style={styles.optionText}>{v}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderMultiSelect = (
    label: string,
    values: readonly string[],
    selected: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => (
    <View style={styles.block}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionRow}>
        {values.map(v => (
          <Pressable
            key={v}
            onPress={() => toggleMultiSelect(selected, setter, v)}
            style={[styles.option, selected.includes(v) && styles.selected]}
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
            <Text style={styles.title}>🏋️ Set Performance Goals</Text>

            {renderSingleSelect('Main Goal', goals, goalType, setGoalType)}
            {renderSingleSelect('Experience Level', experienceLevels, experienceLevel, setExperienceLevel)}
            {renderSingleSelect('Program Duration', durations, duration, setDuration)}
            {renderMultiSelect('Training Focus', trainingFocusOptions, trainingFocus, setTrainingFocus)}
            {renderSingleSelect('Training Days / Week', frequencies, frequency, setFrequency)}

            <View style={[styles.block, styles.rowBetween]}>
              <Text style={styles.label}>Include Fireground Readiness</Text>
              <Switch value={firegroundReady} onValueChange={setFiregroundReady} />
            </View>

            {renderMultiSelect('Available Equipment', equipmentOptions, equipment, setEquipment)}

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
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
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

export default PerformanceGoalsModal;
