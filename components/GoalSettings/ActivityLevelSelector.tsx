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
          Choose the level that best matches your daily lifestyle:{'\n\n'}
          • <Text style={styles.boldText}>Sedentary</Text>: Desk job, minimal daily movement{'\n'}
          • <Text style={styles.boldText}>Light</Text>: Regular walking, light household tasks{'\n'}
          • <Text style={styles.boldText}>Moderate</Text>: Manual job or workouts 3–4x/week{'\n'}
          • <Text style={styles.boldText}>Very Active</Text>: Intense training or daily physical labor{'\n\n'}
          🔥 Firefighting doesn’t count unless you’re actively training or operating on scene.
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
  summary: { color: '#aaa', marginTop: 8, fontSize: 13 },
  boldText: { fontWeight: '700' },
});

export default ActivityLevelSelector;
