/**
 * AI Service - Central hub for all AI integrations
 * Supports: OpenAI, Anthropic Claude, Google Gemini
 */

import axios from 'axios';

// ============= CONFIGURATION =============
// IMPORTANT: Replace 'YOUR_NEW_API_KEY_HERE' with your actual key
// Never commit real API keys to git!
const config = {
  GEMINI_API_KEY: 'AIzaSyBZJQfGhVHtuN-lu-0amgC6ohHPiY-JXYI',
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
          throw new Error('🚫 Gemini API is temporarily unavailable (503). The service might be overloaded or under maintenance. Please try again in a few minutes.');
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

  const prompt = `You are a professional strength and conditioning coach creating a workout for a firefighter.

PROFILE:
Goal: ${userContext.goal}
Level: ${userContext.experience}
Equipment: ${userContext.equipment.join(', ')}
Recent Workouts: ${userContext.recentWorkouts.join(', ') || 'none'}

WORKOUT REQUIREMENTS:
Duration: ${targetDuration} minutes
Focus: ${focusArea}
Training Style: ${style}
Intensity: ${intensityDesc} (${intensityLevel}/10)${exerciseListText}

CREATE A ${style.toUpperCase()} WORKOUT targeting ${focusArea.toUpperCase()}:
1. Select 2-3 warm-up exercises (mobility/activation)
2. Select 4-6 main exercises matching the ${style} style and ${focusArea} focus
3. Select 2-3 cool-down exercises (stretching/mobility)
4. VARY exercises based on recent workouts - don't repeat the same movements
5. Adjust sets/reps for ${style}: Strength=3-5 reps, Hypertrophy=8-12 reps, HIIT=30-60sec, Conditioning=high reps/time, Endurance=15+ reps
6. Match intensity to ${intensityDesc} (${intensityLevel}/10)
7. Total duration should be approximately ${targetDuration} minutes
8. Use ONLY exercises from the AVAILABLE EXERCISES list

Respond with ONLY this JSON (no markdown, no extra text):
{
  "warmup": ["Exercise 1", "Exercise 2"],
  "exercises": ["Exercise 1", "Exercise 2", "Exercise 3", "Exercise 4"],
  "cooldown": ["Exercise 1", "Exercise 2"],
  "rationale": "Brief explanation tailored to ${style} and ${focusArea}",
  "estimatedDuration": ${targetDuration},
  "difficultyScore": ${intensityLevel},
  "focusAreas": ["${focusArea}"]
}`;

  const response = await sendAIMessage(
    [
      { role: 'system', content: 'You are a certified strength coach with 10+ years experience designing firefighter training programs. Create varied, professional workouts tailored to specific goals.' },
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
  
  // Build compact exercise list (limit to 30 most relevant)
  let exerciseListText = '';
  if (programContext.availableExercises && programContext.availableExercises.length > 0) {
    const limitedExercises = programContext.availableExercises.slice(0, 30);
    const exerciseNames = limitedExercises.map(ex => ex.name).join(', ');
    exerciseListText = `\n\nEXERCISES: ${exerciseNames}`;
  }

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

  const prompt = `Generate weeks 1-4 of a ${programContext.totalWeeks}-week firefighter program.

${programContext.experience}, ${programContext.goal}, ${programContext.equipment.join('/')}, ${programContext.daysPerWeek} strength days/week.${cardioPrompt}

AVAILABLE EXERCISES (MUST USE ONLY THESE EXACT NAMES):
${exerciseListText}

RULES:
- Generate EXACTLY 4 weeks (weeks 1-4)
- Each week = ${programContext.daysPerWeek} strength days
- Each day = 4 exercises
- CRITICAL: Use ONLY exercise names from the AVAILABLE EXERCISES list above
- Match exercise names EXACTLY as listed
- Text: 1-2 words max for notes
- 1 warmup, 1 cooldown per day
${programContext.includeCardio ? '- Add cardioSchedule separately with 2-3 sessions/week' : ''}

JSON:
{
  "programName": "FF Strength",
  "totalWeeks": ${programContext.totalWeeks},
  "periodizationModel": "${periodization}",
  "phases": [{"phaseName": "Base", "weekRange": "1-4", "focus": "Build", "description": "Volume"}],
  "weeks": [
    {"weekNumber": 1, "phase": "Base", "isDeload": false, "volumeMultiplier": 1.0, "days": [
      {"dayNumber": 1, "dayName": "Upper", "focus": "Push", "warmup": ["Mobility"], "exercises": [
        {"name": "Bench Press", "sets": 4, "reps": "8-10", "restSeconds": 90, "rpe": 7, "notes": "Control"},
        {"name": "DB Press", "sets": 3, "reps": "10", "restSeconds": 60, "rpe": 7, "notes": "Squeeze"},
        {"name": "Pushups", "sets": 3, "reps": "15", "restSeconds": 45, "rpe": 6, "notes": "Slow"},
        {"name": "Dips", "sets": 3, "reps": "10", "restSeconds": 60, "rpe": 7, "notes": "Deep"}
      ], "cooldown": ["Stretch"], "estimatedDuration": 45}
    ]},
    {"weekNumber": 2, "phase": "Base", "isDeload": false, "volumeMultiplier": 1.05, "days": []},
    {"weekNumber": 3, "phase": "Base", "isDeload": false, "volumeMultiplier": 1.1, "days": []},
    {"weekNumber": 4, "phase": "Base", "isDeload": true, "volumeMultiplier": 0.7, "days": []}
  ],
  ${programContext.includeCardio ? `"cardioSchedule": {
    "frequency": 3,
    "weeks": [
      {"weekNumber": 1, "sessions": [
        {"dayOfWeek": "Monday", "type": "Run", "duration": 20, "intensity": "Easy", "notes": "Recovery pace"},
        {"dayOfWeek": "Wednesday", "type": "HIIT", "duration": 15, "intensity": "Intervals", "notes": "8x30s sprint, 90s rest"},
        {"dayOfWeek": "Friday", "type": "Bike", "duration": 30, "intensity": "Zone 2", "notes": "Steady state"}
      ]},
      {"weekNumber": 2, "sessions": []},
      {"weekNumber": 3, "sessions": []},
      {"weekNumber": 4, "sessions": []}
    ]
  },` : ''}
  "progressionPlan": "Add weight weekly",
  "deloadStrategy": "Light week 4"
}

Generate ALL ${programContext.daysPerWeek} days for ALL 4 weeks (1-4).${programContext.includeCardio ? ' Include cardioSchedule with ALL 4 weeks of cardio sessions.' : ''}`;

  try {
    onProgress?.('Generating workouts...', 50);
    
    const response = await sendAIMessage(
      [
        { role: 'system', content: 'Expert strength coach. Return ONLY valid JSON. Be extremely concise.' },
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
    
    // Convert all exercise names to IDs for proper lookup
    program.weeks.forEach(week => {
      week.days.forEach(day => {
        day.exercises.forEach(exercise => {
          if (!exercise.id && exercise.name) {
            exercise.id = nameToId(exercise.name);
            console.log(`🔄 Converted "${exercise.name}" -> "${exercise.id}"`);
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
};
