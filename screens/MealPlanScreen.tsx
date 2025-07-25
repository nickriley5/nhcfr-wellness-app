// screens/MealPlanScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import DashboardButton from '../components/Common/DashboardButton';
import { RootStackParamList } from '../App';

// ✅ Imported components & hook
import MacroCard from '../components/mealplan/MacroCard';
import MealCard from '../components/mealplan/MealCard';
import FloatingMenu from '../components/mealplan/FloatingMenu';
import DateNavBar from '../components/mealplan/DateNavBar';
import { useMealLogs } from '../hooks/useMealLogs';

interface MealPlanData {
  calorieTarget: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  zoneBlocks?: { protein: number; carbs: number; fats: number };
  dietMethod: 'standard' | 'zone';
  goalType: 'maintain' | 'fatloss' | 'muscle';
  name: string;
}

const MealPlanScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [mealPlan, setMealPlan] = useState<MealPlanData | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const uid = auth.currentUser?.uid;

  // ✅ Centralized hook for logs & totals
  const { loggedMeals, totals, addMeal } = useMealLogs(uid, selectedDate);

  // ✅ FloatingMenu animation for scroll direction
  const menuTranslate = useRef(new Animated.Value(0)).current; // 0 = visible, 100 = hidden
  const lastScrollY = useRef(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = e.nativeEvent.contentOffset.y;
    const diff = currentY - lastScrollY.current;

    if (diff > 5) {
      // scrolling down → hide
      Animated.timing(menuTranslate, {
        toValue: 100, // slide off screen
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else if (diff < -5) {
      // scrolling up → show
      Animated.timing(menuTranslate, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    lastScrollY.current = currentY;
  };

  // ✅ Fetch meal plan targets once
  useEffect(() => {
    const fetchMealPlan = async () => {
      if (!uid) {
        return;
      }
      try {
        const ref = doc(db, `users/${uid}/mealPlan/active`);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setMealPlan(snap.data() as MealPlanData);
        }
      } catch (err) {
        console.error('Failed to fetch meal plan:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMealPlan();
  }, [uid]);

  const goToMacroOverview = () => {
    if (!mealPlan) {
      return;
    }
    navigation.navigate('MacroPlanOverview', {
      calorieTarget: mealPlan.calorieTarget,
      proteinGrams: mealPlan.proteinGrams,
      carbGrams: mealPlan.carbGrams,
      fatGrams: mealPlan.fatGrams,
      zoneBlocks: mealPlan.zoneBlocks || { protein: 0, carbs: 0, fats: 0 },
      dietMethod: mealPlan.dietMethod,
      goalType: mealPlan.goalType,
      name: mealPlan.name,
    });
  };

  return (
    <LinearGradient colors={['#0f0f0f', '#1a1a1a']} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <Text style={styles.heading}>Nutrition</Text>

        {/* ✅ Date picker with swipe + calendar */}
        <DateNavBar selectedDate={selectedDate} onChange={setSelectedDate} />

        {loading ? (
          <Text style={styles.loadingText}>Loading your plan...</Text>
        ) : !mealPlan ? (
          <Text style={styles.infoText}>No meal plan found. Generate one first!</Text>
        ) : (
          <>
            {/* ✅ Macro summary cards */}
            <View style={styles.macroRowTop}>
              <MacroCard
                label="Calories"
                logged={totals.calories}
                target={mealPlan.calorieTarget}
                unit="kcal"
                variant="calories"
              />
              <MacroCard
                label="Protein"
                logged={totals.protein}
                target={mealPlan.proteinGrams}
                unit="g"
                variant="protein"
              />
              <MacroCard
                label="Carbs"
                logged={totals.carbs}
                target={mealPlan.carbGrams}
                unit="g"
                variant="carb"
              />
              <MacroCard
                label="Fat"
                logged={totals.fat}
                target={mealPlan.fatGrams}
                unit="g"
                variant="fat"
              />
            </View>

            {/* ✅ Quick nav to full macro plan */}
            <DashboardButton
              text="📊 View Full Plan"
              variant="blue"
              onPress={goToMacroOverview}
            />

            {/* ✅ Meals logged today */}
            <Text style={styles.subheading}>Meals for {selectedDate.toDateString()}</Text>

            {loggedMeals.length === 0 ? (
              <Text style={styles.infoText}>No meals logged yet.</Text>
            ) : (
              loggedMeals.map((meal, idx) => <MealCard key={idx} {...meal} />)
            )}

            {/* ✅ Quick test button using hook addMeal */}
            <DashboardButton
              text="➕ Quick Add Test Meal"
              variant="green"
              onPress={() =>
                addMeal({
                  name: 'Test Meal',
                  calories: 300,
                  protein: 25,
                  carbs: 30,
                  fat: 10,
                })
              }
            />
          </>
        )}
      </ScrollView>

      {/* ✅ Floating menu slides down/up based on scroll direction */}
      <Animated.View
        style={{
          transform: [{ translateY: menuTranslate }],
        }}
      >
        <FloatingMenu
          onSnapMeal={() => console.log('Snap Meal')}
          onDescribeMeal={() => console.log('Describe Meal')}
          onScanBarcode={() => console.log('Scan Barcode')}
          onSelectFavorite={() => console.log('Select Favorite')}
        />
      </Animated.View>
    </LinearGradient>
  );
};

export default MealPlanScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingText: {
    color: '#aaa',
    textAlign: 'center',
    marginVertical: 20,
  },
  infoText: {
    color: '#aaa',
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 15,
  },
  macroRowTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  subheading: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginVertical: 12,
  },
});
