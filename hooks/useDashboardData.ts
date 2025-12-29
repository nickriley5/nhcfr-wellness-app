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
  where,
  Timestamp,
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
  
  const [aiWorkoutInfo, setAiWorkoutInfo] = useState<{
    day: ProgramDay;
    workoutId: string;
    createdAt: Date;
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
      if (!user) {
        // Reset all state when user is not authenticated
        setProgramExists(false);
        setTodayInfo(null);
        setMealPlanExists(false);
        setHasCheckedInToday(true);
        setMoodData([]);
        setEnergyData([]);
        setCompletionPercent(0);
        setCurrentWeight(180);
        setExerciseLibrary([]);
        return;
      }

      try {
        // Double-check authentication before making Firestore calls
        if (!auth.currentUser) {
          return;
        }

        // Check for AI workouts first (takes precedence)
        const aiWorkoutsQuery = query(
          collection(db, 'users', user.uid, 'aiWorkouts'),
          orderBy('createdAt', 'desc')
        );
        const aiWorkoutsSnap = await getDocs(aiWorkoutsQuery);
        
        if (!auth.currentUser) {
          return;
        }
        
        // Get the most recent AI workout from today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        let latestAiWorkout = null;
        
        aiWorkoutsSnap.forEach(docSnap => {
          const data = docSnap.data();
          const createdAt = data.createdAt?.toDate();
          if (createdAt && createdAt >= todayStart) {
            if (!latestAiWorkout || createdAt > latestAiWorkout.createdAt) {
              latestAiWorkout = {
                id: docSnap.id,
                data,
                createdAt,
              };
            }
          }
        });
        
        if (latestAiWorkout) {
          // AI workout exists from today - use it
          const aiDay = latestAiWorkout.data.days?.[0];
          if (aiDay) {
            setAiWorkoutInfo({
              day: aiDay,
              workoutId: latestAiWorkout.id,
              createdAt: latestAiWorkout.createdAt,
            });
          }
        } else {
          setAiWorkoutInfo(null);
        }

        // Program existence + today's day info
        // Check for prewritten program first
        const progSnap = await getDoc(doc(db, 'users', user.uid, 'program', 'active'));

        // Check again after async operation
        if (!auth.currentUser) {
          return;
        }

        let hasProgram = progSnap.exists();

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
          // Check for active AI program if no prewritten program
          console.log('🔍 Checking for AI programs...');
          const aiProgramsRef = collection(db, 'users', user.uid, 'aiPrograms');
          
          // First, get ALL programs to debug
          const allProgramsSnap = await getDocs(aiProgramsRef);
          console.log('📋 Total AI Programs:', allProgramsSnap.size);
          allProgramsSnap.forEach(doc => {
            const data = doc.data();
            console.log('  - Program:', data.programName, 'isActive:', data.isActive, 'isArchived:', data.isArchived);
          });
          
          // Query for active programs (isActive=true AND isArchived is either false or undefined)
          const aiProgramsSnap = await getDocs(query(aiProgramsRef, where('isActive', '==', true)));
          
          console.log('📋 AI Programs found with isActive=true:', aiProgramsSnap.size);
          
          if (!aiProgramsSnap.empty) {
            // Filter out archived programs in case isArchived field is missing in some docs
            const activePrograms = aiProgramsSnap.docs.filter(doc => {
              const data = doc.data();
              return !data.isArchived; // Will be true if isArchived is false or undefined
            });
            
            if (activePrograms.length > 0) {
              const aiProgram = activePrograms[0].data() as any;
              console.log('✅ Active AI Program:', aiProgram.programName, 'Week:', aiProgram.currentWeek, 'Day:', aiProgram.currentDay);
              hasProgram = true;
            
            // Get current day from AI program
            const currentWeek = aiProgram.currentWeek || 1;
            const currentDay = aiProgram.currentDay || 1;
            
            const week = aiProgram.weeks?.find((w: any) => w.weekNumber === currentWeek);
            const day = week?.days?.find((d: any) => d.dayNumber === currentDay);
            
            if (day) {
              // Convert AI program day to ProgramDay format
              const nameToId = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
              
              const programDay: ProgramDay = {
                title: `${day.dayName} - Week ${currentWeek}`,
                warmup: day.warmup?.map((w: string) => ({ 
                  exerciseId: nameToId(w), 
                  repsOrDuration: '5-10 reps' 
                })) || [],
                exercises: day.exercises?.map((ex: any) => ({
                  exerciseId: ex.id || nameToId(ex.name),
                  sets: ex.sets,
                  repsOrDuration: ex.reps,
                  restSeconds: ex.restSeconds,
                  notes: ex.notes || '',
                })) || [],
                cooldown: day.cooldown?.map((c: string) => ({ 
                  exerciseId: nameToId(c), 
                  repsOrDuration: '30-60 sec' 
                })) || [],
              };
              
              setTodayInfo({
                day: programDay,
                weekIdx: currentWeek - 1,
                dayIdx: currentDay - 1,
              });
            } else {
              setTodayInfo(null);
            }
            } else {
              // No active non-archived programs found
              setTodayInfo(null);
            }
          } else {
            // No AI programs with isActive=true found
            setTodayInfo(null);
          }
        }

        setProgramExists(hasProgram);

        // Meal plan existence
        const mealSnap = await getDoc(doc(db, 'users', user.uid, 'mealPlan', 'active'));

        // Check again after async operation
        if (!auth.currentUser) {
          return;
        }

        setMealPlanExists(mealSnap.exists());

        // Check-ins (mood/energy series + today check)
        // Calculate date range based on view parameter
        const now = new Date();
        let startDate = new Date();
        switch (view) {
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'all':
            startDate = new Date(0); // Beginning of time
            break;
        }

        // Query with date range filter for efficient loading
        console.log(`🔍 Loading check-ins for view: ${view}, startDate: ${startDate.toISOString()}`);
        const checkSnap = await getDocs(
          query(
            collection(db, 'users', user.uid, 'checkIns'),
            where('timestamp', '>=', Timestamp.fromDate(startDate)),
            orderBy('timestamp', 'asc')
          )
        );

        // Check again after async operation
        if (!auth.currentUser) {
          return;
        }

        const entries = checkSnap.docs.map((d) => d.data());
        console.log(`📊 Found ${entries.length} check-in entries:`, entries.map(e => ({
          mood: e.mood,
          energy: e.energy,
          timestamp: e.timestamp?.toDate?.()?.toISOString?.() || 'No timestamp',
        })));

        // Check if user has checked in today
        const todayStr = new Date().toDateString();
        const hasToday = entries.some((entry: any) =>
          entry.timestamp?.toDate().toDateString() === todayStr
        );
        setHasCheckedInToday(hasToday);

        // Use all entries (they're already filtered by date range)
        setMoodData(entries.map((e: any) => Number(e.mood ?? 0)));
        setEnergyData(entries.map((e: any) => Number(e.energy ?? 0)));
        console.log(`📈 Set mood data: [${entries.map((e: any) => Number(e.mood ?? 0)).join(', ')}]`);
        console.log(`⚡ Set energy data: [${entries.map((e: any) => Number(e.energy ?? 0)).join(', ')}]`);

        // Profile completion + current weight
        const profileSnap = await getDoc(doc(db, 'users', user.uid));

        // Check again after async operation
        if (!auth.currentUser) {
          return;
        }

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
          setCurrentWeight(Number(profile.currentWeight || profile.weight) || 180);
        }

        // Exercise library (used by generator)
        const libSnap = await getDocs(collection(db, 'exercises'));

        // Check again after async operation
        if (!auth.currentUser) {
          return;
        }

        setExerciseLibrary(libSnap.docs.map((d) => d.data() as Exercise));
      } catch (error) {
        console.error('Error in fetchAll:', error);
        // Reset state on error
        setProgramExists(false);
        setTodayInfo(null);
        setMealPlanExists(false);
        setHasCheckedInToday(true);
        setMoodData([]);
        setEnergyData([]);
        setCompletionPercent(0);
        setCurrentWeight(180);
        setExerciseLibrary([]);
      }
    };

    fetchAll();
  }, [view, bump]);

  // ----------------- MACROS: goals + live meals for today (top-level hook) -----------------
  useEffect(() => {
    // Early return if no user - don't set up any listeners
    const currentUser = auth.currentUser;
    if (!currentUser?.uid) {
      setMacrosToday({
        calories: { eaten: 0 },
        protein: { eaten: 0 },
        carbs: { eaten: 0 },
        fat: { eaten: 0 },
        hasMeals: false,
      });
      return;
    }

    const uid = currentUser.uid;
    let unsub: undefined | (() => void);
    let canceled = false;

    (async () => {
      // Double-check authentication before starting async work
      if (!auth.currentUser) {
        return;
      }

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

        // Check again after async operation
        if (!auth.currentUser) {
          return;
        }

        if (!canceled && goalSnap.exists()) {
          goals = goalSnap.data() as any; // calorieTarget, proteinGrams, carbGrams, fatGrams
        }
      } catch (e) {
        console.warn('macro goals load failed', e);
      }

            // 2) Subscribe to today's meals
      const dateKey = format(new Date(), 'yyyy-MM-dd'); // local day key
      const mealsRef = collection(db, `users/${uid}/mealLogs/${dateKey}/meals`);
      unsub = onSnapshot(
        mealsRef,
        (snap) => {
          // Check if still authenticated and not canceled
          if (!auth.currentUser || canceled) {
            return;
          }

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
        },
        (error) => {
          // Silently handle permission errors (e.g., after logout)
          console.log('🔒 Dashboard meal listener - Error caught:', error.code);
          if (error.code !== 'permission-denied') {
            console.error('Dashboard meal listener - Unexpected error:', error);
          }
        }
      );
    })();

    // intentionally depend on bump to refresh subscription on screen focus
    const bumpTrigger = bump;
    if (bumpTrigger === -1) {
      // no-op; keeps linter satisfied that bump is referenced
    }

    return () => {
      canceled = true;
      if (unsub) {
        unsub();
      }
    };
  }, [bump, auth.currentUser?.uid]); // Re-run when user changes

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
    aiWorkoutInfo,
    macrosToday,
  };
}
