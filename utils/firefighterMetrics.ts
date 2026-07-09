/**
 * Firefighter-Specific Performance Metrics & Benchmarks
 * Based on CPAT (Candidate Physical Ability Test) standards and occupational research
 */

export interface FirefighterBenchmark {
  exerciseName: string;
  category: 'strength' | 'power' | 'endurance' | 'functional';
  jobApplication: string;
  standards: {
    minimal: { weight?: number; reps?: number; time?: string; distance?: string };
    proficient: { weight?: number; reps?: number; time?: string; distance?: string };
    elite: { weight?: number; reps?: number; time?: string; distance?: string };
  };
  cpatRelevance?: string;
}

/**
 * Firefighter Performance Benchmarks
 * Standards based on:
 * - CPAT testing requirements
 * - NFPA 1582 (Standard on Comprehensive Occupational Medical Program for Fire Departments)
 * - Tactical strength research for firefighters
 */
export const FIREFIGHTER_BENCHMARKS: FirefighterBenchmark[] = [
  // ========== CPAT-CRITICAL EXERCISES ==========
  {
    exerciseName: 'Step-Ups',
    category: 'endurance',
    jobApplication: 'Stair climbing with 50+ lbs of gear and SCBA',
    standards: {
      minimal: { reps: 60, time: '3 min' }, // ~20 steps per minute
      proficient: { reps: 90, time: '3 min' }, // ~30 steps per minute
      elite: { reps: 120, time: '3 min' }, // ~40 steps per minute
    },
    cpatRelevance: 'CPAT Stair Climb: 3 min on StairMaster wearing 50 lb vest',
  },
  {
    exerciseName: 'Farmer Carry',
    category: 'functional',
    jobApplication: 'Equipment carry, hose advancement, victim assist',
    standards: {
      minimal: { weight: 100, distance: '50 yards' }, // Total (50 lbs per hand)
      proficient: { weight: 150, distance: '100 yards' }, // (75 lbs per hand)
      elite: { weight: 200, distance: '150 yards' }, // (100 lbs per hand)
    },
    cpatRelevance: 'CPAT Equipment Carry: 50-70 lbs over distance',
  },
  {
    exerciseName: 'Deadlift',
    category: 'strength',
    jobApplication: 'Victim rescue from ground, equipment retrieval',
    standards: {
      minimal: { weight: 225, reps: 1 }, // 1.5x bodyweight (avg 150lb firefighter)
      proficient: { weight: 315, reps: 1 }, // 2x bodyweight
      elite: { weight: 405, reps: 1 }, // 2.5x+ bodyweight
    },
    cpatRelevance: 'CPAT Victim Drag: 165 lb dummy drag simulation',
  },
  {
    exerciseName: 'Sled Push',
    category: 'power',
    jobApplication: 'Forcible entry, breaching doors/walls',
    standards: {
      minimal: { weight: 100, distance: '30 yards' },
      proficient: { weight: 150, distance: '50 yards' },
      elite: { weight: 200, distance: '75 yards' },
    },
    cpatRelevance: 'CPAT Forcible Entry: Simulated door breach with 10 lb mallet',
  },

  // ========== STRENGTH BENCHMARKS ==========
  {
    exerciseName: 'Barbell Back Squat',
    category: 'strength',
    jobApplication: 'Lower body strength for carrying loads, victim rescue',
    standards: {
      minimal: { weight: 185, reps: 5 }, // ~1.25x bodyweight
      proficient: { weight: 225, reps: 5 }, // ~1.5x bodyweight
      elite: { weight: 315, reps: 5 }, // ~2x bodyweight
    },
  },
  {
    exerciseName: 'Barbell Bench Press',
    category: 'strength',
    jobApplication: 'Pushing power for breaching, ladder work',
    standards: {
      minimal: { weight: 135, reps: 5 }, // ~0.9x bodyweight
      proficient: { weight: 185, reps: 5 }, // ~1.25x bodyweight
      elite: { weight: 225, reps: 5 }, // ~1.5x bodyweight
    },
  },
  {
    exerciseName: 'Barbell Overhead Press',
    category: 'strength',
    jobApplication: 'Overhead work, ladder raises, ceiling operations',
    standards: {
      minimal: { weight: 95, reps: 5 }, // ~0.65x bodyweight
      proficient: { weight: 115, reps: 5 }, // ~0.75x bodyweight
      elite: { weight: 155, reps: 5 }, // ~1x bodyweight
    },
  },
  {
    exerciseName: 'Pull-Ups',
    category: 'strength',
    jobApplication: 'Climbing, pulling hoselines, self-rescue',
    standards: {
      minimal: { reps: 5 },
      proficient: { reps: 10 },
      elite: { reps: 20 },
    },
  },

  // ========== POWER & EXPLOSIVE ==========
  {
    exerciseName: 'Box Jump',
    category: 'power',
    jobApplication: 'Explosive power for clearing obstacles with gear',
    standards: {
      minimal: { distance: '24 inches', reps: 10 },
      proficient: { distance: '30 inches', reps: 10 },
      elite: { distance: '36 inches', reps: 10 },
    },
  },
  {
    exerciseName: 'Broad Jump',
    category: 'power',
    jobApplication: 'Horizontal power, emergency response agility',
    standards: {
      minimal: { distance: '6 feet' },
      proficient: { distance: '8 feet' },
      elite: { distance: '10 feet' },
    },
  },

  // ========== WORK CAPACITY & CONDITIONING ==========
  {
    exerciseName: 'Burpees',
    category: 'endurance',
    jobApplication: 'Rapid prone-to-standing transitions in full gear',
    standards: {
      minimal: { reps: 30, time: '2 min' }, // 15 per minute
      proficient: { reps: 50, time: '2 min' }, // 25 per minute
      elite: { reps: 70, time: '2 min' }, // 35 per minute
    },
  },
  {
    exerciseName: 'Kettlebell Swing',
    category: 'power',
    jobApplication: 'Hip power endurance, hoseline operations',
    standards: {
      minimal: { weight: 35, reps: 50, time: '2 min' }, // (women) / 53 lbs (men)
      proficient: { weight: 53, reps: 75, time: '2 min' },
      elite: { weight: 70, reps: 100, time: '2 min' },
    },
  },
  {
    exerciseName: 'Battle Ropes',
    category: 'endurance',
    jobApplication: 'Upper body endurance for extended hoseline work',
    standards: {
      minimal: { time: '30 sec continuous' },
      proficient: { time: '60 sec continuous' },
      elite: { time: '2 min continuous' },
    },
  },

  // ========== CORE & STABILITY ==========
  {
    exerciseName: 'Plank',
    category: 'endurance',
    jobApplication: 'Core stability for spine protection under load',
    standards: {
      minimal: { time: '60 sec' },
      proficient: { time: '2 min' },
      elite: { time: '4 min' },
    },
  },
];

/**
 * Get benchmark for specific exercise
 */
export function getFirefighterBenchmark(exerciseName: string): FirefighterBenchmark | null {
  return FIREFIGHTER_BENCHMARKS.find(b => 
    b.exerciseName.toLowerCase() === exerciseName.toLowerCase()
  ) || null;
}

/**
 * Evaluate user performance against firefighter standards
 */
export function evaluatePerformance(
  exerciseName: string,
  userWeight?: number,
  userReps?: number,
  _userTime?: string,
  _userDistance?: string
): {
  level: 'below-minimal' | 'minimal' | 'proficient' | 'elite';
  benchmark: FirefighterBenchmark | null;
  message: string;
  nextGoal: string;
} {
  const benchmark = getFirefighterBenchmark(exerciseName);
  
  if (!benchmark) {
    return {
      level: 'below-minimal',
      benchmark: null,
      message: 'No firefighter benchmark available for this exercise',
      nextGoal: 'Continue training to build functional fitness',
    };
  }

  // Evaluate based on weight (for strength exercises)
  if (userWeight !== undefined && benchmark.standards.minimal.weight) {
    if (userWeight >= (benchmark.standards.elite.weight || 0)) {
      return {
        level: 'elite',
        benchmark,
        message: `🔥 ELITE LEVEL! You're in the top tier of firefighter strength.`,
        nextGoal: `Maintain and build endurance at ${userWeight}+ lbs`,
      };
    } else if (userWeight >= (benchmark.standards.proficient.weight || 0)) {
      return {
        level: 'proficient',
        benchmark,
        message: `💪 Proficient! You meet firefighter operational standards.`,
        nextGoal: `Work toward ${benchmark.standards.elite.weight} lbs for elite status`,
      };
    } else if (userWeight >= (benchmark.standards.minimal.weight || 0)) {
      return {
        level: 'minimal',
        benchmark,
        message: `✅ Minimal standard met. Keep building strength.`,
        nextGoal: `Progress to ${benchmark.standards.proficient.weight} lbs`,
      };
    } else {
      return {
        level: 'below-minimal',
        benchmark,
        message: `⚠️ Below minimal standard. Focus on progressive overload.`,
        nextGoal: `Work toward ${benchmark.standards.minimal.weight} lbs`,
      };
    }
  }

  // Evaluate based on reps (for bodyweight/endurance exercises)
  if (userReps !== undefined && benchmark.standards.minimal.reps) {
    if (userReps >= (benchmark.standards.elite.reps || 0)) {
      return {
        level: 'elite',
        benchmark,
        message: `🔥 ELITE LEVEL! Outstanding work capacity.`,
        nextGoal: `Maintain and add complexity (weight, tempo variations)`,
      };
    } else if (userReps >= (benchmark.standards.proficient.reps || 0)) {
      return {
        level: 'proficient',
        benchmark,
        message: `💪 Proficient! You have solid firefighter work capacity.`,
        nextGoal: `Aim for ${benchmark.standards.elite.reps} reps`,
      };
    } else if (userReps >= (benchmark.standards.minimal.reps || 0)) {
      return {
        level: 'minimal',
        benchmark,
        message: `✅ Minimal standard met. Continue building volume.`,
        nextGoal: `Progress to ${benchmark.standards.proficient.reps} reps`,
      };
    } else {
      return {
        level: 'below-minimal',
        benchmark,
        message: `⚠️ Below minimal standard. Focus on technique and volume.`,
        nextGoal: `Work toward ${benchmark.standards.minimal.reps} reps`,
      };
    }
  }

  // Default fallback
  return {
    level: 'below-minimal',
    benchmark,
    message: 'Log more data to track your progress against firefighter standards',
    nextGoal: 'Continue consistent training',
  };
}

/**
 * Get CPAT preparation recommendations based on current fitness level
 */
export function getCPATReadiness(userPRs: { exerciseName: string; weight?: number; reps?: number }[]): {
  readinessScore: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
} {
  const cpatCriticalExercises = FIREFIGHTER_BENCHMARKS.filter(b => b.cpatRelevance);
  let totalScore = 0;
  let evaluatedCount = 0;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  cpatCriticalExercises.forEach(benchmark => {
    const userPR = userPRs.find(pr => 
      pr.exerciseName.toLowerCase() === benchmark.exerciseName.toLowerCase()
    );

    if (userPR) {
      const evaluation = evaluatePerformance(
        benchmark.exerciseName,
        userPR.weight,
        userPR.reps
      );

      evaluatedCount++;

      if (evaluation.level === 'elite') {
        totalScore += 100;
        strengths.push(`${benchmark.exerciseName}: Elite level`);
      } else if (evaluation.level === 'proficient') {
        totalScore += 75;
        strengths.push(`${benchmark.exerciseName}: Proficient`);
      } else if (evaluation.level === 'minimal') {
        totalScore += 50;
        recommendations.push(`Improve ${benchmark.exerciseName} - ${evaluation.nextGoal}`);
      } else {
        totalScore += 25;
        weaknesses.push(`${benchmark.exerciseName}: Below standard`);
        recommendations.push(`PRIORITY: ${evaluation.nextGoal}`);
      }
    } else {
      // No data for this exercise
      weaknesses.push(`${benchmark.exerciseName}: No data logged`);
      recommendations.push(`Test and log your ${benchmark.exerciseName} baseline`);
    }
  });

  const readinessScore = evaluatedCount > 0 ? Math.round(totalScore / evaluatedCount) : 0;

  // Add overall recommendations based on score
  if (readinessScore >= 75) {
    recommendations.unshift('🔥 You\'re CPAT-ready! Focus on maintaining fitness and practicing test events.');
  } else if (readinessScore >= 50) {
    recommendations.unshift('💪 Good foundation! Focus on weak areas and test simulation workouts.');
  } else {
    recommendations.unshift('⚠️ Build your baseline. Focus on fundamental strength and work capacity.');
  }

  return {
    readinessScore,
    strengths: strengths.length > 0 ? strengths : ['Continue building your baseline fitness'],
    weaknesses: weaknesses.length > 0 ? weaknesses : ['No significant weaknesses identified'],
    recommendations,
  };
}

/**
 * Get firefighter-specific workout focus based on performance gaps
 */
export function getTrainingPriorities(userPRs: { exerciseName: string; weight?: number; reps?: number }[]): {
  topPriority: string;
  secondaryPriorities: string[];
  maintainAreas: string[];
} {
  const evaluations = userPRs.map(pr => ({
    exercise: pr.exerciseName,
    ...evaluatePerformance(pr.exerciseName, pr.weight, pr.reps),
  }));

  const belowMinimal = evaluations.filter(e => e.level === 'below-minimal');
  const minimal = evaluations.filter(e => e.level === 'minimal');
  const proficient = evaluations.filter(e => e.level === 'proficient');
  const elite = evaluations.filter(e => e.level === 'elite');

  let topPriority = 'Build foundational strength and work capacity';
  const secondaryPriorities: string[] = [];
  const maintainAreas: string[] = [];

  if (belowMinimal.length > 0) {
    topPriority = `Focus on ${belowMinimal[0].exercise} - currently below firefighter standards`;
    belowMinimal.slice(1, 3).forEach(e => {
      secondaryPriorities.push(`Improve ${e.exercise}`);
    });
  } else if (minimal.length > 0) {
    topPriority = `Progress ${minimal[0].exercise} to proficient level`;
    minimal.slice(1, 3).forEach(e => {
      secondaryPriorities.push(`Advance ${e.exercise}`);
    });
  } else if (proficient.length > 0) {
    topPriority = `Push ${proficient[0].exercise} to elite status`;
    proficient.slice(1, 3).forEach(e => {
      secondaryPriorities.push(`Optimize ${e.exercise}`);
    });
  }

  elite.forEach(e => {
    maintainAreas.push(`${e.exercise} (elite)`);
  });
  proficient.slice(3).forEach(e => {
    maintainAreas.push(`${e.exercise} (proficient)`);
  });

  return {
    topPriority,
    secondaryPriorities,
    maintainAreas: maintainAreas.length > 0 ? maintainAreas : ['Continue building strengths'],
  };
}
