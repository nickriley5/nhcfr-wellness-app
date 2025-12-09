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
  getMealSuggestions,
  chatWithCoach,
  analyzeExerciseForm,
  getAdaptiveProgramSuggestions,
};
