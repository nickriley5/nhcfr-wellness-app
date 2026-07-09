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
  buildContextualMealSuggestionsPrompt,
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
  completedCardioSessions?: string[];
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

export type ContextualMealMode = 'pantry' | 'eat_out';

export interface ContextualMealSuggestion {
  name: string;
  source: string;
  prepMinutes: number;
  estimatedMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  macroFit: {
    withinTolerance: boolean;
    deltaCalories: number;
    deltaProtein: number;
    deltaCarbs: number;
    deltaFat: number;
  };
  ingredients: string[];
  instructions: string[];
  orderDetails: string[];
  optionalAddOns: string[];
  whyItFits: string;
  fallback: string;
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
 * Generate a complete 4-6 week training program.
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
  
  const generatedWeeks = Math.min(6, Math.max(4, Math.round(Number(programContext.totalWeeks) || 4)));
  onProgress?.(`Creating your ${generatedWeeks}-week program...`, 20);
  const MAX_ALLOWLIST_EXERCISES = 60;

  const normalizeLookupKey = (value: string): string =>
    value
      .toLowerCase()
      .trim()
      .replace(/[_-]+/g, ' ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const toNonEmptyString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
  
  // Build exercise list - use curated list for better AI selection
  let exerciseListText = '';
  const { resolveExercise, getCuratedExerciseList } = await import('../exerciseMatching');
  const curatedFallback = getCuratedExerciseList(programContext.equipment || []);
  const allowedExercises =
    programContext.availableExercises && programContext.availableExercises.length > 0
      ? programContext.availableExercises.map((ex) => ({
          id: toNonEmptyString(ex.id),
          name: toNonEmptyString(ex.name),
          equipment: toNonEmptyString(ex.equipment),
          focusArea: toNonEmptyString(ex.focusArea),
        }))
      : curatedFallback.map((ex) => ({
          id: toNonEmptyString(ex.id),
          name: toNonEmptyString(ex.name),
          equipment: toNonEmptyString(ex.equipment),
          focusArea: toNonEmptyString(ex.focusArea),
        }));
  const validAllowedExercises = allowedExercises
    .filter((ex) => ex.id && ex.name)
    .slice(0, MAX_ALLOWLIST_EXERCISES);
  const allowedById = new Map(validAllowedExercises.map((ex) => [ex.id, ex]));
  const allowedByNormalizedName = new Map(
    validAllowedExercises.map((ex) => [normalizeLookupKey(ex.name), ex])
  );
  if (allowedById.size === 0) {
    throw new Error('No exercises available for ID-constrained program generation.');
  }

  const buildLocalCardioSchedule = () => ({
    frequency: 3,
    weeks: Array.from({ length: generatedWeeks }, (_, idx) => ({
      weekNumber: idx + 1,
      sessions: [
        {
          dayOfWeek: 'Monday',
          type: 'Run',
          duration: 20 + idx * 2,
          intensity: 'Zone 2',
          notes: 'Steady aerobic base',
          targetHeartRate: 'Zone 2',
        },
        {
          dayOfWeek: 'Wednesday',
          type: 'HIIT',
          duration: 16 + idx,
          intensity: 'Intervals',
          notes: 'Short work capacity intervals',
          circuit: {
            rounds: 6 + Math.min(idx, 2),
            workSec: 30,
            restSec: 90,
            exercises: ['Burpees', 'Mountain Climbers', 'Jump Rope', 'Step-Ups'],
          },
        },
        {
          dayOfWeek: 'Friday',
          type: 'Row',
          duration: 22 + idx * 2,
          intensity: idx === generatedWeeks - 1 ? 'Easy' : 'Moderate',
          notes: idx === generatedWeeks - 1 ? 'Deload pace' : 'Sustainable effort',
        },
      ],
    })),
  });

  const buildFallbackProgram = (reason: string): PeriodizedProgram => {
    console.warn('⚠️ Using local fallback program:', reason);
    const phases =
      generatedWeeks <= 4
        ? [{ phaseName: 'Foundation', weekRange: `1-${generatedWeeks}`, focus: 'Build strength and work capacity', description: 'A reliable firefighter-focused training block.' }]
        : [
            { phaseName: 'Foundation', weekRange: '1-2', focus: 'Movement quality and base volume', description: 'Build technical consistency and aerobic support.' },
            { phaseName: 'Build', weekRange: `3-${generatedWeeks - 1}`, focus: 'Strength and work capacity progression', description: 'Progress load, volume, and firefighter-specific conditioning.' },
            { phaseName: 'Deload', weekRange: `${generatedWeeks}`, focus: 'Recover and consolidate', description: 'Reduce volume while keeping movement patterns sharp.' },
          ];

    const dayTemplates = [
      { dayName: 'Lower Body Power & Carry', focus: 'Squat, hinge, carry' },
      { dayName: 'Upper Body Strength', focus: 'Push, pull, press' },
      { dayName: 'Hybrid Work Capacity', focus: 'Full-body circuits' },
      { dayName: 'Posterior Chain & Core', focus: 'Hinge, pull, trunk' },
      { dayName: 'Operational Conditioning', focus: 'Carries, steps, power' },
      { dayName: 'Total Body Strength', focus: 'Balanced strength' },
    ];

    const pickExercise = (offset: number) => validAllowedExercises[offset % validAllowedExercises.length];
    const weeks = Array.from({ length: generatedWeeks }, (_, weekIdx) => {
      const isDeload = weekIdx === generatedWeeks - 1;
      return {
        weekNumber: weekIdx + 1,
        phase: isDeload ? 'Deload' : weekIdx < 2 ? 'Foundation' : 'Build',
        isDeload,
        volumeMultiplier: isDeload ? 0.65 : 1 + weekIdx * 0.05,
        days: Array.from({ length: programContext.daysPerWeek }, (_, dayIdx) => {
          const template = dayTemplates[dayIdx % dayTemplates.length];
          const baseOffset = weekIdx * programContext.daysPerWeek * 5 + dayIdx * 5;
          return {
            dayNumber: dayIdx + 1,
            dayName: template.dayName,
            focus: template.focus,
            warmup: ['Seated Forward Fold', 'Walking High Knees'],
            exercises: Array.from({ length: 5 }, (_, exIdx) => {
              const exercise = pickExercise(baseOffset + exIdx);
              return {
                id: exercise.id,
                name: exercise.name,
                sets: isDeload ? 2 : exIdx < 2 ? 4 : 3,
                reps: isDeload ? '8 easy' : goalLower.includes('strength') && exIdx < 2 ? '4-6' : '8-12',
                restSeconds: exIdx < 2 ? 120 : 75,
                rpe: isDeload ? 5 : exIdx < 2 ? 8 : 7,
                notes: exIdx === 0 ? 'Main lift' : 'Quality reps',
              };
            }),
            cooldown: ['Diaphragmatic Breathing', 'Cooldown Walk'],
            estimatedDuration: isDeload ? 35 : 50,
          };
        }),
      };
    });

    return {
      programName: `Firefighter ${programContext.goal} Program`,
      totalWeeks: generatedWeeks,
      periodizationModel: periodization,
      phases,
      weeks,
      progressionPlan: `Complete this ${generatedWeeks}-week block. Add load when all sets hit the top of the rep range with clean form.`,
      deloadStrategy: 'Final week: reduce volume, keep movement quality high, and recover for the next training cycle.',
      cardioSchedule: programContext.includeCardio ? buildLocalCardioSchedule() : undefined,
    };
  };

  const sendProgramAIMessage = (
    messages: AIMessage[],
    options: { temperature?: number; maxTokens?: number }
  ): Promise<AIResponse> => {
    const timeoutMs = 45000;
    return Promise.race([
      sendAIMessage(messages, 'gemini', options),
      new Promise<AIResponse>((_, reject) => {
        setTimeout(() => reject(new Error(`Program generation timed out after ${timeoutMs / 1000}s.`)), timeoutMs);
      }),
    ]);
  };

  if (programContext.availableExercises && programContext.availableExercises.length > 0) {
    // Keep payload compact on mobile: id + canonical name only.
    const exerciseEntries = validAllowedExercises
      .map((ex) => `${ex.id} | ${ex.name}`)
      .join('\n- ');
    exerciseListText = `\n\n⚠️ AVAILABLE EXERCISES (HARD CONSTRAINT):\n- ${exerciseEntries}`;
    console.log(
      `📋 Providing ${validAllowedExercises.length}/${programContext.availableExercises.length} exercises to AI (payload-capped)`
    );
  } else {
    const exerciseEntries = validAllowedExercises
      .map((ex) => `${ex.id} | ${ex.name}`)
      .join('\n- ');
    exerciseListText = `\n\n⚠️ AVAILABLE EXERCISES (HARD CONSTRAINT):\n- ${exerciseEntries}`;
    console.log(`📋 Using curated fallback allowlist (${validAllowedExercises.length} exercises)`);
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
- At least 1 carrying exercise (Farmer Carry, Reverse Sled Pulls)
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

  const periodizationGuidance =
    periodization === 'undulating'
      ? `📊 Periodization (Undulating Model):
   - Week 1: Heavy/Moderate/Light rotation across days
   - Week 2: Change emphasis (volume up, intensity wave)
   - Week 3: Highest performance week with planned variation
   - Week 4: DELOAD with 60-70% volume and reduced intensity`
      : periodization === 'block'
      ? `📊 Periodization (Block Model):
   - Week 1: Accumulation (higher volume, technical quality)
   - Week 2: Intensification (moderate volume, higher load)
   - Week 3: Realization (peak specificity and intensity)
   - Week 4: DELOAD and recovery consolidation`
      : `📊 Periodization (Linear Model):
   - Week 1: Base building (moderate volume, RPE 6-7)
   - Week 2: Volume increase (+5-10% volume, RPE 7-8)
   - Week 3: Peak intensity (maintain volume, RPE 8-9)
   - Week 4: DELOAD (60-70% volume, RPE 5-6, recovery focus)`;

  // Cardio is attached locally after strength generation so program creation is faster and more reliable.
  const cardioPrompt = programContext.includeCardio
    ? '\n\nCARDIO: Do not include cardioSchedule in the JSON. The app will add cardio sessions separately.'
    : '';

  console.log('🏃 Cardio in aiService:', programContext.includeCardio);
  console.log('🏃 Cardio prompt:', cardioPrompt || '(none)');

  const prompt = `Generate a complete ${generatedWeeks}-week FIREFIGHTER occupational fitness program.

FIREFIGHTER PROFILE:
Experience: ${programContext.experience}
Primary Goal: ${programContext.goal}
Available Equipment: ${programContext.equipment.join(', ')}
Training Days: ${programContext.daysPerWeek} strength sessions per week
${programContext.includeCardio ? 'PLUS app-generated dedicated cardio/conditioning sessions' : ''}
${programContext.allowTwoADays ? 'Two-a-days are allowed for advanced users when useful.' : 'Do NOT schedule two-a-days.'}

${firefighterContext}
${exerciseListText}
${cardioPrompt}

PROGRAM DESIGN RULES:
✅ Generate EXACTLY ${generatedWeeks} weeks (weeks 1-${generatedWeeks})
✅ Each week has EXACTLY ${programContext.daysPerWeek} strength training days
✅ Each day has 4-6 main exercises
✅ CRITICAL: Use ONLY exercises from "AVAILABLE EXERCISES" list above
✅ CRITICAL: Every exercise object MUST include both "id" and "name"
✅ CRITICAL: "id" MUST exactly match one ID from the list above
✅ CRITICAL: "name" MUST exactly match that ID's canonical name
✅ NEVER invent IDs or names and NEVER leave id blank
✅ Include 1-2 warmup exercises per day (mobility/activation)
✅ Include 1-2 cooldown exercises per day (stretching/recovery)
✅ Keep notes to 1-3 words maximum per exercise
✅ Do NOT include cardioSchedule; return strength program JSON only

FIREFIGHTER-SPECIFIC REQUIREMENTS:
🚒 Every week MUST include:
   - 2-3 carrying exercises (Farmer Carry, Reverse Sled Pulls, Bear Crawl)
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

${periodizationGuidance}

RETURN FORMAT - Valid JSON Only:
{
  "programName": "Firefighter [Goal] Program",
  "totalWeeks": ${generatedWeeks},
  "periodizationModel": "${periodization}",
  "phases": [
    {
      "phaseName": "Foundation",
      "weekRange": "1-${generatedWeeks}",
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
              "id": "EXERCISE_ID_FROM_LIST",
              "name": "Barbell Back Squat",
              "sets": 4,
              "reps": "6-8",
              "restSeconds": 120,
              "rpe": 7,
              "notes": "Controlled tempo"
            },
            {
              "id": "EXERCISE_ID_FROM_LIST",
              "name": "Romanian Deadlift",
              "sets": 3,
              "reps": "8-10",
              "restSeconds": 90,
              "rpe": 7,
              "notes": "Hip hinge"
            },
            {
              "id": "EXERCISE_ID_FROM_LIST",
              "name": "Farmer Carry",
              "sets": 4,
              "reps": "40 yards",
              "restSeconds": 90,
              "rpe": 8,
              "notes": "Heavy"
            },
            {
              "id": "EXERCISE_ID_FROM_LIST",
              "name": "Step-Ups",
              "sets": 3,
              "reps": "10 each leg",
              "restSeconds": 60,
              "rpe": 7,
              "notes": "Knee drive"
            },
            {
              "id": "EXERCISE_ID_FROM_LIST",
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
  "progressionPlan": "Increase load 2-5% weekly. Add 1 rep when hitting top of rep range. Progress carries by distance or load.",
  "deloadStrategy": "Final week: Reduce volume 35%, maintain movement patterns, focus on quality and recovery for adaptation."
}

🚒 Generate complete program with ALL ${programContext.daysPerWeek} days for ALL ${generatedWeeks} weeks.
${generatedWeeks > 4 ? `🚒 Continue the "weeks" array through week ${generatedWeeks}; do not stop at week 4.` : ''}
🏃 Do not include cardioSchedule in the JSON.
🔥 Prioritize firefighter job-specific movements. This is for occupational readiness, not bodybuilding.`;

  try {
    onProgress?.('Generating workouts...', 50);
    
    const response = await sendProgramAIMessage(
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
      { temperature: 0.45, maxTokens: 16384 }
    );

    onProgress?.('Finalizing...', 90);
    
    console.log('📦 Response length:', response.content.length);
    console.log('📦 First 200:', response.content.substring(0, 200));
    console.log('📦 Last 200:', response.content.substring(response.content.length - 200));

    const canonicalizeProgramExerciseRefs = (
      candidate: PeriodizedProgram,
      allowRepair: boolean
    ): { unresolved: string[]; repaired: number; encounteredInvalid: number } => {
      const unresolved: string[] = [];
      let repaired = 0;
      let encounteredInvalid = 0;

      candidate.weeks?.forEach((week) => {
        week.days?.forEach((day) => {
          day.exercises?.forEach((exercise, idx) => {
            const rawId = toNonEmptyString(exercise.id);
            const rawName = toNonEmptyString(exercise.name);
            const validById = rawId ? allowedById.get(rawId) : undefined;

            if (validById) {
              exercise.id = validById.id;
              exercise.name = validById.name;
              return;
            }

            encounteredInvalid += 1;
            if (!allowRepair) {
              unresolved.push(
                `Week ${week.weekNumber} Day ${day.dayNumber} Ex ${idx + 1}: id="${rawId || '(missing)'}" name="${rawName || '(missing)'}"`
              );
              return;
            }

            const byName = rawName ? allowedByNormalizedName.get(normalizeLookupKey(rawName)) : undefined;
            const resolvedByName = rawName ? resolveExercise(rawName) : null;
            const resolvedById = rawId ? resolveExercise(rawId) : null;
            const mapped =
              byName ||
              (resolvedByName ? allowedById.get(resolvedByName.id) : undefined) ||
              (resolvedById ? allowedById.get(resolvedById.id) : undefined);

            if (mapped) {
              exercise.id = mapped.id;
              exercise.name = mapped.name;
              repaired += 1;
            } else {
              unresolved.push(
                `Week ${week.weekNumber} Day ${day.dayNumber} Ex ${idx + 1}: id="${rawId || '(missing)'}" name="${rawName || '(missing)'}"`
              );
            }
          });
        });
      });

      return { unresolved, repaired, encounteredInvalid };
    };
    
    const validateProgram = (candidate: PeriodizedProgram): string[] => {
      const issues: string[] = [];
      if (!Array.isArray(candidate.weeks) || candidate.weeks.length !== generatedWeeks) {
        issues.push(`Program must include exactly weeks 1-${generatedWeeks}.`);
      }
      candidate.weeks?.forEach((week) => {
        if (!Array.isArray(week.days) || week.days.length !== programContext.daysPerWeek) {
          issues.push(`Week ${week.weekNumber} must have exactly ${programContext.daysPerWeek} days.`);
        }
        week.days?.forEach((day) => {
          const exerciseCount = Array.isArray(day.exercises) ? day.exercises.length : 0;
          if (exerciseCount < 4 || exerciseCount > 6) {
            issues.push(`Week ${week.weekNumber} day ${day.dayNumber} must have 4-6 exercises.`);
          }
          day.exercises?.forEach((exercise, idx) => {
            if (!toNonEmptyString(exercise.id)) {
              issues.push(`Week ${week.weekNumber} day ${day.dayNumber} exercise ${idx + 1} is missing id.`);
            }
          });
        });
      });
      return issues;
    };

    const normalizeProgramMetadata = (candidate: PeriodizedProgram): PeriodizedProgram => {
      candidate.totalWeeks = generatedWeeks;
      candidate.periodizationModel = periodization;
      candidate.progressionPlan = candidate.progressionPlan || `Complete this ${generatedWeeks}-week block, then reassess and generate the next training cycle.`;
      candidate.cardioSchedule = programContext.includeCardio ? buildLocalCardioSchedule() : undefined;
      return candidate;
    };

    const parseProgramJsonWithRepair = async (rawContent: string): Promise<PeriodizedProgram> => {
      if (!rawContent.trim().endsWith('}')) {
        throw new Error('Program JSON response was incomplete.');
      }

      try {
        return parseCleanJsonResponse<PeriodizedProgram>(rawContent);
      } catch (parseErr) {
        console.warn('⚠️ Initial program JSON parse failed. Attempting JSON repair pass...');
        const parseRepairResponse = await sendProgramAIMessage(
          [
            {
              role: 'system',
              content: 'You repair malformed JSON. Output ONLY valid JSON. Preserve existing fields and values whenever possible.',
            },
            {
              role: 'user',
              content:
                `Fix this malformed program JSON so it is fully valid/parseable JSON.\n` +
                `Requirements:\n` +
                `- Keep it as a complete object\n` +
                `- Ensure all arrays/objects are properly closed\n` +
                `- Do not add commentary or markdown\n\n` +
                `Malformed JSON:\n${rawContent}`,
            },
          ],
          { temperature: 0.1, maxTokens: 16384 }
        );

        try {
          return parseCleanJsonResponse<PeriodizedProgram>(parseRepairResponse.content);
        } catch (repairParseErr) {
          const msg = repairParseErr instanceof Error ? repairParseErr.message : 'Unknown parse error';
          const preview = parseRepairResponse.content.substring(0, 300);
          throw new Error(`Program JSON parse failed after repair: ${msg}. Preview: ${preview}`);
        }
      }
    };

    let program = normalizeProgramMetadata(await parseProgramJsonWithRepair(response.content));
    let usedExerciseAutoRepair = false;
    const initialCanonicalization = canonicalizeProgramExerciseRefs(program, true);
    if (initialCanonicalization.encounteredInvalid > 0) {
      usedExerciseAutoRepair = true;
      console.warn(
        `⚠️ Auto-repaired ${initialCanonicalization.repaired}/${initialCanonicalization.encounteredInvalid} invalid exercise references.`
      );
    }
    if (initialCanonicalization.unresolved.length > 0) {
      throw new Error(
        `Invalid exercise references after auto-repair: ${initialCanonicalization.unresolved.slice(0, 10).join(' | ')}`
      );
    }

    let qualityIssues = validateProgram(program);
    if (qualityIssues.length > 0) {
      console.warn('⚠️ Program quality validation failed. Attempting one strict repair pass...', qualityIssues);
      const repairResponse = await sendProgramAIMessage(
        [
          {
            role: 'system',
            content: 'You are a strict JSON repair assistant. Output valid JSON only.',
          },
          {
            role: 'user',
            content: `Fix this program JSON to satisfy constraints with minimal edits.\nConstraints:\n- Exactly ${generatedWeeks} weeks (1-${generatedWeeks})\n- Exactly ${programContext.daysPerWeek} strength days per week\n- 4-6 exercises per day\n- Every exercise must include id and name\n- Every exercise id must be from the provided allowlist in the original prompt\n- Do not include cardioSchedule\n\nCurrent issues:\n${qualityIssues.join('\n')}\n\nJSON:\n${response.content}`,
          },
        ],
        { temperature: 0.2, maxTokens: 16384 }
      );

      program = normalizeProgramMetadata(await parseProgramJsonWithRepair(repairResponse.content));
      const postRepairCanonicalization = canonicalizeProgramExerciseRefs(program, !usedExerciseAutoRepair);
      if (postRepairCanonicalization.encounteredInvalid > 0 && !usedExerciseAutoRepair) {
        usedExerciseAutoRepair = true;
        console.warn(
          `⚠️ Auto-repaired ${postRepairCanonicalization.repaired}/${postRepairCanonicalization.encounteredInvalid} invalid exercise references.`
        );
      }
      if (postRepairCanonicalization.unresolved.length > 0) {
        throw new Error(
          `Invalid exercise references after repair: ${postRepairCanonicalization.unresolved.slice(0, 10).join(' | ')}`
        );
      }
      qualityIssues = validateProgram(program);
      if (qualityIssues.length > 0) {
        throw new Error(`Program quality validation failed: ${qualityIssues.join(' ')}`);
      }
    }

    console.log('🏃 Generated program has cardio:', !!program.cardioSchedule);
    if (program.cardioSchedule) {
      console.log('🏃 Cardio frequency:', program.cardioSchedule.frequency);
      console.log('🏃 Cardio weeks:', program.cardioSchedule.weeks.length);
    }
    
    // Final strict validation gate: no unknown exercise IDs are allowed.
    const finalCanonicalization = canonicalizeProgramExerciseRefs(program, false);
    if (finalCanonicalization.unresolved.length > 0) {
      throw new Error(
        `Program contains unknown exercise references: ${finalCanonicalization.unresolved.slice(0, 10).join(' | ')}`
      );
    }
    
    onProgress?.('Complete!', 100);
    return program;
    
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    onProgress?.('Using reliable fallback...', 95);
    const fallback = buildFallbackProgram(message);
    onProgress?.('Complete!', 100);
    return fallback;
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
 * Get contextual meal suggestions for pantry cooking or eating out.
 */
export async function getContextualMealSuggestions(nutritionContext: {
  mode: ContextualMealMode;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  dietaryPreference?: string;
  restrictions?: string[];
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  prepTimeLimit?: number;
  pantryIngredients?: string[];
  equipment?: string[];
  restaurants?: string[];
  locationHint?: string;
  macroStrictness?: 'strict' | 'balanced';
}): Promise<ContextualMealSuggestion[]> {
  const prompt = buildContextualMealSuggestionsPrompt(nutritionContext);
  const normalizedRestaurants = (nutritionContext.restaurants || [])
    .map((restaurant) =>
      restaurant
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter(Boolean);

  const hasRestaurantMatch = (option: ContextualMealSuggestion): boolean => {
    if (nutritionContext.mode !== 'eat_out' || normalizedRestaurants.length === 0) {
      return true;
    }

    const searchable = [
      option.name,
      option.source,
      option.orderDetails.join(' '),
      option.fallback,
      option.whyItFits,
    ]
      .join(' ')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return normalizedRestaurants.some((restaurant) => searchable.includes(restaurant));
  };

  const isLikelyOrderableAtRestaurant = (option: ContextualMealSuggestion): boolean => {
    if (nutritionContext.mode !== 'eat_out') {
      return true;
    }
    const source = (option.source || '').toLowerCase();
    const details = option.orderDetails.join(' ').toLowerCase();
    const merged = `${option.name} ${source} ${details}`;

    const isDominos = source.includes('domino') || merged.includes('domino');
    if (!isDominos) {
      return true;
    }

    const forbiddenForDominos = ['burrito', 'bowl', 'taco', 'chipotle', 'quesadilla', 'poke'];
    if (forbiddenForDominos.some((token) => merged.includes(token))) {
      return false;
    }

    const expectedDominosSignals = ['pizza', 'wings', 'pasta', 'sandwich', 'bread', 'crust', 'topping', 'slice'];
    return expectedDominosSignals.some((token) => merged.includes(token));
  };

  const isOptionDetailedEnough = (option: ContextualMealSuggestion): boolean => {
    const hasWhy = option.whyItFits.trim().length >= 60;
    const hasFallback = option.fallback.trim().length >= 35;
    const hasMacros =
      option.estimatedMacros.calories > 0 &&
      option.estimatedMacros.protein >= 0 &&
      option.estimatedMacros.carbs >= 0 &&
      option.estimatedMacros.fat >= 0;

    if (!hasWhy || !hasFallback || !hasMacros) {
      return false;
    }

    if (nutritionContext.mode === 'eat_out') {
      return option.orderDetails.length >= 3 && option.source.trim().length >= 2;
    }
    return option.instructions.length >= 3 && option.ingredients.length >= 2;
  };

  const response = await sendAIMessage(
    [
      {
        role: 'system',
        content:
          'You are a tactical nutrition planner. Provide realistic, executable meal options and return only strict JSON.',
      },
      { role: 'user', content: prompt },
    ],
    'gemini',
    { temperature: 0.2, maxTokens: 3800 }
  );

  const parseSuggestions = (content: string): ContextualMealSuggestion[] => {
    const parsed = parseCleanJsonResponse<any>(content);
    const options = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.options)
      ? parsed.options
      : Array.isArray(parsed?.meals)
      ? parsed.meals
      : [];

    return options.slice(0, 3).map((option: any) => {
      const estimatedMacros = {
        calories: Number(option?.estimatedMacros?.calories) || 0,
        protein: Number(option?.estimatedMacros?.protein) || 0,
        carbs: Number(option?.estimatedMacros?.carbs) || 0,
        fat: Number(option?.estimatedMacros?.fat) || 0,
      };
      const macroFit = {
        withinTolerance: Boolean(option?.macroFit?.withinTolerance),
        deltaCalories: Number(option?.macroFit?.deltaCalories) || 0,
        deltaProtein: Number(option?.macroFit?.deltaProtein) || 0,
        deltaCarbs: Number(option?.macroFit?.deltaCarbs) || 0,
        deltaFat: Number(option?.macroFit?.deltaFat) || 0,
      };

      return {
        name: String(option?.name || 'Meal Option'),
        source: String(option?.source || (nutritionContext.mode === 'eat_out' ? 'Restaurant' : 'Kitchen')),
        prepMinutes: Number(option?.prepMinutes) || nutritionContext.prepTimeLimit || 20,
        estimatedMacros,
        macroFit,
        ingredients: Array.isArray(option?.ingredients) ? option.ingredients.map(String) : [],
        instructions: Array.isArray(option?.instructions) ? option.instructions.map(String) : [],
        orderDetails: Array.isArray(option?.orderDetails) ? option.orderDetails.map(String) : [],
        optionalAddOns: Array.isArray(option?.optionalAddOns) ? option.optionalAddOns.map(String) : [],
        whyItFits: String(option?.whyItFits || ''),
        fallback: String(option?.fallback || ''),
      };
    });
  };

  const validateOptions = (options: ContextualMealSuggestion[]): ContextualMealSuggestion[] => {
    if (!options.length) {
      throw new Error('No meal options returned');
    }

    const filtered = options.filter((option) => hasRestaurantMatch(option) && isLikelyOrderableAtRestaurant(option));
    if (nutritionContext.mode === 'eat_out' && normalizedRestaurants.length > 0 && filtered.length === 0) {
      throw new Error('No options matched the requested restaurants');
    }
    return filtered;
  };

  const enrichIncompleteOptions = async (
    options: ContextualMealSuggestion[]
  ): Promise<ContextualMealSuggestion[]> => {
    const needsEnrichment = options.some((option) => !isOptionDetailedEnough(option));
    if (!needsEnrichment) {
      return options;
    }

    const enrichPrompt = `You are an elite tactical nutrition coach.
Upgrade the provided contextual meal options so they are complete and actionable.

CONTEXT:
- Mode: ${nutritionContext.mode}
- Meal type: ${nutritionContext.mealType}
- Target macros: calories ${nutritionContext.targetCalories}, protein ${nutritionContext.targetProtein}g, carbs ${nutritionContext.targetCarbs}g, fat ${nutritionContext.targetFat}g
${nutritionContext.mode === 'eat_out' ? `- Allowed restaurants only: ${(nutritionContext.restaurants || []).join(', ')}` : ''}

INPUT OPTIONS JSON:
${JSON.stringify(options)}

Return ONLY valid JSON:
{
  "options": [ ...same option objects, with richer details... ]
}

Requirements:
- Keep existing option names and macro estimates unless clearly invalid.
- Fill in missing or weak fields with specific practical guidance.
- whyItFits: minimum 2 sentences, specific to macro target and context.
- fallback: actionable backup.
- eat_out: at least 3 concrete orderDetails steps.
- pantry: at least 3 instruction steps.
- Do not add restaurants outside the allowed list (eat_out).`;

    const enriched = await sendAIMessage(
      [
        {
          role: 'system',
          content: 'Return strict JSON only. Improve option quality without changing intent.',
        },
        { role: 'user', content: enrichPrompt },
      ],
      'gemini',
      { temperature: 0.15, maxTokens: 4200 }
    );

    const enrichedOptions = validateOptions(parseSuggestions(enriched.content));
    return enrichedOptions;
  };

  try {
    const options = validateOptions(parseSuggestions(response.content));
    const enriched = await enrichIncompleteOptions(options);
    return enriched;
  } catch (parseError) {
    console.warn('Contextual meal parsing failed, attempting strict JSON repair...', parseError);
    const repaired = await sendAIMessage(
      [
        {
          role: 'system',
          content:
            'Repair the following response into strictly valid JSON with shape { "mode": string, "options": [] }. Return only JSON.',
        },
        { role: 'user', content: response.content },
      ],
      'gemini',
      { temperature: 0.05, maxTokens: 3800 }
    );

    try {
      const repairedOptions = validateOptions(parseSuggestions(repaired.content));
      const enrichedRepairedOptions = await enrichIncompleteOptions(repairedOptions);
      return enrichedRepairedOptions;
    } catch (repairError) {
      if (nutritionContext.mode !== 'eat_out' || normalizedRestaurants.length === 0) {
        throw new Error('Failed to parse contextual meal suggestions');
      }

      // Last attempt: regenerate with explicit hard constraint reminder.
      const strictRetry = await sendAIMessage(
        [
          {
            role: 'system',
            content:
              'Return only strict JSON. Include complete, actionable details for each option.',
          },
          {
            role: 'user',
            content:
              `${prompt}\n\nCRITICAL REQUIREMENTS:\n` +
              `- Use ONLY these restaurants: ${normalizedRestaurants.join(', ')}\n` +
              '- Each option must include: whyItFits, fallback, and at least 2 orderDetails\n' +
              '- Do not leave any required fields empty.',
          },
        ],
        'gemini',
        { temperature: 0.1, maxTokens: 3800 }
      );

      try {
        const strictOptions = validateOptions(parseSuggestions(strictRetry.content));
        if (!strictOptions.length) {
          throw new Error('No valid restaurant-matched options generated');
        }
        const enrichedStrictOptions = await enrichIncompleteOptions(strictOptions);
        return enrichedStrictOptions;
      } catch (strictParseError) {
        console.warn('Strict retry parse failed, attempting final JSON repair...', strictParseError);

        const strictRetryRepair = await sendAIMessage(
          [
            {
              role: 'system',
              content:
                'Repair the following content into valid JSON with shape { "mode": string, "options": [] }. Return only JSON.',
            },
            { role: 'user', content: strictRetry.content },
          ],
          'gemini',
          { temperature: 0.05, maxTokens: 3800 }
        );

        try {
          const repairedStrictOptions = validateOptions(parseSuggestions(strictRetryRepair.content));
          const enrichedRepairedStrictOptions = await enrichIncompleteOptions(repairedStrictOptions);
          return enrichedRepairedStrictOptions;
        } catch (finalParseError) {
          console.error('Contextual meal final parse failure after all retries:', finalParseError);
          throw new Error('AI response was incomplete. Please try again.');
        }
      }
    }
  }
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

  let result: NutritionAnalysisResult;
  try {
    const parsed = parseCleanJsonResponse(response.content) as unknown;
    result = parseNutritionResult(parsed);
  } catch (parseError) {
    console.warn('⚠️ Meal text JSON parse failed, attempting strict repair...', parseError);
    const repair = await sendAIMessage(
      [
        {
          role: 'system',
          content: 'Repair the response into strictly valid JSON that matches the requested nutrition schema. Return only JSON.',
        },
        {
          role: 'user',
          content: response.content,
        },
      ],
      'gemini',
      { temperature: 0.1, maxTokens: 4000 }
    );
    const repairedParsed = parseCleanJsonResponse(repair.content) as unknown;
    result = parseNutritionResult(repairedParsed);
  }
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
  getContextualMealSuggestions,
};
