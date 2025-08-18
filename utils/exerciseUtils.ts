import { exercises } from '../data/exercises';
import type { Exercise } from '../types/Exercise';

/**
 * Resolves exercise IDs to full exercise details from the library
 */
export function resolveExerciseDetails(exerciseId: string): Exercise | null {
  return exercises.find(ex => ex.id === exerciseId) || null;
}

/**
 * Resolves multiple exercise IDs to their full details
 */
export function resolveMultipleExercises(exerciseIds: string[]): Exercise[] {
  return exerciseIds
    .map(id => resolveExerciseDetails(id))
    .filter((ex): ex is Exercise => ex !== null);
}

/**
 * Gets a placeholder video URL for exercises without videos
 */
export function getExerciseVideoUrl(exercise: Exercise): string {
  if (exercise.videoUrl && exercise.videoUrl.trim() !== '') {
    return exercise.videoUrl;
  }

  // Return a placeholder or default video based on exercise type
  // For now, return a generic fitness video placeholder
  return 'https://via.placeholder.com/300x200/33d6a6/ffffff?text=Exercise+Video';
}

/**
 * Gets exercise difficulty/intensity color based on RPE
 */
export function getRPEColor(rpe: number): string {
  if (rpe <= 3) { return '#33d6a6'; } // Easy - green
  if (rpe <= 6) { return '#ffa726'; } // Moderate - orange
  if (rpe <= 8) { return '#ff9800'; } // Hard - deep orange
  return '#ff6b47'; // Very hard - red
}

/**
 * Gets RPE description
 */
export function getRPEDescription(rpe: number): string {
  if (rpe <= 2) { return 'Very Easy'; }
  if (rpe <= 4) { return 'Easy'; }
  if (rpe <= 6) { return 'Moderate'; }
  if (rpe <= 8) { return 'Hard'; }
  return 'Very Hard';
}
