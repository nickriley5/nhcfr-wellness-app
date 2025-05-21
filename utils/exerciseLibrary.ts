// utils/exerciseLibrary.ts
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Exercise } from './generateDailyWorkout';

export async function getFullExerciseLibrary(): Promise<Exercise[]> {
  try {
    const snapshot = await getDocs(collection(db, 'exercises'));
    const exercises: Exercise[] = snapshot.docs.map(doc => ({
      ...(doc.data() as Exercise),
      id: doc.id,
    }));
    return exercises;
  } catch (error) {
    console.error('Error fetching exercise library:', error);
    return [];
  }
}
