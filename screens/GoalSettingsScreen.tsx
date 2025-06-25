import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Slider from '@react-native-community/slider';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Define your MealPlan stack params
export type MealPlanStackParamList = {
  GoalSettings: undefined;
  DietStyleSelection: undefined;
  MealPlan: undefined;
};

type GoalSettingsScreenNavigationProp = NativeStackNavigationProp<
  MealPlanStackParamList,
  'GoalSettings'
>;

interface GoalSettingsScreenProps {
  navigation: GoalSettingsScreenNavigationProp;
}

const GoalSettingsScreen = ({ navigation }: GoalSettingsScreenProps) => {
  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain' | 'recomp' | null>(null);
  const [rate, setRate] = useState(0.5);
  const [weeks, setWeeks] = useState(12);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 1000 * 60 * 60 * 24 * 7 * 12));

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setEndDate(selectedDate);
  };

  const canContinue = !!goal && rate > 0 && weeks > 0;

  const handleContinue = () => {
    if (!canContinue) return;
    // TODO: save goal, rate, weeks, endDate to Firestore or context
    navigation.navigate('DietStyleSelection');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Set Your Meal Goals</Text>
      <Text style={styles.subheader}>Choose what you’d like to do and how fast</Text>

      <View style={styles.goalRow}>
        {[
          { key: 'lose', label: 'Lose Weight', icon: 'remove-circle' },
          { key: 'maintain', label: 'Maintain', icon: 'ellipse' },
          { key: 'gain', label: 'Gain Weight', icon: 'add-circle' },
          { key: 'recomp', label: 'Recomp', icon: 'swap-horizontal' },
        ].map(({ key, label, icon }) => (
          <Pressable
            key={key}
            style={[styles.goalOption, goal === key && styles.goalOptionSelected]}
            onPress={() => setGoal(key as any)}
          >
            <Ionicons name={icon} size={24} color="#FFF" />
            <Text style={styles.goalLabel}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Rate (lbs/week)</Text>
        <Text style={styles.value}>{rate.toFixed(2)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0.25}
          maximumValue={2.0}
          step={0.25}
          value={rate}
          onValueChange={setRate}
          minimumTrackTintColor="#E63946"
          maximumTrackTintColor="#444"
          thumbTintColor="#FFF"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Timeframe</Text>
        <View style={styles.timeRow}>
          <Pressable style={styles.weeksBox} onPress={() => {}}>
            <Text style={styles.value}>{weeks}</Text>
            <Text style={{ color: '#AAA' }}>weeks</Text>
          </Pressable>
          <Pressable style={styles.dateBox} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar-outline" size={20} color="#FFF" />
            <Text style={[styles.value, { marginLeft: 8 }]}>{endDate.toLocaleDateString()}</Text>
          </Pressable>
        </View>
        {showDatePicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}
      </View>

      <Pressable
        style={[styles.continueBtn, !canContinue && styles.disabledBtn]}
        onPress={handleContinue}
        disabled={!canContinue}
      >
        <Text style={styles.continueText}>Continue</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop:50, backgroundColor: '#0A0A23' },
  header: { fontSize: 24, fontWeight: 'bold', color: '#FFF', textAlign: 'center', },
  subheader: { fontSize: 16, marginBottom: 24, color: '#AAA', textAlign: 'center', },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  goalOption: { alignItems: 'center', padding: 8, width: '22%' },
  goalOptionSelected: { borderWidth: 2, borderColor: '#E63946', borderRadius: 8 },
  goalLabel: { marginTop: 4, color: '#FFF', textAlign: 'center' },
  section: { marginBottom: 24 },
  label: { color: '#CCC', marginBottom: 4 },
  value: { color: '#FFF', fontSize: 18 },
  slider: { width: '100%' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weeksBox: {
    padding: 12,
    backgroundColor: '#1A1A3D',
    borderRadius: 8,
    alignItems: 'center',
    width: '45%',
  },
  dateBox: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#1A1A3D',
    borderRadius: 8,
    alignItems: 'center',
    width: '45%',
  },
  continueBtn: {
    marginTop: 'auto',
    padding: 16,
    backgroundColor: '#E63946',
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledBtn: {
    backgroundColor: '#555',
  },
  continueText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default GoalSettingsScreen;
