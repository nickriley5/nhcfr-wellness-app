/**
 * Firefighter Nutrition Guidance for Shift Work
 * Optimized for 24-hour shifts, circadian disruption, and high-stress response
 */

export interface ShiftNutritionPlan {
  shiftType: '24-hour' | '12-hour-day' | '12-hour-night' | 'regular';
  mealTiming: {
    priorToShift: string;
    duringShift: string[];
    postShift: string;
    sleepPrep: string;
  };
  macroAdjustments: {
    carbs: string;
    protein: string;
    fats: string;
    hydration: string;
  };
  supplementRecommendations: string[];
  avoidList: string[];
}

/**
 * Get nutrition recommendations based on shift schedule
 */
export function getShiftNutritionGuidance(shiftType: '24-hour' | '12-hour-day' | '12-hour-night' | 'regular'): ShiftNutritionPlan {
  const plans: { [key: string]: ShiftNutritionPlan } = {
    '24-hour': {
      shiftType: '24-hour',
      mealTiming: {
        priorToShift: '0700-0800 (2-3 hours before shift): High-protein breakfast with complex carbs (oats, eggs, fruit). Moderate fat. Hydrate 16-20oz water.',
        duringShift: [
          '1200-1300 (Lunch): Balanced meal - lean protein, complex carbs, vegetables, healthy fats. Think: grilled chicken, sweet potato, broccoli, avocado.',
          '1600-1700 (Afternoon snack): Protein + carbs for sustained energy. Greek yogurt with berries, protein bar, or trail mix.',
          '1900-2000 (Dinner): Moderate meal - avoid heavy foods that disrupt sleep. Lean protein, vegetables, smaller carb portion.',
          '0000-0100 (Night snack if needed): Light protein shake or small handful of nuts. Avoid heavy meals.',
          '0400-0500 (Pre-dawn): Light breakfast if hungry - protein-focused, minimal simple carbs to avoid crash.',
        ],
        postShift: '0900-1000: Recovery meal with protein + fast carbs (smoothie, eggs + toast). Then sleep within 2 hours.',
        sleepPrep: 'Stop eating 2-3 hours before planned sleep. Light protein shake OK if very hungry.',
      },
      macroAdjustments: {
        carbs: 'Moderate-high during active hours (0700-2000), taper down after 2000 to support sleep. Focus on complex carbs: oats, sweet potato, rice, quinoa.',
        protein: 'Consistent every 3-4 hours: 30-40g per meal. Prevents muscle breakdown during long shift. Total: 1g per lb bodyweight.',
        fats: 'Healthy fats throughout day: avocado, nuts, olive oil, fatty fish. Supports hormone production and satiety. 25-30% of total calories.',
        hydration: 'Drink 8-12oz every 2 hours. Target 100-150oz total over 24-hour shift. Add electrolytes if sweating heavily. Monitor urine color.',
      },
      supplementRecommendations: [
        'Magnesium glycinate (400mg before sleep) - improves sleep quality',
        'Vitamin D3 (2000-5000 IU daily) - supports immune function, mood',
        'Omega-3 fish oil (2-3g EPA/DHA daily) - reduces inflammation, brain health',
        'Protein powder (whey or plant-based) - convenient for quick protein intake',
        'Electrolyte mix (during shift) - sodium, potassium, magnesium replacement',
        'Melatonin (0.5-3mg 30 min before sleep) - helps circadian reset post-shift',
        'Creatine monohydrate (5g daily) - cognitive function, strength maintenance',
      ],
      avoidList: [
        '❌ Caffeine after 1600 - disrupts post-shift sleep',
        '❌ High-sugar snacks/energy drinks - cause energy crashes',
        '❌ Heavy, greasy meals late at night - impair sleep quality',
        '❌ Alcohol post-shift - worsens sleep architecture',
        '❌ Skipping meals - leads to poor decisions, low energy on calls',
        '❌ Excessive processed foods - inflammation, poor recovery',
      ],
    },
    '12-hour-day': {
      shiftType: '12-hour-day',
      mealTiming: {
        priorToShift: '0600-0700 (2 hours before shift): Protein + complex carbs + fats. Example: eggs, oats, berries, nuts.',
        duringShift: [
          '1100-1200 (Mid-shift meal): Balanced lunch with lean protein, carbs, vegetables.',
          '1500-1600 (Afternoon snack): Protein + carbs. Greek yogurt, fruit, or protein bar.',
        ],
        postShift: '2000-2100: Post-shift meal within 1 hour of getting home. Protein + moderate carbs + veggies for recovery.',
        sleepPrep: 'Light protein shake or small snack 1-2 hours before bed if needed. Stop eating by 2200.',
      },
      macroAdjustments: {
        carbs: 'Moderate throughout day, taper slightly in evening. Focus on slow-digesting carbs during shift: brown rice, quinoa, whole grain bread.',
        protein: '30-40g per meal, 3-4 meals daily. Prevents muscle breakdown during long shift. Prioritize post-shift protein for recovery.',
        fats: 'Healthy fats with each meal: nuts, avocado, olive oil, fatty fish. Supports sustained energy without crashes.',
        hydration: '8oz every 90 minutes during shift. Target 80-100oz total. Add electrolytes if working in heat or heavy gear.',
      },
      supplementRecommendations: [
        'Multivitamin (daily) - fills nutritional gaps from irregular eating',
        'Vitamin D3 (2000 IU daily) - especially if working indoors',
        'Magnesium (300-400mg evening) - supports muscle recovery, sleep',
        'Creatine (5g daily) - maintains strength, cognitive function',
        'Protein powder - convenient for quick post-shift recovery',
      ],
      avoidList: [
        '❌ Caffeine after 1500 - can disrupt evening sleep',
        '❌ Large meals during shift - causes drowsiness',
        '❌ Simple sugars without protein - energy crashes',
        '❌ Skipping post-shift meal - impairs recovery',
      ],
    },
    '12-hour-night': {
      shiftType: '12-hour-night',
      mealTiming: {
        priorToShift: '1700-1800 (before night shift): Hearty dinner with protein, complex carbs, vegetables. This is your "breakfast".',
        duringShift: [
          '0000-0100 (Midnight meal): Moderate meal with protein, carbs, fats. Avoid heavy foods that cause drowsiness.',
          '0300-0400 (Early morning snack): Light protein + small carb. String cheese + fruit, or protein shake.',
        ],
        postShift: '0800-0900: Small recovery meal (protein + fast carbs), then sleep within 1 hour. Heavy meals delay sleep.',
        sleepPrep: 'Eat minimal food 2-3 hours before planned sleep (0900-1000). Light protein shake only if very hungry.',
      },
      macroAdjustments: {
        carbs: 'Moderate at start of shift for energy. Taper down toward morning to avoid blood sugar crashes. Complex carbs: oats, rice, quinoa.',
        protein: 'Critical for overnight muscle protection. 30-40g every 3-4 hours. Post-shift protein shake essential.',
        fats: 'Healthy fats help sustain energy overnight. Nuts, avocado, olive oil, fatty fish. Avoid trans fats.',
        hydration: 'Drink 8oz every 2 hours. Caffeine OK until 0300, then switch to water only. Target 80-100oz total.',
      },
      supplementRecommendations: [
        'Melatonin (3-5mg post-shift) - helps daytime sleep onset',
        'Magnesium glycinate (400mg post-shift) - improves sleep quality',
        'Vitamin D3 (5000 IU daily) - critical for night shift workers',
        'Omega-3 fish oil (2-3g daily) - reduces inflammation from circadian disruption',
        'Caffeine (100-200mg early shift only) - strategic use for alertness',
        'L-theanine (200mg with caffeine) - smooth energy without jitters',
        'Blackout curtains + sleep mask - not supplements but essential',
      ],
      avoidList: [
        '❌ Caffeine after 0300 - prevents post-shift sleep',
        '❌ Heavy meals after 0200 - causes drowsiness, impairs sleep',
        '❌ Alcohol to "help sleep" - worsens sleep quality',
        '❌ Blue light 2 hours before sleep - blocks melatonin',
        '❌ Large carb loads overnight - causes energy crashes',
      ],
    },
    regular: {
      shiftType: 'regular',
      mealTiming: {
        priorToShift: '0600-0700: Balanced breakfast with protein, complex carbs, fats. Standard pre-workout principles.',
        duringShift: [
          '1200-1300: Lunch with lean protein, vegetables, complex carbs.',
          '1530-1630: Afternoon snack if needed - protein + carbs.',
        ],
        postShift: '1800-1900: Dinner with family. Balanced meal, moderate portions.',
        sleepPrep: 'Light snack 1-2 hours before bed if needed. Stop eating by 2100.',
      },
      macroAdjustments: {
        carbs: 'Moderate throughout day, time with activity level. Higher on training days, moderate on rest days.',
        protein: '30-40g per meal, 4-5 meals daily. 1g per lb bodyweight for active firefighters.',
        fats: 'Healthy fats with each meal. 25-30% of total calories. Prioritize omega-3s.',
        hydration: 'Baseline 64oz daily, increase to 100oz+ on training/shift days. Monitor urine color.',
      },
      supplementRecommendations: [
        'Multivitamin (daily) - nutritional insurance',
        'Vitamin D3 (2000 IU daily) - most people deficient',
        'Omega-3 fish oil (2g daily) - heart health, inflammation',
        'Creatine (5g daily) - strength, cognitive function',
        'Protein powder - convenient for busy schedules',
      ],
      avoidList: [
        '❌ Excessive processed foods - inflammation',
        '❌ Late-night eating - disrupts sleep',
        '❌ Skipping breakfast - impairs morning performance',
        '❌ Excessive alcohol - impairs recovery, sleep',
      ],
    },
  };

  return plans[shiftType];
}

/**
 * Hydration calculator for firefighters
 * Accounts for gear weight, ambient temperature, and activity level
 */
export function calculateFirefighterHydration(params: {
  bodyWeightLbs: number;
  shiftDurationHours: number;
  ambientTempF: number;
  wearingGear: boolean;
  activityLevel: 'light' | 'moderate' | 'heavy';
}): {
  baselineOz: number;
  gearAdjustmentOz: number;
  tempAdjustmentOz: number;
  activityAdjustmentOz: number;
  totalRecommendedOz: number;
  perHourOz: number;
  electrolyteRecommendation: string;
} {
  // Baseline: 0.5oz per lb bodyweight per day
  const baselineOz = params.bodyWeightLbs * 0.5;

  // Gear adds 15-20% to fluid needs (heat stress, increased sweating)
  const gearAdjustmentOz = params.wearingGear ? baselineOz * 0.175 : 0;

  // Temperature adjustment (increases above 70°F)
  let tempAdjustmentOz = 0;
  if (params.ambientTempF > 70) {
    tempAdjustmentOz = (params.ambientTempF - 70) * 2; // +2oz per degree above 70°F
  }

  // Activity level adjustment
  const activityMultipliers = {
    light: 1.0,
    moderate: 1.3,
    heavy: 1.6,
  };
  const activityAdjustmentOz = baselineOz * (activityMultipliers[params.activityLevel] - 1);

  // Total for shift duration (not full day)
  const dailyTotal = baselineOz + gearAdjustmentOz + tempAdjustmentOz + activityAdjustmentOz;
  const totalRecommendedOz = (dailyTotal / 24) * params.shiftDurationHours;
  const perHourOz = totalRecommendedOz / params.shiftDurationHours;

  // Electrolyte recommendation based on loss rate
  let electrolyteRecommendation = 'Water only';
  if (params.wearingGear && params.activityLevel !== 'light') {
    electrolyteRecommendation = 'Add electrolytes: 300-500mg sodium, 100mg potassium per 20oz';
  } else if (params.ambientTempF > 85 || params.activityLevel === 'heavy') {
    electrolyteRecommendation = 'Add electrolytes: 200-400mg sodium per 20oz';
  }

  return {
    baselineOz: Math.round(baselineOz),
    gearAdjustmentOz: Math.round(gearAdjustmentOz),
    tempAdjustmentOz: Math.round(tempAdjustmentOz),
    activityAdjustmentOz: Math.round(activityAdjustmentOz),
    totalRecommendedOz: Math.round(totalRecommendedOz),
    perHourOz: Math.round(perHourOz),
    electrolyteRecommendation,
  };
}

/**
 * Pre-workout nutrition for firefighters
 * Optimized for immediate response readiness
 */
export function getPreWorkoutNutrition(workoutType: 'strength' | 'conditioning' | 'hybrid'): {
  timing: string;
  meal: string;
  supplements: string[];
  avoidance: string[];
} {
  const recommendations = {
    strength: {
      timing: '90-120 minutes before workout',
      meal: 'Protein (30-40g) + complex carbs (40-60g) + minimal fat. Example: chicken breast, rice, vegetables. Or: protein shake + banana + oats.',
      supplements: [
        'Creatine (5g) - take daily, timing doesn\'t matter',
        'Caffeine (150-200mg) 30-45 min pre-workout - improves strength output',
        'Beta-alanine (3-5g) - reduces fatigue in heavy sets (optional)',
      ],
      avoidance: [
        '❌ High-fat foods - slow digestion, can cause discomfort',
        '❌ High-fiber foods immediately before - GI distress risk',
        '❌ Excessive water (>20oz) in 30 min before - bloating',
      ],
    },
    conditioning: {
      timing: '60-90 minutes before workout',
      meal: 'Fast-digesting carbs (30-40g) + moderate protein (20-30g) + low fat. Example: white rice + lean turkey. Or: banana + protein shake.',
      supplements: [
        'Caffeine (100-150mg) 30 min pre-workout - endurance boost',
        'Electrolytes (pre-load) - sodium, potassium, magnesium',
        'Beta-alanine (3-5g) - delays fatigue in high-rep work',
      ],
      avoidance: [
        '❌ Heavy meals - causes nausea during high-intensity work',
        '❌ High-fat foods - slows gastric emptying',
        '❌ Dairy immediately before (if sensitive) - GI issues',
      ],
    },
    hybrid: {
      timing: '90 minutes before workout',
      meal: 'Balanced: protein (30g) + carbs (40-50g) + small fat portion. Example: eggs, toast, fruit. Or: protein shake + oats + peanut butter.',
      supplements: [
        'Creatine (5g daily) - supports both strength and power',
        'Caffeine (150mg) 30-45 min pre-workout - multi-benefit',
        'Citrulline malate (6-8g) - improves endurance (optional)',
      ],
      avoidance: [
        '❌ Excessive food volume - limits performance in both domains',
        '❌ Completely fasted training - impairs power output',
        '❌ New foods on training days - test foods on rest days',
      ],
    },
  };

  return recommendations[workoutType];
}

/**
 * Post-workout nutrition for firefighters
 * Optimized for rapid recovery and shift readiness
 */
export function getPostWorkoutNutrition(workoutIntensity: 'light' | 'moderate' | 'intense'): {
  timing: string;
  meal: string;
  proteinGrams: number;
  carbGrams: number;
  supplements: string[];
} {
  const recommendations = {
    light: {
      timing: 'Within 2 hours - not urgent for light training',
      meal: 'Normal balanced meal. Protein + carbs + vegetables.',
      proteinGrams: 25,
      carbGrams: 30,
      supplements: ['Multivitamin with meal (optional)'],
    },
    moderate: {
      timing: 'Within 60-90 minutes post-workout',
      meal: 'Protein shake + fruit, or: chicken breast + rice + vegetables',
      proteinGrams: 30,
      carbGrams: 40,
      supplements: [
        'Creatine (5g) - can take post-workout',
        'Protein powder (whey or plant) - fast absorption',
      ],
    },
    intense: {
      timing: 'Within 30-60 minutes - anabolic window matters for intense training',
      meal: 'Fast-digesting protein (whey shake) + simple carbs (banana, rice, gatorade), followed by solid meal 90 min later',
      proteinGrams: 40,
      carbGrams: 60,
      supplements: [
        'Creatine (5g) mixed in protein shake',
        'Whey protein isolate (fast absorption)',
        'Electrolytes (sodium, potassium) if heavy sweating',
        'Tart cherry juice (8oz) - reduces inflammation (optional)',
      ],
    },
  };

  return recommendations[workoutIntensity];
}

/**
 * Firefighter-specific macro calculator
 * Accounts for occupational demands and shift work
 */
export function calculateFirefighterMacros(params: {
  bodyWeightLbs: number;
  bodyfatPercent: number;
  goal: 'fat-loss' | 'maintenance' | 'muscle-gain';
  shiftType: '24-hour' | '12-hour-day' | '12-hour-night' | 'regular';
  trainingDaysPerWeek: number;
}): {
  calories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  rationale: string;
  adjustments: string[];
} {
  // Calculate lean body mass
  const leanMassLbs = params.bodyWeightLbs * (1 - params.bodyfatPercent / 100);

  // TDEE calculation with firefighter occupational activity
  const baseMultiplier = 1.2; // Sedentary baseline
  const occupationalMultiplier = {
    '24-hour': 1.5, // Moderate due to downtime + active calls
    '12-hour-day': 1.6, // More consistent activity
    '12-hour-night': 1.4, // Lower overall activity at night
    regular: 1.5, // Standard daytime activity
  };
  const trainingMultiplier = 0.05 * params.trainingDaysPerWeek; // +5% per training day

  const tdee = params.bodyWeightLbs * 13 * (baseMultiplier + occupationalMultiplier[params.shiftType] + trainingMultiplier);

  // Adjust for goal
  let calories = tdee;
  if (params.goal === 'fat-loss') {
    calories = tdee * 0.85; // 15% deficit
  } else if (params.goal === 'muscle-gain') {
    calories = tdee * 1.10; // 10% surplus
  }

  // Protein: 1g per lb bodyweight (firefighters need higher protein)
  const proteinGrams = params.bodyWeightLbs * 1.0;

  // Fat: 25% of total calories
  const fatGrams = (calories * 0.25) / 9;

  // Carbs: remaining calories
  const carbGrams = (calories - (proteinGrams * 4) - (fatGrams * 9)) / 4;

  const rationale = `Based on ${params.shiftType} shift pattern with ${params.trainingDaysPerWeek} training days/week. Protein prioritized for muscle maintenance and recovery. Carbs adjusted for activity level. Fats set at 25% for hormone health.`;

  const adjustments = [
    `On training days: +20-30g carbs (${Math.round(carbGrams + 25)}g total)`,
    `On rest days: -20-30g carbs (${Math.round(carbGrams - 25)}g total)`,
    `Post-shift (24hr): +protein shake immediately, then normal meals`,
    params.shiftType.includes('night') ? 'Night shifts: Front-load carbs early shift, taper toward morning' : '',
    'Hydration: See separate hydration calculator for fluid needs',
  ].filter(Boolean);

  return {
    calories: Math.round(calories),
    proteinGrams: Math.round(proteinGrams),
    carbGrams: Math.round(carbGrams),
    fatGrams: Math.round(fatGrams),
    rationale,
    adjustments,
  };
}
