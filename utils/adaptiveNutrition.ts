import { db } from '../firebase';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  setDoc,
  where,
  Timestamp,
} from 'firebase/firestore';

interface WeightEntry {
  weight: number;
  date: Date;
}

interface WeightGoal {
  currentWeight: number;
  targetWeight: number;
  weeklyGoal: number; // pounds per week (positive for gain, negative for loss)
  startDate: Date;
}

interface MacroPlan {
  calorieTarget: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  goalType: 'maintain' | 'fatloss' | 'muscle';
  lastAdjustment?: Date;
}

interface ProgressAnalysis {
  weeksPassed: number;
  expectedWeightChange: number;
  actualWeightChange: number;
  progressRate: number; // actual rate vs expected rate (1.0 = on track)
  recommendedAction: 'maintain' | 'increase_calories' | 'decrease_calories' | 'slow_down';
  adjustmentAmount: number; // calories to adjust
  warningMessage?: string;
  projectedGoalDate?: Date;
}

/**
 * Analyzes weight progress vs goals and determines if nutrition adjustments are needed
 */
export async function analyzeWeightProgress(uid: string): Promise<ProgressAnalysis | null> {
  try {
    // Get weight goal
    const goalDoc = await getDoc(doc(db, 'users', uid, 'goals', 'weight'));
    if (!goalDoc.exists()) {
      return null;
    }

    const weightGoal = {
      ...goalDoc.data(),
      startDate: goalDoc.data()?.startDate?.toDate() || new Date(),
    } as WeightGoal;

    // Get recent weight entries (last 4 weeks for trending)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const weightsQuery = query(
      collection(db, 'users', uid, 'weightEntries'),
      where('date', '>=', Timestamp.fromDate(fourWeeksAgo)),
      orderBy('date', 'desc'),
      limit(20)
    );

    const querySnapshot = await getDocs(weightsQuery);
    const weightEntries: WeightEntry[] = [];

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      weightEntries.push({
        weight: data.weight,
        date: data.date.toDate(),
      });
    });

    if (weightEntries.length < 2) {
      return null; // Need at least 2 entries to analyze progress
    }

    // Calculate time-based analysis
    const latestEntry = weightEntries[0];
    const earliestEntry = weightEntries[weightEntries.length - 1];

    const daysBetween = Math.max(1, (latestEntry.date.getTime() - earliestEntry.date.getTime()) / (24 * 60 * 60 * 1000));
    const weeksPassed = Math.max(0.5, daysBetween / 7);
    const totalWeeksSinceStart = Math.max(1, (latestEntry.date.getTime() - weightGoal.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

    const actualWeightChange = latestEntry.weight - earliestEntry.weight;
    const expectedWeightChange = weightGoal.weeklyGoal * weeksPassed;
    const progressRate = expectedWeightChange !== 0 ? actualWeightChange / expectedWeightChange : 1;

    // Determine recommended action based on progress rate
    let recommendedAction: ProgressAnalysis['recommendedAction'] = 'maintain';
    let adjustmentAmount = 0;
    let warningMessage: string | undefined;

    const tolerance = 0.25; // 25% tolerance
    const isLosingWeight = weightGoal.weeklyGoal < 0;
    const isGainingWeight = weightGoal.weeklyGoal > 0;

    if (isLosingWeight) {
      // Fat loss goals
      if (progressRate > 1 + tolerance) {
        // Losing too fast
        recommendedAction = 'increase_calories';
        adjustmentAmount = Math.min(200, Math.abs(actualWeightChange - expectedWeightChange) * 100);
        warningMessage = 'You\'re losing weight faster than planned. Consider increasing calories to maintain muscle mass and avoid metabolic slowdown.';
      } else if (progressRate < 1 - tolerance) {
        // Losing too slow
        recommendedAction = 'decrease_calories';
        adjustmentAmount = Math.min(300, Math.abs(expectedWeightChange - actualWeightChange) * 150);
        warningMessage = 'Progress is slower than planned. A small calorie reduction may help get back on track.';
      }
    } else if (isGainingWeight) {
      // Muscle gain goals
      if (progressRate > 1 + tolerance) {
        // Gaining too fast
        recommendedAction = 'decrease_calories';
        adjustmentAmount = Math.min(250, Math.abs(actualWeightChange - expectedWeightChange) * 125);
        warningMessage = 'You\'re gaining weight faster than planned. Reducing calories slightly may help minimize fat gain.';
      } else if (progressRate < 1 - tolerance) {
        // Gaining too slow
        recommendedAction = 'increase_calories';
        adjustmentAmount = Math.min(400, Math.abs(expectedWeightChange - actualWeightChange) * 200);
        warningMessage = 'Progress is slower than planned. Increasing calories may help reach your muscle-building goals.';
      }
    }

    // Check for extreme rates that require warning
    if (Math.abs(actualWeightChange / weeksPassed) > 2.5) {
      recommendedAction = 'slow_down';
      warningMessage = 'Rapid weight changes can impact performance and health. Consider a more moderate approach.';
    }

    // Calculate projected goal date based on current rate
    let projectedGoalDate: Date | undefined;
    if (actualWeightChange !== 0) {
      const currentRate = actualWeightChange / weeksPassed;
      const remainingWeight = weightGoal.targetWeight - latestEntry.weight;
      const weeksToGoal = Math.abs(remainingWeight / currentRate);

      if (isFinite(weeksToGoal) && weeksToGoal < 104) { // Less than 2 years
        projectedGoalDate = new Date();
        projectedGoalDate.setDate(projectedGoalDate.getDate() + weeksToGoal * 7);
      }
    }

    return {
      weeksPassed: totalWeeksSinceStart,
      expectedWeightChange: weightGoal.weeklyGoal * totalWeeksSinceStart,
      actualWeightChange: latestEntry.weight - weightGoal.currentWeight,
      progressRate,
      recommendedAction,
      adjustmentAmount,
      warningMessage,
      projectedGoalDate,
    };
  } catch (error) {
    console.error('Error analyzing weight progress:', error);
    return null;
  }
}

/**
 * Automatically adjusts macro plan based on weight progress analysis
 */
export async function adjustMacroPlansIfNeeded(uid: string, forceAdjust = false): Promise<boolean> {
  try {
    const analysis = await analyzeWeightProgress(uid);
    if (!analysis || analysis.recommendedAction === 'maintain') {
      return false;
    }

    // Get current macro plan
    const macroPlanDoc = await getDoc(doc(db, 'users', uid, 'mealPlan', 'active'));
    if (!macroPlanDoc.exists()) {
      return false;
    }

    const currentPlan = macroPlanDoc.data() as MacroPlan;

    // Check if we've adjusted recently (prevent over-adjustment)
    const lastAdjustment = currentPlan.lastAdjustment;
    if (!forceAdjust && lastAdjustment) {
      const daysSinceLastAdjustment = (Date.now() - lastAdjustment.getTime()) / (24 * 60 * 60 * 1000);
      if (daysSinceLastAdjustment < 7) {
        return false; // Don't adjust more than once per week
      }
    }

    // Skip if extreme case requiring manual intervention
    if (analysis.recommendedAction === 'slow_down') {
      return false;
    }

    // Calculate new calorie target
    let newCalorieTarget = currentPlan.calorieTarget;
    if (analysis.recommendedAction === 'increase_calories') {
      newCalorieTarget += analysis.adjustmentAmount;
    } else if (analysis.recommendedAction === 'decrease_calories') {
      newCalorieTarget -= analysis.adjustmentAmount;
    }

    // Ensure reasonable bounds
    newCalorieTarget = Math.max(1200, Math.min(4000, newCalorieTarget));

    // Recalculate macros maintaining proportions
    const currentCalories = currentPlan.calorieTarget;
    const calorieDelta = newCalorieTarget - currentCalories;

    // Distribute calorie change: 50% carbs, 30% fats, 20% protein
    const carbCalorieChange = calorieDelta * 0.5;
    const fatCalorieChange = calorieDelta * 0.3;
    const proteinCalorieChange = calorieDelta * 0.2;

    const newProteinGrams = Math.max(80, Math.round(currentPlan.proteinGrams + proteinCalorieChange / 4));
    const newCarbGrams = Math.max(50, Math.round(currentPlan.carbGrams + carbCalorieChange / 4));
    const newFatGrams = Math.max(30, Math.round(currentPlan.fatGrams + fatCalorieChange / 9));

    // Update macro plan
    const updatedPlan = {
      ...currentPlan,
      calorieTarget: newCalorieTarget,
      proteinGrams: newProteinGrams,
      carbGrams: newCarbGrams,
      fatGrams: newFatGrams,
      lastAdjustment: new Date(),
      adjustmentReason: `Auto-adjusted based on weight progress (${analysis.recommendedAction})`,
    };

    await setDoc(doc(db, 'users', uid, 'mealPlan', 'active'), updatedPlan);

    // Log the adjustment for tracking
    await setDoc(doc(db, 'users', uid, 'nutritionAdjustments', Date.now().toString()), {
      date: new Date(),
      previousCalories: currentCalories,
      newCalories: newCalorieTarget,
      adjustmentAmount: calorieDelta,
      reason: analysis.recommendedAction,
      progressRate: analysis.progressRate,
      autoAdjusted: true,
    });

    return true;
  } catch (error) {
    console.error('Error adjusting macro plans:', error);
    return false;
  }
}

/**
 * Gets personalized nutrition guidance based on current progress
 */
export async function getNutritionGuidance(uid: string): Promise<string | null> {
  try {
    const analysis = await analyzeWeightProgress(uid);
    if (!analysis) {
      return null;
    }

    const { progressRate, recommendedAction, warningMessage, projectedGoalDate } = analysis;

    let guidance = '';

    // Progress feedback
    if (progressRate >= 0.9 && progressRate <= 1.1) {
      guidance += '🎯 Excellent! You\'re right on track with your weight goals. ';
    } else if (progressRate > 1.1) {
      guidance += '⚡ You\'re progressing faster than planned. ';
    } else {
      guidance += '📊 Progress is slower than expected. ';
    }

    // Specific recommendations
    if (recommendedAction === 'increase_calories') {
      guidance += 'Consider adding 100-200 calories from healthy carbs and fats to fuel your workouts and recovery.';
    } else if (recommendedAction === 'decrease_calories') {
      guidance += 'A small reduction in calories (100-200) may help accelerate progress while maintaining energy.';
    } else if (recommendedAction === 'slow_down') {
      guidance += 'Consider a more moderate approach to ensure sustainable, healthy progress.';
    } else {
      guidance += 'Keep doing what you\'re doing!';
    }

    // Goal projection
    if (projectedGoalDate) {
      const daysToGoal = Math.ceil((projectedGoalDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      if (daysToGoal > 0 && daysToGoal < 730) {
        guidance += ` At your current rate, you'll reach your goal around ${projectedGoalDate.toLocaleDateString()}.`;
      }
    }

    // Warning if needed
    if (warningMessage) {
      guidance += ` ⚠️ ${warningMessage}`;
    }

    return guidance;
  } catch (error) {
    console.error('Error getting nutrition guidance:', error);
    return null;
  }
}

/**
 * Checks if user should be prompted for a weigh-in
 */
export async function shouldPromptWeighIn(uid: string): Promise<boolean> {
  try {
    // Check last weigh-in date
    const recentQuery = query(
      collection(db, 'users', uid, 'weightEntries'),
      orderBy('date', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(recentQuery);
    if (querySnapshot.empty) {
      return true; // No weigh-ins yet
    }

    const lastWeighIn = querySnapshot.docs[0].data().date.toDate();
    const daysSinceLastWeighIn = (Date.now() - lastWeighIn.getTime()) / (24 * 60 * 60 * 1000);

    // Prompt weekly weigh-ins
    return daysSinceLastWeighIn >= 7;
  } catch (error) {
    console.error('Error checking weigh-in prompt:', error);
    return false;
  }
}
