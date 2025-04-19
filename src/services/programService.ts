// src/services/programService.ts

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';

/**
 * Fetches the current training program for the logged-in user.
 * @returns The program data object, or null if not found.
 */
export async function getCurrentProgram(): Promise<any | null> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  const programRef = doc(db, 'programs', user.uid);
  const snap = await getDoc(programRef);
  return snap.exists() ? snap.data() : null;
}

/**
 * Saves adapted exercises for a given day index into the user's program.
 * @param dayIndex - Zero-based index of the day in the program.
 * @param adaptedExercises - Array of exercise objects to persist.
 */
export async function saveAdaptedWorkout(
  dayIndex: number,
  adaptedExercises: any[]
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  const programRef = doc(db, 'programs', user.uid);
  const snap = await getDoc(programRef);
  if (!snap.exists()) {
    throw new Error('Program not found');
  }

  const data = snap.data();
  data.days[dayIndex].exercises = adaptedExercises;
  await setDoc(programRef, data);
}

/**
 * Generates a fresh seven-day program for the user and saves it.
 */
export async function generateProgram(): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not signed in');
  }

  const program = [
    {
      day: 1,
      title: 'Upper Body Strength',
      exercises: [
        { name: 'Pushups', sets: 4, reps: 12 },
        { name: 'Bent-over Rows', sets: 4, reps: 10 },
        { name: 'Overhead Press', sets: 3, reps: 8 },
      ],
    },
    {
      day: 2,
      title: 'Lower Body Strength',
      exercises: [
        { name: 'Goblet Squat', sets: 4, reps: 15 },
        { name: 'Lunges', sets: 3, reps: 12 },
        { name: 'Glute Bridge', sets: 3, reps: 20 },
      ],
    },
    {
      day: 3,
      title: 'Conditioning & Core',
      exercises: [
        { name: 'Jump Rope', sets: 5, reps: '1 min' },
        { name: 'Plank', sets: 3, reps: '1 min' },
        { name: 'Mountain Climbers', sets: 3, reps: 40 },
      ],
    },
    {
      day: 4,
      title: 'Active Recovery',
      exercises: [
        { name: 'Walking', sets: 1, reps: '20-30 mins' },
        { name: 'Deep Breathing', sets: 1, reps: '5 mins' },
      ],
    },
    {
      day: 5,
      title: 'Full Body Power',
      exercises: [
        { name: 'Kettlebell Swings', sets: 5, reps: 15 },
        { name: 'Burpees', sets: 4, reps: 12 },
        { name: 'Squat to Press', sets: 3, reps: 10 },
      ],
    },
    {
      day: 6,
      title: 'Mobility & Flexibility',
      exercises: [
        { name: 'Hip Flexor Stretch', sets: 2, reps: '1 min/side' },
        { name: 'Cat Cow', sets: 2, reps: 10 },
        { name: 'Hamstring Stretch', sets: 2, reps: '1 min/side' },
      ],
    },
    {
      day: 7,
      title: 'Rest Day',
      exercises: [
        { name: 'Full Rest', sets: 1, reps: 'Enjoy it' },
      ],
    },
  ];

  await setDoc(doc(db, 'programs', user.uid), {
    createdAt: serverTimestamp(),
    days: program,
    currentDay: 1,
    completedDays: [],
  });
}
