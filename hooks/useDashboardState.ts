// hooks/useDashboardState.ts
import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, limit, getDocs, orderBy, setDoc, updateDoc } from 'firebase/firestore';

const logSafeError = (label: string, err: unknown) => {
  if (err instanceof Error) {
    console.error(label, err.message);
    return;
  }
  try {
    console.error(label, JSON.parse(JSON.stringify(err)));
  } catch {
    console.error(label, String(err));
  }
};

const logSafeWarn = (label: string, err: unknown) => {
  if (err instanceof Error) {
    console.warn(label, err.message);
    return;
  }
  try {
    console.warn(label, JSON.parse(JSON.stringify(err)));
  } catch {
    console.warn(label, String(err));
  }
};

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

interface CardioSummary {
  isCompleted: boolean;
  dayTitle: string;
  totalTime: string;
  completedAt: Date;
  type?: string;
  distance?: number | null;
  pace?: string | null;
  calories?: number | null;
  avgHeartRate?: number | null;
  maxHeartRate?: number | null;
}

interface CardioSession {
  dayOfWeek: string;
  type: string;
  duration: number;
  intensity: string;
  notes?: string;
  targetHeartRate?: string;
}

interface CardioScheduleInfo {
  frequency: number;
  currentWeek: number;
  sessions: CardioSession[];
  completedSessionKeys: string[];
  completedThisWeek: number;
  todaySession?: CardioSession;
  todaySessionKey?: string;
  todayIsCompleted?: boolean;
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
  const [todayCardioSummary, setTodayCardioSummary] = useState<CardioSummary | null>(null);
  const [cardioScheduleInfo, setCardioScheduleInfo] = useState<CardioScheduleInfo | null>(null);
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
        setProgramInfo(null);
        setCardioScheduleInfo(null);
        return;
      }

      try {
        // Double-check user is still authenticated before making Firestore calls
        if (!auth.currentUser) {
          setProgramInfo(null);
          setCardioScheduleInfo(null);
          return;
        }

        // Get active program (prewritten first)
        const programDoc = await getDoc(doc(db, 'users', uid, 'program', 'active'));

        // Check again after async operation
        if (!auth.currentUser) {
          setProgramInfo(null);
          return;
        }

        const storedProgramData = programDoc.exists() ? programDoc.data() : null;
        const storedProgramDays = Array.isArray(storedProgramData?.days) ? storedProgramData.days : [];
        let programData = storedProgramDays.length > 0 ? storedProgramData : null;
        let daysPerWeek = 4;
        let isAIProgram = false;

        // If no prewritten program, check for AI program
        if (!programData) {
          const { collection: firestoreCollection, query: firestoreQuery, where: firestoreWhere, getDocs: firestoreGetDocs } = await import('firebase/firestore');
          const aiProgramsRef = firestoreCollection(db, 'users', uid, 'aiPrograms');
          const aiProgramsSnap = await firestoreGetDocs(firestoreQuery(aiProgramsRef, firestoreWhere('isActive', '==', true), firestoreWhere('isArchived', '==', false)));
          
          if (!aiProgramsSnap.empty) {
            const aiProgram = aiProgramsSnap.docs[0].data();
            isAIProgram = true;
            // Create mock structure for AI program
            programData = {
              template: {
                daysPerWeek: aiProgram.weeks?.[0]?.days?.length || 4,
                days: aiProgram.weeks?.[0]?.days || [],
              }
            };
            daysPerWeek = programData.template.daysPerWeek;

            const currentWeek = aiProgram.currentWeek || 1;
            const cardioSchedule = aiProgram.cardioSchedule;
            const completedCardioSessions = aiProgram.completedCardioSessions || [];
            if (cardioSchedule?.frequency) {
              const weekSchedule = cardioSchedule.weeks?.find((w: any) => w.weekNumber === currentWeek);
              const sessions = (weekSchedule?.sessions || []) as CardioSession[];
              const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
              const todaySession = sessions.find((session) => session.dayOfWeek === todayName);
              const todaySessionKey = todaySession ? `week${currentWeek}-${todaySession.dayOfWeek}` : undefined;
              const completedThisWeek = completedCardioSessions.filter((key: string) => key.startsWith(`week${currentWeek}-`)).length;

              setCardioScheduleInfo({
                frequency: cardioSchedule.frequency,
                currentWeek,
                sessions,
                completedSessionKeys: completedCardioSessions,
                completedThisWeek,
                todaySession,
                todaySessionKey,
                todayIsCompleted: todaySessionKey ? completedCardioSessions.includes(todaySessionKey) : false,
              });
            } else {
              setCardioScheduleInfo(null);
            }
          }
        } else {
          daysPerWeek = programData.template?.daysPerWeek || 4;
          setCardioScheduleInfo(null);
        }

        if (!programData) {
          setProgramInfo(null);
          setCardioScheduleInfo(null);
          return;
        }

        // Get user profile to check schedule
        const profileDoc = await getDoc(doc(db, 'users', uid));

        // Check again after async operation
        if (!auth.currentUser) {
          setProgramInfo(null);
          return;
        }

        const profile = profileDoc.data();
        const hasSchedule = !!profile?.schedule?.environmentMap;

        // Determine current day status
        const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
        const dayMap = {
          Sunday: 'Sun', Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
          Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat',
        };
        const todayKey = dayMap[today as keyof typeof dayMap] || today;

        let currentDayName = isAIProgram ? 'AI Program Active' : 'No current workout';
        let isRestDay = true;
        let todayEnvironment = 'off'; // Default to off

        if (hasSchedule && profile.schedule.environmentMap[todayKey]) {
          todayEnvironment = profile.schedule.environmentMap[todayKey];
          isRestDay = todayEnvironment === 'off';

          if (!isRestDay) {
            if (isAIProgram) {
              currentDayName = 'AI Workout';
            } else {
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
        }

        setProgramInfo({
          daysPerWeek,
          hasSchedule,
          currentDayName,
          isRestDay,
          todayEnvironment,
        });
      } catch (error) {
        logSafeError('Error loading program info:', error);
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
        // Double-check user is still authenticated
        if (!auth.currentUser) {
          setTomorrowInfo(null);
          return;
        }

        // Get the active program (prewritten first)
        const progSnap = await getDoc(doc(db, 'users', uid, 'program', 'active'));

        // Check again after async operation
        if (!auth.currentUser) {
          setTomorrowInfo(null);
          return;
        }

        let nextWorkoutDay: any = null;
        let isAIProgram = false;

        if (progSnap.exists()) {
          // Prewritten program
          const prog: any = progSnap.data();
          const days: any[] = Array.isArray(prog.days) ? prog.days : [];
          if (days.length === 0) {
            setTomorrowInfo(null);
            return;
          }

          const curDay = prog.metadata?.currentDay ?? 1;

          // Get next day (tomorrow's workout)
          const nextDayIndex = curDay; // curDay is 1-based, so curDay gives us next day's 0-based index

          // Handle cycling through program
          const actualIndex = nextDayIndex % days.length;
          nextWorkoutDay = days[actualIndex];
        } else {
          // Check for AI program
          try {
            const { collection: firestoreCollection, query: firestoreQuery, where: firestoreWhere, getDocs: firestoreGetDocs } = await import('firebase/firestore');
            const aiProgramsRef = firestoreCollection(db, 'users', uid, 'aiPrograms');
            const aiProgramsSnap = await firestoreGetDocs(firestoreQuery(aiProgramsRef, firestoreWhere('isActive', '==', true)));
            
            if (!aiProgramsSnap.empty) {
              const activePrograms = aiProgramsSnap.docs.filter(doc => !doc.data().isArchived);
              
              if (activePrograms.length > 0) {
                const aiProgram = activePrograms[0].data() as any;
                isAIProgram = true;
                
                // Get current position in program
                const currentWeek = aiProgram.currentWeek || 1;
                const currentDay = aiProgram.currentDay || 1;
                
                // Find tomorrow's day (next day in sequence)
                const currentWeekData = aiProgram.weeks?.find((w: any) => w.weekNumber === currentWeek);
                const daysInWeek = currentWeekData?.days?.length || 0;
                
                let nextWeek = currentWeek;
                let nextDay = currentDay + 1;
                
                // If next day exceeds days in current week, move to next week
                if (nextDay > daysInWeek && daysInWeek > 0) {
                  nextDay = 1;
                  nextWeek = currentWeek + 1;
                }
                
                // Check if next week exists
                const nextWeekData = aiProgram.weeks?.find((w: any) => w.weekNumber === nextWeek);
                const nextDayData = nextWeekData?.days?.find((d: any) => d.dayNumber === nextDay);
                
                if (nextDayData) {
                  // Convert to expected format
                  const nameToId = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
                  
                  nextWorkoutDay = {
                    title: `${nextDayData.dayName} - Week ${nextWeek}`,
                    warmup: nextDayData.warmup?.map((w: string) => ({ 
                      exerciseId: nameToId(w), 
                      repsOrDuration: '5-10 reps' 
                    })) || [],
                    exercises: nextDayData.exercises?.map((ex: any) => ({
                      exerciseId: ex.id || nameToId(ex.name),
                      sets: ex.sets,
                      repsOrDuration: ex.reps,
                      restSeconds: ex.restSeconds,
                      notes: ex.notes || '',
                    })) || [],
                    cooldown: nextDayData.cooldown?.map((c: string) => ({ 
                      exerciseId: nameToId(c), 
                      repsOrDuration: '30-60 sec' 
                    })) || [],
                    week: nextWeek,
                    day: nextDay,
                  };
                }
              }
            }
          } catch (aiError) {
            logSafeError('Error loading AI program for tomorrow:', aiError);
            // Continue - nextWorkoutDay will be null
          }
        }

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

        // Check again after async operation
        if (!auth.currentUser) {
          setTomorrowInfo(null);
          return;
        }

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
        logSafeError('Error getting tomorrow info:', error);
        setTomorrowInfo(null);
      }
    };

    loadTomorrowInfo();
  }, [bump, programExists]);

  // Load today's workout + cardio completion status
  useEffect(() => {
    const loadWorkoutSummary = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setTodayWorkoutSummary(null);
        setTodayCardioSummary(null);
        return;
      }

      try {
        // Double-check user is still authenticated
        if (!auth.currentUser) {
          setTodayWorkoutSummary(null);
          return;
        }

        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

        const loadTodayLogByType = async (workoutType: 'strength' | 'cardio') => {
          try {
            const workoutLogsQuery = query(
              collection(db, 'users', uid, 'workoutLogs'),
              where('completedAt', '>=', todayStart),
              where('completedAt', '<', todayEnd),
              where('workoutType', '==', workoutType),
              orderBy('completedAt', 'desc'),
              limit(1)
            );

            const snapshot = await getDocs(workoutLogsQuery);
            return snapshot.empty ? null : snapshot.docs[0].data();
          } catch (error) {
            logSafeWarn(`Workout summary fallback for ${workoutType}:`, error);
          }

          const fallbackQuery = query(
            collection(db, 'users', uid, 'workoutLogs'),
            where('completedAt', '>=', todayStart),
            where('completedAt', '<', todayEnd),
            orderBy('completedAt', 'desc')
          );
          const fallbackSnap = await getDocs(fallbackQuery);
          const match = fallbackSnap.docs.find(docSnap => docSnap.data().workoutType === workoutType);
          return match?.data() ?? null;
        };

        const workoutData = await loadTodayLogByType('strength');
        const cardioData = await loadTodayLogByType('cardio');

        // Check again after async operation
        if (!auth.currentUser) {
          setTodayWorkoutSummary(null);
          setTodayCardioSummary(null);
          return;
        }

        if (workoutData) {
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

        if (cardioData) {
          const actualDuration = cardioData.actualDuration ?? cardioData.plannedDuration ?? 0;
          setTodayCardioSummary({
            isCompleted: true,
            dayTitle: cardioData.dayTitle || 'Cardio',
            totalTime: `${actualDuration} min`,
            completedAt: cardioData.completedAt?.toDate() || new Date(),
            type: cardioData.type,
            distance: cardioData.distance ?? null,
            pace: cardioData.pace ?? null,
            calories: cardioData.calories ?? null,
            avgHeartRate: cardioData.avgHeartRate ?? null,
            maxHeartRate: cardioData.maxHeartRate ?? null,
          });
        } else {
          setTodayCardioSummary(null);
        }
      } catch (error) {
        logSafeError('Error loading workout summary:', error);
        setTodayWorkoutSummary(null);
        setTodayCardioSummary(null);
      }
    };

    loadWorkoutSummary();
  }, [bump]);

  // Calculate consistency data
  useEffect(() => {
    const calculateConsistency = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid || !programExists) {
        setConsistencyData({
          workoutStreak: 0,
          workoutsCompleted: 0,
          workoutsPlanned: 0,
          mealsLogged: 0,
          hydrationDays: 0,
          recentPRs: [],
        });
        return;
      }

      try {
        // Double-check user is still authenticated
        if (!auth.currentUser) {
          setConsistencyData({
            workoutStreak: 0,
            workoutsCompleted: 0,
            workoutsPlanned: 0,
            mealsLogged: 0,
            hydrationDays: 0,
            recentPRs: [],
          });
          return;
        }

        // Calculate last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // 1. WORKOUT CONSISTENCY - Based on program schedule
        const programDoc = await getDoc(doc(db, 'users', uid, 'program', 'active'));

        // Check again after async operation
        if (!auth.currentUser) {
          return;
        }

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

          // Check again after async operation
          if (!auth.currentUser) {
            return;
          }

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

        // Check again after async operation
        if (!auth.currentUser) {
          return;
        }

        if (todayMealsSnapshot.size >= 3) {
          mealsLogged++; // Today counts if 3+ meals
        }

        // Then check the past 6 days
        for (let i = 1; i < 7; i++) {
          // Check if user is still authenticated
          if (!auth.currentUser) {
            return;
          }

          const checkDate = new Date();
          checkDate.setDate(checkDate.getDate() - i);
          const dateStr = checkDate.toISOString().split('T')[0];

          const mealsQuery = query(
            collection(db, 'users', uid, 'mealLogs', dateStr, 'meals')
          );

          const mealSnapshot = await getDocs(mealsQuery);

          // Check again after async operation
          if (!auth.currentUser) {
            return;
          }

          if (mealSnapshot.size >= 3) { // At least 3 meals logged
            mealsLogged++;
          }
        }
        // 3. HYDRATION CONSISTENCY - Days hitting 80% of goal
        let hydrationDays = 0;
        for (let i = 0; i < 7; i++) {
          // Check if user is still authenticated
          if (!auth.currentUser) {
            return;
          }

          const checkDate = new Date();
          checkDate.setDate(checkDate.getDate() - i);
          const dateStr = checkDate.toISOString().split('T')[0];

          const hydrationQuery = query(
            collection(db, 'users', uid, 'hydrationLogs'),
            where('date', '==', dateStr)
          );

          const hydrationSnapshot = await getDocs(hydrationQuery);

          // Check again after async operation
          if (!auth.currentUser) {
            return;
          }

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

        // Check again after async operation
        if (!auth.currentUser) {
          return;
        }

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
        logSafeError('Error calculating consistency:', error);
      }
    };

    calculateConsistency();
  }, [programExists, bump]);

  // Load hydration data
  useEffect(() => {
    const loadHydrationData = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setHydrationToday({
          currentOz: 0,
          goalOz: 64,
          containerOz: 16,
        });
        return;
      }

      try {
        // Double-check user is still authenticated
        if (!auth.currentUser) {
          setHydrationToday({
            currentOz: 0,
            goalOz: 64,
            containerOz: 16,
          });
          return;
        }

        const today = new Date().toISOString().split('T')[0];

        // Always load user's current preferences from profile first
        const profileDoc = await getDoc(doc(db, 'users', uid));

        // Check again after async operation
        if (!auth.currentUser) {
          setHydrationToday({
            currentOz: 0,
            goalOz: 64,
            containerOz: 16,
          });
          return;
        }

        const defaultGoal = profileDoc.exists() ? profileDoc.data().hydrationGoalOz || 64 : 64;
        const defaultContainer = profileDoc.exists() ? profileDoc.data().hydrationContainerOz || 16 : 16;

        // Then check if there's a daily log with current progress
        const hydrationDoc = await getDoc(doc(db, 'users', uid, 'hydrationLogs', today));

        // Check again after async operation
        if (!auth.currentUser) {
          setHydrationToday({
            currentOz: 0,
            goalOz: 64,
            containerOz: 16,
          });
          return;
        }

        if (hydrationDoc.exists()) {
          const data = hydrationDoc.data();
          setHydrationToday({
            currentOz: data.currentOz || 0,
            goalOz: data.goalOz || defaultGoal, // Use profile goal if not set in daily log
            containerOz: defaultContainer, // Always use profile container preference
          });
        } else {
          // No daily log yet, use profile defaults
          setHydrationToday({
            currentOz: 0,
            goalOz: defaultGoal,
            containerOz: defaultContainer,
          });
        }
      } catch (error) {
        logSafeError('Error loading hydration data:', error);
      }
    };

    loadHydrationData();
  }, [bump]);

  // Hydration utility functions
  const updateHydrationGoal = async (newGoal: number) => {
    const uid = auth.currentUser?.uid;
    if (!uid || !auth.currentUser) {
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      await setDoc(doc(db, 'users', uid, 'hydrationLogs', today), {
        currentOz: hydrationToday.currentOz,
        goalOz: newGoal,
        date: today,
      });

      // Check if user is still authenticated after first operation
      if (!auth.currentUser) {
        return;
      }

      // Also save as default in profile
      await updateDoc(doc(db, 'users', uid), {
        hydrationGoalOz: newGoal,
      });

      setHydrationToday(prev => ({ ...prev, goalOz: newGoal }));
    } catch (error) {
      logSafeError('Error updating hydration goal:', error);
    }
  };

  const updateContainerSize = async (newContainerOz: number) => {
    const uid = auth.currentUser?.uid;
    if (!uid || !auth.currentUser) {
      return;
    }

    try {
      // Save as default in profile
      await updateDoc(doc(db, 'users', uid), {
        hydrationContainerOz: newContainerOz,
      });

      setHydrationToday(prev => ({ ...prev, containerOz: newContainerOz }));
    } catch (error) {
      logSafeError('Error updating container size:', error);
    }
  };

  const addHydration = async (ozToAdd: number) => {
    const uid = auth.currentUser?.uid;
    if (!uid || !auth.currentUser) {
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
      logSafeError('Error updating hydration:', error);
    }
  };

  return {
    hydrationToday,
    setHydrationToday,
    programInfo,
    tomorrowInfo,
    todayWorkoutSummary,
    todayCardioSummary,
    cardioScheduleInfo,
    consistencyData,
    updateHydrationGoal,
    updateContainerSize,
    addHydration,
  };
}
