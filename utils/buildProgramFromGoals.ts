import { Timestamp } from 'firebase/firestore';
import { Exercise } from '../types/Exercise';

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

  for (let i = 0; i < totalDays; i++) {
    const weekNumber = Math.floor(i / daysPerWeek) + 1;
    let dayTitle = trackSplit[i % daysPerWeek];

    // 3) Last day of each block → Mobility & Recovery
    if (daysPerWeek <= 4 && i % daysPerWeek === daysPerWeek - 1) {
      dayTitle = 'Mobility & Recovery';
    }

    const tags = getTagsFromTitle(dayTitle);
    const exercises = getSmartExercises(
      tags,
      fullLibrary,
      equipment,
      goalType,
      experienceLevel,
      dayTitle
    );

    const progressedExercises = exercises.map((ex) =>
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

function getTagsFromTitle(title: string): string[] {
  const map: Record<string, string[]> = {
    Push: ['push', 'press', 'chest', 'triceps'],
    Pull: ['pull', 'back', 'biceps', 'row', 'deadlift', 'chin', 'pull-up'],
    Legs: ['legs', 'quads', 'glutes', 'hinge', 'squat'],
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
    'Push + Core': ['push', 'core'],
    'Pull + Mobility': ['pull', 'mobility'],
  };
  return map[title] || ['full'];
}

function getWorkoutTitle(dayTitle: string, goalType: string): string {
  if (dayTitle.includes('Mobility') || dayTitle.includes('Recovery'))
    return 'Mobility & Recovery';
  if (goalType === 'Lose Fat') return dayTitle;
  return `${dayTitle} – ${goalType}`;
}

function getSmartExercises(
  tags: string[],
  library: Exercise[],
  equipment: string[],
  goal: string,
  level: string,
  dayTitle: string
): Exercise[] {
  const MAX_EX = 8;

  // equipment check: based on ex.category (may be undefined)
  const allowed = equipment.map((e) => e.toLowerCase());
  const isEquipmentAllowed = (ex: Exercise): boolean => {
    const cat = ex.category?.toLowerCase() ?? '';
    if (cat.includes('only')) {
      // e.g. "dumbbell only" → require matching equipment
      return allowed.some((eq) => cat.includes(eq.replace(/s$/, '')));
    }
    return true;
  };

  // 1) Fireground day → only Fireground Readiness drills
  if (dayTitle === 'Fireground') {
    const candidates = library.filter(
      (ex) =>
        ex.category === 'Fireground Readiness' &&
        isEquipmentAllowed(ex)
    );
    if (candidates.length > 0) {
      return shuffleArray(candidates).slice(0, MAX_EX);
    }
    // fallback → full-body/conditioning moves
    const fallback = library.filter((ex) =>
      (ex.tags
        ?.map((t: string) => t.toLowerCase())
        .includes('full') ||
        ex.goalTags
          ?.map((g: string) => g.toLowerCase())
          .some((g) => ['conditioning', 'strength'].includes(g))) &&
      isEquipmentAllowed(ex)
    );
    return shuffleArray(fallback).slice(0, MAX_EX);
  }

  // 2) Normal days
  // a) strict: tags + equipment + goal
  let filtered = library.filter((ex) => {
    const tagMatch = tags.some((tag) =>
      ex.tags?.map((t: string) => t.toLowerCase()).includes(tag.toLowerCase())
    );
    const equipMatch = isEquipmentAllowed(ex);
    const goalMatch =
      ex.goalTags
        ?.map((g: string) => g.toLowerCase())
        .includes(goal.toLowerCase()) ||
      ex.goalTags?.includes('strength');
    return tagMatch && equipMatch && goalMatch;
  });

  // b) relax goal if too few
  if (filtered.length < 3) {
    filtered = library.filter((ex) => {
      const tagMatch = tags.some((tag) =>
        ex.tags?.map((t: string) => t.toLowerCase()).includes(tag.toLowerCase())
      );
      return tagMatch && isEquipmentAllowed(ex);
    });
  }

  // c) fallback → any full-body or name match
  if (filtered.length === 0) {
    filtered = library.filter(
      (ex) =>
        (ex.tags
          ?.map((t: string) => t.toLowerCase())
          .includes('full') ||
          tags.some((tag) =>
            ex.name.toLowerCase().includes(tag.toLowerCase())
          )) &&
        isEquipmentAllowed(ex)
    );
  }

  return shuffleArray(filtered).slice(0, MAX_EX);
}

function applyProgression(
  exercise: Exercise,
  goal: string,
  experience: string,
  week: number
): Exercise {
  const sets = exercise.sets ?? 3;
  let reps = exercise.reps ?? 10;

  if (goal === 'Build Muscle') reps += week;
  if (goal === 'Lose Fat') reps = Math.max(12, reps + week);
  if (goal === 'Maintain') reps = 8;

  return {
    ...exercise,
    sets,
    reps,
  };
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
