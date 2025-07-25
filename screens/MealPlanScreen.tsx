import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, onSnapshot, addDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import DashboardButton from '../components/Common/DashboardButton';
import { RootStackParamList } from '../App';
import MacroCard from '../components/mealplan/MacroCard';
import MealCard from '../components/mealplan/MealCard';
import FloatingMenu from '../components/mealplan/FloatingMenu';
import DescribeMealModal from '../components/mealplan/DescribeMealModal';  // ✅ NEW

/* -------------------------- TYPES -------------------------- */
interface MealPlanData {
  calorieTarget: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  zoneBlocks?: {
    protein: number;
    carbs: number;
    fats: number;
  };
  dietMethod: 'standard' | 'zone';
  goalType: 'maintain' | 'fatloss' | 'muscle';
  name: string;
}

interface MealCardProps {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/* -------------------------- MAIN -------------------------- */
const MealPlanScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [mealPlan, setMealPlan] = useState<MealPlanData | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedDate, _setSelectedDate] = useState(new Date());
  const [loggedMeals, setLoggedMeals] = useState<MealCardProps[]>([]);

  const [showDescribeModal, setShowDescribeModal] = useState(false); // ✅ NEW STATE

  const uid = auth.currentUser?.uid;

  // Fetch meal plan targets
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

  // Fetch logged meals for selected day
  useEffect(() => {
    if (!uid) {
      return;
    }
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const mealLogRef = collection(db, `users/${uid}/mealLogs/${dateKey}/meals`);
    const unsub = onSnapshot(mealLogRef, (snapshot) => {
      const meals: MealCardProps[] = snapshot.docs.map((mealDoc) => ({
        ...(mealDoc.data() as MealCardProps),
      }));
      setLoggedMeals(meals);
    });
    return () => unsub();
  }, [uid, selectedDate]);

  // Quick add dummy meal
  const quickAddMeal = async () => {
    if (!uid) {
      return;
    }
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const mealLogRef = collection(db, `users/${uid}/mealLogs/${dateKey}/meals`);
    await addDoc(mealLogRef, {
      name: 'Test Meal',
      calories: 300,
      protein: 25,
      carbs: 30,
      fat: 10,
      loggedAt: new Date(),
    });
  };

  // Calculate totals
  const totals = loggedMeals.reduce(
    (acc, m) => {
      acc.calories += m.calories;
      acc.protein += m.protein;
      acc.carbs += m.carbs;
      acc.fat += m.fat;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const goToMacroOverview = () => {
    if (mealPlan) {
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
    }
  };

  return (
    <LinearGradient colors={['#0f0f0f', '#1a1a1a']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.heading}>Today’s Nutrition</Text>

        {loading ? (
          <Text style={styles.loadingText}>Loading your plan...</Text>
        ) : !mealPlan ? (
          <Text style={styles.infoText}>No meal plan found. Generate one first!</Text>
        ) : (
          <>
            {/* Macro Cards showing Logged / Target */}
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

            <DashboardButton
              text="📊 View Full Plan"
              variant="blue"
              onPress={goToMacroOverview}
            />

            <Text style={styles.subheading}>Today’s Meals</Text>

            {loggedMeals.length === 0 ? (
              <Text style={styles.infoText}>No meals logged yet.</Text>
            ) : (
              loggedMeals.map((meal, idx) => <MealCard key={idx} {...meal} />)
            )}

            {/* TEMP TEST BUTTON */}
            <DashboardButton
              text="➕ Quick Add Test Meal"
              variant="green"
              onPress={quickAddMeal}
            />
          </>
        )}
      </ScrollView>

      {/* Floating menu for interactive add */}
      <FloatingMenu
        onDescribeMeal={() => setShowDescribeModal(true)} // ✅ OPEN MODAL
      />

      {/* Describe Meal Modal */}
      <DescribeMealModal
        visible={showDescribeModal}
        onClose={() => setShowDescribeModal(false)}
        onMealLogged={(meal) => {
          console.log('Meal parsed:', meal);
          // 🔹 Later we can auto-log to Firestore here
        }}
      />
    </LinearGradient>
  );
};

export default MealPlanScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 120 },
  heading: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 16 },
  loadingText: { color: '#aaa', textAlign: 'center', marginVertical: 20 },
  infoText: { color: '#aaa', textAlign: 'center', marginVertical: 20, fontSize: 15 },
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
