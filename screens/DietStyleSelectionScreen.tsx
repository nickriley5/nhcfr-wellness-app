import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MealPlanStackParamList } from '../navigation/DrawerNavigation';

type DietStyleSelectionNavigationProp = NativeStackNavigationProp<
  MealPlanStackParamList,
  'DietStyleSelection'
>;

interface Props {
  navigation: DietStyleSelectionNavigationProp;
}

export default function DietStyleSelectionScreen({ navigation }: Props) {
  const dietOptions = [
    'Standard American',
    'Carnivore',
    'Vegetarian',
    'Zone (Block Method)',
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select Your Diet Style</Text>
      {dietOptions.map((opt) => (
        <Pressable
          key={opt}
          style={styles.option}
          onPress={() => navigation.navigate('MealPlan')}
        >
          <Text style={styles.optionText}>{opt}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#0A0A23' },
  header: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 24 },
  option: {
    padding: 16,
    backgroundColor: '#1A1A3D',
    borderRadius: 8,
    marginBottom: 12,
  },
  optionText: { color: '#FFF', fontSize: 18 },
});
