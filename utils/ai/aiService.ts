/**
 * AI Service - Central hub for all AI integrations
 * Supports: OpenAI, Anthropic Claude, Google Gemini
 */

import axios from 'axios';
import { getEnv } from '../env';

// ============= CONFIGURATION =============
// Read API keys from environment (react-native-config) with safe fallbacks.
const env = getEnv();
const config = {
  GEMINI_API_KEY: env.GEMINI_API_KEY ?? '',
  OPENAI_API_KEY: env.OPENAI_API_KEY ?? '',
  ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY ?? '',
};

if (config.GEMINI_API_KEY) {
  console.log('✅ Gemini API key loaded successfully');
} else {
  console.warn('⚠️ Gemini API key not configured');
}

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
    model: 'gemini-flash-latest', // Auto-updates to latest stable flash model
  },
};

// ============= RATE LIMITING =============
// Track last request time to prevent 429 errors
let lastRequestTime = 0;
const MIN_REQUEST_DELAY = 1800; // 1.8 seconds between requests

/**
 * Enforce minimum delay between AI requests to avoid rate limits
 */
async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_DELAY) {
    const waitTime = MIN_REQUEST_DELAY - timeSinceLastRequest;
    console.log(`⏱️  Rate limit: waiting ${waitTime}ms before next request...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

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
        id?: string; // Exercise ID for lookup (converted from name)
        name: string;
        sets: number;
        reps: string;
        weight?: number; // Weight in lbs (optional - user enters during workout)
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
  // Cardio schedule (separate from strength days)
  cardioSchedule?: {
    frequency: number; // Days per week
    weeks: Array<{
      weekNumber: number;
      sessions: Array<{
        dayOfWeek: string; // "Monday", "Wednesday", etc.
        type: string; // "Run", "Bike", "Row", "HIIT", "Swim"
        duration: number; // Minutes
        intensity: string; // "Easy", "Moderate", "Hard", "Intervals", "Zone 2"
        notes?: string; // "5min warmup, 8x400m @ 5K pace, 2min rest"
        targetHeartRate?: string; // "140-150 bpm" or "Zone 2"
      }>;
    }>;
  };
  // Program management
  id?: string;
  isActive?: boolean;
  isArchived?: boolean;
  archivedAt?: any; // Firestore Timestamp
  completedAt?: any; // Firestore Timestamp
  currentWeek?: number;
  currentDay?: number;
  completedWeeks?: number;
  createdAt?: any; // Firestore Timestamp
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
  // Enforce rate limiting to prevent 429 errors
  await enforceRateLimit();
  
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
  // Retry logic for 503 errors (server overload)
  const maxRetries = 3;
  const baseDelay = 2000; // 2 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await sendGeminiMessageAttempt(messages, config, options);
    } catch (error: any) {
      const is503 = error.response?.status === 503;
      const isLastAttempt = attempt === maxRetries;
      
      if (is503 && !isLastAttempt) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff: 2s, 4s, 8s
        console.log(`🔄 Retry ${attempt}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If not 503, or if last attempt, throw the error
      throw error;
    }
  }
  
  throw new Error('Failed after all retry attempts');
}

async function sendGeminiMessageAttempt(
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
    // console.log('📨 Request payload:', JSON.stringify({ contents: formattedMessages }, null, 2));

    try {
      const response = await axios.post<any>(
        url,
        {
          contents: formattedMessages,
          generationConfig: {
            temperature: options?.temperature || 0.7,
            maxOutputTokens: options?.maxTokens || 8192, // Gemini max is 8192
            topP: 0.95,
            topK: 40,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60 second timeout
        }
      );

      // console.log('📥 Gemini response received:', JSON.stringify(response.data).substring(0, 200));
      
      if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        // console.error('❌ Unexpected Gemini response structure:', JSON.stringify(response.data, null, 2));
        throw new Error('Invalid response from Gemini API');
      }

      return {
        content: response.data.candidates[0].content.parts[0].text,
        model: config.model,
      };
    } catch (error: any) {
      // Handle specific error codes
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;

        if (status === 503) {
          // Don't throw immediately - let retry logic handle it
          console.warn('⚠️ Gemini API returned 503, will retry...');
          throw error; // Throw to trigger retry
        } else if (status === 429) {
          throw new Error('⏱️ Rate limit exceeded. You\'ve made too many requests. Please wait a few minutes and try again.');
        } else if (status === 400) {
          throw new Error(`❌ Invalid request: ${errorData?.error?.message || 'Bad request'}`);
        } else if (status === 401 || status === 403) {
          throw new Error('🔑 API key is invalid or has been revoked. Please check your configuration.');
        } else if (status === 404) {
          throw new Error(`🔍 Model not found. The model "${config.model}" may not be available.`);
        }
        
        throw new Error(`Gemini API error (${status}): ${errorData?.error?.message || error.message}`);
      }
      
      // Network or timeout errors
      if (error.code === 'ECONNABORTED') {
        throw new Error('⏱️ Request timed out. The AI is taking too long to respond. Please try again.');
      }
      
      throw error;
    }
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
  duration?: number;
  focus?: string;
  trainingStyle?: string;
  intensity?: number;
}): Promise<WorkoutRecommendation> {
  // Build compact exercise list (newline-separated, no quotes to save tokens)
  let exerciseListText = '';
  if (userContext.availableExercises && userContext.availableExercises.length > 0) {
    const exerciseNames = userContext.availableExercises.map(ex => ex.name).join('\n');
    exerciseListText = `\n\nAVAILABLE EXERCISES:\n${exerciseNames}`;
  }

  const targetDuration = userContext.duration || 45;
  const focusArea = userContext.focus || 'Full Body';
  const style = userContext.trainingStyle || 'Strength';
  const intensityLevel = userContext.intensity || 5;
  
  // Map intensity to descriptive term
  const intensityMap: { [key: number]: string } = {
    1: 'Very Light', 2: 'Light', 3: 'Light', 4: 'Moderate', 5: 'Moderate',
    6: 'Moderate', 7: 'Hard', 8: 'Hard', 9: 'Very Hard', 10: 'Maximum'
  };
  const intensityDesc = intensityMap[intensityLevel] || 'Moderate';

  const prompt = `You are designing a single workout for a FIREFIGHTER.

PROFILE:
Experience: ${userContext.experience}
Primary Goal: ${userContext.goal}
Equipment Available: ${userContext.equipment.join(', ')}
Recent Workouts (avoid repeating): ${userContext.recentWorkouts.join(', ') || 'none'}
${userContext.injuries ? `Injuries/Limitations: ${userContext.injuries.join(', ')}` : ''}

TODAY'S WORKOUT PARAMETERS:
Duration Target: ${targetDuration} minutes
Focus Area: ${focusArea}
Training Style: ${style}
Intensity Level: ${intensityDesc} (${intensityLevel}/10 RPE)${exerciseListText}

🚒 FIREFIGHTER JOB-SPECIFIC FOCUS:
Design this workout to improve occupational readiness. Consider:
- Functional strength for victim rescue and equipment manipulation
- Work capacity for extended duration operations
- Movement quality under load (50+ lbs of gear)
- Injury prevention for common firefighter issues (lower back, shoulders)
- Real-world application to fireground tasks

WORKOUT STRUCTURE:
1. Warmup (2-3 exercises, 5-8 min): Dynamic mobility, muscle activation
2. Main Work (4-6 exercises, ${targetDuration - 15} min): Match ${style} style and ${focusArea} focus
   - If ${style} = "Strength": 3-5 reps, heavy loads, full recovery
   - If ${style} = "Hypertrophy": 8-12 reps, moderate loads, 60-90s rest
   - If ${style} = "Power": 3-5 reps, explosive movement, full recovery
   - If ${style} = "HIIT": 30-60 sec work intervals, minimal rest
   - If ${style} = "Conditioning": High reps or timed work, moderate rest
   - If ${style} = "Endurance": 15+ reps or 2+ min work, short rest
3. Cooldown (2-3 exercises, 5-7 min): Static stretching, mobility, recovery

EXERCISE SELECTION RULES:
✅ Use ONLY exercises from the AVAILABLE EXERCISES list
✅ Copy names EXACTLY as shown (case-sensitive)
✅ Choose exercises that match ${focusArea} focus
✅ AVOID repeating: ${userContext.recentWorkouts.join(', ') || 'none'}
✅ Include firefighter-priority movements when possible:
   - Carrying (Farmer Carry, Sled work)
   - Hip hinge (Deadlift variations)
   - Overhead pressing (ladder/ceiling work simulation)
   - Pulling (hoseline operations)
   - Core stability (spine protection)
${userContext.injuries ? `✅ Modify for: ${userContext.injuries.join(', ')}` : ''}

INTENSITY CALIBRATION FOR ${intensityDesc} (${intensityLevel}/10):
- RPE Target: ${intensityLevel - 1} to ${intensityLevel}
- Load: ${intensityLevel < 4 ? 'Light (60-70% max)' : intensityLevel < 7 ? 'Moderate (70-80% max)' : 'Heavy (80-90% max)'}
- Rest Periods: ${intensityLevel < 4 ? '30-45s' : intensityLevel < 7 ? '60-90s' : '2-3 min'}
- Volume: ${intensityLevel < 4 ? 'Lower sets/reps' : intensityLevel < 7 ? 'Moderate volume' : 'Higher volume or intensity'}

Return ONLY this JSON (no markdown, no extra text):
{
  "warmup": ["Exercise Name 1", "Exercise Name 2"],
  "exercises": ["Exercise Name 1", "Exercise Name 2", "Exercise Name 3", "Exercise Name 4"],
  "cooldown": ["Exercise Name 1", "Exercise Name 2"],
  "rationale": "Brief 1-2 sentence explanation of how this workout supports firefighter ${focusArea} performance and ${userContext.goal}",
  "estimatedDuration": ${targetDuration},
  "difficultyScore": ${intensityLevel},
  "focusAreas": ["${focusArea}"]
}`;

  const response = await sendAIMessage(
    [
      { 
        role: 'system', 
        content: 'You are a TSAC-F certified tactical strength coach with 10+ years designing firefighter fitness programs. You understand occupational demands, CPAT testing, injury prevention, and functional fitness for structural firefighting. Create varied, professional workouts with real-world application to fireground operations.' 
      },
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
 * Convert exercise name to ID format (lowercase with underscores)
 * Example: "Bench Press" -> "bench_press"
 * @deprecated Use exerciseMatching.ts utilities instead
 */
function nameToId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

/**
 * Generate initial 2-week training block
 * Generates just 2 weeks at a time to avoid token limits
 */
export async function generatePeriodizedProgram(
  programContext: {
    goal: string;
    experience: string;
    equipment: string[];
    totalWeeks: number;
    daysPerWeek: number;
    periodizationModel?: 'linear' | 'undulating' | 'block';
    availableExercises?: Array<{ id: string; name: string; equipment: string; focusArea: string }>;
    includeCardio?: boolean;
    allowTwoADays?: boolean;
  },
  onProgress?: (phase: string, percent: number) => void
): Promise<PeriodizedProgram> {
  
  onProgress?.('Creating your first 4 weeks...', 20);
  
  // Build exercise list - use curated list for better AI selection
  let exerciseListText = '';
  if (programContext.availableExercises && programContext.availableExercises.length > 0) {
    // Use all provided exercises (already curated from getCuratedExerciseList)
    const exerciseNames = programContext.availableExercises.map(ex => ex.name).join('\n- ');
    exerciseListText = `\n\n⚠️ AVAILABLE EXERCISES - USE EXACT NAMES (CRITICAL):\n- ${exerciseNames}`;
    console.log(`📋 Providing ${programContext.availableExercises.length} exercises to AI`);
  }

  // Import firefighter-specific guidance
  const { getFirefighterExerciseGuidance } = await import('../exerciseMatching');
  const ffGuidance = getFirefighterExerciseGuidance();
  
  const firefighterContext = `
🚒 FIREFIGHTER OCCUPATIONAL FITNESS CONTEXT:
This program is for a FIREFIGHTER who needs job-specific functional fitness.

CRITICAL JOB DEMANDS:
- Wearing 50+ lbs of gear and SCBA during operations
- Stair climbing with equipment (Step-Ups are essential)
- Victim rescue lifts from ground (Deadlift patterns critical)
- Equipment/hose carries over distance (Farmer Carries essential)
- Forcible entry and breaching (Pushing power: bench, overhead press)
- Hoseline operations (Pulling strength: rows, pull-ups)
- Extended duration work under cardiovascular stress
- Rapid transitions from prone to standing (Burpees)
- Spine protection under asymmetric loads

EXERCISE PRIORITIES (Job-Specific):
1. CARRYING: ${ffGuidance.movementPatterns.carrying.join(', ')}
2. LOWER BODY POWER: ${ffGuidance.movementPatterns.squatting.join(', ')} + ${ffGuidance.movementPatterns.hinging.join(', ')}
3. PUSHING: ${ffGuidance.movementPatterns.pushing.join(', ')}
4. PULLING: ${ffGuidance.movementPatterns.pulling.join(', ')}
5. EXPLOSIVE: ${ffGuidance.movementPatterns.explosive.join(', ')}
6. CORE STABILITY: ${ffGuidance.movementPatterns.core.join(', ')}
7. WORK CAPACITY: ${ffGuidance.movementPatterns.conditioning.join(', ')}

PROGRAM MUST INCLUDE (Every Week):
- At least 1 carrying exercise (Farmer Carry, Sled Drag)
- At least 1 deadlift variation (ground-to-standing lifts)
- At least 1 overhead press (ladder work, ceiling operations)
- At least 1 pull exercise (hoseline work)
- At least 1 explosive movement (emergency response power)
- Core work in every session (spine protection)
- Work capacity/conditioning 2-3x per week
`;

  // Determine periodization model
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

  // Map periodization names
  const periodizationMap = {
    linear: 'Progressive',
    undulating: 'Varied',
    block: 'Focused'
  };

  // Cardio prompt addition
  const cardioPrompt = programContext.includeCardio 
    ? `\n\nCARDIO: Include 2-3 cardio sessions per week. Use cardioSchedule with frequency, type (Run/Bike/Row/HIIT), duration, intensity (Easy/Moderate/Hard/Intervals/Zone 2).` 
    : '';

  console.log('🏃 Cardio in aiService:', programContext.includeCardio);
  console.log('🏃 Cardio prompt:', cardioPrompt || '(none)');

  const prompt = `Generate weeks 1-4 of a ${programContext.totalWeeks}-week FIREFIGHTER occupational fitness program.

FIREFIGHTER PROFILE:
Experience: ${programContext.experience}
Primary Goal: ${programContext.goal}
Available Equipment: ${programContext.equipment.join(', ')}
Training Days: ${programContext.daysPerWeek} strength sessions per week
${programContext.includeCardio ? 'PLUS 2-3 dedicated cardio/conditioning sessions' : ''}

${firefighterContext}
${exerciseListText}

PROGRAM DESIGN RULES:
✅ Generate EXACTLY 4 weeks (weeks 1-4 only)
✅ Each week has EXACTLY ${programContext.daysPerWeek} strength training days
✅ Each day has 4-6 main exercises
✅ CRITICAL: Use ONLY exercises from "AVAILABLE EXERCISES" list above
✅ CRITICAL: Copy exercise names EXACTLY character-for-character (case-sensitive)
✅ DO NOT abbreviate, modify, or paraphrase exercise names
✅ Include 1-2 warmup exercises per day (mobility/activation)
✅ Include 1-2 cooldown exercises per day (stretching/recovery)
✅ Keep notes to 1-3 words maximum per exercise
${programContext.includeCardio ? '✅ Include separate cardioSchedule with 2-3 sessions per week' : ''}

FIREFIGHTER-SPECIFIC REQUIREMENTS:
🚒 Every week MUST include:
   - 2-3 carrying exercises (Farmer Carry, Sled Drag, Bear Crawl)
   - 2-3 deadlift variations (victim rescue simulation)
   - 2-3 overhead pressing movements (ladder/ceiling work)
   - 2-3 pulling exercises (hoseline operations)
   - 1-2 explosive movements (Box Jump, Broad Jump, Clean, Tire Flip)
   - Step-Ups in at least 2 sessions (stair climbing with gear)
   - Core work in EVERY session (anti-rotation, anti-extension)

🔥 Set/Rep Schemes Based on Goal:
   - STRENGTH: 3-5 sets × 3-6 reps @ RPE 8-9
   - WORK CAPACITY: 3-4 sets × 8-12 reps @ RPE 7-8
   - POWER: 3-5 sets × 3-5 reps @ RPE 7-8 (explosive)
   - CONDITIONING: Circuits/AMRAPs, 45-90 sec work periods
   - CORE: 3 sets × 30-60 sec holds or 10-15 reps

📊 Periodization (Linear Model):
   - Week 1: Base building (moderate volume, RPE 6-7)
   - Week 2: Volume increase (+5-10% volume, RPE 7-8)
   - Week 3: Peak intensity (maintain volume, RPE 8-9)
   - Week 4: DELOAD (60-70% volume, RPE 5-6, recovery focus)

RETURN FORMAT - Valid JSON Only:
{
  "programName": "Firefighter [Goal] Program",
  "totalWeeks": ${programContext.totalWeeks},
  "periodizationModel": "${periodization}",
  "phases": [
    {
      "phaseName": "Foundation",
      "weekRange": "1-4",
      "focus": "Build work capacity and movement quality",
      "description": "Establish baseline strength and conditioning for firefighter operations"
    }
  ],
  "weeks": [
    {
      "weekNumber": 1,
      "phase": "Foundation",
      "isDeload": false,
      "volumeMultiplier": 1.0,
      "days": [
        {
          "dayNumber": 1,
          "dayName": "Lower Body Power & Carry",
          "focus": "Squats, Deadlifts, Carries",
          "warmup": ["Hip Mobility", "Glute Activation"],
          "exercises": [
            {
              "name": "Barbell Back Squat",
              "sets": 4,
              "reps": "6-8",
              "restSeconds": 120,
              "rpe": 7,
              "notes": "Controlled tempo"
            },
            {
              "name": "Romanian Deadlift",
              "sets": 3,
              "reps": "8-10",
              "restSeconds": 90,
              "rpe": 7,
              "notes": "Hip hinge"
            },
            {
              "name": "Farmer Carry",
              "sets": 4,
              "reps": "40 yards",
              "restSeconds": 90,
              "rpe": 8,
              "notes": "Heavy"
            },
            {
              "name": "Step-Ups",
              "sets": 3,
              "reps": "10 each leg",
              "restSeconds": 60,
              "rpe": 7,
              "notes": "Knee drive"
            },
            {
              "name": "Plank",
              "sets": 3,
              "reps": "45 sec",
              "restSeconds": 45,
              "rpe": 6,
              "notes": "Brace core"
            }
          ],
          "cooldown": ["Hip Flexor Stretch", "Hamstring Stretch"],
          "estimatedDuration": 50
        }
      ]
    },
    {
      "weekNumber": 2,
      "phase": "Foundation",
      "isDeload": false,
      "volumeMultiplier": 1.05,
      "days": []
    },
    {
      "weekNumber": 3,
      "phase": "Foundation",
      "isDeload": false,
      "volumeMultiplier": 1.1,
      "days": []
    },
    {
      "weekNumber": 4,
      "phase": "Foundation",
      "isDeload": true,
      "volumeMultiplier": 0.65,
      "days": []
    }
  ],
  ${programContext.includeCardio ? `"cardioSchedule": {
    "frequency": 3,
    "weeks": [
      {
        "weekNumber": 1,
        "sessions": [
          {"dayOfWeek": "Monday", "type": "Run", "duration": 20, "intensity": "Easy", "notes": "Recovery pace"},
          {"dayOfWeek": "Wednesday", "type": "HIIT", "duration": 15, "intensity": "Intervals", "notes": "8×30s/90s"},
          {"dayOfWeek": "Friday", "type": "Row", "duration": 25, "intensity": "Zone 2", "notes": "Steady state"}
        ]
      },
      {"weekNumber": 2, "sessions": []},
      {"weekNumber": 3, "sessions": []},
      {"weekNumber": 4, "sessions": []}
    ]
  },` : ''}
  "progressionPlan": "Increase load 2-5% weekly. Add 1 rep when hitting top of rep range. Progress carries by distance or load.",
  "deloadStrategy": "Week 4: Reduce volume 35%, maintain movement patterns, focus on quality and recovery for adaptation."
}

🚒 Generate complete program with ALL ${programContext.daysPerWeek} days for ALL 4 weeks.
${programContext.includeCardio ? '🏃 Include cardioSchedule with sessions for ALL 4 weeks.' : ''}
🔥 Prioritize firefighter job-specific movements. This is for occupational readiness, not bodybuilding.`;

  try {
    onProgress?.('Generating workouts...', 50);
    
    const response = await sendAIMessage(
      [
        { 
          role: 'system', 
          content: `You are an elite Tactical Strength & Conditioning Coach (TSAC-F certified) with 15+ years specializing in FIREFIGHTER occupational fitness. Your expertise includes:
- CPAT preparation and firefighter physical ability testing
- Functional fitness for structural firefighting operations
- Injury prevention for firefighters (lower back, shoulders, knees)
- Work capacity development for extended duration calls
- Periodization for shift work schedules
- Movement quality under load and fatigue

Your programs are evidence-based, job-specific, and designed to keep firefighters operationally ready while preventing injury. You understand the unique demands of wearing SCBA, carrying equipment, victim rescue, and sustained physical work in hot environments.

Return ONLY valid, parseable JSON. No markdown formatting. Be concise in notes (1-3 words max).`
        },
        { role: 'user', content: prompt }
      ],
      'gemini',
      { temperature: 0.7, maxTokens: 16384 }
    );

    onProgress?.('Finalizing...', 90);
    
    console.log('📦 Response length:', response.content.length);
    console.log('📦 First 200:', response.content.substring(0, 200));
    console.log('📦 Last 200:', response.content.substring(response.content.length - 200));
    
    const cleaned = cleanJsonResponse(response.content);
    const program = JSON.parse(cleaned) as PeriodizedProgram;
    
    console.log('🏃 Generated program has cardio:', !!program.cardioSchedule);
    if (program.cardioSchedule) {
      console.log('🏃 Cardio frequency:', program.cardioSchedule.frequency);
      console.log('🏃 Cardio weeks:', program.cardioSchedule.weeks.length);
    }
    
    // Ensure program metadata is correct
    program.totalWeeks = programContext.totalWeeks;
    program.periodizationModel = periodization;
    
    // Add note that this is first block
    program.progressionPlan = `Complete these 2 weeks, then generate next block.`;
    
    // Match exercises using fuzzy matching fallback
    const { resolveExercise } = await import('../exerciseMatching');
    
    program.weeks.forEach(week => {
      week.days.forEach(day => {
        day.exercises.forEach(exercise => {
          if (!exercise.id && exercise.name) {
            // First try: Use exercise name to find match in library
            const matched = resolveExercise(exercise.name);
            if (matched) {
              exercise.id = matched.id;
              // Update name to match library exactly (in case AI used slight variation)
              exercise.name = matched.name;
              console.log(`✅ Matched: "${exercise.name}" -> ID: ${exercise.id}`);
            } else {
              // Fallback: Use name-based ID (will show as "Unknown Exercise" in UI)
              exercise.id = nameToId(exercise.name);
              console.error(`❌ No match found for: "${exercise.name}", using fallback ID: ${exercise.id}`);
            }
          }
        });
      });
    });
    
    onProgress?.('Complete!', 100);
    return program;
    
  } catch (error) {
    throw error;
  }
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
    { temperature: 0.6, maxTokens: 4096 }
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
- ingredients: array of strings with quantities (e.g., ["200g chicken breast", "1 cup rice", "2 tbsp olive oil"])
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
  
  // ✅ Normalize ingredients format - handle both string[] and object[] formats
  const normalizedMeals = parsed.map((meal: any) => {
    const ingredients = meal.ingredients.map((ing: any) => {
      // If ingredient is an object like {item: "chicken", quantity: "200g"}, convert to string
      if (typeof ing === 'object' && ing !== null) {
        const quantity = ing.quantity || '';
        const item = ing.item || ing.name || '';
        return quantity ? `${quantity} ${item}` : item;
      }
      // Otherwise it's already a string
      return String(ing);
    });
    
    return {
      ...meal,
      ingredients,
    };
  });
  
  return normalizedMeals as MealSuggestion[];
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

/**
 * Analyze check-in data to determine training readiness
 * Triggers: Low energy, poor sleep, high soreness, low readiness, or on-shift with high call volume
 */
export async function analyzeTrainingReadiness(
  checkIn: {
    mood: number; // 1-5
    energy: number; // 1-5
    sleepQuality: number; // 1-5
    sleepHours: number; // decimal
    soreness: number; // 1-5
    stress: number; // 1-5
    readiness: number; // 1-5
    onShift: boolean;
    callVolume?: number | null; // 1-5 if onShift
    notes: string;
    timestamp: any; // Firestore timestamp
  },
  recentWorkouts: Array<{
    date: any;
    exercises: any[];
    feeling?: string; // "Strong", "Good", "Tough", "Exhausted"
    completed: boolean;
  }>,
  programContext?: {
    currentWeek: number;
    totalWeeks: number;
    phase: string;
    isDeloadWeek: boolean;
  }
): Promise<{
  shouldTrain: boolean;
  recommendation: 'train' | 'light' | 'rest';
  severity: 'none' | 'minor' | 'moderate' | 'severe';
  coachMessage: string;
  reasoning: string;
  adjustedIntensity?: number; // Percentage (e.g., 70 = reduce to 70% intensity)
}> {
  const prompt = `You are an expert strength coach analyzing a firefighter's readiness to train.

CHECK-IN DATA (Today):
- Sleep Quality: ${checkIn.sleepQuality}/5 (1=Poor, 5=Excellent)
- Sleep Hours: ${checkIn.sleepHours} hours
- Energy: ${checkIn.energy}/5 (1=Exhausted, 5=Energized)
- Soreness: ${checkIn.soreness}/5 (1=None, 5=Very Sore)
- Stress: ${checkIn.stress}/5 (1=Calm, 5=Overwhelmed)
- Readiness: ${checkIn.readiness}/5 (1=Not at all, 5=Let's go!)
- Mood: ${checkIn.mood}/5 (1=Terrible, 5=Great)
${checkIn.onShift ? `- On Shift: Yes, Call Volume: ${checkIn.callVolume}/5` : '- On Shift: No'}
${checkIn.notes ? `- Notes: "${checkIn.notes}"` : ''}

RECENT WORKOUT HISTORY (Last 7 days):
${recentWorkouts.length > 0 ? recentWorkouts.map((w, i) => 
  `Day ${i + 1}: ${w.completed ? 'Completed' : 'Skipped'}${w.feeling ? `, Felt: ${w.feeling}` : ''}`
).join('\n') : 'No recent workouts'}

${programContext ? `PROGRAM CONTEXT:
- Week ${programContext.currentWeek}/${programContext.totalWeeks}
- Phase: ${programContext.phase}
- Deload Week: ${programContext.isDeloadWeek ? 'Yes' : 'No'}` : ''}

DECISION CRITERIA:
- Sleep <6hrs OR Sleep Quality ≤2 = High fatigue risk
- Energy ≤2 OR Readiness ≤2 = Not recovered
- Soreness ≥4 = Accumulated fatigue
- Stress ≥4 + Poor sleep = CNS overload
- On shift + Call Volume ≥4 = Physical/mental exhaustion
- 3+ "Tough/Exhausted" workouts in recent history = Overtraining pattern

RECOMMENDATIONS:
1. "train" = Green light, proceed as planned (80-100% intensity)
2. "light" = Yellow flag, reduce volume/intensity (60-80%)
3. "rest" = Red flag, take full rest day

Provide a professional, motivational coach message that:
- Acknowledges their situation empathetically
- Explains the reasoning clearly
- Keeps them engaged with the program
- For firefighters: Recognize their job demands

Return ONLY valid JSON:
{
  "shouldTrain": true/false,
  "recommendation": "train|light|rest",
  "severity": "none|minor|moderate|severe",
  "coachMessage": "2-3 sentence message for user",
  "reasoning": "Technical explanation of decision factors",
  "adjustedIntensity": 70
}`;

  const response = await sendAIMessage(
    [
      {
        role: 'system',
        content: 'You are an expert strength coach specializing in recovery science and fatigue management for first responders.',
      },
      { role: 'user', content: prompt },
    ],
    'gemini',
    { temperature: 0.5, maxTokens: 2048 }
  );

  console.log('🤖 Raw AI Response:', response.content);
  
  const cleaned = cleanJsonResponse(response.content);
  console.log('🤖 Cleaned Response:', cleaned);
  
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('🤖 JSON Parse Error:', error);
    console.error('🤖 Failed to parse:', cleaned);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse AI response: ${errorMsg}`);
  }
}

/**
 * Analyze completed week performance and update next week's weights
 * Called after user completes all workouts in a week
 */
export async function analyzeWeeklyProgression(
  completedWeek: {
    weekNumber: number;
    phase: string;
    workouts: Array<{
      dayNumber: number;
      exercises: Array<{
        name: string;
        prescribedSets: number;
        prescribedReps: string;
        prescribedWeight?: number;
        actualSets: number;
        actualReps: number[];
        actualWeight: number;
        feeling?: string; // "Strong", "Good", "Tough", "Exhausted"
        rpe?: number; // 1-10
        notes?: string;
      }>;
    }>;
  },
  nextWeekPlan: {
    weekNumber: number;
    phase: string;
    isDeloadWeek: boolean;
    days: Array<{
      dayNumber: number;
      exercises: Array<{
        name: string;
        sets: number;
        reps: string;
        weight?: number;
        restSeconds: number;
        rpe?: number;
        notes?: string;
      }>;
    }>;
  }
): Promise<{
  updatedWeek: typeof nextWeekPlan;
  changes: Array<{
    exercise: string;
    dayNumber: number;
    change: 'increase' | 'maintain' | 'decrease';
    oldWeight?: number;
    newWeight?: number;
    oldReps?: string;
    newReps?: string;
    reason: string;
  }>;
  coachMessage: string;
  summary: string;
}> {
  const prompt = `You are an elite strength coach analyzing weekly performance to adjust training loads.

COMPLETED WEEK ${completedWeek.weekNumber} (${completedWeek.phase}):
${completedWeek.workouts.map(day => `
Day ${day.dayNumber}:
${day.exercises.map(ex => `  - ${ex.name}: 
    Prescribed: ${ex.prescribedSets}x${ex.prescribedReps}${ex.prescribedWeight ? ` @ ${ex.prescribedWeight}lbs` : ''}
    Actual: ${ex.actualSets}x${ex.actualReps.join('/')}${ex.actualWeight ? ` @ ${ex.actualWeight}lbs` : ''}
    Feeling: ${ex.feeling || 'N/A'}, RPE: ${ex.rpe || 'N/A'}
    ${ex.notes ? `Notes: ${ex.notes}` : ''}`).join('\n')}
`).join('\n')}

NEXT WEEK ${nextWeekPlan.weekNumber} (${nextWeekPlan.phase}):
Deload Week: ${nextWeekPlan.isDeloadWeek ? 'Yes' : 'No'}
${nextWeekPlan.days.map(day => `
Day ${day.dayNumber}:
${day.exercises.map(ex => `  - ${ex.name}: ${ex.sets}x${ex.reps}${ex.weight ? ` @ ${ex.weight}lbs` : ' @ TBD lbs'}`).join('\n')}
`).join('\n')}

PROGRESSION RULES:
1. **Hit Top of Rep Range + "Strong" feeling** → Increase weight 5-10lbs (compounds) or 2.5-5lbs (accessories)
2. **Hit Mid-Range + "Good" feeling** → Maintain weight, aim for top range next week
3. **Struggled to hit bottom range + "Tough/Exhausted"** → Decrease 5-10%
4. **Deload Week** → Reduce volume 40%, maintain or slightly reduce intensity
5. **Bodyweight exercises** → Increase reps or add difficulty progression
6. **Phase considerations**:
   - Strength phase: Prioritize weight increases
   - Hypertrophy phase: Prioritize rep increases
   - Deload: Always reduce regardless of performance

ANALYSIS FACTORS:
- Rep performance vs. prescribed range
- Consistency across sets (did they fade?)
- Feeling/RPE trends
- Phase-appropriate progression
- Deload timing

Return ONLY valid JSON with updated weights for each exercise:
{
  "updatedWeek": {
    "weekNumber": 2,
    "phase": "Strength",
    "isDeloadWeek": false,
    "days": [
      {
        "dayNumber": 1,
        "exercises": [
          {
            "name": "Bench Press",
            "sets": 4,
            "reps": "6-8",
            "weight": 195,
            "restSeconds": 120,
            "rpe": 8,
            "notes": "Increased from 185lbs"
          }
        ]
      }
    ]
  },
  "changes": [
    {
      "exercise": "Bench Press",
      "dayNumber": 1,
      "change": "increase",
      "oldWeight": 185,
      "newWeight": 195,
      "reason": "Hit 3x10 at top of range, felt strong throughout"
    }
  ],
  "coachMessage": "💪 Crushing it! Upped weight on Bench Press (+10lbs) and Squats (+15lbs) this week. Keep that momentum!",
  "summary": "3 exercises increased, 2 maintained, 0 decreased"
}`;

  const response = await sendAIMessage(
    [
      {
        role: 'system',
        content: 'You are an expert in progressive overload and periodized strength training. You make intelligent, evidence-based programming adjustments.',
      },
      { role: 'user', content: prompt },
    ],
    'gemini',
    { temperature: 0.4, maxTokens: 8192 }
  );

  const cleaned = cleanJsonResponse(response.content);
  return JSON.parse(cleaned);
}

/**
 * 🔥 NUTRITION ANALYSIS - Gemini-Powered with Vision Support
 * Analyzes text descriptions OR images to extract accurate macros
 */

export interface NutritionAnalysisResult {
  totalMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  items: Array<{
    name: string;
    quantity: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
  confidence: number; // 0-100
  source: 'gemini-text' | 'gemini-vision';
  detectedPortionSizes: string[];
  warnings?: string[];
  explanation?: string;
}

/**
 * Analyze meal from text description using Gemini
 */
export async function analyzeMealFromText(
  description: string
): Promise<NutritionAnalysisResult> {
  console.log('🍽️ Analyzing meal from text:', description);

  const prompt = `You are a professional nutritionist and dietitian specializing in accurate macro calculation for firefighters and athletes.

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

  const response = await sendAIMessage(
    [
      { role: 'system', content: 'You are a professional nutritionist with expertise in macro calculation. Return only valid JSON.' },
      { role: 'user', content: prompt },
    ],
    'gemini',
    { temperature: 0.3, maxTokens: 4000 }
  );

  const cleaned = cleanJsonResponse(response.content);
  const result = JSON.parse(cleaned) as NutritionAnalysisResult;

  // Validation
  const calculatedCals = 
    result.totalMacros.protein * 4 + 
    result.totalMacros.carbs * 4 + 
    result.totalMacros.fat * 9;
  
  const calDifference = Math.abs(result.totalMacros.calories - calculatedCals);
  
  if (calDifference > result.totalMacros.calories * 0.15) {
    result.warnings = result.warnings || [];
    result.warnings.push('Calorie calculation may be approximate - macros adjusted for accuracy');
    // Auto-correct calories to match macros
    result.totalMacros.calories = Math.round(calculatedCals);
  }

  console.log('✅ Meal analysis complete:', {
    calories: result.totalMacros.calories,
    items: result.items.length,
    confidence: result.confidence,
  });

  return result;
}

/**
 * Analyze meal from image using Gemini Vision API
 */
export async function analyzeMealFromImage(
  imageBase64: string,
  mimeType: string = 'image/jpeg',
  additionalContext?: string
): Promise<NutritionAnalysisResult> {
  console.log('📸 Analyzing meal from image...');

  await enforceRateLimit();

  const prompt = `You are a professional nutritionist analyzing a food photo for accurate macro calculation.

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

  try {
    const apiKey = AI_CONFIG.gemini.apiKey;
    const model = 'gemini-1.5-flash-latest'; // Vision-enabled model

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4000,
      },
    };

    const response = await axios.post(
      `${AI_CONFIG.gemini.baseURL}/models/${model}:generateContent?key=${apiKey}`,
      requestBody,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );

    const content = (response.data as any)?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = cleanJsonResponse(content);
    const result = JSON.parse(cleaned) as NutritionAnalysisResult;

    // Validation
    const calculatedCals =
      result.totalMacros.protein * 4 +
      result.totalMacros.carbs * 4 +
      result.totalMacros.fat * 9;

    const calDifference = Math.abs(result.totalMacros.calories - calculatedCals);

    if (calDifference > result.totalMacros.calories * 0.15) {
      result.warnings = result.warnings || [];
      result.warnings.push('Calorie calculation adjusted to match macro breakdown');
      result.totalMacros.calories = Math.round(calculatedCals);
    }

    console.log('✅ Image analysis complete:', {
      calories: result.totalMacros.calories,
      items: result.items.length,
      confidence: result.confidence,
    });

    return result;
  } catch (error) {
    console.error('❌ Image analysis failed:', error);
    throw new Error(`Failed to analyze meal image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Universal meal analyzer - handles both text and images
 */
export async function analyzeMeal(input: {
  text?: string;
  imageBase64?: string;
  imageMimeType?: string;
  context?: string;
}): Promise<NutritionAnalysisResult> {
  if (input.imageBase64) {
    return analyzeMealFromImage(
      input.imageBase64,
      input.imageMimeType || 'image/jpeg',
      input.text || input.context
    );
  } else if (input.text) {
    return analyzeMealFromText(input.text);
  } else {
    throw new Error('Must provide either text description or image');
  }
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
  analyzeTrainingReadiness,
  analyzeWeeklyProgression,
  analyzeMealFromText,
  analyzeMealFromImage,
  analyzeMeal,
};
