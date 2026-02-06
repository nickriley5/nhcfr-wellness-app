export interface WorkoutRecommendationContext {
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
}

export function buildWorkoutRecommendationPrompt(userContext: WorkoutRecommendationContext): string {
  let exerciseListText = '';
  if (userContext.availableExercises && userContext.availableExercises.length > 0) {
    const exerciseNames = userContext.availableExercises.map(ex => ex.name).join('\n');
    exerciseListText = `\n\nAVAILABLE EXERCISES:\n${exerciseNames}`;
  }

  const targetDuration = userContext.duration || 45;
  const focusArea = userContext.focus || 'Full Body';
  const style = userContext.trainingStyle || 'Strength';
  const intensityLevel = userContext.intensity || 5;

  const intensityMap: Record<number, string> = {
    1: 'Very Light', 2: 'Light', 3: 'Light', 4: 'Moderate', 5: 'Moderate',
    6: 'Moderate', 7: 'Hard', 8: 'Hard', 9: 'Very Hard', 10: 'Maximum',
  };
  const intensityDesc = intensityMap[intensityLevel] || 'Moderate';

  return `You are designing a single workout for a FIREFIGHTER.

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
   - If ${style} = "HIIT": 30-60 sec work, 10-30 sec rest, 6-10 rounds (include interval object below)
   - If ${style} = "Conditioning": Timed work, moderate rest, higher density
   - If ${style} = "Endurance": Steady-state effort (Zone 2-3). Return cardio object below, set exercises to an empty array, and do NOT include AMRAP/circuits.
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
  "warmup": [{"name": "Exercise Name 1", "sets": 2, "reps_or_time": "10 reps", "rest": 30, "notes": "mobility"}, {"name": "Exercise Name 2", "sets": 2, "reps_or_time": "30 sec", "rest": 30}],
  "exercises": [{"name": "Exercise Name 1", "sets": 4, "reps_or_time": "8-10", "rest": 90, "notes": "controlled"}, {"name": "Exercise Name 2", "sets": 3, "reps_or_time": "10-12", "rest": 60}],
  "cooldown": [{"name": "Exercise Name 1", "sets": 1, "reps_or_time": "45 sec", "rest": 0}, {"name": "Exercise Name 2", "sets": 1, "reps_or_time": "45 sec", "rest": 0}],
  "rationale": "Brief 1-2 sentence explanation of how this workout supports firefighter ${focusArea} performance and ${userContext.goal}",
  "estimatedDuration": ${targetDuration},
  "difficultyScore": ${intensityLevel},
  "focusAreas": ["${focusArea}"],
  "interval": ${style === 'HIIT' ? '{ "rounds": 8, "workSec": 40, "restSec": 20, "transitionSec": 10, "format": "circuit" }' : 'null'},
  "cardio": ${style === 'Endurance' ? '{ "type": "Run", "duration": ' + targetDuration + ', "intensity": "Zone 2", "notes": "Steady-state, nasal breathing if possible" }' : 'null'}
}`;
}

export interface WorkoutAdjustmentsContext {
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
}

export function buildWorkoutAdjustmentsPrompt(context: WorkoutAdjustmentsContext): string {
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

  return `You are an elite strength coach analyzing a firefighter's training session to make intelligent adjustments.

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
}
