// screens/MealPlanScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import DashboardButton from '../components/Common/DashboardButton';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../App';

const { width } = Dimensions.get('window');

/* --------------------------
   Types & Interfaces
--------------------------- */
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

interface MacroCardProps {
  label: string;
  value: number;
  unit?: string;
  variant: 'protein' | 'carb' | 'fat' | 'calories';
}

interface MealCardProps {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/* --------------------------
   Dummy Meal Logs for Now
--------------------------- */
const dummyMeals = [
  {
    id: '1',
    name: 'Grilled Chicken & Rice',
    calories: 420,
    protein: 40,
    carbs: 35,
    fat: 12,
  },
  {
    id: '2',
    name: 'Greek Yogurt & Berries',
    calories: 220,
    protein: 18,
    carbs: 20,
    fat: 5,
  },
];

/* --------------------------
   Stable Subcomponents
--------------------------- */

// MacroCard stays stable and uses styles based on variant
const MacroCard: React.FC<MacroCardProps> = ({ label, value, unit, variant }) => {
  const colorStyles = {
    protein: styles.proteinColor,
    carb: styles.carbColor,
    fat: styles.fatColor,
    calories: styles.calorieColor,
  }[variant];

  return (
    <View style={[styles.macroCard, colorStyles]}>
      <Text style={styles.macroValue}>
        {Math.round(value)}
        {unit}
      </Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
};

// MealCard for logged meals
const MealCard: React.FC<MealCardProps> = ({ name, calories, protein, carbs, fat }) => (
  <View style={styles.mealCard}>
    <View style={styles.mealCardContent}>
      <Text style={styles.mealName}>{name}</Text>
      <Text style={styles.mealCalories}>{calories} kcal</Text>
      <View style={styles.mealMacroRow}>
        <Text style={[styles.mealMacro, styles.proteinColor]}>P {protein}g</Text>
        <Text style={[styles.mealMacro, styles.carbColor]}>C {carbs}g</Text>
        <Text style={[styles.mealMacro, styles.fatColor]}>F {fat}g</Text>
      </View>
    </View>
  </View>
);

// Floating menu options for adding meals
const FloatingMenu: React.FC = () => (
  <View style={styles.floatingContainer}>
    <Pressable style={styles.floatingButton}>
      <Ionicons name="add" size={30} color="#fff" />
    </Pressable>
    <View style={styles.radialMenu}>
      <Pressable style={styles.menuOption}>
        <Ionicons name="camera" size={24} color="#fff" />
        <Text style={styles.menuLabel}>Snap Meal</Text>
      </Pressable>
      <Pressable style={styles.menuOption}>
        <Ionicons name="mic" size={24} color="#fff" />
        <Text style={styles.menuLabel}>Describe</Text>
      </Pressable>
      <Pressable style={styles.menuOption}>
        <Ionicons name="barcode" size={24} color="#fff" />
        <Text style={styles.menuLabel}>Scan</Text>
      </Pressable>
      <Pressable style={styles.menuOption}>
        <Ionicons name="star" size={24} color="#fff" />
        <Text style={styles.menuLabel}>Favorites</Text>
      </Pressable>
    </View>
  </View>
);

/* --------------------------
   Main Screen
--------------------------- */

const MealPlanScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [mealPlan, setMealPlan] = useState<MealPlanData | null>(null);
  const [loading, setLoading] = useState(true);

  const uid = auth.currentUser?.uid;

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
            {/* Macro Cards */}
            <View style={styles.macroRowTop}>
              {mealPlan.dietMethod === 'zone' ? (
                <>
                  <MacroCard
                    label="Protein Blocks"
                    value={mealPlan.zoneBlocks?.protein || 0}
                    variant="protein"
                  />
                  <MacroCard
                    label="Carb Blocks"
                    value={mealPlan.zoneBlocks?.carbs || 0}
                    variant="carb"
                  />
                  <MacroCard
                    label="Fat Blocks"
                    value={mealPlan.zoneBlocks?.fats || 0}
                    variant="fat"
                  />
                </>
              ) : (
                <>
                  <MacroCard
                    label="Calories"
                    value={mealPlan.calorieTarget}
                    unit=" kcal"
                    variant="calories"
                  />
                  <MacroCard
                    label="Protein"
                    value={mealPlan.proteinGrams}
                    unit="g"
                    variant="protein"
                  />
                  <MacroCard
                    label="Carbs"
                    value={mealPlan.carbGrams}
                    unit="g"
                    variant="carb"
                  />
                  <MacroCard
                    label="Fat"
                    value={mealPlan.fatGrams}
                    unit="g"
                    variant="fat"
                  />
                </>
              )}
            </View>

            <DashboardButton
              text="📊 View Full Plan"
              variant="blue"
              onPress={goToMacroOverview}
            />

            <Text style={styles.subheading}>Today’s Meals</Text>
            {dummyMeals.map((meal) => (
              <MealCard key={meal.id} {...meal} />
            ))}
          </>
        )}
      </ScrollView>

      {/* Floating + radial menu */}
      <FloatingMenu />
    </LinearGradient>
  );
};

export default MealPlanScreen;

/* --------------------------
   Styles
--------------------------- */

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
  macroCard: {
    width: (width - 48) / 2,
    paddingVertical: 16,
    backgroundColor: '#1f1f1f',
    borderRadius: 14,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  macroValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  macroLabel: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 4,
  },
  calorieColor: { borderColor: '#FFD54F' },
  proteinColor: { borderColor: '#4FC3F7', color: '#4FC3F7' },
  carbColor: { borderColor: '#81C784', color: '#81C784' },
  fatColor: { borderColor: '#F06292', color: '#F06292' },
  subheading: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginVertical: 12,
  },
  mealCard: {
    flexDirection: 'row',
    backgroundColor: '#1f1f1f',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  mealCardContent: { flex: 1 },
  mealName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mealCalories: {
    color: '#FFD54F',
    marginTop: 4,
  },
  mealMacroRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  mealMacro: {
    marginRight: 12,
    fontWeight: '500',
  },
  floatingContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
  },
  floatingButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F44336',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  radialMenu: {
    position: 'absolute',
    bottom: 70,
    right: 0,
    backgroundColor: '#1f1f1f',
    borderRadius: 14,
    padding: 8,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  menuLabel: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
  },
});
