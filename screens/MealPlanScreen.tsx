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
import LogFoodButton from '../components/mealplan/LogFoodButton'; // ✅ NEW IMPORT
import MealLoggingModal, { MealContext } from '../components/mealplan/MealLoggingModal'; // ✅ NEW IMPORT
import DescribeMealModal from '../components/mealplan/DescribeMealModal';
import CameraModal from '../components/mealplan/CameraModal';
import QuickFavoritesModal from '../components/mealplan/QuickFavorites'; // ✅ ENHANCED

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
  photoUri?: string | null;
}

/* -------------------------- MAIN -------------------------- */
const MealPlanScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [mealPlan, setMealPlan] = useState<MealPlanData | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedDate, _setSelectedDate] = useState(new Date());
  const [loggedMeals, setLoggedMeals] = useState<MealCardProps[]>([]);

  // ✅ NEW MODAL STATES
  const [showMealLoggingModal, setShowMealLoggingModal] = useState(false);
  const [showDescribeModal, setShowDescribeModal] = useState(false);
  const [showQuickFavoritesModal, setShowQuickFavoritesModal] = useState(false);

  // ✅ EXISTING CAMERA MODAL STATE
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);

  // ✅ NEW: Store meal context for when modals open
  const [currentMealContext, setCurrentMealContext] = useState<MealContext | null>(null);

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
      const meals: MealCardProps[] = snapshot.docs.map((mealDoc) => {
        const data = mealDoc.data();
        return {
          name: data.name,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          photoUri: data.photoUri || null,
        };
      });
      setLoggedMeals(meals);
    });
    return () => unsub();
  }, [uid, selectedDate]);

  // Quick add dummy meal (TEMP - remove later)
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

  // ✅ ENHANCED: Handle modal opening with context
  const handleOpenDescribeModal = (mealContext: MealContext) => {
    setCurrentMealContext(mealContext);
    setShowDescribeModal(true);
  };

  const handleOpenQuickAdd = (mealContext: MealContext) => {
    setCurrentMealContext(mealContext);
    setShowQuickFavoritesModal(true);
  };

  const handleOpenBarcodeScanner = (mealContext: MealContext) => {
    setCurrentMealContext(mealContext);
    // TODO: Implement barcode scanner
    console.log('Barcode scanner coming soon!', mealContext);
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
        <Text style={styles.heading}>Today's Nutrition</Text>

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

            <Text style={styles.subheading}>Today's Meals</Text>

            {loggedMeals.length === 0 ? (
              <Text style={styles.infoText}>No meals logged yet.</Text>
            ) : (
              loggedMeals.map((meal, idx) => <MealCard key={idx} {...meal} />)
            )}

            {/* TEMP TEST BUTTON - REMOVE LATER */}
            <DashboardButton
              text="➕ Quick Add Test Meal"
              variant="green"
              onPress={quickAddMeal}
            />
          </>
        )}
      </ScrollView>

      {/* ✅ NEW: Log Food Button (replaces FloatingMenu) */}
      <LogFoodButton onPress={() => setShowMealLoggingModal(true)} />

      {/* ✅ NEW: Main Meal Logging Modal */}
      <MealLoggingModal
        visible={showMealLoggingModal}
        onClose={() => setShowMealLoggingModal(false)}
        onOpenDescribeModal={handleOpenDescribeModal}
        onOpenQuickAdd={handleOpenQuickAdd}
        onOpenBarcodeScanner={handleOpenBarcodeScanner}
      />

      {/* ✅ ENHANCED: Describe Meal Modal with context */}
      <DescribeMealModal
        visible={showDescribeModal}
        onClose={() => {
          setShowDescribeModal(false);
          setPendingPhotoUri(null);
          setCurrentMealContext(null);
        }}
        onMealLogged={(meal) => {
          console.log('Meal parsed:', meal);
        }}
        pendingPhotoUri={pendingPhotoUri}
        mealContext={currentMealContext}
      />

      {/* ✅ ENHANCED: Quick Favorites Modal with context */}
      <QuickFavoritesModal
        visible={showQuickFavoritesModal}
        onClose={() => {
          setShowQuickFavoritesModal(false);
          setCurrentMealContext(null);
        }}
        onFoodLogged={() => {
          console.log('Quick food logged');
        }}
        mealContext={currentMealContext}
      />

      {/* ✅ EXISTING: Camera Modal */}
      <CameraModal
        visible={showCameraModal}
        onClose={() => {
          setShowCameraModal(false);
          setSelectedImageUri(null);
        }}
        imageUri={selectedImageUri}
        onMealLogged={(meal) => {
          console.log('Camera meal logged:', meal);
          if (meal.source === 'OPEN_DESCRIBE_MODAL') {
            setPendingPhotoUri(meal.photoUri || null);
            setShowDescribeModal(true);
          }
        }}
      />
    </LinearGradient>
  );
};

export default MealPlanScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 120 }, // ✅ Extra padding for LogFoodButton
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
