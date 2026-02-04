import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface Props {
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'very_active';
  onChange: (newLevel: Props['activityLevel']) => void;
  showInfo: boolean;
  onToggleInfo: () => void;
}

const ActivityLevelSelector = ({
  activityLevel,
  onChange,
  showInfo,
  onToggleInfo,
}: Props) => {
  const options = [
    { key: 'sedentary', label: 'Sedentary' },
    { key: 'light', label: 'Light' },
    { key: 'moderate', label: 'Moderate' },
    { key: 'very_active', label: 'Very Active' },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.label}>Activity Level</Text>
        <Pressable onPress={onToggleInfo}>
          <Ionicons name="help-circle-outline" size={20} color="#aaa" />
        </Pressable>
      </View>

      <View style={styles.optionsRow}>
        {options.map(({ key, label }) => (
          <Pressable
            key={key}
            style={[styles.optionButton, activityLevel === key && styles.activeOption]}
            onPress={() => onChange(key as Props['activityLevel'])}
          >
            <Text style={styles.optionText}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {showInfo && (
        <Text style={styles.summary}>
          Choose the level that best matches your <Text style={styles.boldText}>overall weekly activity</Text>:{'\n\n'}
          🪑 <Text style={styles.boldText}>Sedentary</Text>: Desk job, minimal exercise (0-1 workouts/week){'\n'}
          {'   '}Little daily movement, mostly sitting{'\n\n'}
          🚶 <Text style={styles.boldText}>Light</Text>: Light exercise 1-3 days/week{'\n'}
          {'   '}Walking, light cardio, or station duties without structured training{'\n\n'}
          🏋️ <Text style={styles.boldText}>Moderate</Text>: Exercise 3-5 days/week{'\n'}
          {'   '}Regular strength training, active job, or consistent fitness routine{'\n\n'}
          💪 <Text style={styles.boldText}>Very Active</Text>: Intense training 6-7 days/week{'\n'}
          {'   '}Daily workouts, physically demanding job, or competitive athlete{'\n\n'}
          <Text style={styles.warningText}>⚠️ Choose based on your actual training frequency, not just your job title.</Text>
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#1f1f1f', borderRadius: 16, padding: 16, marginBottom: 20 },
  label: { color: '#fff', fontSize: 16, marginBottom: 8 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
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
    minWidth: '23%',
    flexGrow: 1,
    textAlign: 'center',
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
  summary: { color: '#aaa', marginTop: 8, fontSize: 13, lineHeight: 20 },
  boldText: { fontWeight: '700', color: '#fff' },
  warningText: { color: '#ff9800', fontWeight: '600' },
});

export default ActivityLevelSelector;
