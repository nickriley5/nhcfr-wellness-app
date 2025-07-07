import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App'; // update path if needed

type Props = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  firstTime?: boolean;
};

const MacroSummaryCard: React.FC<Props> = ({
  calories,
  protein,
  carbs,
  fats,
  firstTime = false,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Pressable
      onPress={() =>
  navigation.navigate('MacroPlanOverview', {
    calorieTarget: calories,
    proteinGrams: protein,
    fatGrams: fats,
    carbGrams: carbs,
    zoneBlocks: { protein: 0, carbs: 0, fats: 0 }, // Or real values if available
    dietMethod: 'standard', // Default or passed in via props
    goalType: 'maintain',   // Default or passed in via props
    name: 'Firefighter',    // Or pass from userProfile
  })
}

      style={[
        styles.card,
        firstTime ? styles.highlightCard : null,
      ]}
    >
      <Text style={styles.header}>Your Macro Plan</Text>
      <Text style={styles.macroText}>Calories: {calories}</Text>
      <Text style={styles.macroText}>Protein: {protein}g</Text>
      <Text style={styles.macroText}>Carbs: {carbs}g</Text>
      <Text style={styles.macroText}>Fats: {fats}g</Text>
      <Text style={styles.tap}>Tap to view full plan</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    width: '100%',
  },
  highlightCard: {
    borderColor: '#d32f2f',
    borderWidth: 2,
    shadowColor: '#d32f2f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  macroText: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 4,
  },
  tap: {
    marginTop: 10,
    fontSize: 14,
    color: '#d32f2f',
    fontStyle: 'italic',
  },
});

export default MacroSummaryCard;
