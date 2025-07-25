import { useEffect, useState, useCallback } from 'react';
import { db } from '../firebase';
import { format } from 'date-fns';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';

// Type for a single logged meal
export interface LoggedMeal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  loggedAt?: any;
}

// Return type
interface UseMealLogsResult {
  loggedMeals: LoggedMeal[];
  totals: { calories: number; protein: number; carbs: number; fat: number };
  addMeal: (meal: LoggedMeal) => Promise<void>;
}

export function useMealLogs(uid: string | undefined, selectedDate: Date): UseMealLogsResult {
  const [loggedMeals, setLoggedMeals] = useState<LoggedMeal[]>([]);

  // Fetch meals for the selected date
  useEffect(() => {
    if (!uid) {return;}

    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const mealLogRef = collection(db, `users/${uid}/mealLogs/${dateKey}/meals`);

    const unsub = onSnapshot(mealLogRef, (snapshot) => {
      const meals: LoggedMeal[] = snapshot.docs.map((doc) => ({
        ...(doc.data() as LoggedMeal),
      }));
      setLoggedMeals(meals);
    });

    return () => unsub();
  }, [uid, selectedDate]);

  // Calculate totals
  const totals = loggedMeals.reduce(
    (acc, m) => {
      acc.calories += m.calories || 0;
      acc.protein += m.protein || 0;
      acc.carbs += m.carbs || 0;
      acc.fat += m.fat || 0;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Helper to add a meal for current day
  const addMeal = useCallback(
    async (meal: LoggedMeal) => {
      if (!uid) {return;}
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      const mealLogRef = collection(db, `users/${uid}/mealLogs/${dateKey}/meals`);
      await addDoc(mealLogRef, {
        ...meal,
        loggedAt: new Date(),
      });
    },
    [uid, selectedDate]
  );

  return { loggedMeals, totals, addMeal };
}
