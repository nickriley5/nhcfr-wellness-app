// utils/programBuilder.ts

import { Timestamp } from 'firebase/firestore';
import { Exercise } from './generateDailyWorkout'; // ✅ Correct import

export interface PerformanceGoals {
  focus: string[]; // e.g. ['strength', 'mobility']
  daysPerWeek: number;
  includeFireground: boolean;
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
  const program: ProgramDay[] = [];
  const { daysPerWeek, focus, includeFireground } = goals;

  const filteredLibrary = fullLibrary.filter((ex) => {
    const matchesFocus = focus.some((tag) => ex.goalTags.includes(tag));
    const isFireground = includeFireground ? true : ex.tags.includes('fireground') === false;
    return matchesFocus && isFireground;
  });

  const days: string[] = [
    'Upper Body Strength',
    'Lower Body Strength',
    'Conditioning + Core',
    'Mobility & Recovery',
    'Mixed Modal / Fireground'
  ];

  let currentDate = new Date(startDate);
  for (let i = 0; i < daysPerWeek * 4; i++) {
    const title = days[i % days.length];

    const dailyExercises = getExercisesForTitle(title, filteredLibrary);

    program.push({
      title,
      date: Timestamp.fromDate(new Date(currentDate)),
      exercises: dailyExercises,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return program;
}

function getExercisesForTitle(title: string, pool: Exercise[]): Exercise[] {
  let tags: string[] = [];

  if (title.includes('Upper')) tags = ['upper'];
  else if (title.includes('Lower')) tags = ['lower'];
  else if (title.includes('Conditioning')) tags = ['conditioning', 'core'];
  else if (title.includes('Mobility')) tags = ['mobility'];
  else if (title.includes('Fireground')) tags = ['fireground'];
  else tags = ['full'];

  const filtered = pool.filter((ex) => tags.some((tag) => ex.tags.includes(tag)));
  return shuffleArray(filtered).slice(0, 5); // pick 5 exercises for now
}

function shuffleArray<T>(arr: T[]): T[] {
  const array = [...arr];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
