// screens/MealPlanScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { RootStackParamList } from '../App';
import Ionicons from 'react-native-vector-icons/Ionicons';

type MealPlanNavProp = NativeStackNavigationProp<RootStackParamList>;

interface Meal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const MealPlanScreen: React.FC = () => {
  const navigation = useNavigation<MealPlanNavProp>();
  const [meals, setMeals] = useState<Meal[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const today = new Date().toISOString().split('T')[0];
        const ref = doc(db, 'mealPlans', `${uid}_${today}`);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setMeals(snap.data().meals as Meal[]);
        } else {
          await generatePlan();
        }
      } catch (err) {
        console.error('Error loading meal plan:', err);
        Alert.alert('Error', 'Could not load meal plan.');
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, []);

  const generatePlan = async () => {
    setLoading(true);
    try {
      const placeholder: Meal[] = [
        { name: 'Grilled Chicken & Veggies', calories: 450, protein: 40, carbs: 30, fat: 15 },
        { name: 'Salmon Salad', calories: 500, protein: 35, carbs: 20, fat: 25 },
        { name: 'Beef Stir Fry', calories: 550, protein: 45, carbs: 35, fat: 20 },
      ];

      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Not signed in');

      const today = new Date().toISOString().split('T')[0];
      const ref = doc(db, 'mealPlans', `${uid}_${today}`);
      await setDoc(ref, { meals: placeholder, generatedAt: serverTimestamp() }, { merge: true });
      setMeals(placeholder);
    } catch (err) {
      console.error('Error generating meal plan:', err);
      Alert.alert('Error', 'Could not generate meal plan.');
    } finally {
      setLoading(false);
    }
  };

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
        <Text style={styles.title}>Today's Meal Plan</Text>
        {meals?.map((meal, idx) => (
          <View key={idx} style={styles.card}>
            <Text style={styles.mealName}>{meal.name}</Text>
            <Text style={styles.nutrients}>
              {meal.calories} kcal | P: {meal.protein}g | C: {meal.carbs}g | F: {meal.fat}g
            </Text>
          </View>
        ))}
        <Pressable style={styles.button} onPress={generatePlan}>
          <Ionicons name="refresh" size={18} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Regenerate Plan</Text>
        </Pressable>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#d32f2f',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  mealName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  nutrients: {
    fontSize: 14,
    color: '#ccc',
  },
  button: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#d32f2f',
    backgroundColor: '#1a1a1a',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  icon: {
    marginRight: 8,
  },
});

export default MealPlanScreen;
