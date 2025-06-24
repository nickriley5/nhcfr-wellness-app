// Macro calculation utilities

export interface UserProfile {
  age: number;
  sex: 'male' | 'female';
  height: number; // in cm
  weight: number; // in kg
}

export interface MacroResult {
  calories: number;
  protein: number; // grams
  carbs: number;   // grams
  fat: number;     // grams
}

export function calculateBMR(profile: UserProfile): number {
  const { weight, height, age, sex } = profile;
  return sex === 'male'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;
}

export function calculateTDEE(bmr: number, activityFactor: number): number {
  return bmr * activityFactor;
}

export function calculateMacros(
  tdee: number,
  goalType: 'Lose' | 'Maintain' | 'Gain',
  goalRate: number,
  macroSplit = { protein: 0.3, carbs: 0.4, fat: 0.3 } // ✅ added
): MacroResult {
  const dailyDelta =
    goalType === 'Maintain' ? 0 : goalRate * (3500 / 7) * (goalType === 'Lose' ? -1 : 1);

  const targetCalories = tdee + dailyDelta;

  const proteinCalories = targetCalories * macroSplit.protein;
  const carbCalories = targetCalories * macroSplit.carbs;
  const fatCalories = targetCalories * macroSplit.fat;

  return {
    calories: targetCalories,
    protein: proteinCalories / 4,
    carbs: carbCalories / 4,
    fat: fatCalories / 9,
  };
}


