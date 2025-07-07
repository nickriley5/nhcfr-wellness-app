// screens/MealPlanScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import MacroSummaryCard from '../components/MacroSummaryCard';

const MealPlanScreen: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [macroData, setMacroData] = useState<{
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  } | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        return;
      }

      const ref = doc(db, 'users', uid, 'mealPlan', 'active');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const d = snap.data();
        setMacroData({
          calories: d.calorieTarget,
          protein: d.proteinGrams,
          carbs: d.carbGrams,
          fats: d.fatGrams,
        });
      }

      setLoading(false);
    };

    fetchPlan();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </View>
    );
  }

  return (
    <LinearGradient colors={['#0f0f0f', '#1c1c1c', '#121212']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {macroData && (
          <MacroSummaryCard
            calories={macroData.calories}
            protein={macroData.protein}
            carbs={macroData.carbs}
            fats={macroData.fats}
            firstTime={false} // Adjust this dynamically if needed
          />
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
});

export default MealPlanScreen;
