import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  useNavigation,
  CompositeNavigationProp,
} from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TabParamList, RootStackParamList } from '../../App';

const QuickViews = () => {
  const navigation = useNavigation<
    CompositeNavigationProp<
      BottomTabNavigationProp<TabParamList, 'Dashboard'>,
      NativeStackNavigationProp<RootStackParamList>
    >
  >();

  return (
    <View style={styles.quickContainer}>
      <Pressable
        style={styles.quickCard}
        onPress={() => navigation.navigate('MealPlan')}
      >
        <Text style={styles.quickTitle}>Meal Plan</Text>
        <Text style={styles.quickDetail}>View your personalized meal plan</Text>
        <Text style={styles.quickHint}>Tap to view or edit</Text>
      </Pressable>

      <Pressable
        style={styles.quickCard}
        onPress={() => navigation.navigate('WorkoutHistory')}
      >
        <Text style={styles.quickTitle}>Workout History</Text>
        <Text style={styles.quickDetail}>Review past workouts and progress</Text>
        <Text style={styles.quickHint}>Tap to explore</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  quickContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d32f2f',
    marginBottom: 4,
  },
  quickDetail: {
    fontSize: 14,
    color: '#ccc',
  },
  quickHint: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 6,
  },
});

export default QuickViews;
