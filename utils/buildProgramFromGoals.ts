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
  daysPerWeek: number; // e.g. 5
  includeFireground: boolean;
  durationWeeks: number; // e.g. 12
  goalType: 'Build Muscle' | 'Lose Fat' | 'Maintain';
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  equipment: string[]; // e.g. ['Dumbbells', 'Bodyweight']
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
  const { daysPerWeek, durationWeeks, focus, includeFireground, goalType, experienceLevel, equipment } = goals;
  const totalDays = daysPerWeek * durationWeeks;
  const program: ProgramDay[] = [];

  // 🔍 Filter exercises by goal tags, equipment, and fireground toggle
  const filteredLibrary = fullLibrary.filter((ex) => {
    const matchesGoal = focus.some((tag) => ex.goalTags.includes(tag));
    const matchesEquipment = ex.equipment === 'Bodyweight' || equipment.includes(ex.equipment);
    const isFiregroundCompatible = includeFireground || !ex.tags.includes('fireground');
    return matchesGoal && matchesEquipment && isFiregroundCompatible;
  });

  const workoutSplit = generateSplit(daysPerWeek, goalType, includeFireground);

  let currentDate = new Date(startDate);

  for (let i = 0; i < totalDays; i++) {
    const title = workoutSplit[i % workoutSplit.length];
    const exercises = getExercisesForTitle(title, filteredLibrary, experienceLevel, goalType);

    program.push({
      title,
      date: Timestamp.fromDate(new Date(currentDate)),
      exercises,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log('Generated program:', program);

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

function getExercisesForTitle(
  title: string,
  pool: Exercise[],
  experience: PerformanceGoals['experienceLevel'],
  goalType: PerformanceGoals['goalType']
): Exercise[] {
  let tags: string[] = [];

  if (title.includes('Upper')) tags = ['upper', 'push', 'pull'];
  else if (title.includes('Lower')) tags = ['lower', 'legs', 'hinge'];
  else if (title.includes('Fireground')) tags = ['fireground'];
  else if (title.includes('Mobility')) tags = ['mobility'];
  else if (title.includes('Conditioning') || title.includes('MetCon')) tags = ['conditioning', 'core'];
  else tags = ['full', 'strength', 'durability'];

  const filtered = pool.filter((ex) => tags.some((tag) => ex.tags.includes(tag)));
  const shuffled = shuffleArray(filtered).slice(0, 5);

  return shuffled.map((ex) => ({
    ...ex,
    sets: getDefaultSets(goalType, experience),
    reps: getDefaultReps(goalType, experience),
  }));
}

function getDefaultSets(goal: string, level: string): number {
  if (goal === 'Build Muscle') return level === 'Advanced' ? 5 : level === 'Intermediate' ? 4 : 3;
  if (goal === 'Lose Fat') return 2;
  return 3;
}

function getDefaultReps(goal: string, level: string): number {
  if (goal === 'Build Muscle') return 8 + (level === 'Advanced' ? 0 : 2);
  if (goal === 'Lose Fat') return 15;
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
