// utils/programService.ts
import { serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { getFullExerciseLibrary } from './exerciseLibrary';
import { buildProgramFromGoals } from './buildProgramFromGoals'; // or ./generateDailyWorkout if that's the file you use
import type { PerformanceGoals, ProgramDay } from './buildProgramFromGoals';

export async function regenerateActiveProgram(
  goals: PerformanceGoals,
  startDate = new Date()
): Promise<ProgramDay[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) {throw new Error('No authenticated user');}

  // 1) load library with our backfilled fields
  const library = await getFullExerciseLibrary();

  // 2) build program
  const program = buildProgramFromGoals(goals, library as any, startDate);

  // 3) save to Firestore
  const ref = doc(db, 'users', uid, 'program', 'active');
  await setDoc(
    ref,
    {
      createdAt: serverTimestamp(),
      goals,
      days: program,
      currentDay: 1,
      currentWeek: 1,
      recentIds: [], // you can use this later to reduce repeats
    },
    { merge: true }
  );

  return program;
}
