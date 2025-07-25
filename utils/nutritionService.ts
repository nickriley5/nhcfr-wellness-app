import axios from 'axios';

/* ✅ PUT YOUR KEYS HERE */
const API_NINJAS_KEY = 'ALKFLcYBNnMyNOTVdkRvVA==SKPUFIZ6BsNkrNeK';
const USDA_API_KEY = 'DJ23bi1Bdxqm2yX1koDezsIgtbOQXLrgr0Q3UrSl';

/* ✅ Common return type for parsed meals */
export interface MealMacroResult {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: string;
  items?: string[];
}

// ✅ Types for API Ninjas
interface ApiNinjasFoodItem {
  name: string;
  serving_size_g: number;
  calories: number;
  protein_g: number;
  carbohydrates_total_g: number;
  fat_total_g: number;
}

// ✅ Types for USDA
interface USDAFoodNutrient {
  nutrientName: string;
  value: number;
}
interface USDAFoodItem {
  description: string;
  foodNutrients: USDAFoodNutrient[];
}
interface USDAResponse {
  foods: USDAFoodItem[];
}

export const fetchFromApiNinjas = async (query: string): Promise<MealMacroResult | null> => {
  try {
    const res = await axios.get<ApiNinjasFoodItem[]>(
      `https://api.api-ninjas.com/v1/nutrition?query=${encodeURIComponent(query)}`,
      {
        headers: { 'X-Api-Key': API_NINJAS_KEY },
      }
    );

    const foods = res.data;
    if (!foods || foods.length === 0) {
      return null;
    }

    let totalCals = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
    const items: string[] = [];

    foods.forEach((f: ApiNinjasFoodItem) => {
      totalCals += f.calories || 0;
      totalProtein += f.protein_g || 0;
      totalCarbs += f.carbohydrates_total_g || 0;
      totalFat += f.fat_total_g || 0;
      items.push(`${f.serving_size_g}g ${f.name}`);
    });

    return {
      calories: Math.round(totalCals),
      protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs),
      fat: Math.round(totalFat),
      source: 'API_NINJAS',
      items,
    };
  } catch (err) {
    console.error('❌ API Ninjas error:', err);
    return null;
  }
};

export const fetchFromUSDA = async (query: string): Promise<MealMacroResult | null> => {
  try {
    const res = await axios.get<USDAResponse>(
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=1&api_key=${USDA_API_KEY}`
    );

    const foods = res.data.foods;
    if (!foods || foods.length === 0) {
      return null;
    }

    const nutrients = foods[0].foodNutrients;

    let cals = 0, protein = 0, carbs = 0, fat = 0;

    nutrients.forEach((n: USDAFoodNutrient) => {
      if (n.nutrientName.includes('Energy')) {
        cals = n.value;
      }
      if (n.nutrientName.includes('Protein')) {
        protein = n.value;
      }
      if (n.nutrientName.includes('Carbohydrate')) {
        carbs = n.value;
      }
      if (n.nutrientName.includes('Total lipid')) {
        fat = n.value;
      }
    });

    return {
      calories: Math.round(cals),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
      source: 'USDA_FDC',
      items: [foods[0].description],
    };
  } catch (err) {
    console.error('❌ USDA fallback error:', err);
    return null;
  }
};

export const describeMeal = async (query: string): Promise<MealMacroResult> => {
  const apiNinjasResult = await fetchFromApiNinjas(query);
  if (apiNinjasResult) {
    return apiNinjasResult;
  }

  const usdaResult = await fetchFromUSDA(query);
  if (usdaResult) {
    return usdaResult;
  }

  throw new Error('No meal found in either API');
};
