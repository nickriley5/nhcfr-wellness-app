import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface Props {
  goalType: 'fat_loss' | 'maintain' | 'muscle_gain';
  onChange: (newGoal: 'fat_loss' | 'maintain' | 'muscle_gain') => void;
}

const GoalTypeSelector = ({ goalType, onChange }: Props) => {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Goal Focus</Text>
      <View style={styles.optionsRow}>
        {['fat_loss', 'maintain', 'muscle_gain'].map((type) => (
          <Pressable
            key={type}
            style={[styles.optionButton, goalType === type && styles.activeOption]}
            onPress={() => onChange(type as any)}
          >
            <Ionicons
              name={
                type === 'fat_loss'
                  ? 'flame'
                  : type === 'maintain'
                  ? 'body'
                  : 'barbell'
              }
              size={24}
              color="#fff"
            />
            <Text style={styles.optionText}>
              {type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.summary}>
        You’re currently focused on {goalType.replace('_', ' ')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#1f1f1f', borderRadius: 16, padding: 16, marginBottom: 20 },
  label: { color: '#fff', fontSize: 16, marginBottom: 8, textAlign: 'center' },
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
});

export default GoalTypeSelector;
