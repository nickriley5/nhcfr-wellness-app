// generateDailyWorkout.ts
import { Exercise } from '../types/Exercise';
import {
  selectExercisesDeterministic,
  UserContext,
  SlotRule,
  ExerciseLite,
} from '../utils/selectExercises';
// import { RULES } from '../utils/slotRule';
import { RULES } from './slotRule';

/** Minimal input needed for a one-off daily workout */
export interface DailyGenInput {
  goalType: 'Build Muscle' | 'Lose Fat' | 'Maintain';
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  equipment: string[];          // e.g. ['Dumbbells','Bodyweight','Kettlebells']
  dayTitle?: string;            // optional: e.g. 'Push', 'Legs', 'Conditioning'
  recentExerciseIds?: string[]; // to avoid repeats across days
  maxExercises?: number;        // default 8
}

/** Return shape */
export interface DailyGenResult {
  dayTitle: string;
  exercises: Exercise[];
  pickedIds: string[];
}

/** Public API — deterministic single-day generator */
export function generateDailyWorkout(
  input: DailyGenInput,
  library: Exercise[]
): DailyGenResult {
  const {
    goalType,
    experienceLevel,
    equipment,
    dayTitle: maybeTitle,
    recentExerciseIds = [],
    maxExercises = 8,
  } = input;

  // Choose a day title if caller didn't provide one.
  const dayTitle = maybeTitle ?? defaultTitleForGoal(goalType);

  const tags = getTagsFromTitle(dayTitle);
  const allowed = equipment.map((e) => e.toLowerCase());

  const userCtx: UserContext = {
    goal: mapGoal(goalType),
    level: mapLevel(experienceLevel),
    equipment: (allowed.includes('bodyweight') ? ['none', ...allowed] : allowed) as any,
  };

  // Build a base pool (tags + equipment gate)
  const basePool = library.filter((ex) => {
    const tagMatch = tags.some((tag) =>
      ex.tags?.map((t: string) => t.toLowerCase()).includes(tag.toLowerCase())
    );
    const equipMatch = isEquipmentAllowed(ex, allowed);
    return tagMatch && equipMatch;
  });

  // Special-case Fireground
  if (dayTitle === 'Fireground') {
    const firePool = library.filter(
      (ex) => ex.category === 'Fireground Readiness' && isEquipmentAllowed(ex, allowed)
    );
    const lite = (firePool.length ? firePool : basePool).map(toLite);
    const rule = ruleForDayTitle('Fireground', ['full', 'conditioning', 'strength']);
    const { picked } = pickDeterministic(lite, userCtx, rule, Math.min(maxExercises, lite.length), recentExerciseIds);
    const pickedIds = picked.map((p) => p.id);
    return { dayTitle, exercises: mapBack(pickedIds, library), pickedIds };
  }

  // Goal-STRICT pool first
  let strictPool = basePool.filter((ex) =>
    (ex.goalTags ?? []).map((g) => g.toLowerCase()).includes(mapGoal(goalType))
  );

  // If too few, relax goal (keep tag/equipment gates)
  let poolToUse = strictPool.length >= 3 ? strictPool : basePool;

  // If still empty, fallback: anything "full" or name contains tag
  if (poolToUse.length === 0) {
    poolToUse = library.filter(
      (ex) =>
        ex.tags?.map((t: string) => t.toLowerCase()).includes('full') ||
        tags.some((tag) => ex.name.toLowerCase().includes(tag.toLowerCase()))
    );
  }

  const litePool = poolToUse.map(toLite);
  const rule = ruleForDayTitle(dayTitle, tags);

  const { picked } = pickDeterministic(
    litePool,
    userCtx,
    rule,
    Math.min(maxExercises, litePool.length),
    recentExerciseIds
  );

  const pickedIds = picked.map((p) => p.id);
  return { dayTitle, exercises: mapBack(pickedIds, library), pickedIds };
}

/* -----------------------------------
   Helpers (same behavior as builder)
------------------------------------*/

function defaultTitleForGoal(goalType: DailyGenInput['goalType']): string {
  if (goalType === 'Build Muscle') {return 'Full Body';}
  if (goalType === 'Lose Fat') {return 'Full Body Circuit';}
  return 'Strength';
}

function getTagsFromTitle(title: string): string[] {
  const map: Record<string, string[]> = {
    Push: ['push', 'press', 'chest', 'triceps', 'upper'],
    Pull: ['pull', 'back', 'biceps', 'row', 'deadlift', 'chin', 'pull-up', 'upper'],
    Legs: ['legs', 'quads', 'glutes', 'hinge', 'squat', 'lower'],
    Core: ['core', 'ab'],
    Mobility: ['mobility', 'stretch'],
    Fireground: ['full'],
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

function mapGoal(goalType: DailyGenInput['goalType']): UserContext['goal'] {
  if (goalType === 'Build Muscle') {return 'hypertrophy';}
  if (goalType === 'Lose Fat') {return 'conditioning';}
  return 'balanced';
}

function mapLevel(level: DailyGenInput['experienceLevel']): UserContext['level'] {
  if (level === 'Beginner') {return 'beginner';}
  if (level === 'Intermediate') {return 'intermediate';}
  return 'advanced';
}

// honor "___ only" categories
function isEquipmentAllowed(ex: Exercise, allowed: string[]): boolean {
  const cat = ex.category?.toLowerCase() ?? '';
  if (cat.includes('only')) {
    return allowed.some((eq) => cat.includes(eq.replace(/s$/, '')));
  }
  return true;
}

// rough equipment inference for scoring (does not override gate above)
function inferEquipmentFromCategory(cat?: string): ExerciseLite['equipment'] {
  const c = (cat || '').toLowerCase();
  const eq: ExerciseLite['equipment'] = [];
  if (c.includes('bodyweight')) {eq.push('none');}
  if (c.includes('dumbbell')) {eq.push('db');}
  if (c.includes('kettlebell')) {eq.push('kb');}
  if (c.includes('barbell')) {eq.push('barbell');}
  if (c.includes('pull') || c.includes('rig')) {eq.push('pullup_bar');}
  return eq.length ? eq : undefined;
}

function toLite(ex: Exercise): ExerciseLite {
  const id = (ex as any).id ?? ex.name?.toLowerCase().replace(/\s+/g, '_');
  return {
    id,
    name: ex.name,
    tags: ex.tags,
    goalTags: ex.goalTags,
    equipment: inferEquipmentFromCategory(ex.category),
  };
}

function ruleForDayTitle(dayTitle: string, tags: string[]): SlotRule {
  const key = dayTitle.toUpperCase().replace(/\s+/g, '_');
  return (RULES as any)[key] ?? {
    includeTags: Array.from(new Set(tags)),
    requireCoreSet: false,
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

function mapBack(ids: string[], library: Exercise[]): Exercise[] {
  const byId = new Map<string, Exercise>();
  for (const ex of library as any[]) {
    const key = (ex.id ?? ex.name?.toLowerCase().replace(/\s+/g, '_')) as string;
    byId.set(key, ex);
  }
  return ids.map((id) => byId.get(id)).filter(Boolean) as Exercise[];
}
