import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface Props {
  weight: number;
  targetWeight: number;
  onChangeWeight: (value: number) => void;
  onChangeTargetWeight: (value: number) => void;
  onSaveWeight: () => void;
  onSaveTargetWeight: () => void;
}

const WeightInputSection = ({
  weight,
  targetWeight,
  onChangeWeight,
  onChangeTargetWeight,
  onSaveWeight,
  onSaveTargetWeight,
}: Props) => {
  return (
    <>
      <View style={styles.card}>
        <Text style={styles.label}>Current Weight (lbs)</Text>
        <TextInput
          keyboardType="numeric"
          value={weight.toString()}
          onChangeText={(val) => onChangeWeight(parseFloat(val) || 0)}
          onBlur={onSaveWeight}
          style={styles.input}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Target Weight (lbs)</Text>
        <TextInput
          keyboardType="numeric"
          value={targetWeight.toString()}
          onChangeText={(val) => onChangeTargetWeight(parseFloat(val) || 0)}
          onBlur={onSaveTargetWeight}
          style={styles.input}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#1f1f1f', borderRadius: 16, padding: 16, marginBottom: 20 },
  label: { color: '#fff', fontSize: 16, marginBottom: 8 },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
});

export default WeightInputSection;
