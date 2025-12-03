/**
 * AI Service - Central hub for all AI integrations
 * Supports: OpenAI, Anthropic Claude, Google Gemini
 */

import axios from 'axios';
import Config from 'react-native-config';

// ============= CONFIGURATION =============
// API keys are loaded from .env file via react-native-config
const AI_CONFIG = {
  openai: {
    apiKey: Config.OPENAI_API_KEY || '',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4-turbo-preview',
  },
  anthropic: {
    apiKey: Config.ANTHROPIC_API_KEY || '',
    baseURL: 'https://api.anthropic.com/v1',
    model: 'claude-3-5-sonnet-20241022',
  },
  gemini: {
    apiKey: Config.GEMINI_API_KEY || '',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-1.5-pro',
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
  exercises: string[];
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
    console.error(`AI Service Error (${provider}):`, error);
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
  const formattedMessages = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const response = await axios.post<any>(
    `${config.baseURL}/models/${config.model}:generateContent?key=${config.apiKey}`,
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

  return {
    content: response.data.candidates[0].content.parts[0].text,
    model: config.model,
  };
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
}): Promise<WorkoutRecommendation> {
  const prompt = `You are an expert fitness coach for firefighters. Based on the following user context, recommend a workout:

Goal: ${userContext.goal}
Experience Level: ${userContext.experience}
Available Equipment: ${userContext.equipment.join(', ')}
Recent Workouts: ${userContext.recentWorkouts.join(', ')}
${userContext.injuries ? `Injuries/Limitations: ${userContext.injuries.join(', ')}` : ''}
${userContext.preferences ? `Preferences: ${userContext.preferences.join(', ')}` : ''}

Provide a JSON response with:
1. exercises: array of exercise names that fit the context
2. rationale: brief explanation of why these exercises were chosen
3. estimatedDuration: workout duration in minutes
4. difficultyScore: 1-10 difficulty rating
5. focusAreas: array of muscle groups/areas targeted

Return ONLY valid JSON, no additional text.`;

  const response = await sendAIMessage([
    { role: 'system', content: 'You are a professional fitness AI specialized in firefighter wellness programs.' },
    { role: 'user', content: prompt },
  ]);

  const parsed = JSON.parse(response.content);
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

  const response = await sendAIMessage([
    { role: 'system', content: 'You are a professional nutrition AI specialized in firefighter meal planning.' },
    { role: 'user', content: prompt },
  ]);

  const parsed = JSON.parse(response.content);
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

  const response = await sendAIMessage(messages);
  return response.content;
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
