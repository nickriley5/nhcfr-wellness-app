// utils/selectExercises.ts
// Deterministic exercise selection + replacements from your existing library

export type Level = 'beginner' | 'intermediate' | 'advanced';
export type Pattern =
  | 'squat' | 'hinge'
  | 'push_v' | 'push_h'
  | 'pull_v' | 'pull_h'
  | 'carry' | 'core' | 'mono';

export type Equipment =
  | 'barbell' | 'db' | 'kb'
  | 'pullup_bar' | 'rings'
  | 'jumprope' | 'medball'
  | 'sled' | 'ghd' | 'none';

export interface ExerciseLite {
  id: string;
  name?: string;
  tags?: string[];           // keep using your existing tags
  goalTags?: string[];       // e.g. ['strength','hypertrophy','conditioning']
  patterns?: Pattern[];      // add if not present; can infer from tags if needed
  equipment?: Equipment[];   // add if not present
  level?: Level;
  focusArea?: string[];      // optional
  coreSet?: boolean;         // new flag to whitelist for generator
  status?: 'core'|'extended'|'deprecated'; // avoid deprecated in generator
  replacements?: string[];   // ids of viable swaps
}

export interface UserContext {
  goal: 'strength'|'hypertrophy'|'conditioning'|'balanced';
  level: Level;
  equipment: Equipment[];
}

export interface SlotRule {
  includePatterns?: Pattern[];
  excludePatterns?: Pattern[];
  includeTags?: string[];     // e.g. ['upper','push'] etc.
  excludeTags?: string[];
  preferEquipment?: Equipment[];
  avoidEquipment?: Equipment[];
  skillCap?: Level;           // don't exceed this
  requireCoreSet?: boolean;   // default true for generator
}

export interface SelectOptions {
  historyIds?: string[];      // recent picks to de-duplicate
  maxRecent?: number;         // how many recent to consider (default 10)
  limit?: number;             // return top N (default 1)
}

// Basic level rank for comparisons
const LEVEL_RANK: Record<Level, number> = { beginner: 1, intermediate: 2, advanced: 3 };

function hasAny<T>(arr: T[] | undefined, targets: T[] | undefined) {
  if (!arr || !targets || targets.length === 0) {return false;}
  return arr.some(x => targets.includes(x));
}
function levelOk(ex: ExerciseLite, cap?: Level) {
  if (!cap || !ex.level) {return true;}
  return LEVEL_RANK[ex.level] <= LEVEL_RANK[cap];
}

export function scoreExercise(
  ex: ExerciseLite,
  user: UserContext,
  rule: SlotRule,
  opts: SelectOptions
): number {
  // hard blocks
  if (ex.status === 'deprecated') {return -Infinity;}
  if (rule.requireCoreSet !== false && ex.coreSet === false) {return -Infinity;}
  if (rule.includePatterns && !hasAny(ex.patterns, rule.includePatterns)) {return -Infinity;}
  if (rule.excludePatterns && hasAny(ex.patterns, rule.excludePatterns)) {return -Infinity;}

  // equipment availability
  const needs = ex.equipment ?? [];
  if (needs.length && !needs.every(eq => user.equipment.includes(eq))) {
    // allow pure 'none' bodyweight even if no equipment
    if (!(needs.length === 1 && needs[0] === 'none')) {return -Infinity;}
  }

  // base score
  let s = 0;

  // pattern fit
  if (rule.includePatterns) {
    s += (ex.patterns ?? []).reduce((acc, p) => acc + (rule.includePatterns!.includes(p) ? 3 : 0), 0);
  }

  // tag fit
  if (rule.includeTags) {s += (ex.tags ?? []).filter(t => rule.includeTags!.includes(t)).length * 2;}
  if (rule.excludeTags) {s -= (ex.tags ?? []).filter(t => rule.excludeTags!.includes(t)).length * 2;}

  // goal bias
  if (user.goal !== 'balanced') {
    if (ex.goalTags?.includes(user.goal)) {s += 2;}
  }

  // equipment preference
  if (rule.preferEquipment) {
    s += (ex.equipment ?? []).filter(e => rule.preferEquipment!.includes(e)).length;
  }
  if (rule.avoidEquipment) {
    s -= (ex.equipment ?? []).filter(e => rule.avoidEquipment!.includes(e)).length;
  }

  // skill cap
  if (!levelOk(ex, rule.skillCap)) {s -= 3;}

  // recent-use penalty
  const recent = (opts.historyIds ?? []).slice(-1 * (opts.maxRecent ?? 10));
  if (recent.includes(ex.id)) {s -= 5;}

  return s;
}

export function selectExercisesDeterministic(
  pool: ExerciseLite[],
  user: UserContext,
  rule: SlotRule,
  opts: SelectOptions = {}
): ExerciseLite[] {
  // stable sort by score then by id to keep deterministic
  const scored = pool.map(ex => ({
    ex,
    score: scoreExercise(ex, user, rule, opts),
  }));
  scored.sort((a, b) => {
    if (b.score !== a.score) {return b.score - a.score;}
    return a.ex.id.localeCompare(b.ex.id);
  });
  const top = scored.filter(x => isFinite(x.score));
  const limit = opts.limit ?? 1;
  return top.slice(0, limit).map(x => x.ex);
}

// Replacement suggestion respecting same rule but with stricter matching first
export function suggestReplacements(
  current: ExerciseLite,
  library: ExerciseLite[],
  user: UserContext,
  rule: SlotRule,
  limit = 6
): ExerciseLite[] {
  const baseRule: SlotRule = {
    ...rule,
    includePatterns: current.patterns ?? rule.includePatterns,
    includeTags: Array.from(new Set([...(rule.includeTags ?? []), ...(current.tags ?? [])])),
  };
  // filter out self and require available equipment
  const pool = library.filter(e => e.id !== current.id);
  return selectExercisesDeterministic(pool, user, baseRule, { limit, maxRecent: 6 });
}
