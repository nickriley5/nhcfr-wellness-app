/**
 * Coaching Service
 * Utilities for fetching workout history and generating coaching advice
 */

import { auth, db } from '../firebase';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { getWorkoutAdjustments } from './ai/aiService';

/**
 * Get the last completed workout with feedback
 */
export async function getLastWorkoutWithFeedback(): Promise<{
  completedAt: string;
  exercises: Array<{
    name: string;
    sets: number;
    reps?: number;
    weight?: number;
    completed: boolean;
  }>;
  feedback?: {
    feeling: string;
    note?: string;
  };
} | null> {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;

  try {
    // Query the most recent workout log with feedback
    const workoutLogsQuery = query(
      collection(db, 'users', uid, 'workoutLogs'),
      orderBy('completedAt', 'desc'),
      limit(5) // Get last 5 to find one with feedback
    );

    const snapshot = await getDocs(workoutLogsQuery);
    
    // Find the first one with feedback
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.feedback && data.feedback.feeling) {
        return {
          completedAt: data.completedAt,
          exercises: data.exercises || [],
          feedback: {
            feeling: data.feedback.feeling,
            note: data.feedback.note || '',
          },
        };
      }
    }

    // If no feedback found, return the most recent workout anyway
    if (!snapshot.empty) {
      const mostRecent = snapshot.docs[0].data();
      return {
        completedAt: mostRecent.completedAt,
        exercises: mostRecent.exercises || [],
        feedback: undefined,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching last workout:', error);
    return null;
  }
}

/**
 * Generate coaching advice for the current workout based on last session
 */
export async function generateCoachingAdvice(scheduledWorkout: {
  dayName: string;
  focus: string;
  exercises: Array<{
    name: string;
    sets: number;
    reps: string;
    restSeconds: number;
  }>;
}, programContext: {
  currentWeek: number;
  totalWeeks: number;
  goal: string;
  phase: string;
}): Promise<{
  shouldAdjust: boolean;
  coachingAdvice: string;
  adjustedWorkout?: {
    exercises: Array<{
      name: string;
      sets: number;
      reps: string;
      restSeconds: number;
      notes?: string;
    }>;
  };
  reasoning: string;
} | null> {
  try {
    const lastWorkout = await getLastWorkoutWithFeedback();
    
    // If no last workout or no feedback, don't generate advice
    if (!lastWorkout || !lastWorkout.feedback) {
      console.log('No coaching advice: No recent workout with feedback');
      return null;
    }

    // Check if the feedback warrants coaching (not "Good" or "Strong")
    const feeling = lastWorkout.feedback.feeling.toLowerCase();
    const needsAdvice = feeling.includes('exhausted') || 
                        feeling.includes('tough') || 
                        feeling.includes('okay') ||
                        lastWorkout.feedback.note?.trim();

    if (!needsAdvice) {
      console.log('No coaching advice: User feeling good');
      return null;
    }

    // Generate AI-powered coaching adjustments
    const adjustments = await getWorkoutAdjustments({
      lastWorkout,
      scheduledWorkout,
      programContext,
    });

    return adjustments;
  } catch (error) {
    console.error('Error generating coaching advice:', error);
    return null;
  }
}

/**
 * Check if a coaching session should be shown (once per workout)
 */
export function shouldShowCoaching(workoutId: string): boolean {
  // Use sessionStorage-like mechanism to track if coaching was shown
  // For React Native, we'll track this in the component state
  // This is just a helper to determine logic
  return true; // Component will handle the actual state
}
