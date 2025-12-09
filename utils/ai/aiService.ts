/**
 * AI Service - Central hub for all AI integrations
 * Supports: OpenAI, Anthropic Claude, Google Gemini
 */

import axios from 'axios';

// ============= CONFIGURATION =============
// Hardcoded API keys for now (react-native-config not working)
// TODO: Fix react-native-config setup for production
const config = {
  GEMINI_API_KEY: 'AIzaSyBPEC65Rlz3MeBC8BcKX-CvX5BkPP3hXwY',
  OPENAI_API_KEY: '',
  ANTHROPIC_API_KEY: '',
};

const AI_CONFIG = {
  openai: {
    apiKey: config.OPENAI_API_KEY || '',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4-turbo-preview',
  },
  anthropic: {
    apiKey: config.ANTHROPIC_API_KEY || '',
    baseURL: 'https://api.anthropic.com/v1',
    model: 'claude-3-5-sonnet-20241022',
  },
  gemini: {
    apiKey: config.GEMINI_API_KEY || '',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-2.5-flash',
  },
};

// ============= TYPES =============
export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  tokensUsed?: number;
  model?: string;
  confidence?: number;
}

export interface WorkoutRecommendation {
  warmup: string[];
  exercises: string[];
  cooldown: string[];
  rationale: string;
  estimatedDuration: number;
  difficultyScore: number;
  focusAreas: string[];
}

export interface PeriodizedProgram {
  programName: string;
  totalWeeks: number;
  periodizationModel: 'linear' | 'undulating' | 'block';
  phases: Array<{
    phaseName: string;
    weekRange: string;
    focus: string;
    description: string;
  }>;
  weeks: Array<{
    weekNumber: number;
    phase: string;
    isDeload: boolean;
    volumeMultiplier: number;
    days: Array<{
      dayNumber: number;
      dayName: string;
      focus: string;
      warmup: string[];
      exercises: Array<{
        name: string;
        sets: number;
        reps: string;
        restSeconds: number;
        rpe?: number;
        notes?: string;
      }>;
      cooldown: string[];
      estimatedDuration: number;
    }>;
  }>;
  progressionPlan: string;
  deloadStrategy: string;
}

export interface MealSuggestion {
  name: string;
  ingredients: string[];
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  prepTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  dietaryTags: string[];
}

export interface FormAnalysis {
  overallScore: number;
  keyPoints: string[];
  corrections: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

// ============= CORE AI FUNCTIONS =============

/**
 * Send a message to the AI and get a response
 */
export async function sendAIMessage(
  messages: AIMessage[],
  provider: 'openai' | 'anthropic' | 'gemini' = 'gemini',
  options?: {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  }
): Promise<AIResponse> {
  // Validate API key exists
  const providerConfig = AI_CONFIG[provider];
  if (!providerConfig.apiKey) {
    throw new Error(`${provider} API key not configured. Please check your .env file.`);
  }
  
  console.log(`🤖 Sending message to ${provider}...`);
  const config = AI_CONFIG[provider];
  
  if (!config.apiKey) {
    throw new Error(`${provider} API key not configured`);
  }

  try {
    let response;
    
    switch (provider) {
      case 'openai':
        response = await sendOpenAIMessage(messages, config, options);
        break;
      case 'anthropic':
        response = await sendAnthropicMessage(messages, config, options);
        break;
      case 'gemini':
        response = await sendGeminiMessage(messages, config, options);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
    
    return response;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`AI Service Error (${provider}):`, errorMsg);
    throw error;
  }
}

// ============= PROVIDER-SPECIFIC IMPLEMENTATIONS =============

async function sendOpenAIMessage(
  messages: AIMessage[],
  config: typeof AI_CONFIG.openai,
  options?: any
): Promise<AIResponse> {
  const response = await axios.post<any>(
    `${config.baseURL}/chat/completions`,
    {
      model: config.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 2000,
    },
    {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return {
    content: response.data.choices[0].message.content,
    tokensUsed: response.data.usage?.total_tokens,
    model: config.model,
  };
}

async function sendAnthropicMessage(
  messages: AIMessage[],
  config: typeof AI_CONFIG.anthropic,
  options?: any
): Promise<AIResponse> {
  const systemMessage = messages.find(m => m.role === 'system');
  const userMessages = messages.filter(m => m.role !== 'system');

  const response = await axios.post<any>(
    `${config.baseURL}/messages`,
    {
      model: config.model,
      max_tokens: options?.maxTokens || 2000,
      system: systemMessage?.content,
      messages: userMessages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    },
    {
      headers: {
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
    }
  );

  return {
    content: response.data.content[0].text,
    tokensUsed: response.data.usage?.input_tokens + response.data.usage?.output_tokens,
    model: config.model,
  };
}

async function sendGeminiMessage(
  messages: AIMessage[],
  config: typeof AI_CONFIG.gemini,
  options?: any
): Promise<AIResponse> {
  // Gemini doesn't support system messages - merge system prompt into first user message
  const systemMessage = messages.find(m => m.role === 'system');
  const nonSystemMessages = messages.filter(m => m.role !== 'system');
  
  // Gemini requires alternating user/model messages
  // Filter to ensure proper alternation (remove consecutive messages of same role)
  const alternatingMessages: AIMessage[] = [];
  let lastRole: string | null = null;
  
  for (const msg of nonSystemMessages) {
    if (msg.role !== lastRole) {
      alternatingMessages.push(msg);
      lastRole = msg.role;
    }
  }
  
  // If we only have user messages (no assistant responses), just send the last one
  // with system prompt prepended
  if (alternatingMessages.every(m => m.role === 'user')) {
    const lastUserMessage = alternatingMessages[alternatingMessages.length - 1];
    const messageText = systemMessage 
      ? `${systemMessage.content}\n\nUser: ${lastUserMessage.content}`
      : lastUserMessage.content;
    
    const formattedMessages = [{
      role: 'user',
      parts: [{ text: messageText }],
    }];
    
    const url = `${config.baseURL}/models/${config.model}:generateContent?key=${config.apiKey}`;
    console.log('🌐 Gemini API URL:', url.replace(config.apiKey, 'API_KEY_HIDDEN'));
    console.log('📨 Request payload:', JSON.stringify({ contents: formattedMessages }, null, 2));

    const response = await axios.post<any>(
      url,
      {
        contents: formattedMessages,
        generationConfig: {
          temperature: options?.temperature || 0.7,
          maxOutputTokens: options?.maxTokens || 4000,
          topP: 0.95,
          topK: 40,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('📥 Gemini response received:', JSON.stringify(response.data).substring(0, 200));
    
    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('❌ Unexpected Gemini response structure:', JSON.stringify(response.data, null, 2));
      throw new Error('Invalid response from Gemini API');
    }

    return {
      content: response.data.candidates[0].content.parts[0].text,
      model: config.model,
    };
  }
  
  // If there's a system message, prepend it to the first user message
  if (systemMessage && alternatingMessages.length > 0) {
    const firstUserMsg = alternatingMessages.find(m => m.role === 'user');
    if (firstUserMsg) {
      firstUserMsg.content = `${systemMessage.content}\n\nUser: ${firstUserMsg.content}`;
    }
  }

  const formattedMessages = alternatingMessages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const url = `${config.baseURL}/models/${config.model}:generateContent?key=${config.apiKey}`;
  console.log('🌐 Gemini API URL:', url.replace(config.apiKey, 'API_KEY_HIDDEN'));
  console.log('📨 Request payload:', JSON.stringify({ contents: formattedMessages }, null, 2));

  const response = await axios.post<any>(
    url,
    {
      contents: formattedMessages,
      generationConfig: {
        temperature: options?.temperature || 0.7,
        maxOutputTokens: options?.maxTokens || 2000,
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  console.log('📥 Gemini response received:', JSON.stringify(response.data).substring(0, 200));
  
  if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
    console.error('❌ Unexpected Gemini response structure:', JSON.stringify(response.data, null, 2));
    throw new Error('Invalid response from Gemini API');
  }

  return {
    content: response.data.candidates[0].content.parts[0].text,
    model: config.model,
  };
}

// ============= HELPER FUNCTIONS =============

/**
 * Clean markdown formatting from AI responses (e.g., ```json ... ```)
 */
function cleanJsonResponse(text: string): string {
  // Remove markdown code blocks
  let cleaned = text.trim();
  
  // Remove ```json or ``` at the start
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  
  // Remove ``` at the end
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  
  return cleaned.trim();
}

// ============= SPECIALIZED AI FUNCTIONS =============

/**
 * Get AI-powered workout recommendations based on user data
 */
export async function getWorkoutRecommendation(userContext: {
  goal: string;
  experience: string;
  equipment: string[];
  recentWorkouts: string[];
  injuries?: string[];
  preferences?: string[];
  availableExercises?: Array<{ id: string; name: string; equipment: string; focusArea: string }>;
}): Promise<WorkoutRecommendation> {
  // Build compact exercise list (newline-separated, no quotes to save tokens)
  let exerciseListText = '';
  if (userContext.availableExercises && userContext.availableExercises.length > 0) {
    const exerciseNames = userContext.availableExercises.map(ex => ex.name).join('\n');
    exerciseListText = `\n\nAVAILABLE EXERCISES:\n${exerciseNames}`;
  }

  const prompt = `You are a professional strength and conditioning coach creating a workout for a firefighter.

PROFILE:
Goal: ${userContext.goal}
Level: ${userContext.experience}
Equipment: ${userContext.equipment.join(', ')}
Recent Workouts: ${userContext.recentWorkouts.join(', ') || 'none'}${exerciseListText}

CREATE A PROFESSIONAL-GRADE WORKOUT:
1. Select 2-3 warm-up exercises (mobility/activation - NOT the same as main exercises)
2. Select 4-6 main exercises (compound movements first, then accessories)
3. Select 2-3 cool-down exercises (stretching/mobility)
4. VARY exercises based on recent workouts - don't repeat the same movements
5. Balance muscle groups (push/pull, upper/lower)
6. Use ONLY exercises from the AVAILABLE EXERCISES list
7. Match difficulty to experience level

Respond with ONLY this JSON (no markdown, no extra text):
{
  "warmup": ["Exercise 1", "Exercise 2"],
  "exercises": ["Exercise 1", "Exercise 2", "Exercise 3", "Exercise 4"],
  "cooldown": ["Exercise 1", "Exercise 2"],
  "rationale": "Brief explanation of why these exercises work together",
  "estimatedDuration": 45,
  "difficultyScore": 7,
  "focusAreas": ["Chest", "Back"]
}`;

  const response = await sendAIMessage(
    [
      { role: 'system', content: 'You are a certified strength coach with 10+ years experience designing firefighter training programs. Create varied, professional workouts.' },
      { role: 'user', content: prompt },
    ],
    'gemini',
    { temperature: 0.9, maxTokens: 4000 } // Higher temperature for more variety
  );

  const cleanedResponse = cleanJsonResponse(response.content);
  const parsed = JSON.parse(cleanedResponse);
  return parsed as WorkoutRecommendation;
}

/**
 * Generate a complete periodized training program with progressive overload
 */
export async function generatePeriodizedProgram(programContext: {
  goal: string;
  experience: string;
  equipment: string[];
  totalWeeks: number;
  daysPerWeek: number;
  periodizationModel?: 'linear' | 'undulating' | 'block';
  availableExercises?: Array<{ id: string; name: string; equipment: string; focusArea: string }>;
}): Promise<PeriodizedProgram> {
  // Build compact exercise list
  let exerciseListText = '';
  if (programContext.availableExercises && programContext.availableExercises.length > 0) {
    const exerciseNames = programContext.availableExercises.map(ex => ex.name).join('\n');
    exerciseListText = `\n\nAVAILABLE EXERCISES (use ONLY these):\n${exerciseNames}`;
  }

  // Determine periodization model based on goal
  let defaultPeriodization: 'linear' | 'undulating' | 'block' = 'linear';
  const goalLower = programContext.goal.toLowerCase();
  if (goalLower.includes('strength')) {
    defaultPeriodization = 'linear';
  } else if (goalLower.includes('vo2') || goalLower.includes('cardio') || goalLower.includes('endurance')) {
    defaultPeriodization = 'block';
  } else if (goalLower.includes('hypertrophy') || goalLower.includes('muscle')) {
    defaultPeriodization = 'undulating';
  }

  const periodization = programContext.periodizationModel || defaultPeriodization;

  const prompt = `You are an elite strength & conditioning coach specializing in firefighter fitness. Create a COMPLETE ${programContext.totalWeeks}-week periodized training program.

USER PROFILE:
- Goal: ${programContext.goal}
- Experience: ${programContext.experience}
- Equipment: ${programContext.equipment.join(', ')}
- Duration: ${programContext.totalWeeks} weeks
- Training Days: ${programContext.daysPerWeek} days per week
- Periodization Model: ${periodization}${exerciseListText}

PERIODIZATION PRINCIPLES TO APPLY:

${periodization === 'linear' ? `LINEAR PERIODIZATION (for Strength):
- Weeks 1-4: Hypertrophy Phase (3-4 sets × 8-12 reps, RPE 7-8)
- Weeks 5-8: Strength Phase (4-5 sets × 4-6 reps, RPE 8-9)
- Weeks 9-11: Power/Peak Phase (3-4 sets × 2-4 reps, RPE 9)
- Week 12: Deload (reduce volume by 40%)` : ''}

${periodization === 'undulating' ? `UNDULATING PERIODIZATION (for Hypertrophy):
- Vary intensity within each week:
  - Day 1: Heavy (4 sets × 4-6 reps, RPE 8-9)
  - Day 2: Moderate (3 sets × 8-12 reps, RPE 7-8)
  - Day 3: Light (3 sets × 12-15 reps, RPE 6-7)
- Every 4th week: Deload (reduce all volume by 40%)` : ''}

${periodization === 'block' ? `BLOCK PERIODIZATION (for VO2 Max/Endurance):
- Weeks 1-4: Base Building (high volume, low intensity)
- Weeks 5-8: Threshold/Tempo (moderate volume, moderate-high intensity)
- Weeks 9-11: Peak/Interval (lower volume, high intensity)
- Week 12: Taper (reduce volume by 50%)` : ''}

PROGRESSIVE OVERLOAD RULES:
1. Increase volume by 5-10% each week within a phase
2. Maintain exercise selection for 4 weeks before swapping
3. Every 4th week is a DELOAD (reduce sets by 40%, keep intensity)
4. Use RPE (Rate of Perceived Exertion) 1-10 scale for auto-regulation
5. Include appropriate rest periods:
   - Strength: 3-5 minutes
   - Hypertrophy: 60-90 seconds
   - Endurance/HIIT: 30-60 seconds

EXERCISE SELECTION CRITERIA:
1. Start with compound movements (squat, deadlift, press variations)
2. Follow with accessory exercises (isolation work)
3. Balance muscle groups (push/pull, upper/lower)
4. Include firefighter-specific movements (carries, crawls, climbs)
5. Use ONLY exercises from the AVAILABLE EXERCISES list
6. Maintain exercise consistency within each 4-week block

PROGRAM STRUCTURE:
- Include warm-up (5-10 min dynamic mobility)
- Include cool-down (5-10 min static stretch/mobility)
- Estimate realistic workout duration
- Provide clear progression notes

Return ONLY valid JSON with this EXACT structure (no markdown, no extra text):
{
  "programName": "12-Week Firefighter Strength Program",
  "totalWeeks": 12,
  "periodizationModel": "linear",
  "phases": [
    {
      "phaseName": "Hypertrophy",
      "weekRange": "1-4",
      "focus": "Muscle building and work capacity",
      "description": "Build foundational strength with higher volume"
    }
  ],
  "weeks": [
    {
      "weekNumber": 1,
      "phase": "Hypertrophy",
      "isDeload": false,
      "volumeMultiplier": 1.0,
      "days": [
        {
          "dayNumber": 1,
          "dayName": "Upper Body Push",
          "focus": "Chest, Shoulders, Triceps",
          "warmup": ["Band Pull-Aparts", "Arm Circles"],
          "exercises": [
            {
              "name": "Dumbbell Bench Press",
              "sets": 4,
              "reps": "8-10",
              "restSeconds": 90,
              "rpe": 7,
              "notes": "Control the descent"
            }
          ],
          "cooldown": ["Chest Stretch", "Shoulder Mobility"],
          "estimatedDuration": 50
        }
      ]
    }
  ],
  "progressionPlan": "Increase weight by 2.5-5% when you can complete all sets at top of rep range with RPE 7-8",
  "deloadStrategy": "Every 4th week, reduce sets by 40% and maintain same weight/reps"
}

IMPORTANT: Generate ALL ${programContext.totalWeeks} weeks with ${programContext.daysPerWeek} days each. Be specific with exercise names from the available list.`;

  const response = await sendAIMessage(
    [
      {
        role: 'system',
        content: 'You are a certified strength coach with 15+ years experience in periodized program design. You specialize in firefighter training and understand the demands of the profession.',
      },
      { role: 'user', content: prompt },
    ],
    'gemini',
    { temperature: 0.7, maxTokens: 8000 } // Need more tokens for full program
  );

  const cleanedResponse = cleanJsonResponse(response.content);
  const parsed = JSON.parse(cleanedResponse);
  return parsed as PeriodizedProgram;
}

/**
 * Get dynamic coaching adjustments based on last workout feedback
 */
export async function getWorkoutAdjustments(context: {
  lastWorkout?: {
    completedAt: string;
    exercises: Array<{
      name: string;
      sets: number;
      reps?: number;
      weight?: number;
      completed: boolean;
    }>;
    feedback?: {
      feeling: string;
      note?: string;
    };
  };
  scheduledWorkout: {
    dayName: string;
    focus: string;
    exercises: Array<{
      name: string;
      sets: number;
      reps: string;
      restSeconds: number;
    }>;
  };
  programContext: {
    currentWeek: number;
    totalWeeks: number;
    goal: string;
    phase: string;
  };
}): Promise<{
  shouldAdjust: boolean;
  coachingAdvice: string;
  adjustedWorkout?: {
    exercises: Array<{
      name: string;
      sets: number;
      reps: string;
      restSeconds: number;
      notes?: string;
    }>;
  };
  reasoning: string;
}> {
  const lastWorkoutInfo = context.lastWorkout
    ? `LAST WORKOUT (${context.lastWorkout.completedAt}):
Feeling: ${context.lastWorkout.feedback?.feeling || 'Not provided'}
Note: ${context.lastWorkout.feedback?.note || 'None'}
Completion Rate: ${context.lastWorkout.exercises.filter(e => e.completed).length}/${context.lastWorkout.exercises.length} exercises completed
Exercises performed:
${context.lastWorkout.exercises
  .map(
    ex =>
      `- ${ex.name}: ${ex.sets} sets${ex.weight ? ` @ ${ex.weight}lbs` : ''}${!ex.completed ? ' (INCOMPLETE)' : ''}`
  )
  .join('\n')}`
    : 'No previous workout data available';

  const prompt = `You are an elite strength coach analyzing a firefighter's training session to make intelligent adjustments.

${lastWorkoutInfo}

CURRENT PROGRAM CONTEXT:
Week ${context.programContext.currentWeek} of ${context.programContext.totalWeeks}
Phase: ${context.programContext.phase}
Goal: ${context.programContext.goal}

NEXT SCHEDULED WORKOUT:
Day: ${context.scheduledWorkout.dayName}
Focus: ${context.scheduledWorkout.focus}
Planned Exercises:
${context.scheduledWorkout.exercises.map(ex => `- ${ex.name}: ${ex.sets} sets × ${ex.reps}, rest ${ex.restSeconds}s`).join('\n')}

COACHING TASK:
Based on the user's feedback ("${context.lastWorkout?.feedback?.feeling}") and notes ("${context.lastWorkout?.feedback?.note || 'none'}"), determine:

1. Should we adjust today's workout? Consider:
   - If they felt "Exhausted" or "Tough" with negative notes (structure fires, poor sleep, etc.) → REDUCE intensity/volume
   - If they felt "Strong" or "Good" consistently → Maybe INCREASE slightly
   - If workout completion was low (< 75%) → SIMPLIFY or REDUCE volume
   - If they're in a deload week → Keep it light regardless

2. Provide specific coaching advice (2-3 sentences) that:
   - Acknowledges their situation
   - Explains the adjustment rationale
   - Motivates them appropriately

3. If adjusting, modify the workout (keep same exercises, adjust sets/reps/rest)

ADJUSTMENT GUIDELINES:
- For "Exhausted" with work stress: Reduce volume by 30-40%, increase rest periods
- For "Tough" but no major issues: Reduce volume by 10-20%
- For "Good/Strong": Proceed as planned or consider 5-10% increase
- Always prioritize recovery over pushing through fatigue

Return ONLY valid JSON:
{
  "shouldAdjust": true,
  "coachingAdvice": "I see you responded to 2 structure fires last night and felt exhausted. Let's reduce today's volume by 35% and focus on quality movement. Recovery is where adaptation happens.",
  "adjustedWorkout": {
    "exercises": [
      {
        "name": "Dumbbell Bench Press",
        "sets": 3,
        "reps": "6-8",
        "restSeconds": 120,
        "notes": "Focus on form, don't push to failure"
      }
    ]
  },
  "reasoning": "Reduced sets from 4 to 3, lowered reps to prioritize recovery"
}`;

  const response = await sendAIMessage(
    [
      {
        role: 'system',
        content:
          'You are an expert strength coach who understands periodization, fatigue management, and the physical demands of firefighting. You make intelligent, context-aware training adjustments.',
      },
      { role: 'user', content: prompt },
    ],
    'gemini',
    { temperature: 0.6, maxTokens: 2000 }
  );

  const cleanedResponse = cleanJsonResponse(response.content);
  const parsed = JSON.parse(cleanedResponse);
  return parsed;
}

/**
 * Get AI-powered meal suggestions based on nutrition goals
 */
export async function getMealSuggestions(nutritionContext: {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  dietaryPreference?: string;
  restrictions?: string[];
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  prepTimeLimit?: number;
}): Promise<MealSuggestion[]> {
  const prompt = `You are a nutrition expert. Suggest 3 meal options for a firefighter with these requirements:

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
- ingredients: array of ingredients with quantities
- macros: {calories, protein, carbs, fat}
- prepTime: preparation time in minutes
- difficulty: "easy", "medium", or "hard"
- dietaryTags: array of tags like "high-protein", "low-carb", etc.

Return ONLY valid JSON array, no additional text.`;

  const response = await sendAIMessage(
    [
      { role: 'system', content: 'You are a professional nutrition AI specialized in firefighter meal planning.' },
      { role: 'user', content: prompt },
    ],
    'gemini',
    { maxTokens: 8000 }
  );

  const cleanedResponse = cleanJsonResponse(response.content);
  const parsed = JSON.parse(cleanedResponse);
  return parsed as MealSuggestion[];
}

/**
 * Chat with AI fitness coach
 */
export async function chatWithCoach(
  userMessage: string,
  conversationHistory: AIMessage[],
  userProfile?: {
    name?: string;
    goals?: string[];
    experience?: string;
  }
): Promise<string> {
  try {
    console.log('💬 chatWithCoach called with:', { userMessage, historyLength: conversationHistory.length });
    
    const systemPrompt = `You are a professional fitness and nutrition coach specializing in firefighter wellness. 
Your name is "Coach AI" and you provide evidence-based, practical advice.
${userProfile?.name ? `You're talking to ${userProfile.name}.` : ''}
${userProfile?.goals ? `Their goals are: ${userProfile.goals.join(', ')}` : ''}
${userProfile?.experience ? `Experience level: ${userProfile.experience}` : ''}

Be encouraging, knowledgeable, and concise. Focus on actionable advice.`;

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    console.log('💬 Sending message to AI...');
    const response = await sendAIMessage(messages);
    console.log('💬 AI response received:', response.content.substring(0, 100) + '...');
    return response.content;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('💬 chatWithCoach error:', errorMsg);
    throw new Error(`AI Chat Error: ${errorMsg}`);
  }
}

/**
 * Analyze exercise form from video/image description
 * Note: This is a placeholder for when you implement video/image analysis
 */
export async function analyzeExerciseForm(
  exerciseName: string,
  formDescription: string
): Promise<FormAnalysis> {
  const prompt = `Analyze the following exercise form description:

Exercise: ${exerciseName}
Description: ${formDescription}

Provide a JSON response with:
- overallScore: 0-100 score
- keyPoints: array of what's being done correctly
- corrections: array of what needs improvement
- riskLevel: "low", "medium", or "high" injury risk

Return ONLY valid JSON, no additional text.`;

  const response = await sendAIMessage([
    { role: 'system', content: 'You are an expert in exercise biomechanics and form analysis.' },
    { role: 'user', content: prompt },
  ]);

  const parsed = JSON.parse(response.content);
  return parsed as FormAnalysis;
}

/**
 * Generate adaptive program adjustments based on progress
 */
export async function getAdaptiveProgramSuggestions(progressData: {
  completedWorkouts: number;
  averageRPE: number;
  missedDays: number;
  goalsProgress: { [key: string]: number };
  feedback?: string;
}): Promise<{
  shouldAdjust: boolean;
  recommendations: string[];
  newIntensity?: 'increase' | 'decrease' | 'maintain';
  reasoning: string;
}> {
  const prompt = `Analyze this training progress and suggest program adjustments:

Completed Workouts: ${progressData.completedWorkouts}
Average RPE: ${progressData.averageRPE}/10
Missed Days: ${progressData.missedDays}
Goals Progress: ${JSON.stringify(progressData.goalsProgress)}
${progressData.feedback ? `User Feedback: ${progressData.feedback}` : ''}

Provide JSON with:
- shouldAdjust: boolean (should we modify the program?)
- recommendations: array of specific suggestions
- newIntensity: "increase", "decrease", or "maintain"
- reasoning: brief explanation

Return ONLY valid JSON, no additional text.`;

  const response = await sendAIMessage([
    { role: 'system', content: 'You are an expert in periodization and adaptive training programs.' },
    { role: 'user', content: prompt },
  ]);

  return JSON.parse(response.content);
}

export default {
  sendAIMessage,
  getWorkoutRecommendation,
  generatePeriodizedProgram,
  getWorkoutAdjustments,
  getMealSuggestions,
  chatWithCoach,
  analyzeExerciseForm,
  getAdaptiveProgramSuggestions,
};
