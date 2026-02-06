/**
 * AI Service - Central hub for all AI integrations
 * Supports: OpenAI, Anthropic Claude, Google Gemini
 */

import axios from 'axios';
import { NutritionAnalysisResult, parseNutritionResult } from './nutritionSchema';
import { AIProvider, sendProviderMessage } from './providers';
import { cleanJsonResponse, parseCleanJsonResponse } from './jsonUtils';
import { AI_CONFIG } from './config';
import { enforceRateLimit } from './rateLimiter';
import type { AIMessage, AIResponse } from './types';
import {
  buildWorkoutAdjustmentsPrompt,
  buildWorkoutRecommendationPrompt,
  WorkoutAdjustmentsContext,
  WorkoutRecommendationContext,
} from './prompts/workoutPrompts';
import {
  buildAnalyzeMealImagePrompt,
  buildAnalyzeMealTextPrompt,
  buildMealSuggestionsPrompt,
} from './prompts/nutritionPrompts';
export type { NutritionAnalysisResult } from './nutritionSchema';
export type { AIMessage, AIResponse } from './types';

const isAxiosLikeError = (error: unknown): error is { response?: { status?: number; data?: unknown }; message?: string } =>
  typeof error === 'object' &&
  error !== null &&
  'response' in error;

// ============= TYPES =============
export interface WorkoutRecommendation {
  warmup: Array<string | { name: string; sets?: number; reps_or_time?: string; rest?: number; notes?: string }>;
  exercises: Array<string | { name: string; sets?: number; reps_or_time?: string; rest?: number; notes?: string }>;
  cooldown: Array<string | { name: string; sets?: number; reps_or_time?: string; rest?: number; notes?: string }>;
  rationale: string;
  estimatedDuration: number;
  difficultyScore: number;
  focusAreas: string[];
  interval?: {
    rounds: number;
    workSec: number;
    restSec: number;
    transitionSec?: number;
    format?: 'circuit' | 'single';
  };
  cardio?: {
    type: string;
    duration: number;
    intensity: string;
    notes?: string;
    targetHeartRate?: string;
  };
}

const normalizeWorkoutRecommendation = (
  recommendation: WorkoutRecommendation,
  userContext: WorkoutRecommendationContext
): WorkoutRecommendation => {
  const style = (userContext.trainingStyle || '').toLowerCase();
  const recAny = recommendation as any;
  const recStyle = (recAny?._trainingStyle || '').toLowerCase();
  const isEndurance = style.includes('endurance') || recStyle.includes('endurance') || recAny?._isEndurance === true;
  const targetDuration =
    userContext.duration ??
    recommendation.cardio?.duration ??
    recommendation.estimatedDuration ??
    30;

  const safeWarmup = Array.isArray(recommendation.warmup) ? recommendation.warmup : [];
  const safeCooldown = Array.isArray(recommendation.cooldown) ? recommendation.cooldown : [];
  const safeExercises = Array.isArray(recommendation.exercises) ? recommendation.exercises : [];

  if (isEndurance) {
    const cardio = recommendation.cardio || {
      type: 'Run',
      duration: targetDuration,
      intensity: 'Zone 2',
      notes: 'Steady-state, nasal breathing if possible',
    };
    return {
      ...recommendation,
      warmup: safeWarmup,
      exercises: [],
      cooldown: safeCooldown,
      interval: undefined,
      cardio: {
        ...cardio,
        duration: cardio.duration ?? targetDuration,
      },
      estimatedDuration: cardio.duration ?? targetDuration,
    };
  }

  return {
    ...recommendation,
    warmup: safeWarmup,
    exercises: safeExercises,
    cooldown: safeCooldown,
    cardio: undefined,
  };
};

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
        circuit?: {
          rounds: number;
          workSec: number;
          restSec: number;
          exercises: string[];
        };
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
  provider: AIProvider = 'gemini',
  options?: {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  }
): Promise<AIResponse> {
  // Enforce rate limiting to prevent 429 errors
  await enforceRateLimit();
  
  console.log(`🤖 Sending message to ${provider}...`);
  return sendProviderMessage(provider, messages, AI_CONFIG, options);
}

// ============= SPECIALIZED AI FUNCTIONS =============

/**
 * Get AI-powered workout recommendations based on user data
 */
export async function getWorkoutRecommendation(
  userContext: WorkoutRecommendationContext
): Promise<WorkoutRecommendation> {
  const prompt = buildWorkoutRecommendationPrompt(userContext);

  const response = await sendAIMessage(
    [
      { 
        role: 'system', 
        content: 'You are a TSAC-F certified tactical strength coach with 10+ years designing firefighter fitness programs. You understand occupational demands, CPAT testing, injury prevention, and functional fitness for structural firefighting. Create varied, professional workouts with real-world application to fireground operations. Return ONLY valid JSON.' 
      },
      { role: 'user', content: prompt },
    ],
    'gemini',
    { temperature: 0.9, maxTokens: 4000 } // Higher temperature for more variety
  );

  try {
    return normalizeWorkoutRecommendation(
      parseCleanJsonResponse<WorkoutRecommendation>(response.content),
      userContext
    );
  } catch (error) {
    // Retry once with a strict repair prompt
    const repair = await sendAIMessage(
      [
        {
          role: 'system',
          content: 'Fix the following into strictly valid JSON. Output ONLY the JSON with no extra text.',
        },
        { role: 'user', content: response.content },
      ],
      'gemini',
      { temperature: 0.2, maxTokens: 2000 }
    );
    return normalizeWorkoutRecommendation(
      parseCleanJsonResponse<WorkoutRecommendation>(repair.content),
      userContext
    );
  }
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
    ? `\n\nCARDIO: Include 2-3 cardio sessions per week. Use cardioSchedule with frequency, type (Run/Bike/Row/HIIT), duration, intensity (Easy/Moderate/Hard/Intervals/Zone 2). If type is HIIT/circuit/intervals, include a "circuit" object with rounds, workSec, restSec, and a list of 4-6 exercises.` 
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
          {"dayOfWeek": "Wednesday", "type": "HIIT", "duration": 15, "intensity": "Intervals", "notes": "8 rounds: 30s work/90s rest", "circuit": {"rounds": 8, "workSec": 30, "restSec": 90, "exercises": ["Burpees", "Kettlebell Swings", "Mountain Climbers", "Jump Rope"]}},
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
    
    const program = parseCleanJsonResponse<PeriodizedProgram>(response.content);
    
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
export async function getWorkoutAdjustments(context: WorkoutAdjustmentsContext): Promise<{
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
  const prompt = buildWorkoutAdjustmentsPrompt(context);

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

  const parsed = parseCleanJsonResponse<{
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
  }>(response.content);
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
  const prompt = buildMealSuggestionsPrompt(nutritionContext);

  const response = await sendAIMessage(
    [
      { role: 'system', content: 'You are a professional nutrition AI specialized in firefighter meal planning.' },
      { role: 'user', content: prompt },
    ],
    'gemini',
    { maxTokens: 8000 }
  );

  const parsed = parseCleanJsonResponse<any[]>(response.content);
  
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
  },
  context?: string
): Promise<string> {
  try {
    console.log('💬 chatWithCoach called with:', { userMessage, historyLength: conversationHistory.length });
    
    const systemPrompt = `You are a professional fitness and nutrition coach specializing in firefighter wellness. 
Your name is "Coach AI" and you provide evidence-based, practical advice.
${userProfile?.name ? `You're talking to ${userProfile.name}.` : ''}
${userProfile?.goals ? `Their goals are: ${userProfile.goals.join(', ')}` : ''}
${userProfile?.experience ? `Experience level: ${userProfile.experience}` : ''}
${context ? `Current workout context:\n${context}\nUse this to answer workout-specific questions accurately.` : ''}

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

  return parseCleanJsonResponse(response.content);
}

/**
 * 🔥 NUTRITION ANALYSIS - Gemini-Powered with Vision Support
 * Analyzes text descriptions OR images to extract accurate macros
 */

// Exposed for unit tests only.
export const __testables = {
  parseNutritionResult,
};

/**
 * Analyze meal from text description using Gemini
 */
export async function analyzeMealFromText(
  description: string
): Promise<NutritionAnalysisResult> {
  console.log('🍽️ Analyzing meal from text:', description);

  const prompt = buildAnalyzeMealTextPrompt(description);

  const response = await sendAIMessage(
    [
      { role: 'system', content: 'You are a professional nutritionist with expertise in macro calculation. Return only valid JSON.' },
      { role: 'user', content: prompt },
    ],
    'gemini',
    { temperature: 0.3, maxTokens: 4000 }
  );

  const parsed = parseCleanJsonResponse(response.content) as unknown;
  const result = parseNutritionResult(parsed);
  result.source = 'gemini-text';

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

  const prompt = buildAnalyzeMealImagePrompt(additionalContext);

  try {
    const apiKey = AI_CONFIG.gemini.apiKey;
    // Try a small set of vision-capable models for compatibility across Gemini updates.
    const modelCandidates = [
      AI_CONFIG.gemini.model,
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
    ];

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
    let response: any = null;
    let lastErrorMessage = 'Unknown error';

    for (const model of modelCandidates) {
      try {
        response = await axios.post(
          `${AI_CONFIG.gemini.baseURL}/models/${model}:generateContent?key=${apiKey}`,
          requestBody,
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000,
          }
        );
        console.log(`✅ Gemini vision model used: ${model}`);
        break;
      } catch (modelError: unknown) {
        if (isAxiosLikeError(modelError)) {
          const status = modelError.response?.status;
          const apiMessage = (modelError.response?.data as any)?.error?.message || modelError.message || 'Request failed';
          lastErrorMessage = `Model ${model} failed (${status ?? 'no-status'}): ${apiMessage}`;

          // Retry on 404 model-not-found with the next candidate
          if (status === 404) {
            console.warn(`⚠️ Vision model unavailable: ${model}. Trying fallback...`);
            continue;
          }
        } else if (modelError instanceof Error) {
          lastErrorMessage = modelError.message;
        }
        throw modelError;
      }
    }

    if (!response) {
      throw new Error(`No compatible Gemini vision model available. ${lastErrorMessage}`);
    }

    const content = (response.data as any)?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = parseCleanJsonResponse(content) as unknown;
    const result = parseNutritionResult(parsed);
    result.source = 'gemini-vision';

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
  } catch (error: unknown) {
    if (isAxiosLikeError(error)) {
      const status = error.response?.status;
      const apiMessage = (error.response?.data as any)?.error?.message || error.message || 'Request failed';
      console.error(`❌ Image analysis failed (${status ?? 'no-status'}): ${apiMessage}`);
      throw new Error(`Failed to analyze meal image: ${apiMessage}`);
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Image analysis failed: ${message}`);
    throw new Error(`Failed to analyze meal image: ${message}`);
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
