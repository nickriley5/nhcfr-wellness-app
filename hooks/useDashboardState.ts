// hooks/useDashboardState.ts
import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, limit, getDocs, orderBy, setDoc, updateDoc } from 'firebase/firestore';

interface HydrationState {
  currentOz: number;
  goalOz: number;
  containerOz: number;
}

interface ProgramInfo {
  daysPerWeek: number;
  hasSchedule: boolean;
  currentDayName: string;
  isRestDay: boolean;
  todayEnvironment: string;
}

interface TomorrowInfo {
  isRestDay: boolean;
  day: any;
  weekIdx: number;
  dayIdx: number;
  environment: string;
}

interface WorkoutSummary {
  isCompleted: boolean;
  dayTitle: string;
  totalTime: string;
  setsCompleted: number;
  setsPlanned: number;
  completedAt: Date;
  prMessages: string[];
}

interface ConsistencyData {
  workoutStreak: number;
  workoutsCompleted: number;
  workoutsPlanned: number;
  mealsLogged: number;
  hydrationDays: number;
  recentPRs: string[];
}

export function useDashboardState(bump: number, programExists: boolean) {
  const [hydrationToday, setHydrationToday] = useState<HydrationState>({
    currentOz: 0,
    goalOz: 64,
    containerOz: 16,
  });
  
  const [programInfo, setProgramInfo] = useState<ProgramInfo | null>(null);
  const [tomorrowInfo, setTomorrowInfo] = useState<TomorrowInfo | null>(null);
  const [todayWorkoutSummary, setTodayWorkoutSummary] = useState<WorkoutSummary | null>(null);
  const [consistencyData, setConsistencyData] = useState<ConsistencyData>({
    workoutStreak: 0,
    workoutsCompleted: 0,
    workoutsPlanned: 0,
    mealsLogged: 0,
    hydrationDays: 0,
    recentPRs: [],
  });

  // Load program information and schedule status
  useEffect(() => {
    const loadProgramInfo = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        return;
      }

      try {
        // Get active program
        const programDoc = await getDoc(doc(db, 'users', uid, 'program', 'active'));
        if (!programDoc.exists()) {
          setProgramInfo(null);
          return;
        }

        const programData = programDoc.data();
        const daysPerWeek = programData.template?.daysPerWeek || 4;

        // Get user profile to check schedule
        const profileDoc = await getDoc(doc(db, 'users', uid));
        const profile = profileDoc.data();
        const hasSchedule = !!profile?.schedule?.environmentMap;

        // Determine current day status
        const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
        const dayMap = {
          Sunday: 'Sun', Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
          Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat',
        };
        const todayKey = dayMap[today as keyof typeof dayMap] || today;

        let currentDayName = 'No current workout';
        let isRestDay = true;
        let todayEnvironment = 'off'; // Default to off

        if (hasSchedule && profile.schedule.environmentMap[todayKey]) {
          todayEnvironment = profile.schedule.environmentMap[todayKey];
          isRestDay = todayEnvironment === 'off';

          if (!isRestDay) {
            // Count how many workout days have passed this week to determine program day
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday

            const workoutDaysThisWeek = [];
            for (let i = 0; i < 7; i++) {
              const checkDate = new Date(weekStart);
              checkDate.setDate(weekStart.getDate() + i);
              const checkDay = checkDate.toLocaleDateString('en-US', { weekday: 'short' });
              const checkDayKey = dayMap[checkDay as keyof typeof dayMap] || checkDay;

              if (profile.schedule.environmentMap[checkDayKey] !== 'off') {
                workoutDaysThisWeek.push(checkDayKey);
              }
            }

            // Find which workout day of the week today is
            const todayIndex = workoutDaysThisWeek.indexOf(todayKey);
            if (todayIndex >= 0) {
              const programDayIndex = todayIndex % daysPerWeek;
              const programDay = programData.template?.days?.[programDayIndex];
              currentDayName = programDay?.title || `Day ${programDayIndex + 1}`;
            }
          }
        }

        setProgramInfo({
          daysPerWeek,
          hasSchedule,
          currentDayName,
          isRestDay,
          todayEnvironment,
        });
      } catch (error) {
        console.error('Error loading program info:', error);
        setProgramInfo(null);
      }
    };

    loadProgramInfo();
  }, [bump]);

  // Load tomorrow's workout info
  useEffect(() => {
    const loadTomorrowInfo = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid || !programExists) {
        setTomorrowInfo(null);
        return;
      }

      try {
        // Get the active program
        const progSnap = await getDoc(doc(db, 'users', uid, 'program', 'active'));
        if (!progSnap.exists()) {
          setTomorrowInfo(null);
          return;
        }

        const prog: any = progSnap.data();
        const days: any[] = prog.days || [];
        const curDay = prog.metadata?.currentDay ?? 1;

        // Get next day (tomorrow's workout)
        const nextDayIndex = curDay; // curDay is 1-based, so curDay gives us next day's 0-based index

        // Handle cycling through program
        const actualIndex = nextDayIndex % days.length;
        const nextWorkoutDay = days[actualIndex];

        if (!nextWorkoutDay) {
          setTomorrowInfo(null);
          return;
        }

        // Get tomorrow's date and check if it's a rest day
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDay = tomorrow.toLocaleDateString('en-US', { weekday: 'short' });

        const dayMap = {
          Sunday: 'Sun', Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
          Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat',
        };
        const tomorrowKey = dayMap[tomorrowDay as keyof typeof dayMap] || tomorrowDay;

        // Get user schedule to check if tomorrow is a rest day
        const profileDoc = await getDoc(doc(db, 'users', uid));
        const profile = profileDoc.data();
        const environmentMap = profile?.schedule?.environmentMap;

        let isRestDay = true;
        let environment = 'off';

        if (environmentMap && environmentMap[tomorrowKey]) {
          environment = environmentMap[tomorrowKey];
          isRestDay = environment === 'off';
        }

        setTomorrowInfo({
          isRestDay,
          day: nextWorkoutDay,
          weekIdx: (nextWorkoutDay as any).week - 1,
          dayIdx: (nextWorkoutDay as any).day - 1,
          environment,
        });
      } catch (error) {
        console.error('Error getting tomorrow info:', error);
        setTomorrowInfo(null);
      }
    };

    loadTomorrowInfo();
  }, [bump, programExists]);

  // Load today's workout completion status
  useEffect(() => {
    const loadWorkoutSummary = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        return;
      }

      try {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

        // Query today's workout logs
        const workoutLogsQuery = query(
          collection(db, 'users', uid, 'workoutLogs'),
          where('completedAt', '>=', todayStart),
          where('completedAt', '<', todayEnd),
          orderBy('completedAt', 'desc'),
          limit(1)
        );

        const snapshot = await getDocs(workoutLogsQuery);
        if (!snapshot.empty) {
          const workoutData = snapshot.docs[0].data();
          const prMessages: string[] = [];

          // Calculate summary stats
          const elapsedSec = workoutData.elapsedSec || 0;
          const totalTime = Math.floor(elapsedSec / 60) + ' min';
          const setsCompleted = workoutData.exercises?.reduce((total: number, ex: any) =>
            total + (ex.sets?.filter((set: any) => set.reps || set.weight).length || 0), 0) || 0;
          const setsPlanned = workoutData.exercises?.reduce((total: number, ex: any) =>
            total + (ex.sets?.length || 0), 0) || 0;

          // Check for PRs (simple detection from weight data)
          if (workoutData.exercises) {
            const exercisePRs: Record<string, number> = {};
            workoutData.exercises.forEach((ex: any) => {
              ex.sets?.forEach((set: any) => {
                const weight = Number(set.weight);
                if (!isNaN(weight) && weight > 0) {
                  exercisePRs[ex.name] = Math.max(exercisePRs[ex.name] || 0, weight);
                }
              });
            });

            Object.entries(exercisePRs).forEach(([exerciseName, weight]) => {
              if (weight > 0) {
                prMessages.push(`${exerciseName}: ${weight} lbs`);
              }
            });
          }

          setTodayWorkoutSummary({
            isCompleted: true,
            dayTitle: workoutData.dayTitle || 'Workout',
            totalTime,
            setsCompleted,
            setsPlanned,
            completedAt: workoutData.completedAt?.toDate() || new Date(),
            prMessages: prMessages.slice(0, 3), // Limit to top 3 PRs
          });
        } else {
          setTodayWorkoutSummary(null);
        }
      } catch (error) {
        console.error('Error loading workout summary:', error);
        setTodayWorkoutSummary(null);
      }
    };

    loadWorkoutSummary();
  }, [bump]);

  // Calculate consistency data
  useEffect(() => {
    const calculateConsistency = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid || !programExists) {
        return;
      }

      try {
        // Calculate last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // 1. WORKOUT CONSISTENCY - Based on program schedule
        const programDoc = await getDoc(doc(db, 'users', uid, 'program', 'active'));
        let workoutsCompleted = 0;
        let workoutsPlanned = 0;

        if (programDoc.exists()) {
          const program = programDoc.data();
          const daysPerWeek = program.metadata?.daysPerWeek || 4;

          // Get workout logs from last 7 days
          const workoutLogsQuery = query(
            collection(db, 'users', uid, 'workoutLogs'),
            where('completedAt', '>=', sevenDaysAgo),
            orderBy('completedAt', 'desc')
          );

          const workoutSnapshot = await getDocs(workoutLogsQuery);
          workoutsCompleted = workoutSnapshot.size;
          workoutsPlanned = daysPerWeek; // Per week
        }

        // 2. MEAL CONSISTENCY - Days with at least 3 meals logged
        let mealsLogged = 0;

        // First, check today's meals from real-time data
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // Get today's meal count from Firebase
        const todayMealsQuery = query(
          collection(db, 'users', uid, 'mealLogs', todayStr, 'meals')
        );
        const todayMealsSnapshot = await getDocs(todayMealsQuery);
        if (todayMealsSnapshot.size >= 3) {
          mealsLogged++; // Today counts if 3+ meals
        }

        // Then check the past 6 days
        for (let i = 1; i < 7; i++) {
          const checkDate = new Date();
          checkDate.setDate(checkDate.getDate() - i);
          const dateStr = checkDate.toISOString().split('T')[0];

          const mealsQuery = query(
            collection(db, 'users', uid, 'mealLogs', dateStr, 'meals')
          );

          const mealSnapshot = await getDocs(mealsQuery);
          if (mealSnapshot.size >= 3) { // At least 3 meals logged
            mealsLogged++;
          }
        }
        // 3. HYDRATION CONSISTENCY - Days hitting 80% of goal
        let hydrationDays = 0;
        for (let i = 0; i < 7; i++) {
          const checkDate = new Date();
          checkDate.setDate(checkDate.getDate() - i);
          const dateStr = checkDate.toISOString().split('T')[0];

          const hydrationQuery = query(
            collection(db, 'users', uid, 'hydrationLogs'),
            where('date', '==', dateStr)
          );

          const hydrationSnapshot = await getDocs(hydrationQuery);
          if (!hydrationSnapshot.empty) {
            const hydrationData = hydrationSnapshot.docs[0].data();
            const percentage = (hydrationData.currentOz || 0) / (hydrationData.goalOz || 64);
            if (percentage >= 0.8) { // Hit 80% of goal
              hydrationDays++;
            }
          }
        }

        // 4. RECENT PRS - Last 3 PRs from workout logs
        const recentPRs: string[] = [];
        const prQuery = query(
          collection(db, 'users', uid, 'workoutLogs'),
          orderBy('completedAt', 'desc'),
          limit(10) // Look at last 10 workouts for PRs
        );

        const prSnapshot = await getDocs(prQuery);
        prSnapshot.docs.forEach(logDoc => {
          const logData = logDoc.data();
          if (logData.exercises) {
            logData.exercises.forEach((ex: any) => {
              ex.sets?.forEach((set: any) => {
                if (set.isPR && recentPRs.length < 3) {
                  recentPRs.push(`${ex.name}: ${set.weight}lbs x ${set.reps}`);
                }
              });
            });
          }
        });

        // 5. CALCULATE STREAK - Days hitting all 3 metrics
        const currentStreak = Math.min(workoutsCompleted, mealsLogged, hydrationDays);

        setConsistencyData({
          workoutStreak: currentStreak,
          workoutsCompleted,
          workoutsPlanned,
          mealsLogged,
          hydrationDays,
          recentPRs,
        });

      } catch (error) {
        console.error('Error calculating consistency:', error);
      }
    };

    calculateConsistency();
  }, [programExists, bump]);

  // Load hydration data
  useEffect(() => {
    const loadHydrationData = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        return;
      }

      try {
        const today = new Date().toISOString().split('T')[0];
        const hydrationDoc = await getDoc(doc(db, 'users', uid, 'hydrationLogs', today));

        if (hydrationDoc.exists()) {
          const data = hydrationDoc.data();
          setHydrationToday({
            currentOz: data.currentOz || 0,
            goalOz: data.goalOz || 64,
            containerOz: data.containerOz || 16,
          });
        } else {
          // Load user's default goal from profile
          const profileDoc = await getDoc(doc(db, 'users', uid));
          const defaultGoal = profileDoc.exists() ? profileDoc.data().hydrationGoalOz || 64 : 64;
          const defaultContainer = profileDoc.exists() ? profileDoc.data().hydrationContainerOz || 16 : 16;
          setHydrationToday({ currentOz: 0, goalOz: defaultGoal, containerOz: defaultContainer });
        }
      } catch (error) {
        console.error('Error loading hydration data:', error);
      }
    };

    loadHydrationData();
  }, [bump]);

  // Hydration utility functions
  const updateHydrationGoal = async (newGoal: number) => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      await setDoc(doc(db, 'users', uid, 'hydrationLogs', today), {
        currentOz: hydrationToday.currentOz,
        goalOz: newGoal,
        date: today,
      });

      // Also save as default in profile
      await updateDoc(doc(db, 'users', uid), {
        hydrationGoalOz: newGoal,
      });

      setHydrationToday(prev => ({ ...prev, goalOz: newGoal }));
    } catch (error) {
      console.error('Error updating hydration goal:', error);
    }
  };

  const updateContainerSize = async (newContainerOz: number) => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      return;
    }

    try {
      // Save as default in profile
      await updateDoc(doc(db, 'users', uid), {
        hydrationContainerOz: newContainerOz,
      });

      setHydrationToday(prev => ({ ...prev, containerOz: newContainerOz }));
    } catch (error) {
      console.error('Error updating container size:', error);
    }
  };

  const addHydration = async (ozToAdd: number) => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      return;
    }

    const newTotal = Math.min(hydrationToday.currentOz + ozToAdd, hydrationToday.goalOz);

    try {
      const today = new Date().toISOString().split('T')[0];
      await setDoc(doc(db, 'users', uid, 'hydrationLogs', today), {
        currentOz: newTotal,
        goalOz: hydrationToday.goalOz,
        date: today,
      });

      setHydrationToday(prev => ({ ...prev, currentOz: newTotal }));
    } catch (error) {
      console.error('Error updating hydration:', error);
    }
  };

  return {
    hydrationToday,
    setHydrationToday,
    programInfo,
    tomorrowInfo,
    todayWorkoutSummary,
    consistencyData,
    updateHydrationGoal,
    updateContainerSize,
    addHydration,
  };
}
