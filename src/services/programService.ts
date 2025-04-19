// src/services/programService.ts

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase';

export interface Exercise {
  name: string;
  sets: number;
  reps: number | string;
}

export interface Day {
  day: number;
  title: string;
  exercises: Exercise[];
}

export interface Program {
  days: Day[];
  currentDay: number;
  completedDays: number[];
}

/**
 * Fetches the current training program for the logged‐in user.
 * @returns The Program object, or null if none exists yet.
 */
export async function getCurrentProgram(): Promise<Program | null> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const programRef = doc(db, 'programs', user.uid);
  const snap = await getDoc(programRef);
  return snap.exists() ? (snap.data() as Program) : null;
}

/**
 * Persists an adapted list of exercises for a given day index.
 */
export async function saveAdaptedWorkout(
  dayIndex: number,
  adaptedExercises: Exercise[]
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const programRef = doc(db, 'programs', user.uid);
  const snap = await getDoc(programRef);
  if (!snap.exists()) throw new Error('Program not found');

  const program = snap.data() as Program;
  program.days[dayIndex].exercises = adaptedExercises;

  await setDoc(programRef, program);
}

/**
 * (Optional) Generates and saves a brand‐new 7‑day program under the user’s document.
 */
export async function generateProgram(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not signed in');

  const program: Day[] = [
    {
      day: 1,
      title: 'Upper Body Strength',
      exercises: [
        { name: 'Pushups', sets: 4, reps: 12 },
        { name: 'Bent‑over Rows', sets: 4, reps: 10 },
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
        { name: 'Walking', sets: 1, reps: '20‑30 mins' },
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
      exercises: [{ name: 'Full Rest', sets: 1, reps: 'Enjoy it' }],
    },
  ];

  const programRef = doc(db, 'programs', user.uid);
  await setDoc(programRef, {
    createdAt: serverTimestamp(),
    days: program,
    currentDay: 1,
    completedDays: [],
  });
}
