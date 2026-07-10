import { format } from 'date-fns';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../firebase';

type MacroTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

const asDate = (value: any): Date | null => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value.toDate === 'function') {
    return value.toDate();
  }
  if (typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000);
  }
  return null;
};

const round = (value: number, places = 1) => {
  const multiplier = 10 ** places;
  return Math.round(value * multiplier) / multiplier;
};

const fmt = (value: any, fallback = 'unknown') => (
  value === undefined || value === null || value === '' ? fallback : String(value)
);

const getDateKey = (date: Date) => format(date, 'yyyy-MM-dd');

const sumMeals = (meals: any[]): MacroTotals => meals.reduce(
  (acc, meal) => ({
    calories: acc.calories + Number(meal.calories || 0),
    protein: acc.protein + Number(meal.protein || 0),
    carbs: acc.carbs + Number(meal.carbs || 0),
    fat: acc.fat + Number(meal.fat || 0),
  }),
  { calories: 0, protein: 0, carbs: 0, fat: 0 }
);

const formatMacroLine = (label: string, totals: MacroTotals) => (
  `${label}: ${Math.round(totals.calories)} cal, ${Math.round(totals.protein)}g protein, ` +
  `${Math.round(totals.carbs)}g carbs, ${Math.round(totals.fat)}g fat`
);

const summarizeWeightProgress = (goal: any, weightEntries: { weight: number; date: Date }[]) => {
  if (!goal) {
    return 'No weight goal saved.';
  }

  const currentWeight = weightEntries[0]?.weight ?? Number(goal.latestWeight || goal.currentWeight || goal.startWeight);
  const targetWeight = Number(goal.targetWeight);
  const weeklyGoal = Number(goal.weeklyGoal ?? 0);
  const direction = weeklyGoal < 0 ? 'loss' : weeklyGoal > 0 ? 'gain' : 'maintenance';

  if (!weightEntries.length || weightEntries.length < 2 || weeklyGoal === 0) {
    return `Current ${fmt(currentWeight)} lbs, target ${fmt(targetWeight)} lbs, goal type ${direction}. Need more weigh-ins for trend.`;
  }

  const newest = weightEntries[0];
  const oldest = weightEntries[weightEntries.length - 1];
  const weeks = Math.max(0.5, (newest.date.getTime() - oldest.date.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const actualWeeklyRate = (newest.weight - oldest.weight) / weeks;
  const targetWeeklyRate = weeklyGoal;
  const tolerance = Math.max(0.2, Math.abs(targetWeeklyRate) * 0.25);

  let status = 'on track';
  if (direction === 'loss') {
    if (actualWeeklyRate < targetWeeklyRate - tolerance) {
      status = 'losing faster than planned';
    } else if (actualWeeklyRate > targetWeeklyRate + tolerance) {
      status = 'losing slower than planned';
    }
  } else if (direction === 'gain') {
    if (actualWeeklyRate > targetWeeklyRate + tolerance) {
      status = 'gaining faster than planned';
    } else if (actualWeeklyRate < targetWeeklyRate - tolerance) {
      status = 'gaining slower than planned';
    }
  } else if (Math.abs(actualWeeklyRate) > tolerance) {
    status = 'drifting away from maintenance';
  }

  return `Current ${round(currentWeight)} lbs, target ${round(targetWeight)} lbs, target rate ${round(targetWeeklyRate)} lbs/week, ` +
    `actual recent rate ${round(actualWeeklyRate)} lbs/week, status: ${status}.`;
};

const buildProgramSummary = (program: any) => {
  if (!program) {
    return 'No active generated program found.';
  }

  const weeks = Array.isArray(program.weeks) ? program.weeks : [];
  const currentWeek = Number(program.currentWeek || program.currentWeekNumber || 1);
  const totalWeeks = Number(program.totalWeeks || weeks.length || 0);
  const week = weeks.find((w: any) => Number(w.weekNumber) === currentWeek) || weeks[0];
  const daySummaries = Array.isArray(week?.days)
    ? week.days.slice(0, 4).map((day: any) => {
      const title = day.title || day.dayTitle || `Day ${day.dayNumber || ''}`.trim();
      const focus = day.focus || day.primaryFocus || day.type || 'training';
      return `${title} (${focus})`;
    }).join('; ')
    : 'No week day details available.';

  return `${fmt(program.programName, 'Active program')} - ${fmt(program.periodizationModel, 'periodized')} model, ` +
    `week ${currentWeek}${totalWeeks ? `/${totalWeeks}` : ''}. This week: ${daySummaries}`;
};

const buildWorkoutSummary = (logs: any[]) => {
  if (!logs.length) {
    return 'No recent workouts logged.';
  }

  return logs.map(log => {
    const date = asDate(log.completedAt)?.toLocaleDateString() || 'recent';
    if (log.workoutType === 'cardio') {
      return `${date}: cardio ${fmt(log.type, 'session')} ${fmt(log.actualDuration || log.duration, '?')} min`;
    }
    const exerciseCount = Array.isArray(log.exercises) ? log.exercises.length : 0;
    const prCount = Array.isArray(log.prs) ? log.prs.length : 0;
    return `${date}: ${fmt(log.dayTitle, 'Workout')} (${exerciseCount} exercises${prCount ? `, ${prCount} PR(s)` : ''})`;
  }).join('; ');
};

const buildReadinessSummary = (checkIn: any) => {
  if (!checkIn) {
    return 'No recent readiness check.';
  }

  return `sleep ${fmt(checkIn.sleepHours)} hrs, sleep quality ${fmt(checkIn.sleepQuality)}/5, energy ${fmt(checkIn.energy)}/5, ` +
    `soreness ${fmt(checkIn.soreness)}/5, stress ${fmt(checkIn.stress)}/5, readiness ${fmt(checkIn.readiness)}/5, ` +
    `on shift: ${checkIn.onShift ? 'yes' : 'no'}${checkIn.callVolume ? `, call volume ${checkIn.callVolume}/5` : ''}.`;
};

export async function buildCoachContext(uid: string, userMessage: string): Promise<string> {
  const today = new Date();
  const todayKey = getDateKey(today);

  try {
    const [
      profileSnap,
      mealPlanSnap,
      weightGoalSnap,
      weightSnap,
      programsSnap,
      workoutSnap,
      checkInSnap,
    ] = await Promise.all([
      getDoc(doc(db, 'users', uid)),
      getDoc(doc(db, 'users', uid, 'mealPlan', 'active')),
      getDoc(doc(db, 'users', uid, 'goals', 'weight')),
      getDocs(query(collection(db, 'users', uid, 'weightEntries'), orderBy('date', 'desc'), limit(8))),
      getDocs(query(collection(db, 'users', uid, 'aiPrograms'), where('isActive', '==', true), limit(3))),
      getDocs(query(collection(db, 'users', uid, 'workoutLogs'), orderBy('completedAt', 'desc'), limit(3))),
      getDocs(query(collection(db, 'users', uid, 'checkIns'), orderBy('timestamp', 'desc'), limit(1))),
    ]);

    const profile = profileSnap.exists() ? profileSnap.data() : {};
    const mealPlan = mealPlanSnap.exists() ? mealPlanSnap.data() : null;
    const weightGoal = weightGoalSnap.exists() ? weightGoalSnap.data() : null;
    const weightEntries = weightSnap.docs
      .map(docSnap => {
        const data = docSnap.data();
        const date = asDate(data.date);
        return date ? { weight: Number(data.weight), date } : null;
      })
      .filter((entry): entry is { weight: number; date: Date } => !!entry && Number.isFinite(entry.weight));
    const activeProgram = programsSnap.docs
      .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
      .find((program: any) => !program.isArchived);
    const recentWorkouts = workoutSnap.docs.map(docSnap => docSnap.data());
    const latestCheckIn = checkInSnap.docs[0]?.data();

    const mealDays = await Promise.all(Array.from({ length: 7 }).map(async (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateKey = getDateKey(date);
      const mealsSnap = await getDocs(collection(db, 'users', uid, 'mealLogs', dateKey, 'meals'));
      const meals = mealsSnap.docs.map(docSnap => docSnap.data());
      return { date: dateKey, totals: sumMeals(meals), count: meals.length };
    }));

    const todayMeals = mealDays.find(day => day.date === todayKey);
    const loggedDays = mealDays.filter(day => day.count > 0);
    const sevenDayAverage = loggedDays.length
      ? {
        calories: loggedDays.reduce((sum, day) => sum + day.totals.calories, 0) / loggedDays.length,
        protein: loggedDays.reduce((sum, day) => sum + day.totals.protein, 0) / loggedDays.length,
        carbs: loggedDays.reduce((sum, day) => sum + day.totals.carbs, 0) / loggedDays.length,
        fat: loggedDays.reduce((sum, day) => sum + day.totals.fat, 0) / loggedDays.length,
      }
      : null;

    const macroTargets = mealPlan
      ? `${Math.round(Number(mealPlan.calorieTarget || 0))} cal, ${Math.round(Number(mealPlan.proteinGrams || 0))}g protein, ` +
        `${Math.round(Number(mealPlan.carbGrams || 0))}g carbs, ${Math.round(Number(mealPlan.fatGrams || 0))}g fat`
      : 'No active meal plan.';

    const context = [
      'FIREFIGHTER COACH CONTEXT PACKET',
      `User asked: "${userMessage}"`,
      `Profile: ${fmt(profile.fullName || profile.name, 'Firefighter')}; age ${fmt(profile.age)}; sex ${fmt(profile.sex)}; height ${fmt(profile.height)} in; current weight ${fmt(profile.currentWeight || profile.weight)} lbs; goal ${fmt(profile.goalType)}; activity ${fmt(profile.activityLevel)}.`,
      `Weight goal/trend: ${summarizeWeightProgress(weightGoal, weightEntries)}`,
      `Meal plan targets: ${macroTargets}; preference ${fmt(mealPlan?.dietaryPreference, 'none')}; restrictions ${Array.isArray(mealPlan?.dietaryRestrictions) ? mealPlan.dietaryRestrictions.join(', ') || 'none' : 'none'}.`,
      todayMeals ? formatMacroLine(`Today logged (${todayMeals.count} meal${todayMeals.count === 1 ? '' : 's'})`, todayMeals.totals) : 'Today logged: no meal data.',
      sevenDayAverage ? formatMacroLine(`7-day logged average across ${loggedDays.length} day(s)`, sevenDayAverage) : '7-day logged average: no logged meal days.',
      `Active program: ${buildProgramSummary(activeProgram)}`,
      `Recent readiness: ${buildReadinessSummary(latestCheckIn)}`,
      `Recent workouts: ${buildWorkoutSummary(recentWorkouts)}`,
      'Coach rules: Be direct, fast, firefighter-specific, and actionable. Use this context when relevant. If data is missing, say what needs to be logged instead of guessing. Do not recommend unsafe extreme dieting or training through serious symptoms.',
    ];

    return context.join('\n');
  } catch (error) {
    console.warn('Unable to build full coach context:', error);
    return 'Coach context packet unavailable. Use the user message and ask for missing app data if needed.';
  }
}
