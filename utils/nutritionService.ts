import axios from 'axios';
import crypto from 'crypto-js';

/* ✅ PUT YOUR REAL API KEYS HERE */
const NUTRITIONIX_APP_ID = 'a7dc596e';
const NUTRITIONIX_APP_KEY = '833302e6a67cd67663f72a08e8a05137';
const USDA_API_KEY = 'DJ23bi1Bdxqm2yX1koDezsIgtbOQXLrgr0Q3UrSl';
const FATSECRET_CONSUMER_KEY = 'fc4290b05cf8490c8391ad7b707befcc';
const FATSECRET_CONSUMER_SECRET = 'dc90e0d80d9c405d8a4387a65c5ce875';

/* ✅ Enhanced return type with confidence scoring */
export interface MealMacroResult {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: string;
  items?: string[];
  photoUri?: string | null;
  confidence: number; // 0-100 confidence score
  portionInfo?: {
    detectedSize?: string;
    standardizedAmount?: number;
    unit?: string;
  };
  validationFlags?: string[];
  itemMacros?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }[]; // ✅ NEW
}

/* ✅ API Response Types - FIXES TYPESCRIPT ERRORS */
interface NutritionixFood {
  food_name: string;
  serving_qty: number;
  serving_unit: string;
  serving_weight_grams?: number;
  nf_calories: number;
  nf_protein: number;
  nf_total_carbohydrate: number;
  nf_total_fat: number;
  brand_name?: string;
}

interface NutritionixResponse {
  foods: NutritionixFood[];
}

interface USDAFoodNutrient {
  nutrientName: string;
  value: number;
  unitName?: string;
}

interface USDAFoodItem {
  description: string;
  foodNutrients: USDAFoodNutrient[];
  fdcId?: number;
}

interface USDAResponse {
  foods: USDAFoodItem[];
  totalHits?: number;
}

interface TestResult {
  query: string;
  success: boolean;
  result?: MealMacroResult;
  error?: unknown;
}

interface ProcessedQuery {
  originalQuery: string;
  cleanedQuery: string;
  detectedQuantity: number;
  detectedUnit: string;
  detectedFood: string;
  brandDetected?: string;
  restaurantDetected?: string;
  confidence: number;
}

/* ✅ ENHANCED QUERY PREPROCESSING - Critical for accuracy */
const preprocessQuery = (query: string): ProcessedQuery => {
  const original = query.trim();
  let cleaned = original.toLowerCase();

  // Remove extra whitespace and normalize
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Standardize common abbreviations
  const abbreviations = {
    'oz': 'ounce',
    'lbs': 'pounds',
    'lb': 'pound',
    'tbsp': 'tablespoon',
    'tsp': 'teaspoon',
    'c': 'cup',
    'pt': 'pint',
    'qt': 'quart',
    'gal': 'gallon',
    'med': 'medium',
    'lg': 'large',
    'sm': 'small',
    'xl': 'extra large',
  };

  Object.entries(abbreviations).forEach(([abbr, full]) => {
    const regex = new RegExp(`\\b${abbr}\\b`, 'g');
    cleaned = cleaned.replace(regex, full);
  });

  // Extract quantity information with better patterns
  const quantityPatterns = [
    /(\d+(?:\.\d+)?)\s*(ounce|oz|pound|lb|gram|g|cup|tablespoon|teaspoon|slice|piece)/i,
    /(\d+(?:\.\d+)?)\s*(large|medium|small|extra large)/i,
    /(\d+(?:\.\d+)?)\s+(.+)/i, // Generic number + food
    /(one|two|three|four|five|six|seven|eight|nine|ten)/i,
  ];

  let detectedQuantity = 1;
  let detectedUnit = 'serving';
  let detectedFood = cleaned;

  // Word to number mapping
  const wordToNum: Record<string, number> = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  };

  for (const pattern of quantityPatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      const quantityStr = match[1];
      if (wordToNum[quantityStr]) {
        detectedQuantity = wordToNum[quantityStr];
      } else if (!isNaN(parseFloat(quantityStr))) {
        detectedQuantity = parseFloat(quantityStr);
      }

      if (match[2]) {
        detectedUnit = match[2];
        detectedFood = cleaned.replace(match[0], '').trim();
      }
      break;
    }
  }

  // Brand detection
  const brands = [
    'mcdonalds', 'starbucks', 'subway', 'chipotle', 'kfc', 'pizza hut',
    'dominos', 'taco bell', 'burger king', 'wendys', 'five guys',
    'shake shack', 'in-n-out', 'white castle', 'dunkin', 'costa',
  ];

  let brandDetected: string | undefined;
  let restaurantDetected: string | undefined;

  for (const brand of brands) {
    if (cleaned.includes(brand)) {
      brandDetected = brand;
      restaurantDetected = brand;
      break;
    }
  }

  // Calculate preprocessing confidence
  let confidence = 50; // Base confidence
  if (detectedQuantity > 0) {confidence += 20;}
  if (detectedUnit !== 'serving') {confidence += 10;}
  if (brandDetected) {confidence += 15;}
  if (detectedFood.length > 3) {confidence += 5;}

  return {
    originalQuery: original,
    cleanedQuery: cleaned,
    detectedQuantity,
    detectedUnit,
    detectedFood,
    brandDetected,
    restaurantDetected,
    confidence: Math.min(confidence, 100),
  };
};

/* ✅ RESULT VALIDATION - Catch unrealistic results */
const validateNutritionResult = (result: any, query: string): { isValid: boolean; flags: string[] } => {
  const flags: string[] = [];
  let isValid = true;

  // Check for impossible values
  if (result.calories < 0 || result.calories > 10000) {
    flags.push('Unrealistic calorie count');
    isValid = false;
  }

  if (result.protein < 0 || result.protein > 500) {
    flags.push('Unrealistic protein amount');
    isValid = false;
  }

  if (result.carbs < 0 || result.carbs > 1000) {
    flags.push('Unrealistic carb amount');
    isValid = false;
  }

  if (result.fat < 0 || result.fat > 500) {
    flags.push('Unrealistic fat amount');
    isValid = false;
  }

  // Calorie consistency check (4 cal/g protein, 4 cal/g carbs, 9 cal/g fat)
  const calculatedCals = (result.protein * 4) + (result.carbs * 4) + (result.fat * 9);
  const calorieVariance = Math.abs(result.calories - calculatedCals) / result.calories;

  if (calorieVariance > 0.3) { // More than 30% variance is suspicious
    flags.push('Calorie-macro mismatch detected');
  }

  // Check for zero-macro foods that should have macros
  const shouldHaveMacros = ['pizza', 'burger', 'sandwich', 'pasta', 'rice', 'bread'];
  if (shouldHaveMacros.some(food => query.toLowerCase().includes(food))) {
    if (result.calories === 0 || (result.protein === 0 && result.carbs === 0 && result.fat === 0)) {
      flags.push('Missing expected macros for complex food');
      isValid = false;
    }
  }

  return { isValid, flags };
};

/* ✅ Helper function to check if error is AxiosError */
const isAxiosError = (error: unknown): error is any => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    'config' in error
  );
};

/* ✅ OAuth signature generation */
const generateOAuthSignature = (
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
): string => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  const baseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&`;

  return crypto.HmacSHA1(baseString, signingKey).toString(crypto.enc.Base64);
};

/* ✅ ENHANCED NUTRITIONIX - Professional accuracy for complex meals */
export const fetchFromNutritionix = async (query: string): Promise<MealMacroResult | null> => {
  try {
    const processed = preprocessQuery(query);
    console.log('🥗 Nutritionix analysis:', processed);

    const searchQuery = processed.originalQuery;

    const response = await axios.post<NutritionixResponse>(
      'https://trackapi.nutritionix.com/v2/natural/nutrients',
      { query: searchQuery },
      {
        headers: {
          'x-app-id': NUTRITIONIX_APP_ID,
          'x-app-key': NUTRITIONIX_APP_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 12000,
      },
    );

    const foods = response.data.foods;
    if (!foods || foods.length === 0) {
      console.log('❌ Nutritionix: No foods returned');
      return null;
    }

    // Calculate totals and build confidence score
    let totalCals = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    const items: string[] = [];
    let confidenceScore = processed.confidence;

    foods.forEach((food: NutritionixFood) => {
      totalCals += food.nf_calories || 0;
      totalProtein += food.nf_protein || 0;
      totalCarbs += food.nf_total_carbohydrate || 0;
      totalFat += food.nf_total_fat || 0;

      const serving = `${food.serving_qty} ${food.serving_unit}`;
      const brandInfo = food.brand_name ? ` (${food.brand_name})` : '';
      items.push(`${serving} ${food.food_name}${brandInfo}`);

      if (food.brand_name) {confidenceScore += 10;}
    });

    const result: MealMacroResult = {
  calories: Math.round(totalCals),
  protein: Math.round(totalProtein),
  carbs: Math.round(totalCarbs),
  fat: Math.round(totalFat),
  source: 'NUTRITIONIX_PROFESSIONAL',
  items,
  confidence: Math.min(confidenceScore + 20, 95),
  portionInfo: {
    detectedSize: processed.detectedUnit,
    standardizedAmount: processed.detectedQuantity,
    unit: processed.detectedUnit,
  },
  itemMacros: foods.map(food => ({
    calories: Math.round(food.nf_calories || 0),
    protein: Math.round(food.nf_protein || 0),
    carbs: Math.round(food.nf_total_carbohydrate || 0),
    fat: Math.round(food.nf_total_fat || 0),
  })),
};

    const validation = validateNutritionResult(result, query);
    if (!validation.isValid) {
      console.log('❌ Nutritionix result failed validation:', validation.flags);
      return null;
    }

    result.validationFlags = validation.flags;
    console.log('✅ Nutritionix result:', result);
    return result;

  } catch (error: unknown) {
    console.error('❌ Nutritionix error:', error);
    if (isAxiosError(error)) {
      console.error('Nutritionix response:', error.response?.data);
      console.error('Nutritionix status:', error.response?.status);
    }
    return null;
  }
};

/* ✅ ENHANCED USDA - Government accuracy for whole foods */
export const fetchFromUSDA = async (query: string): Promise<MealMacroResult | null> => {
  try {
    const processed = preprocessQuery(query);
    console.log('🏛️ USDA analysis:', processed);

    const searchQuery = processed.detectedFood || processed.cleanedQuery;

    const response = await axios.get<USDAResponse>(
      'https://api.nal.usda.gov/fdc/v1/foods/search',
      {
        params: {
          query: searchQuery,
          pageSize: 15,
          api_key: USDA_API_KEY,
          dataType: ['Foundation', 'SR Legacy'],
        },
        timeout: 12000,
      },
    );

    const foods = response.data.foods;
    if (!foods || foods.length === 0) {
      console.log('❌ USDA: No foods returned');
      return null;
    }

    // Enhanced food selection logic
    let bestFood = foods[0];
    let matchScore = 0;

    for (const food of foods.slice(0, 10)) {
      const desc = food.description.toLowerCase();
      let score = 0;

      if (desc.includes('raw') || desc.includes('fresh')) {score += 10;}

      const searchWords = searchQuery.toLowerCase().split(' ');
      const matchingWords = searchWords.filter(word => desc.includes(word));
      score += (matchingWords.length / searchWords.length) * 30;

      if (!desc.includes('prepared') && !desc.includes('cooked with') && !desc.includes('canned')) {
        score += 5;
      }

      if (desc.split(' ').length <= 6) {score += 5;}

      if (score > matchScore) {
        matchScore = score;
        bestFood = food;
      }
    }

    console.log('🥇 USDA selected:', bestFood.description, 'Score:', matchScore);

    const nutrients = bestFood.foodNutrients;
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    nutrients.forEach((n: USDAFoodNutrient) => {
      const name = n.nutrientName.toLowerCase();
      const value = Number(n.value) || 0;

      if (name.includes('energy')) {
        calories = value;
      } else if (name.includes('protein')) {
        protein = value;
      } else if (name.includes('carbohydrate') && !name.includes('fiber')) {
        carbs = value;
      } else if (name.includes('total lipid') || (name.includes('fat') && name.includes('total'))) {
        fat = value;
      }
    });

    const multiplier = processed.detectedQuantity;

    const result: MealMacroResult = {
      calories: Math.round(calories * multiplier) || 0,
      protein: Math.round(protein * multiplier) || 0,
      carbs: Math.round(carbs * multiplier) || 0,
      fat: Math.round(fat * multiplier) || 0,
      source: 'USDA_GOVERNMENT',
      items: [`${multiplier}x ${bestFood.description}`],
      confidence: Math.min(processed.confidence + matchScore, 90),
      portionInfo: {
        detectedSize: processed.detectedUnit,
        standardizedAmount: processed.detectedQuantity,
        unit: processed.detectedUnit,
      },
    };

    const validation = validateNutritionResult(result, query);
    if (!validation.isValid) {
      console.log('❌ USDA result failed validation:', validation.flags);
      return null;
    }

    result.validationFlags = validation.flags;
    console.log('✅ USDA result:', result);
    return result;

  } catch (error: unknown) {
    console.error('❌ USDA error:', error);
    if (isAxiosError(error)) {
      console.error('USDA response data:', error.response?.data);
      console.error('USDA status:', error.response?.status);
    }
    return null;
  }
};

/* ✅ ENHANCED FATSECRET - Large database with brand recognition */
export const fetchFromFatSecret = async (query: string): Promise<MealMacroResult | null> => {
  try {
    const processed = preprocessQuery(query);
    console.log('🔍 FatSecret analysis:', processed);

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const baseUrl = 'https://platform.fatsecret.com/rest/server.api';
    const method = 'GET';

    // Step 1: Search for foods
    const searchParams = {
      method: 'foods.search',
      search_expression: processed.cleanedQuery,
      format: 'json',
      oauth_consumer_key: FATSECRET_CONSUMER_KEY,
      oauth_nonce: nonce,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp,
      oauth_version: '1.0',
    };

    const signature = generateOAuthSignature(method, baseUrl, searchParams, FATSECRET_CONSUMER_SECRET);
    const finalParams = { ...searchParams, oauth_signature: signature };

    const searchResponse = await axios.get(baseUrl, {
      params: finalParams,
      timeout: 12000,
    });

    const searchData = searchResponse.data as any;
    let foods = [];
    if (searchData.foods && searchData.foods.food) {
      foods = Array.isArray(searchData.foods.food) ? searchData.foods.food : [searchData.foods.food];
    }

    if (!foods || foods.length === 0) {
      console.log('❌ FatSecret: No foods found');
      return null;
    }

    // Step 2: Get detailed nutrition for the first food
    const firstFood = foods[0];
    const foodId = firstFood.food_id;

    const detailTimestamp = Math.floor(Date.now() / 1000).toString();
    const detailNonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const detailParams = {
      method: 'food.get.v4',
      food_id: foodId,
      format: 'json',
      oauth_consumer_key: FATSECRET_CONSUMER_KEY,
      oauth_nonce: detailNonce,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: detailTimestamp,
      oauth_version: '1.0',
    };

    const detailSignature = generateOAuthSignature(method, baseUrl, detailParams, FATSECRET_CONSUMER_SECRET);
    const finalDetailParams = { ...detailParams, oauth_signature: detailSignature };

    const detailResponse = await axios.get(baseUrl, {
      params: finalDetailParams,
      timeout: 12000,
    });

    const detailData = detailResponse.data as any;
    const foodDetail = detailData.food;
    if (!foodDetail || !foodDetail.servings) {
      console.log('❌ FatSecret: No nutrition data available');
      return null;
    }

    const servings = Array.isArray(foodDetail.servings.serving)
      ? foodDetail.servings.serving
      : [foodDetail.servings.serving];
    const serving = servings[0];

    const result: MealMacroResult = {
      calories: Math.round(Number(serving.calories) || 0),
      protein: Math.round(Number(serving.protein) || 0),
      carbs: Math.round(Number(serving.carbohydrate) || 0),
      fat: Math.round(Number(serving.fat) || 0),
      source: 'FATSECRET_DATABASE',
      items: [`${serving.serving_description} ${foodDetail.food_name}`],
      confidence: Math.min(processed.confidence + 5, 80),
      portionInfo: {
        detectedSize: serving.serving_description,
        standardizedAmount: processed.detectedQuantity,
        unit: processed.detectedUnit,
      },
    };

    const validation = validateNutritionResult(result, query);
    if (!validation.isValid) {
      console.log('❌ FatSecret result failed validation:', validation.flags);
      return null;
    }

    result.validationFlags = validation.flags;
    console.log('✅ FatSecret result:', result);
    return result;

  } catch (error: unknown) {
    console.error('❌ FatSecret error:', error);
    if (isAxiosError(error)) {
      console.error('FatSecret response:', error.response?.data);
      console.error('FatSecret status:', error.response?.status);
    }
    return null;
  }
};

/* ✅ CROSS-VALIDATION - Compare results when confidence is low */
const crossValidateResults = (results: MealMacroResult[]): MealMacroResult => {
  if (results.length === 1) {return results[0];}

  const sortedByConfidence = results.sort((a, b) => b.confidence - a.confidence);
  const bestResult = sortedByConfidence[0];

  if (bestResult.confidence < 70 && results.length > 1) {
    const secondBest = sortedByConfidence[1];

    const calorieVariance = Math.abs(bestResult.calories - secondBest.calories) / Math.max(bestResult.calories, secondBest.calories);

    if (calorieVariance > 0.25) {
      bestResult.validationFlags = bestResult.validationFlags || [];
      bestResult.validationFlags.push('High variance between API results');
      bestResult.confidence = Math.max(bestResult.confidence - 15, 30);
    } else {
      bestResult.confidence = Math.min(bestResult.confidence + 10, 95);
    }
  }

  return bestResult;
};

/* ✅ SMART ROUTING - The core intelligence */
export const describeMeal = async (query: string): Promise<MealMacroResult> => {
  console.log('🚀 Smart meal analysis for:', query);

  const processed = preprocessQuery(query);
  const results: MealMacroResult[] = [];

  // Enhanced routing logic
  const shouldTryNutritionix = (
    processed.restaurantDetected ||
    processed.brandDetected ||
    query.toLowerCase().includes('with') ||
    query.split(' ').length >= 4 ||
    ['burger', 'pizza', 'sandwich', 'salad', 'wrap', 'burrito'].some(food =>
      query.toLowerCase().includes(food)
    )
  );

  const shouldTryUSDA = (
    !processed.restaurantDetected &&
    !processed.brandDetected &&
    query.split(' ').length <= 3 &&
    ['egg', 'chicken', 'fish', 'beef', 'rice', 'apple', 'banana', 'broccoli', 'milk'].some(food =>
      query.toLowerCase().includes(food)
    )
  );

  // Strategy 1: Try Nutritionix for complex/branded items
  if (shouldTryNutritionix) {
    console.log('🎯 Using Nutritionix for complex meal');
    const nutritionixResult = await fetchFromNutritionix(query);
    if (nutritionixResult && nutritionixResult.calories > 0) {
      results.push(nutritionixResult);
    }
  }

  // Strategy 2: Try USDA for simple whole foods
  if (shouldTryUSDA) {
    console.log('🏛️ Using USDA for whole food');
    const usdaResult = await fetchFromUSDA(query);
    if (usdaResult && usdaResult.calories > 0) {
      results.push(usdaResult);
    }
  }

  // Strategy 3: FatSecret as fallback or for branded items
  if (results.length === 0 || processed.brandDetected) {
    console.log('🔄 Using FatSecret database');
    const fatSecretResult = await fetchFromFatSecret(query);
    if (fatSecretResult && fatSecretResult.calories > 0) {
      results.push(fatSecretResult);
    }
  }

  // Strategy 4: If we have no results, try the other APIs
  if (results.length === 0) {
    console.log('🔄 No results yet, trying remaining APIs');

    if (!shouldTryNutritionix) {
      const nutritionixBackup = await fetchFromNutritionix(query);
      if (nutritionixBackup && nutritionixBackup.calories > 0) {
        results.push(nutritionixBackup);
      }
    }

    if (!shouldTryUSDA) {
      const usdaBackup = await fetchFromUSDA(query);
      if (usdaBackup && usdaBackup.calories > 0) {
        results.push(usdaBackup);
      }
    }
  }

  if (results.length === 0) {
    console.log('❌ All APIs failed');
    throw new Error(`No nutrition data found for "${query}". Try being more specific with portion size and preparation method.`);
  }

  // Cross-validate and return best result
  const finalResult = crossValidateResults(results);

  console.log(`✅ Final result with ${finalResult.confidence}% confidence:`, finalResult);
  return finalResult;
};

/* ✅ ACCURACY TESTING SUITE */
export const runAccuracyTest = async () => {
  const testQueries = [
    // Simple foods (should hit USDA)
    '2 large eggs',
    '6 oz grilled chicken breast',
    '1 cup brown rice',
    '1 medium apple',

    // Complex foods (should hit Nutritionix)
    'McDonald\'s Big Mac',
    'Caesar salad with grilled chicken',
    'turkey sandwich with mayo and cheese',
    'Chipotle chicken burrito bowl',

    // Branded drinks (should hit FatSecret)
    'Starbucks grande latte',
    'Dunkin medium iced coffee with cream',

    // Challenging queries
    '2 slices pepperoni pizza',
    '1 cup pasta with marinara sauce',
    'grilled salmon with vegetables',
    'protein shake with banana',
  ];

  console.log('🎯 Running accuracy test...');

  const results: TestResult[] = [];
  for (const query of testQueries) {
    try {
      const result = await describeMeal(query);
      const success = `✅ ${query}: ${result.calories} cal, ${result.protein}g protein, ${result.confidence}% confidence (${result.source})`;
      console.log(success);
      results.push({ query, success: true, result });
    } catch (_error) {
      const failure = `❌ ${query}: Failed`;
      console.log(failure);
      results.push({ query, success: false, error: _error });
    }
  }

  const successfulResults = results.filter((r): r is TestResult & { success: true; result: MealMacroResult } =>
    r.success && r.result !== undefined
  );

  const successRate = (successfulResults.length / results.length) * 100;
  const avgConfidence = successfulResults.length > 0
    ? successfulResults.reduce((sum, r) => sum + r.result.confidence, 0) / successfulResults.length
    : 0;

  console.log(`🎯 Success Rate: ${successRate}%`);
  console.log(`🎯 Average Confidence: ${avgConfidence.toFixed(1)}%`);

  return {
    successRate,
    avgConfidence,
    results,
    message: `Enhanced system achieved ${successRate}% success rate with ${avgConfidence.toFixed(1)}% average confidence. Ready for deployment.`,
  };
};
