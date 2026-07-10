export interface MealSuggestionPromptContext {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  dietaryPreference?: string;
  restrictions?: string[];
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  prepTimeLimit?: number;
}

export type ContextualMealMode = 'pantry' | 'eat_out';

export interface ContextualMealSuggestionsPromptContext {
  mode: ContextualMealMode;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  dietaryPreference?: string;
  restrictions?: string[];
  prepTimeLimit?: number;
  pantryIngredients?: string[];
  equipment?: string[];
  restaurants?: string[];
  locationHint?: string;
  macroStrictness?: 'strict' | 'balanced';
}

export function buildMealSuggestionsPrompt(nutritionContext: MealSuggestionPromptContext): string {
  return `You are a nutrition expert. Suggest 3 meal options for a firefighter with these requirements:

Target Macros:
- Calories: ${nutritionContext.targetCalories}
- Protein: ${nutritionContext.targetProtein}g
- Carbs: ${nutritionContext.targetCarbs}g
- Fat: ${nutritionContext.targetFat}g

Meal Type: ${nutritionContext.mealType}
${nutritionContext.dietaryPreference ? `Dietary Preference: ${nutritionContext.dietaryPreference}` : ''}
${nutritionContext.restrictions?.length ? `Restrictions: ${nutritionContext.restrictions.join(', ')}` : ''}
${nutritionContext.prepTimeLimit ? `Max Prep Time: ${nutritionContext.prepTimeLimit} minutes` : ''}

Provide a JSON array of 3 meal suggestions. Each should include:
- name: meal name
- ingredients: array of strings with quantities (e.g., ["200g chicken breast", "1 cup rice", "2 tbsp olive oil"])
- macros: {calories, protein, carbs, fat}
- prepTime: preparation time in minutes
- difficulty: "easy", "medium", or "hard"
- dietaryTags: array of tags like "high-protein", "low-carb", etc.

Return ONLY valid JSON array, no additional text.`;
}

export function buildContextualMealSuggestionsPrompt(
  nutritionContext: ContextualMealSuggestionsPromptContext
): string {
  const normalizedRestaurants = (nutritionContext.restaurants || []).map((restaurant) =>
    restaurant.toLowerCase()
  );
  const includesDominos = normalizedRestaurants.some(
    (restaurant) => restaurant.includes('domino') || restaurant.includes("domino's")
  );
  const eatOutSpecificRules = includesDominos
    ? `
Restaurant-specific constraints:
- For Domino's, use only realistic Domino's categories: pizza, wings, sandwiches, pasta, bread sides, salads, drinks.
- Include concrete pizza order structure when used (size, crust, topping choices, quantity).
- Do not reference non-Domino's formats like burrito bowls, tacos, or Chipotle-style custom orders.`
    : '';

  const tolerance =
    nutritionContext.macroStrictness === 'strict'
      ? { protein: 8, carbs: 10, fat: 6, calories: 80 }
      : { protein: 12, carbs: 18, fat: 8, calories: 120 };

  const modeContext =
    nutritionContext.mode === 'pantry'
      ? `MODE: COOK FROM WHAT I HAVE
AVAILABLE INGREDIENTS (must use these only unless clearly marked optional add-on): ${
          nutritionContext.pantryIngredients?.length
            ? nutritionContext.pantryIngredients.join(', ')
            : 'Not provided'
        }
AVAILABLE EQUIPMENT: ${
          nutritionContext.equipment?.length ? nutritionContext.equipment.join(', ') : 'Basic kitchen'
        }
Requirements:
- Build realistic meal ideas using on-hand ingredients.
- Include clear cooking steps.
- If one optional add-on would materially improve macros, include it in "optionalAddOns".`
      : `MODE: EAT OUT NOW
LOCATION HINT: ${nutritionContext.locationHint || 'Not provided'}
RESTAURANTS TO USE (must use ONLY these places): ${
          nutritionContext.restaurants?.length ? nutritionContext.restaurants.join(', ') : 'Not provided'
        }
Requirements:
- Use realistic menu items from the listed restaurants only.
- Provide exact order details and portion modifications.
- Include multiple distinct order options when possible, even if only one restaurant is listed.
- Include one backup order from the same or another listed restaurant inside each option.
${eatOutSpecificRules}`;

  return `You are a practical performance nutrition coach for firefighters.
Generate meal guidance that is realistic, executable, and tightly aligned to macro targets.

TARGET MACROS FOR THIS ${nutritionContext.mealType.toUpperCase()}:
- Calories: ${nutritionContext.targetCalories}
- Protein: ${nutritionContext.targetProtein}g
- Carbs: ${nutritionContext.targetCarbs}g
- Fat: ${nutritionContext.targetFat}g

MACRO TOLERANCE:
- Calories: +/- ${tolerance.calories}
- Protein: +/- ${tolerance.protein}g
- Carbs: +/- ${tolerance.carbs}g
- Fat: +/- ${tolerance.fat}g

CONTEXT:
${nutritionContext.dietaryPreference ? `- Dietary Preference: ${nutritionContext.dietaryPreference}` : '- Dietary Preference: none'}
${nutritionContext.restrictions?.length ? `- Restrictions: ${nutritionContext.restrictions.join(', ')}` : '- Restrictions: none'}
${nutritionContext.prepTimeLimit ? `- Max prep time: ${nutritionContext.prepTimeLimit} minutes` : '- Max prep time: 30 minutes'}
${modeContext}

Return ONLY valid JSON with this exact shape:
{
  "mode": "pantry" | "eat_out",
  "options": [
    {
      "name": "string",
      "source": "string",
      "prepMinutes": 20,
      "estimatedMacros": {
        "calories": 600,
        "protein": 45,
        "carbs": 55,
        "fat": 18
      },
      "macroFit": {
        "withinTolerance": true,
        "deltaCalories": 20,
        "deltaProtein": -3,
        "deltaCarbs": 6,
        "deltaFat": 2
      },
      "ingredients": ["string"],
      "instructions": ["string"],
      "orderDetails": ["string"],
      "optionalAddOns": ["string"],
      "whyItFits": "string",
      "fallback": "string"
    }
  ]
}

Rules:
- Return 2-3 options. If only one restaurant is listed, return 2-3 distinct orders from that restaurant.
- If mode is "pantry", "ingredients" and "instructions" must be populated. Keep "orderDetails" empty.
- If mode is "eat_out", "orderDetails" must be populated. Keep "instructions" concise and practical.
- If mode is "eat_out", each option MUST reference one of the provided restaurants in "source" and in "orderDetails".
- Do NOT invent restaurants not listed by the user.
- Quality floor:
- "whyItFits" must be specific and tactical (minimum 2 sentences).
- "fallback" must be an actionable backup option (minimum 1 sentence).
- For "eat_out", include at least 3 concrete order steps in "orderDetails"
  (exact menu item structure, customizations, and macro-control adjustments).
- For "pantry", include at least 3 clear cooking steps in "instructions".
- Do not include markdown, prose, or code fences.
- Ensure numbers are realistic and internally consistent.`;
}

export function buildAnalyzeMealTextPrompt(description: string): string {
  return `You are a professional nutritionist and dietitian specializing in accurate macro calculation for firefighters and athletes.

TASK: Analyze this meal description and provide detailed nutritional information.

MEAL DESCRIPTION: "${description}"

INSTRUCTIONS:
1. Identify ALL food items mentioned
2. Estimate reasonable portion sizes based on context (firefighters typically eat 1.2-1.5x normal portions)
3. Calculate accurate macros for EACH item individually
4. Use standard USDA/restaurant nutrition data as reference
5. Be conservative with estimates - slightly underestimate rather than overestimate
6. If portion size is ambiguous, assume "1 serving" or "medium" size
7. For restaurant items (McDonald's, Chipotle, etc.), use official nutrition facts

CONFIDENCE SCORING:
- 90-100: Exact portion specified + brand name (e.g., "McDonald's Big Mac")
- 75-89: Clear portion specified (e.g., "6oz chicken breast", "2 eggs")
- 60-74: General description with context (e.g., "grilled chicken sandwich")
- 40-59: Vague description (e.g., "some chicken")
- 0-39: Very ambiguous or missing information

VALIDATION RULES:
- Protein should be 4 cal/g
- Carbs should be 4 cal/g  
- Fat should be 9 cal/g
- Total calories should roughly match sum of macros
- Warn if values seem unrealistic

RETURN FORMAT - Valid JSON only, no markdown:
{
  "totalMacros": {
    "calories": 650,
    "protein": 45,
    "carbs": 60,
    "fat": 22
  },
  "items": [
    {
      "name": "Grilled Chicken Breast",
      "quantity": "6 oz",
      "calories": 280,
      "protein": 53,
      "carbs": 0,
      "fat": 6
    },
    {
      "name": "Brown Rice",
      "quantity": "1 cup cooked",
      "calories": 215,
      "protein": 5,
      "carbs": 45,
      "fat": 2
    },
    {
      "name": "Olive Oil",
      "quantity": "1 tbsp",
      "calories": 120,
      "protein": 0,
      "carbs": 0,
      "fat": 14
    }
  ],
  "confidence": 75,
  "source": "gemini-text",
  "detectedPortionSizes": ["6 oz", "1 cup", "1 tbsp"],
  "warnings": [],
  "explanation": "Based on standard USDA values for cooked chicken breast (165 cal per 100g), brown rice (112 cal per 100g cooked), and olive oil (120 cal per tbsp)"
}

Return ONLY the JSON object, no additional text.`;
}

export function buildAnalyzeMealImagePrompt(additionalContext?: string): string {
  return `You are a professional nutritionist analyzing a food photo for accurate macro calculation.

TASK: Identify all foods in this image and calculate their nutritional content.

${additionalContext ? `ADDITIONAL CONTEXT: ${additionalContext}` : ''}

INSTRUCTIONS:
1. Identify EVERY food item visible in the photo
2. Estimate portion sizes based on visual cues (plate size, utensil size, food dimensions)
3. For firefighters, portions are typically 1.2-1.5x standard servings
4. Calculate accurate macros for each item
5. Use visual indicators:
   - Standard dinner plate ≈ 10-11 inches diameter
   - Protein portion ≈ palm size or deck of cards
   - Carb portion ≈ fist size
   - Fat portion ≈ thumb size
6. Account for cooking method (fried vs grilled affects calories significantly)
7. Identify any sauces, toppings, or condiments

CONFIDENCE SCORING:
- 90-100: Clear view of all items, recognizable portions, known foods
- 75-89: Most items visible, portion sizes estimable
- 60-74: Some items unclear or portions hard to judge
- 40-59: Poor lighting, blurry, or unusual foods
- 0-39: Very unclear image or unidentifiable foods

RETURN FORMAT - Valid JSON only:
{
  "totalMacros": {
    "calories": 720,
    "protein": 48,
    "carbs": 65,
    "fat": 24
  },
  "items": [
    {
      "name": "Grilled Chicken Breast",
      "quantity": "~7 oz (visual estimate)",
      "calories": 320,
      "protein": 58,
      "carbs": 0,
      "fat": 8
    },
    {
      "name": "White Rice",
      "quantity": "~1.5 cups (visual estimate)",
      "calories": 310,
      "protein": 6,
      "carbs": 68,
      "fat": 1
    },
    {
      "name": "Butter/Oil on rice",
      "quantity": "~1 tbsp (visual estimate)",
      "calories": 90,
      "protein": 0,
      "carbs": 0,
      "fat": 10
    }
  ],
  "confidence": 80,
  "source": "gemini-vision",
  "detectedPortionSizes": ["~7 oz", "~1.5 cups", "~1 tbsp"],
  "warnings": ["Portion sizes are visual estimates - actual values may vary by 10-20%"],
  "explanation": "Clear image showing protein and carb portions. Chicken appears grilled based on char marks. Rice portion estimated from plate coverage (~40% of plate). Small amount of fat visible (sheen on rice)."
}

Return ONLY the JSON object.`;
}
