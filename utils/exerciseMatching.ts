/**
 * Exercise matching utilities for AI-generated programs
 */

import { exercises } from '../data/exercises';
import type { Exercise } from '../types/Exercise';

/**
 * Get curated list of exercises filtered by equipment
 * Returns most common/useful exercises for AI selection
 * OPTIMIZED FOR FIREFIGHTER OCCUPATIONAL DEMANDS
 */
export function getCuratedExerciseList(userEquipment: string[]): Exercise[] {
  // TIER 1: Firefighter-Specific Functional Movements (Job-Critical)
  const firefighterCritical = [
    'Farmer Carry',           // Hose/equipment carries
    'Tire Flip',              // Explosive power for equipment manipulation
    'Sled Push',              // Forceful displacement similar to breaching
    'Sled Drag',              // Dragging victims/equipment
    'Step-Ups',               // Stair climbing with gear
    'Box Jump',               // Explosive power for obstacles
    'Broad Jumps',            // Horizontal power
    'Bear Crawl',             // Low crawling in smoke
    'Burpees',                // Get up/down with gear
    'Hammer Strike',          // Tool work endurance
    'Battle Ropes',           // Upper body endurance for hoseline work
  ];

  // TIER 2: Foundational Strength (Core Firefighter Strength)
  const foundationalStrength = [
    'Barbell Back Squat',     // Leg strength for carrying victims
    'Barbell Front Squat',    // Front-loaded carrying positions
    'Barbell Deadlift',       // Ground-to-standing lifts (victim rescue)
    'Romanian Deadlift',      // Posterior chain for lifting mechanics
    'Trap Bar Deadlift',      // Safer alternative for high-rep conditioning
    'Barbell Bench Press',    // Pushing power (breaching, ladder work)
    'Barbell Overhead Press', // Overhead strength (ceiling work, ladder raises)
    'Barbell Row',            // Pulling strength (hoselines, forcible entry)
    'Pull-Ups',               // Climbing, pulling bodyweight + gear
    'Chin-Ups',               // Grip endurance variation
  ];

  // TIER 3: Work Capacity & Conditioning (Sustain Performance Under Fatigue)
  const workCapacity = [
    'Kettlebell Swing',       // Hip power, cardiovascular endurance
    'Turkish Get-Up',         // Full-body coordination under load
    'Thrusters',              // Full-body power endurance
    'Clean and Press',        // Explosive total-body movement
    'Push Press',             // Overhead power with leg drive
    'Renegade Rows',          // Anti-rotation strength + endurance
    'Mountain Climbers',      // Core endurance, hip mobility
    'Jump Rope',              // Footwork, cardiovascular conditioning
    'High Knees',             // Coordination, cardiovascular
    'Lateral Shuffles',       // Agility, change of direction
  ];

  // TIER 4: Core & Stability (Protect Spine Under Load)
  const coreStability = [
    'Plank',                  // Anti-extension
    'Side Plank',             // Anti-lateral flexion
    'Pallof Press',           // Anti-rotation
    'Dead Bug',               // Coordinated core control
    'Bird Dog',               // Anti-rotation, posterior chain
    'Russian Twist',          // Rotational endurance
    'Hanging Knee Raises',    // Core + grip
    'Ab Wheel Rollout',       // Anti-extension under load
  ];

  // TIER 5: Accessory Movements (Injury Prevention & Balance)
  const accessoryMovements = [
    'Dumbbell Bench Press',
    'Dumbbell Row',
    'Dumbbell Shoulder Press',
    'Goblet Squat',
    'Dumbbell Lunges',
    'Dumbbell Romanian Deadlift',
    'Face Pulls',
    'Lat Pulldown',
    'Seated Cable Row',
    'Tricep Dips',
    'Push-Ups',
    'Diamond Push-Ups',
    'Incline Push-Ups',
    'Decline Push-Ups',
    'Inverted Row',
  ];

  // Combine all priority tiers
  const priorityExercises = [
    ...firefighterCritical,
    ...foundationalStrength,
    ...workCapacity,
    ...coreStability,
    ...accessoryMovements,
  ];

  // Normalize equipment strings for comparison
  const normalizedUserEquip = userEquipment.map(e => e.toLowerCase().trim());
  
  // Filter exercises by user's available equipment
  const filtered = exercises.filter(ex => {
    if (!ex.equipment) return false;
    
    const exEquip = ex.equipment.toLowerCase();
    
    // Always include bodyweight exercises
    if (exEquip.includes('bodyweight') || exEquip.includes('none')) {
      return true;
    }
    
    // Check if user has this equipment
    return normalizedUserEquip.some(userEq => {
      // Handle plural/singular variations
      if (userEq.includes('dumbbell') && exEquip.includes('dumbbell')) return true;
      if (userEq.includes('barbell') && exEquip.includes('barbell')) return true;
      if (userEq.includes('kettlebell') && exEquip.includes('kettlebell')) return true;
      if (userEq.includes('band') && exEquip.includes('band')) return true;
      if (userEq.includes('cable') && exEquip.includes('cable')) return true;
      if (userEq.includes('machine') && exEquip.includes('machine')) return true;
      if (userEq.includes('box') && exEquip.includes('box')) return true;
      if (userEq.includes('rope') && exEquip.includes('rope')) return true;
      if (userEq.includes('sled') && exEquip.includes('sled')) return true;
      if (userEq.includes('tire') && exEquip.includes('tire')) return true;
      if (userEq.includes('pull-up bar') && exEquip.includes('pull-up')) return true;
      return userEq === exEquip;
    });
  });

  // Prioritize exercises from our priority list (maintains firefighter-specific ordering)
  const priority = filtered.filter(ex => priorityExercises.includes(ex.name));
  const others = filtered.filter(ex => !priorityExercises.includes(ex.name));

  // Combine: priority first (firefighter-critical movements at top), then others
  // Limit to 100 exercises for optimal AI performance (expanded from 75 for better variety)
  const combined = [...priority, ...others].slice(0, 100);

  console.log(`🚒 Curated ${combined.length} exercises for firefighter training (from ${exercises.length} total)`);
  console.log(`🏋️ Equipment available: ${userEquipment.join(', ')}`);
  console.log(`🔥 Firefighter-critical movements: ${priority.filter(ex => firefighterCritical.includes(ex.name)).length}`);
  
  return combined;
}

/**
 * Get firefighter-specific exercise guidance for AI prompts
 * Returns structured information about exercise priorities and job-specific applications
 */
export function getFirefighterExerciseGuidance(): {
  criticalMovements: string[];
  movementPatterns: { [key: string]: string[] };
  jobApplications: { [key: string]: string };
  performanceMetrics: string[];
} {
  return {
    criticalMovements: [
      'Farmer Carry (equipment/hose carries)',
      'Step-Ups (stair climbing with gear)',
      'Deadlift variations (victim rescue lifts)',
      'Overhead pressing (ladder work)',
      'Pulling movements (hoseline operations)',
      'Burpees (rapid up/down with gear)',
      'Core stability (spine protection under load)',
    ],
    movementPatterns: {
      pushing: ['Bench Press', 'Overhead Press', 'Push-Ups', 'Dips', 'Sled Push'],
      pulling: ['Pull-Ups', 'Rows', 'Lat Pulldown', 'Face Pulls', 'Sled Drag'],
      squatting: ['Back Squat', 'Front Squat', 'Goblet Squat', 'Step-Ups'],
      hinging: ['Deadlift', 'Romanian Deadlift', 'Kettlebell Swing'],
      carrying: ['Farmer Carry', 'Sled Drag', 'Bear Crawl'],
      explosive: ['Box Jump', 'Broad Jump', 'Clean', 'Push Press', 'Tire Flip'],
      core: ['Plank', 'Pallof Press', 'Dead Bug', 'Anti-rotation work'],
      conditioning: ['Burpees', 'Jump Rope', 'Battle Ropes', 'Mountain Climbers', 'HIIT circuits'],
    },
    jobApplications: {
      'Farmer Carry': 'Simulates carrying hoses, equipment, or assisting victims over distance',
      'Step-Ups': 'Replicates stair climbing with 50+ lbs of gear and SCBA',
      'Deadlift': 'Ground-to-standing victim lifts, equipment retrieval',
      'Sled Push/Drag': 'Forceful displacement, dragging victims or equipment',
      'Overhead Press': 'Ceiling work, ladder raises, overhead tool manipulation',
      'Pull-Ups/Rows': 'Hoseline pulls, forcible entry, climbing operations',
      'Burpees': 'Rapid transitions from prone to standing in full gear',
      'Box Jump': 'Explosive power for clearing obstacles with gear',
      'Core Work': 'Spinal protection during asymmetric loads and awkward positions',
      'Battle Ropes': 'Upper body endurance for extended hoseline operations',
      'Tire Flip': 'Explosive full-body power for equipment manipulation',
    },
    performanceMetrics: [
      'CPAT preparation (Candidate Physical Ability Test)',
      'Work capacity under fatigue (sustained performance during long calls)',
      'Injury prevention (lower back, shoulders, knees)',
      'Grip endurance (tool work, hoseline operations)',
      'Cardiovascular fitness (VO2max for SCBA work)',
      'Functional strength (real-world load bearing)',
      'Power output (explosive movements in emergencies)',
    ],
  };
}

/**
 * Calculate similarity between two strings (Levenshtein distance)
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Calculate distances
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // deletion
        matrix[i][j - 1] + 1,     // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Find best matching exercise from library using fuzzy matching
 */
export function findBestExerciseMatch(aiGeneratedName: string): Exercise | null {
  if (!aiGeneratedName || aiGeneratedName.trim() === '') {
    return null;
  }

  const searchName = aiGeneratedName.toLowerCase().trim();
  
  // First try: Exact match (case insensitive)
  let match = exercises.find(ex => ex.name.toLowerCase() === searchName);
  if (match) {
    console.log(`✅ Exact match: "${aiGeneratedName}" -> "${match.name}"`);
    return match;
  }

  // Second try: Contains match
  match = exercises.find(ex => 
    ex.name.toLowerCase().includes(searchName) || 
    searchName.includes(ex.name.toLowerCase())
  );
  if (match) {
    console.log(`✅ Contains match: "${aiGeneratedName}" -> "${match.name}"`);
    return match;
  }

  // Third try: Fuzzy match with Levenshtein distance
  let bestMatch: Exercise | null = null;
  let bestDistance = Infinity;

  for (const ex of exercises) {
    const distance = levenshteinDistance(searchName, ex.name.toLowerCase());
    const maxLength = Math.max(searchName.length, ex.name.length);
    const similarity = 1 - (distance / maxLength);

    // If similarity > 70%, consider it a match
    if (similarity > 0.7 && distance < bestDistance) {
      bestDistance = distance;
      bestMatch = ex;
    }
  }

  if (bestMatch) {
    console.log(`⚠️ Fuzzy match: "${aiGeneratedName}" -> "${bestMatch.name}" (distance: ${bestDistance})`);
    return bestMatch;
  }

  // No match found
  console.error(`❌ No match found for: "${aiGeneratedName}"`);
  return null;
}

/**
 * Convert exercise name to ID format (for backward compatibility)
 */
export function nameToId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_');
}

/**
 * Resolve exercise by ID or name, with fuzzy fallback
 */
export function resolveExercise(idOrName: string): Exercise | null {
  if (!idOrName) return null;

  // Try ID lookup first
  let exercise = exercises.find(ex => ex.id === idOrName);
  if (exercise) return exercise;

  // Try name-based ID lookup (convert name to ID format)
  const nameBasedId = nameToId(idOrName);
  exercise = exercises.find(ex => nameToId(ex.name) === nameBasedId);
  if (exercise) return exercise;

  // Try direct name match
  exercise = exercises.find(ex => ex.name.toLowerCase() === idOrName.toLowerCase());
  if (exercise) return exercise;

  // Last resort: fuzzy match
  return findBestExerciseMatch(idOrName);
}

/**
 * Export all firefighter-specific utilities
 */
export { FIREFIGHTER_BENCHMARKS, getFirefighterBenchmark, evaluatePerformance, getCPATReadiness, getTrainingPriorities } from './firefighterMetrics';

