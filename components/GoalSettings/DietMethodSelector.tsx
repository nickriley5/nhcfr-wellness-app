import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface Props {
  dietMethod: 'standard' | 'zone';
  onChange: (method: 'standard' | 'zone') => void;
}

const DietMethodSelector = ({ dietMethod, onChange }: Props) => {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Diet Strategy</Text>
      <View style={styles.optionsRow}>
        {['standard', 'zone'].map((method) => (
          <Pressable
            key={method}
            style={[styles.optionButton, dietMethod === method && styles.activeOption]}
            onPress={() => onChange(method as Props['dietMethod'])}
          >
            <Ionicons
              name={method === 'standard' ? 'stats-chart' : 'grid'}
              size={24}
              color="#fff"
            />
            <Text style={styles.optionText}>
              {method.charAt(0).toUpperCase() + method.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.summary}>
        {dietMethod === 'standard' &&
          'Macros will follow a standard evidence-based formula.'}
        {dietMethod === 'zone' &&
          'Macros follow 40/30/30 block ratios for carbs, protein, and fat.'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#1f1f1f', borderRadius: 16, padding: 16, marginBottom: 20 },
  label: { color: '#fff', fontSize: 16, marginBottom: 8 },
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

export default DietMethodSelector;
