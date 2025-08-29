/**
 * Precision Math Utilities for Accurate Macro Calculations
 * Prevents floating point errors and ensures consistent rounding
 */

export const DECIMAL_PRECISION = 1; // 1 decimal place for final display
export const CALC_PRECISION = 3; // 3 decimal places during calculations

/**
 * Controlled precision rounding
 */
export const preciseRound = (value: number, decimals: number = DECIMAL_PRECISION): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

/**
 * Safe number conversion with fallback
 */
export const safeNumber = (value: any, fallback: number = 0): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

/**
 * Calculate macros from food item with precise math
 */
export const calculateItemMacros = (item: {
  baseCalories: number;
  baseProtein: number;
  baseCarbs: number;
  baseFat: number;
  baseQuantity: number;
  currentQuantity: number;
}) => {
  const multiplier = safeNumber(item.currentQuantity, 1) / safeNumber(item.baseQuantity, 1);

  return {
    calories: preciseRound(safeNumber(item.baseCalories) * multiplier, CALC_PRECISION),
    protein: preciseRound(safeNumber(item.baseProtein) * multiplier, CALC_PRECISION),
    carbs: preciseRound(safeNumber(item.baseCarbs) * multiplier, CALC_PRECISION),
    fat: preciseRound(safeNumber(item.baseFat) * multiplier, CALC_PRECISION),
  };
};

/**
 * Sum multiple macro objects with precise math
 */
export const sumMacros = (macroArray: Array<{ calories: number; protein: number; carbs: number; fat: number }>) => {
  const totals = macroArray.reduce(
    (acc, macros) => ({
      calories: acc.calories + safeNumber(macros.calories),
      protein: acc.protein + safeNumber(macros.protein),
      carbs: acc.carbs + safeNumber(macros.carbs),
      fat: acc.fat + safeNumber(macros.fat),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return {
    calories: preciseRound(totals.calories),
    protein: preciseRound(totals.protein),
    carbs: preciseRound(totals.carbs),
    fat: preciseRound(totals.fat),
  };
};

/**
 * Calculate theoretical calories from macros (4/4/9 rule)
 */
export const calculateTheoreticalCalories = (protein: number, carbs: number, fat: number): number => {
  return preciseRound(
    safeNumber(protein) * 4 + safeNumber(carbs) * 4 + safeNumber(fat) * 9
  );
};

/**
 * Validate if meal totals match calculated totals from items
 */
export const validateMealAccuracy = (
  mealTotals: { calories: number; protein: number; carbs: number; fat: number },
  calculatedTotals: { calories: number; protein: number; carbs: number; fat: number },
  tolerance: number = 0.05 // 5% tolerance
) => {
  const calorieVariance = Math.abs(mealTotals.calories - calculatedTotals.calories) / Math.max(mealTotals.calories, 1);
  const proteinVariance = Math.abs(mealTotals.protein - calculatedTotals.protein) / Math.max(mealTotals.protein, 1);
  const carbVariance = Math.abs(mealTotals.carbs - calculatedTotals.carbs) / Math.max(mealTotals.carbs, 1);
  const fatVariance = Math.abs(mealTotals.fat - calculatedTotals.fat) / Math.max(mealTotals.fat, 1);

  const maxVariance = Math.max(calorieVariance, proteinVariance, carbVariance, fatVariance);

  return {
    isAccurate: maxVariance <= tolerance,
    variance: maxVariance,
    calorieVariance,
    proteinVariance,
    carbVariance,
    fatVariance,
    shouldFlag: maxVariance > 0.15, // Flag for user review if > 15%
  };
};

/**
 * Comprehensive nutrition validation for API results
 * Catches unrealistic macro combinations that should never pass
 */
export const validateNutritionResult = (
  result: { calories: number; protein: number; carbs: number; fat: number },
  query: string
): { isValid: boolean; confidence: number; flags: string[] } => {
  const flags: string[] = [];
  let confidence = 100;
  let isValid = true;

  // 1. Basic bounds checking
  if (result.calories < 0 || result.calories > 8000) {
    flags.push('Unrealistic calorie count');
    isValid = false;
  }

  if (result.protein < 0 || result.protein > 300) {
    flags.push('Unrealistic protein amount');
    confidence -= 30;
  }

  if (result.carbs < 0 || result.carbs > 800) {
    flags.push('Unrealistic carb amount');
    confidence -= 20;
  }

  if (result.fat < 0 || result.fat > 300) {
    flags.push('Unrealistic fat amount');
    confidence -= 20;
  }

  // 2. Calorie-macro consistency (4/4/9 rule)
  const theoreticalCalories = calculateTheoreticalCalories(result.protein, result.carbs, result.fat);
  const calorieVariance = Math.abs(result.calories - theoreticalCalories) / Math.max(result.calories, 1);

  if (calorieVariance > 0.25) {
    flags.push(`Calorie-macro mismatch: ${result.calories} cal vs ${theoreticalCalories} calculated`);
    confidence -= 25;
    if (calorieVariance > 0.50) {
      isValid = false;
    }
  }

  // 3. Protein-to-calorie ratio checks (CRITICAL for chicken tenders case)
  const proteinCalories = result.protein * 4;
  const proteinRatio = proteinCalories / Math.max(result.calories, 1);

  if (proteinRatio < 0.05 && query.toLowerCase().includes('chicken')) {
    flags.push('Protein too low for chicken-based food');
    confidence -= 40;
  }

  if (proteinRatio > 0.85) {
    flags.push('Protein ratio too high - impossible macro distribution');
    confidence -= 30;
  }

  // 4. Food-specific validation
  const queryLower = query.toLowerCase();

  // Chicken/meat validation
  if (queryLower.includes('chicken') || queryLower.includes('tender')) {
    if (result.calories > 1200 && result.protein < 40) {
      flags.push('High calorie chicken with suspiciously low protein');
      confidence -= 50;
      isValid = false;
    }

    if (result.calories > 2000) {
      flags.push('Unrealistically high calories for chicken portion');
      confidence -= 40;
      isValid = false;
    }
  }

  // Fried food validation
  if (queryLower.includes('fried') || queryLower.includes('tender')) {
    const fatCalories = result.fat * 9;
    const fatRatio = fatCalories / Math.max(result.calories, 1);

    if (fatRatio < 0.20) {
      flags.push('Fried food should have higher fat content');
      confidence -= 20;
    }
  }

  // 5. Portion size sanity check
  if (result.calories < 10 && !queryLower.includes('water') && !queryLower.includes('tea') && !queryLower.includes('coffee')) {
    flags.push('Suspiciously low calories for food item');
    confidence -= 30;
  }

  // 6. Zero macro validation
  const hasSignificantMacros = result.protein > 0 || result.carbs > 0 || result.fat > 0;
  if (result.calories > 50 && !hasSignificantMacros) {
    flags.push('High calories with no macronutrients');
    confidence -= 40;
    isValid = false;
  }

  return {
    isValid,
    confidence: Math.max(confidence, 10),
    flags,
  };
};
