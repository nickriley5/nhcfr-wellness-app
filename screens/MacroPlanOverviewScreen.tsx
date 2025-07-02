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
import Animated, { FadeInDown } from 'react-native-reanimated';

const MacroCard = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <Animated.View
    entering={FadeInDown.duration(600)}
    style={[styles.macroCard, { borderColor: color }]}
  >
    <Text style={[styles.cardLabel, { color }]}>{label}</Text>
    <Text style={styles.cardValue}>{value}</Text>
  </Animated.View>
);

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

  const isZone = dietMethod === 'zone';

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#0f0f0f', '#1a1a1a']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.heading}>Your Nutrition Plan</Text>
          <Text style={styles.tagline}>
            {isZone
              ? 'Your Zone blocks are ready to keep you dialed in.'
              : 'Your macros are personalized to fuel your fire.'}
          </Text>

          <View style={styles.cardContainer}>
            {!isZone ? (
              <>
                <MacroCard label="Calories" value={`${calorieTarget} kcal`} color="#FFA726" />
                <MacroCard label="Protein" value={`${proteinGrams}g`} color="#4FC3F7" />
                <MacroCard label="Carbs" value={`${carbGrams}g`} color="#81C784" />
                <MacroCard label="Fat" value={`${fatGrams}g`} color="#F06292" />
              </>
            ) : (
              <>
                <MacroCard label="Protein Blocks" value={`${zoneBlocks.protein}`} color="#4FC3F7" />
                <MacroCard label="Carb Blocks" value={`${zoneBlocks.carbs}`} color="#81C784" />
                <MacroCard label="Fat Blocks" value={`${zoneBlocks.fats}`} color="#F06292" />
              </>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>What’s Next?</Text>
            <Text style={styles.summary}>
              Your plan has been calculated. This will guide your future meal planning and performance insights.
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
  heading: { fontSize: 22, color: '#fff', fontWeight: '600', marginBottom: 8 },
  tagline: {
    fontSize: 14,
    color: '#bbb',
    marginBottom: 16,
    textAlign: 'center',
  },
  cardContainer: {
    gap: 16,
    marginBottom: 24,
  },
  macroCard: {
    borderWidth: 2,
    borderRadius: 10,
    padding: 16,
    backgroundColor: '#1e1e1e',
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  card: {
    backgroundColor: '#1f1f1f',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  label: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 8 },
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
