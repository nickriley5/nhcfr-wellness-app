import { setDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

export const saveMealPlanToFirestore = async ({
  uid,
  calorieTarget,
  proteinGrams,
  fatGrams,
  carbGrams,
  zoneBlocks,
  dietMethod,
  goalType,
  name,
  dietaryPreference,
  dietaryRestriction,
}: {
  uid: string;
  calorieTarget: number;
  proteinGrams: number;
  fatGrams: number;
  carbGrams: number;
  zoneBlocks: {
    protein: number;
    carbs: number;
    fat: number;
  };
  dietMethod: string;
  goalType: 'maintain' | 'fatloss' | 'muscle';
  name: string;
  dietaryPreference: string;
  dietaryRestriction: string;
}) => {
  const mealPlanData = {
    calorieTarget,
    proteinGrams,
    fatGrams,
    carbGrams,
    zoneBlocks,
    dietMethod,
    goalType,
    name,
    dietaryPreference,
    dietaryRestriction,
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'users', uid, 'mealPlan', 'active'), mealPlanData);

  return mealPlanData;
};

