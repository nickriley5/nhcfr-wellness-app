import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Exercise } from './buildProgramFromGoals'; // ✅ update this path if needed

export async function getFullExerciseLibrary(): Promise<Exercise[]> {
  try {
    const snapshot = await getDocs(collection(db, 'exercises'));

    const exercises: Exercise[] = snapshot.docs.map((doc) => ({
      ...(doc.data() as Exercise),
      id: doc.id,
    }));

    // 🔍 Log the count and first exercise to debug
    console.log('📦 Exercise library loaded:', exercises.length, exercises[0]);

    return exercises;
  } catch (error) {
    console.error('❌ Error fetching exercise library:', error);
    return [];
  }
}
