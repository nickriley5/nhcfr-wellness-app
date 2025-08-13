import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getFullExerciseLibrary } from './exerciseLibrary';
import { buildProgramFromGoals, PerformanceGoals } from './buildProgramFromGoals';
import { Exercise } from '../types/Exercise';

// 🔁 Generate from stored user profile in Firestore
export async function generateProgram(uid: string) {
  const profileRef = doc(db, 'users', uid);
  const profileSnap = await getDoc(profileRef);
  const userData = profileSnap.data();

  const storedGoals = userData?.preferences?.performance;

  if (
    !storedGoals ||
    !storedGoals.focus ||
    !storedGoals.daysPerWeek ||
    !storedGoals.duration ||
    !storedGoals.goalType ||
    !storedGoals.experienceLevel ||
    !storedGoals.equipment
  ) {
    throw new Error('Missing or incomplete performance goals in profile.');
  }

  const goals: PerformanceGoals = {
    focus: Array.isArray(storedGoals.focus) ? storedGoals.focus : [storedGoals.focus],
    daysPerWeek: parseInt(storedGoals.frequency?.split('x')[0] || '3', 10),
    durationWeeks: parseInt(storedGoals.duration.split(' ')[0], 10),
    includeFireground: storedGoals.firegroundReady,
    goalType: storedGoals.goalType,
    experienceLevel: storedGoals.experienceLevel,
    equipment: storedGoals.equipment || [],
  };

  const exerciseLibrary = await getFullExerciseLibrary();
  return buildProgramFromGoals(goals, exerciseLibrary);
}

// 🆕 Generate from passed-in goals object (used in modal)
export async function generateProgramFromGoals(
  goals: PerformanceGoals,
  exerciseLibrary: Exercise[]
) {
  if (
    !goals ||
    !goals.focus ||
    !goals.daysPerWeek ||
    !goals.durationWeeks ||
    !goals.goalType ||
    !goals.experienceLevel ||
    !goals.equipment
  ) {
    throw new Error('Invalid or incomplete goals object.');
  }

  return buildProgramFromGoals(goals, exerciseLibrary);
}

