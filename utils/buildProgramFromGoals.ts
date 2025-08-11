import { Timestamp } from 'firebase/firestore';
import { Exercise } from '../types/Exercise';
import {
  selectExercisesDeterministic,
  UserContext,
  SlotRule,
  ExerciseLite,
} from '../utils/selectExercises';
import { inferEquipmentFromCategory } from './backfillExerciseFields';




export interface PerformanceGoals {
  focus: string[];
  daysPerWeek: number;
  includeFireground: boolean;
  durationWeeks: number;
  goalType: 'Build Muscle' | 'Lose Fat' | 'Maintain';
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  equipment: string[];
}

export interface ProgramDay {
  title: string;
  date: Timestamp;
  exercises: Exercise[];
}

const TrackTemplates: Record<string, Record<string, string[]>> = {
  'Build Muscle': {
    Beginner: ['Full Body', 'Push', 'Pull', 'Legs', 'Core + Mobility'],
    Intermediate: ['Push', 'Pull', 'Legs', 'Core', 'Mobility'],
    Advanced: ['Upper', 'Lower', 'Push', 'Pull', 'Legs', 'Fireground', 'Recovery'],
  },
  'Lose Fat': {
    Beginner: ['Full Body Circuit', 'Cardio + Core', 'Mobility'],
    Intermediate: ['Conditioning', 'Strength Circuit', 'Fireground', 'Core + Mobility'],
    Advanced: ['Conditioning', 'Fireground', 'Core + Mobility', 'Strength Circuit', 'MetCon'],
  },
  Maintain: {
    Beginner: ['Full Body', 'Core + Mobility', 'Mobility'],
    Intermediate: ['Strength', 'Mobility', 'Core', 'Fireground'],
    Advanced: ['Push + Core', 'Pull + Mobility', 'Fireground', 'Legs', 'Conditioning'],
  },
};

export function buildProgramFromGoals(
  goals: PerformanceGoals,
  fullLibrary: Exercise[],
  startDate = new Date()
): ProgramDay[] {
  const {
    durationWeeks,
    daysPerWeek,
    goalType,
    experienceLevel,
    equipment,
    includeFireground,
  } = goals;

  const totalDays = durationWeeks * daysPerWeek;
  let trackSplit = [
    ...(TrackTemplates[goalType]?.[experienceLevel] || ['Full Body']),
  ];

  // 1) Inject Fireground
  if (includeFireground && !trackSplit.includes('Fireground')) {
    trackSplit.splice(1, 0, 'Fireground');
  }

  // 2) Trim to exactly daysPerWeek
  if (trackSplit.length > daysPerWeek) {
    trackSplit = trackSplit.slice(0, daysPerWeek);
  }

  const program: ProgramDay[] = [];
  let currentDate = new Date(startDate);

  // ✅ NEW: keep a small history to avoid repeats across days
  let recentExerciseIds: string[] = [];

  for (let i = 0; i < totalDays; i++) {
    const weekNumber = Math.floor(i / daysPerWeek) + 1;
    let dayTitle = trackSplit[i % daysPerWeek];

    // 3) Last day of each block → Mobility & Recovery
    if (daysPerWeek <= 4 && i % daysPerWeek === daysPerWeek - 1) {
      dayTitle = 'Mobility & Recovery';
    }

    const tags = getTagsFromTitle(dayTitle);

    // ✅ Deterministic selection (no shuffle)
    const pickResult = getSmartExercises(
      tags,
      fullLibrary,
      equipment,
      goalType,
      experienceLevel,
      dayTitle,
      recentExerciseIds
    );

    const progressedExercises = pickResult.exercises.map((ex) =>
      applyProgression(
        {
          ...ex,
          sets: ex.sets ?? 3,
          reps: ex.reps ?? 10,
        },
        goalType,
        experienceLevel,
        weekNumber
      )
    );

    // update history (cap to last ~30 for variety)
    recentExerciseIds.push(...pickResult.pickedIds);
    if (recentExerciseIds.length > 30) {
      recentExerciseIds = recentExerciseIds.slice(-30);
    }

    const formattedTitle = `Week ${weekNumber}: ${getWorkoutTitle(
      dayTitle,
      goalType
    )}`;

    program.push({
      title: formattedTitle,
      date: Timestamp.fromDate(new Date(currentDate)),
      exercises: progressedExercises,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return program;
}

/* -------------------------
   TAG MAPPING / TITLES
--------------------------*/
function getTagsFromTitle(title: string): string[] {
  const map: Record<string, string[]> = {
    Push: ['push', 'press', 'chest', 'triceps', 'upper'],
    Pull: ['pull', 'back', 'biceps', 'row', 'deadlift', 'chin', 'pull-up', 'upper'],
    Legs: ['legs', 'quads', 'glutes', 'hinge', 'squat', 'lower'],
    Core: ['core', 'ab'],
    Mobility: ['mobility', 'stretch'],
    Fireground: ['full'], // special-cased below
    'Mobility & Recovery': ['mobility', 'stretch'],
    'Full Body': ['full'],
    'Full Body Circuit': ['full', 'conditioning'],
    Conditioning: ['conditioning', 'cardio'],
    Recovery: ['mobility', 'stretch'],
    'Core + Mobility': ['core', 'mobility'],
    'Strength Circuit': ['strength', 'full'],
    'Cardio + Core': ['cardio', 'core'],
    MetCon: ['conditioning', 'full'],
    Strength: ['strength'],
    Upper: ['upper', 'push', 'pull'],
    Lower: ['lower', 'legs'],
    'Push + Core': ['push', 'core', 'upper'],
    'Pull + Mobility': ['pull', 'mobility', 'upper'],
  };
  return map[title] || ['full'];
}

function getWorkoutTitle(dayTitle: string, goalType: string): string {
  if (dayTitle.includes('Mobility') || dayTitle.includes('Recovery')) {
    return 'Mobility & Recovery';
  }
  if (goalType === 'Lose Fat') {
    return dayTitle;
  }
  return `${dayTitle} – ${goalType}`;
}

/* -------------------------
   DETERMINISTIC SELECTION
--------------------------*/

const MAX_EX = 8;

function mapGoal(goalType: PerformanceGoals['goalType']): UserContext['goal'] {
  if (goalType === 'Build Muscle') {return 'hypertrophy';}
  if (goalType === 'Lose Fat') {return 'conditioning';}
  return 'balanced';
}

function mapLevel(level: PerformanceGoals['experienceLevel']): UserContext['level'] {
  if (level === 'Beginner') {return 'beginner';}
  if (level === 'Intermediate') {return 'intermediate';}
  return 'advanced';
}

// keep your original logic: if a category says "___ only" require it
function isEquipmentAllowed(ex: Exercise, allowed: string[]): boolean {
  const cat = ex.category?.toLowerCase() ?? '';
  if (cat.includes('only')) {
    return allowed.some((eq) => cat.includes(eq.replace(/s$/, '')));
  }
  return true;
}

function toLite(ex: Exercise): ExerciseLite {
  const anyEx = ex as any; // ✅ define it
  const id =
    anyEx.id ??
    (ex.name ? ex.name.toLowerCase().replace(/\s+/g, '_') : undefined);

  return {
    id,
    name: ex.name,
    tags: anyEx.tags ?? [],
    goalTags: anyEx.goalTags ?? [],
    patterns: anyEx.patterns, // populated by exerciseLibrary backfill
    equipment: anyEx.equipmentTokens ?? inferEquipmentFromCategory(anyEx.category),
  };
}


/** deterministic multi-pick with simple rotation */
function pickDeterministic(
  pool: ExerciseLite[],
  user: UserContext,
  rule: SlotRule,
  count: number,
  recent: string[]
) {
  const picked: ExerciseLite[] = [];
  let history = [...recent];
  let candidatePool = [...pool];

  for (let i = 0; i < count; i++) {
    const [best] = selectExercisesDeterministic(candidatePool, user, rule, {
      historyIds: history,
      maxRecent: 12,
      limit: 1,
    });
    if (!best) {break;}
    picked.push(best);
    history.push(best.id);
    candidatePool = candidatePool.filter((p) => p.id !== best.id);
  }
  return { picked, usedHistory: history };
}

/**
 * Replaces the old shuffle-based selector.
 * Returns BOTH the chosen exercises and their IDs so we can update history.
 */
function getSmartExercises(
  tags: string[],
  library: Exercise[],
  equipment: string[],
  goal: PerformanceGoals['goalType'],
  level: PerformanceGoals['experienceLevel'],
  dayTitle: string,
  recentIds: string[]
): { exercises: Exercise[]; pickedIds: string[] } {
  const allowed = equipment.map((e) => e.toLowerCase());
  const userCtx: UserContext = {
    goal: mapGoal(goal),
    level: mapLevel(level),
    equipment: allowed.includes('bodyweight') ? ['none', ...(allowed as any)] : (allowed as any),
  };

  // 1) Build a base pool by your original constraints (tags/equipment/category)
  const basePool = library.filter((ex) => {
    const tagMatch = tags.some((tag) =>
      ex.tags?.map((t: string) => t.toLowerCase()).includes(tag.toLowerCase())
    );
    const equipMatch = isEquipmentAllowed(ex, allowed);
    return tagMatch && equipMatch;
  });

  // Special-case Fireground day first
  if (dayTitle === 'Fireground') {
    const firePool = library.filter(
      (ex) => ex.category === 'Fireground Readiness' && isEquipmentAllowed(ex, allowed)
    );
    const lite = firePool.map(toLite);
    const rule: SlotRule = {
      includeTags: ['full', 'conditioning', 'strength'], // generous for fireground
      requireCoreSet: false, // allow broader pool for now
      skillCap: userCtx.level,
    };
    const { picked } = pickDeterministic(lite, userCtx, rule, Math.min(MAX_EX, lite.length), recentIds);
    const pickedIds = picked.map((p) => p.id);
    return { exercises: mapBack(pickedIds, library), pickedIds };
  }

  // 2) Goal-STRICT pool (goalTags)
  let strictPool = basePool.filter((ex) =>
    (ex.goalTags ?? []).map((g) => g.toLowerCase())
      .includes(mapGoal(goal))
  );

  // 3) If too few, relax goal (tags only already applied)
  let poolToUse = strictPool.length >= 3 ? strictPool : basePool;

  // 4) If still empty, fallback to anything "full" or name contains tag
  if (poolToUse.length === 0) {
    poolToUse = library.filter(
      (ex) =>
        ex.tags?.map((t: string) => t.toLowerCase()).includes('full') ||
        tags.some((tag) => ex.name.toLowerCase().includes(tag.toLowerCase()))
    );
  }

  const litePool = poolToUse.map(toLite);

  // Rule for this day: bias to provided tags, cap by level, don't force coreSet yet
  const rule: SlotRule = {
    includeTags: Array.from(new Set(tags)),
    requireCoreSet: false,
    skillCap: userCtx.level,
  };

  const { picked } = pickDeterministic(litePool, userCtx, rule, Math.min(MAX_EX, litePool.length), recentIds);
  const pickedIds = picked.map((p) => p.id);
  return { exercises: mapBack(pickedIds, library), pickedIds };
}

function mapBack(ids: string[], library: Exercise[]): Exercise[] {
  const byId = new Map<string, Exercise>();
  for (const ex of library as any[]) {
    const key = (ex.id ?? ex.name?.toLowerCase().replace(/\s+/g, '_')) as string;
    byId.set(key, ex);
  }
  return ids.map((id) => byId.get(id)).filter(Boolean) as Exercise[];
}

/* -------------------------
   SIMPLE PROGRESSION (unchanged)
--------------------------*/
function applyProgression(
  exercise: Exercise,
  goal: string,
  experience: string,
  week: number
): Exercise {
  const sets = exercise.sets ?? 3;
  let reps = exercise.reps ?? 10;

  if (goal === 'Build Muscle') {
    reps += week;
  }
  if (goal === 'Lose Fat') {
    reps = Math.max(12, reps + week);
  }
  if (goal === 'Maintain') {
    reps = 8;
  }

  return {
    ...exercise,
    sets,
    reps,
  };
}
