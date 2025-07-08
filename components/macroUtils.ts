export const calculateCalories = (protein: number, carbs: number, fat: number) => {
  return protein * 4 + carbs * 4 + fat * 9;
};
