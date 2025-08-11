import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import type { Exercise } from '../types/Exercise';
import { inferPatternsFromTags, inferEquipmentFromCategory } from './backfillExerciseFields';

// Extend for local use so TS is happy with our extra, optional fields
export type ExerciseDoc = Exercise & {
  id?: string;
  patterns?: ('squat'|'hinge'|'push_v'|'push_h'|'pull_v'|'pull_h'|'carry'|'core'|'mono')[];
  // keep original Exercise.equipment (likely a string like "Dumbbell Only")
  // and add a tokenized version for the selector:
  equipmentTokens?: ('barbell'|'db'|'kb'|'pullup_bar'|'rings'|'jumprope'|'medball'|'sled'|'ghd'|'none')[];
};

export async function getFullExerciseLibrary(): Promise<ExerciseDoc[]> {
  try {
    const snapshot = await getDocs(collection(db, 'exercises'));

    const exercises: ExerciseDoc[] = snapshot.docs.map((d) => {
      const raw = d.data() as any;
      return {
        ...(raw as Exercise),
        id: d.id,
        // add signals for the selector without touching Firestore
        patterns: raw.patterns ?? inferPatternsFromTags(raw.tags ?? []),
        equipmentTokens: raw.equipmentTokens ?? inferEquipmentFromCategory(raw.category),
      };
    });

    console.log('📦 Exercise library loaded:', exercises.length, exercises[0]);
    return exercises;
  } catch (error) {
    console.error('❌ Error fetching exercise library:', error);
    return [];
  }
}
