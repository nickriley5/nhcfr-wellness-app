import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export const calculateMacroPlan = (
  goalType: string,
  weight: number,
  weeklyRate: number
) => {
  let calories = 0;
  const proteinPerLb = goalType === 'build_muscle' ? 1.1 : 1.0;
  const fatPercent = 0.35;

  const baseCalories = weight * 14;
  const adjustment = weeklyRate * 500 * (goalType === 'fat_loss' ? -1 : goalType === 'build_muscle' ? 1 : 0);
  calories = baseCalories + adjustment;

  const protein = Math.round(weight * proteinPerLb);
  const fat = Math.round((calories * fatPercent) / 9);
  const carbs = Math.round((calories - (protein * 4 + fat * 9)) / 4);

  const zoneBlocks = {
    protein: Math.round(protein / 7),
    carbs: Math.round(carbs / 9),
    fat: Math.round(fat / 1.5),
  };

  return {
    calories: Math.round(calories),
    protein,
    carbs,
    fat,
    zoneBlocks,
  };
};

export const saveMacroPlanToFirestore = async ({
  uid,
  weight,
  targetWeight,
  weeklyRate,
  goalType,
  dietaryPreference,
  dietaryRestriction,
  dietMethod,
}: {
  uid: string;
  weight: number;
  targetWeight: number;
  weeklyRate: number;
  goalType: string;
  dietaryPreference: string;
  dietaryRestriction: string;
  dietMethod: string;
}) => {
  const macroPlan = calculateMacroPlan(goalType, weight, weeklyRate);
  const timestamp = new Date().toISOString();

  // Save user inputs
  await setDoc(doc(db, 'users', uid, 'mealPlan', 'goals'), {
    currentWeight: weight,
    targetWeight,
    weeklyRate,
    goalType,
    dietaryPreference,
    dietaryRestriction,
    dietMethod,
    updatedAt: timestamp,
  });

  // Save calculated macros
  await setDoc(doc(db, 'users', uid, 'macroPlan', 'active'), {
    ...macroPlan,
    goalType,
    dietMethod,
    updatedAt: timestamp,
  });
};
