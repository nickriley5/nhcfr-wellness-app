// hooks/useDashboardData.ts
import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  onSnapshot,
} from 'firebase/firestore';
import { Exercise, ProgramDay } from '../types/Exercise';
import { format } from 'date-fns';

type MacroRow = { eaten: number; goal?: number; remaining?: number };

function sumMealsForToday(meals: any[]) {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  for (const meal of meals) {
    if (Array.isArray(meal.foodItems) && meal.foodItems.length) {
      // Item-level sum (base * (current/base)) — mirrors MealPlanScreen
      for (const item of meal.foodItems) {
        const baseQ = Number(item.baseQuantity ?? 1) || 1;
        const curQ = Number(item.currentQuantity ?? 1) || 1;
        const mult = curQ / baseQ;
        totals.calories += Math.round((item.baseCalories ?? 0) * mult);
        totals.protein += Math.round((item.baseProtein ?? 0) * mult);
        totals.carbs += Math.round((item.baseCarbs ?? 0) * mult);
        totals.fat += Math.round((item.baseFat ?? 0) * mult);
      }
    } else {
      // Fallback to meal-level totals
      totals.calories += Number(meal.calories ?? 0);
      totals.protein += Number(meal.protein ?? 0);
      totals.carbs += Number(meal.carbs ?? 0);
      totals.fat += Number(meal.fat ?? 0);
    }
  }

  return totals;
}

export function useDashboardData(view: 'week' | 'month' | 'all', bump: number = 0) {
  const [moodData, setMoodData] = useState<number[]>([]);
  const [energyData, setEnergyData] = useState<number[]>([]);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(true);
  const [completionPercent, setCompletionPercent] = useState(0);
  const [currentWeight, setCurrentWeight] = useState(180);
  const [programExists, setProgramExists] = useState(false);
  const [mealPlanExists, setMealPlanExists] = useState(false);
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);
  const [todayInfo, setTodayInfo] = useState<{
    day: ProgramDay;
    weekIdx: number;
    dayIdx: number;
  } | null>(null);

  const [macrosToday, setMacrosToday] = useState<{
    calories: MacroRow;
    protein: MacroRow;
    carbs: MacroRow;
    fat: MacroRow;
    hasMeals: boolean;
  }>({
    calories: { eaten: 0 },
    protein: { eaten: 0 },
    carbs: { eaten: 0 },
    fat: { eaten: 0 },
    hasMeals: false,
  });

  // ----------------- MAIN LOAD: program, check-ins, profile, exercises -----------------
  useEffect(() => {
    const fetchAll = async () => {
      const user = auth.currentUser;
      if (!user) {return;}

      // Program existence + today's day info
      const progSnap = await getDoc(doc(db, 'users', user.uid, 'program', 'active'));
      setProgramExists(progSnap.exists());

      if (progSnap.exists()) {
        const prog: any = progSnap.data();
        const days: ProgramDay[] = prog.days || [];
        const curDay = prog.metadata?.currentDay ?? 1;
        const idx = Math.max(0, curDay - 1);

        if (days[idx]) {
          setTodayInfo({
            day: days[idx],
            weekIdx: (days[idx] as any).week - 1,
            dayIdx: (days[idx] as any).day - 1,
          });
        } else {
          setTodayInfo(null);
        }
      } else {
        setTodayInfo(null);
      }

      // Meal plan existence
      const mealSnap = await getDoc(doc(db, 'users', user.uid, 'mealPlan', 'active'));
      setMealPlanExists(mealSnap.exists());

      // Check-ins (mood/energy series + today check)
      const checkSnap = await getDocs(
        query(collection(db, 'users', user.uid, 'checkIns'), orderBy('timestamp', 'asc'))
      );
      const entries = checkSnap.docs.map((d) => d.data());
      const todayStr = new Date().toDateString();
      const last = checkSnap.docs[checkSnap.docs.length - 1];
      if (!last || new Date(last.data().timestamp?.toDate()).toDateString() !== todayStr) {
        setHasCheckedInToday(false);
      } else {
        setHasCheckedInToday(true);
      }

      const limited =
        view === 'week' ? entries.slice(-7) : view === 'month' ? entries.slice(-30) : entries;
      setMoodData(limited.map((e: any) => Number(e.mood ?? 0)));
      setEnergyData(limited.map((e: any) => Number(e.energy ?? 0)));

      // Profile completion + current weight
      const profileSnap = await getDoc(doc(db, 'users', user.uid));
      const profile = profileSnap.data();
      if (profile) {
        const fields = [
          profile.fullName,
          profile.dob,
          profile.height,
          profile.weight,
          profile.profilePicture,
          profile.bodyFatPct,
        ];
        setCompletionPercent(
          Math.round((fields.filter(Boolean).length / fields.length) * 100)
        );
        setCurrentWeight(Number(profile.weight) || 180);
      }

      // Exercise library (used by generator)
      const libSnap = await getDocs(collection(db, 'exercises'));
      setExerciseLibrary(libSnap.docs.map((d) => d.data() as Exercise));
    };

    fetchAll();
  }, [view, bump]);

  // ----------------- MACROS: goals + live meals for today (top-level hook) -----------------
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {return;}

    let unsub: undefined | (() => void);
    let canceled = false;

    (async () => {
      // 1) Read goals from mealPlan/active
      let goals: {
        calorieTarget?: number;
        proteinGrams?: number;
        carbGrams?: number;
        fatGrams?: number;
      } = {};
      try {
        const goalRef = doc(db, `users/${uid}/mealPlan/active`);
        const goalSnap = await getDoc(goalRef);
        if (!canceled && goalSnap.exists()) {
          goals = goalSnap.data() as any; // calorieTarget, proteinGrams, carbGrams, fatGrams
        }
      } catch (e) {
        console.warn('macro goals load failed', e);
      }

      // 2) Subscribe to today’s meals
      const dateKey = format(new Date(), 'yyyy-MM-dd'); // local day key
      const mealsRef = collection(db, `users/${uid}/mealLogs/${dateKey}/meals`);
      unsub = onSnapshot(mealsRef, (snap) => {
        const meals = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const totals = sumMealsForToday(meals);

        const cGoal = goals.calorieTarget;
        const pGoal = goals.proteinGrams;
        const cbGoal = goals.carbGrams;
        const fGoal = goals.fatGrams;

        const cRem = cGoal != null ? Math.max(0, cGoal - totals.calories) : undefined;
        const pRem = pGoal != null ? Math.max(0, pGoal - totals.protein) : undefined;
        const cbRem = cbGoal != null ? Math.max(0, cbGoal - totals.carbs) : undefined;
        const fRem = fGoal != null ? Math.max(0, fGoal - totals.fat) : undefined;

        setMacrosToday({
          calories: { eaten: totals.calories, goal: cGoal, remaining: cRem },
          protein: { eaten: totals.protein, goal: pGoal, remaining: pRem },
          carbs: { eaten: totals.carbs, goal: cbGoal, remaining: cbRem },
          fat: { eaten: totals.fat, goal: fGoal, remaining: fRem },
          hasMeals: meals.length > 0,
        });
      });
    })();

    // intentionally depend on bump to refresh subscription on screen focus
    const bumpTrigger = bump;
    if (bumpTrigger === -1) {
      // no-op; keeps linter satisfied that bump is referenced
    }

    return () => {
      if (unsub) {unsub();}
      canceled = true;
    };
  }, [bump]);

  return {
    moodData,
    energyData,
    hasCheckedInToday,
    completionPercent,
    currentWeight,
    programExists,
    mealPlanExists,
    exerciseLibrary,
    todayInfo,
    macrosToday,
  };
}
