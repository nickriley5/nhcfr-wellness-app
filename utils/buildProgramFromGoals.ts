import { Timestamp } from 'firebase/firestore';

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  category?: string;
  focusArea?: string;
  equipment: string;
  coachingNotes?: string;
  swapOptions?: string[];
  tags: string[];
  goalTags: string[];
  videoUrl?: string;
  thumbnailUri?: string;
  level: string;
  sets?: number;
  reps?: number;
}

export interface PerformanceGoals {
  focus: string[]; // ['strength', 'mobility']
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

export function buildProgramFromGoals(
  goals: PerformanceGoals,
  fullLibrary: Exercise[],
  startDate = new Date()
): ProgramDay[] {
  const {
    daysPerWeek,
    durationWeeks,
    focus,
    includeFireground,
    goalType,
    experienceLevel,
    equipment,
  } = goals;

  const totalDays = daysPerWeek * durationWeeks;
  const program: ProgramDay[] = [];

  const workoutSplit = generateSplit(daysPerWeek, goalType, includeFireground);
  let currentDate = new Date(startDate);

  for (let i = 0; i < totalDays; i++) {
    const title = workoutSplit[i % workoutSplit.length];

    let filteredLibrary = fullLibrary.filter((ex) => {
      const matchesGoal = focus.some((tag) => ex.goalTags.includes(tag));
      const matchesEquipment = ex.equipment === 'Bodyweight' || equipment.includes(ex.equipment);
      const isFiregroundCompatible = includeFireground || !ex.tags.includes('fireground');
      const matchesSplit = getTagsForTitle(title).some((tag) => ex.tags.includes(tag));
      return matchesGoal && matchesEquipment && isFiregroundCompatible && matchesSplit;
    });

    if (filteredLibrary.length === 0) {
      console.warn(`⚠️ No exercises matched for "${title}". Falling back to equipment-only filter.`);
      filteredLibrary = fullLibrary.filter((ex) =>
        ex.equipment === 'Bodyweight' || equipment.includes(ex.equipment)
      );
    }

    const exercises = getShuffledExercises(filteredLibrary, experienceLevel, goalType);

    console.log(`✅ Exercises for "${title}":`, exercises.map((ex) => ex.name));

    program.push({
      title,
      date: Timestamp.fromDate(new Date(currentDate)),
      exercises,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log('✅ Final Program:', program);

  return program;
}

function generateSplit(daysPerWeek: number, goalType: string, includeFireground: boolean): string[] {
  const split: string[] = [];

  if (goalType === 'Build Muscle') {
    split.push('Upper Body Strength', 'Lower Body Strength');
    if (daysPerWeek >= 4) split.push('Full Body Strength');
    if (includeFireground) split.push('Fireground Conditioning');
    if (daysPerWeek >= 5) split.push('Mobility & Recovery');
  } else if (goalType === 'Lose Fat') {
    split.push('MetCon Circuit', 'Conditioning + Core');
    if (includeFireground) split.push('Fireground Burner');
    split.push('Mobility & Recovery');
    if (daysPerWeek >= 5) split.push('Full Body Conditioning');
  } else {
    // Maintain
    split.push('Full Body Strength', 'Mobility & Core');
    if (includeFireground) split.push('Fireground Hybrid');
    if (daysPerWeek >= 5) split.push('Cardio & Mobility');
  }

  return split;
}

function getTagsForTitle(title: string): string[] {
  if (title.includes('Upper')) return ['upper', 'push', 'pull'];
  if (title.includes('Lower')) return ['lower', 'legs', 'hinge'];
  if (title.includes('Fireground')) return ['fireground'];
  if (title.includes('Mobility')) return ['mobility'];
  if (title.includes('Conditioning') || title.includes('MetCon')) return ['conditioning', 'core'];
  return ['full', 'strength', 'durability'];
}

function getShuffledExercises(
  pool: Exercise[],
  experience: PerformanceGoals['experienceLevel'],
  goalType: PerformanceGoals['goalType']
): Exercise[] {
  if (pool.length === 0) return [];

  const shuffled = shuffleArray(pool);
  const count = 5;

  return shuffled.slice(0, count).map((ex) => ({
    ...ex,
    sets: getDefaultSets(goalType, experience),
    reps: getDefaultReps(goalType, experience),
  }));
}

function getDefaultSets(goal: string, level: string): number {
  const base = goal === 'Build Muscle' ? 4 : goal === 'Lose Fat' ? 3 : 3;
  const mod = level === 'Advanced' ? 1 : level === 'Beginner' ? -1 : 0;
  return Math.max(2, base + mod);
}

function getDefaultReps(goal: string, level: string): number {
  if (goal === 'Build Muscle') return 8;
  if (goal === 'Lose Fat') return 16;
  if (goal === 'Maintain') return 10;
  if (goal === 'Fireground') return 60;
  return 10;
}

function shuffleArray<T>(arr: T[]): T[] {
  const array = [...arr];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
