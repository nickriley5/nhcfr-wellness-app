// screens/MacroPlanOverviewScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const MacroPlanOverviewScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'MacroPlanOverview'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const {
    calorieTarget,
    proteinGrams,
    fatGrams,
    carbGrams,
    zoneBlocks,
    dietMethod,
  } = route.params;

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#0f0f0f', '#1a1a1a']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.heading}>Your Nutrition Plan</Text>

          <View style={styles.card}>
            <Text style={styles.label}>Diet Strategy</Text>
            <Text style={styles.value}>{dietMethod === 'zone' ? 'Zone Diet (40/30/30)' : 'Standard Macros'}</Text>
            <Text style={styles.summary}>
              {dietMethod === 'zone'
                ? 'You’ll use block-based ratios to guide your meals. Each block consists of a specific amount of protein, carbs, and fats.'
                : 'These macros are based on your weight, goal, and activity level using evidence-based formulas.'}
            </Text>
          </View>

          {dietMethod === 'standard' && (
            <View style={styles.card}>
              <Text style={styles.label}>Standard Macro Breakdown</Text>
              <Text style={styles.value}>Calories: {calorieTarget} kcal/day</Text>
              <Text style={styles.value}>Protein: {proteinGrams}g</Text>
              <Text style={styles.value}>Carbs: {carbGrams}g</Text>
              <Text style={styles.value}>Fats: {fatGrams}g</Text>
            </View>
          )}

          {dietMethod === 'zone' && (
            <View style={styles.card}>
              <Text style={styles.label}>Zone Blocks</Text>
              <Text style={styles.value}>Protein Blocks: {zoneBlocks.protein}</Text>
              <Text style={styles.value}>Carb Blocks: {zoneBlocks.carbs}</Text>
              <Text style={styles.value}>Fat Blocks: {zoneBlocks.fats}</Text>
              <Text style={styles.summary}>
                Use these blocks to plan meals throughout the day. 1 block = 7g protein, 9g carbs, 1.5g fat.
              </Text>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.label}>What’s Next?</Text>
            <Text style={styles.summary}>
              Your macro or block plan has been calculated. This data will guide your future meal plan and performance feedback.
            </Text>
          </View>

          <Pressable
          style={styles.button}
          onPress={() =>
            navigation.navigate('AppDrawer', {
              screen: 'MainTabs',
              params: { screen: 'Dashboard' },
            })
          }
        >
          <Text style={styles.buttonText}>Return to Dashboard</Text>
        </Pressable>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f0f0f' },
  container: { flex: 1 },
  scroll: { padding: 20 },
  heading: { fontSize: 22, color: '#fff', fontWeight: '600', marginBottom: 20 },
  card: {
    backgroundColor: '#1f1f1f',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  label: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  value: { color: '#fff', fontSize: 16, marginBottom: 4 },
  summary: { color: '#aaa', fontSize: 14, marginTop: 8, lineHeight: 20 },
  button: {
    backgroundColor: '#ff3b30',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default MacroPlanOverviewScreen;
