import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getFullExerciseLibrary } from './exerciseLibrary';
import { buildProgramFromGoals, PerformanceGoals } from './programBuilder'; // <- FIXED THIS LINE

// Existing function (generate from stored profile)
export async function generateProgram(uid: string) {
  const profileRef = doc(db, 'users', uid);
  const profileSnap = await getDoc(profileRef);
  const userData = profileSnap.data();

  if (!userData?.performanceGoals) {
    throw new Error('No performance goals found.');
  }

  const exerciseLibrary = await getFullExerciseLibrary();
  const program = buildProgramFromGoals(userData.performanceGoals, exerciseLibrary);

  return program;
}

// NEW function (generate from passed-in goals object)
export async function generateProgramFromGoals(goals: PerformanceGoals) {
  if (!goals || !goals.focus || !goals.daysPerWeek) {
    throw new Error('Invalid goals object provided.');
  }

  const exerciseLibrary = await getFullExerciseLibrary();
  const program = buildProgramFromGoals(goals, exerciseLibrary);

  return program;
}
