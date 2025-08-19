import type { ProgramTemplate } from '../types';

export const firefighter_hybrid_6week: ProgramTemplate = {
  id: 'firefighter_hybrid_6week',
  name: 'Firefighter Hybrid Training (6-Week)',
  durationWeeks: 6,
  daysPerWeek: 4,
  description: 'Progressive hybrid program combining strength, conditioning, and work capacity for operational readiness. Perfect for firefighters and tactical athletes.',
  days: [
    // WEEK 1
    {
      week: 1,
      day: 1,
      title: 'Strength Foundation',
      priority: 1,
      type: 'training',
      phase: 'Volume',
      warmup: [
        { id: 'arm_circle', sets: 2, repsOrDuration: '10 each direction', rpe: 3 },
        { id: '9b5bdbf6f49e478e8444c4a8616a594e', sets: 2, repsOrDuration: '15 reps', rpe: 4 }, // Bodyweight Squat
        { id: 'd68572790c034f40afbd39433926bc96', sets: 2, repsOrDuration: '15 reps', rpe: 4 }, // Glute Bridge
      ],
      exercises: [
        {
          id: '9b5bdbf6f49e478e8444c4a8616a594e', // Bodyweight Squat (verified real ID)
          sets: 3,
          repsOrDuration: '12 reps',
          rpe: 7,
          tags: ['legs', 'functional'],
          replacements: ['d39835ca44974225aec0dd225dfd1488', '2227e83231e640e79270d5f86cb15c2f'], // Bulgarian Split Squat, Jump Squats
        },
        {
          id: '92dd1f1400f44ebf89be03da8249a03a', // Push-Ups (verified real ID)
          sets: 3,
          repsOrDuration: '10-15 reps',
          rpe: 7,
          tags: ['push', 'bodyweight'],
          replacements: ['71bd492a76ea406ebf9314bc2e2d3b7e', 'd4fad6729b0548159e9bf3872c7d9e3b'], // Diamond Push-Ups, Decline Push-Ups
        },
        {
          id: '9f162328a5434638989a63b9251b9f3a', // Reverse Lunge (verified real ID)
          sets: 3,
          repsOrDuration: '12 reps',
          rpe: 7,
          tags: ['pull', 'back'],
          replacements: ['ac171422a1b14732857cf35be90d74b2', 'd39835ca44974225aec0dd225dfd1488'], // Jumping Lunges, Bulgarian Split Squat
        },
        {
          id: 'fcc13cf6cc3f4a39970187e732b33e64', // Plank (verified real ID)
          sets: 3,
          repsOrDuration: '30-45 sec',
          rpe: 6,
          tags: ['core', 'stability'],
          replacements: ['a53bdf65c7f64767bee6d113c6a544cc', 'cabcf53d38034628aa74848e97eb33fa'], // Side Plank, Hollow Body Hold
        },
        {
          id: 'e80844ef7445418c987deea6641ce22e', // Farmer's Carries (verified real ID)
          sets: 3,
          repsOrDuration: '30 sec',
          rpe: 7,
          tags: ['carry', 'functional'],
          replacements: ['3dc3ed9c502a416592abcd207e8bc51f', 'd68572790c034f40afbd39433926bc96'], // Wall Sit, Glute Bridge
        },
      ],
      cooldown: [
        { id: 'walking', sets: 1, repsOrDuration: '5 min easy pace', rpe: 3 },
        { id: 'child_pose_stretch', sets: 1, repsOrDuration: '1 min', rpe: 2 },
        { id: 'hip_flexor_stretch', sets: 1, repsOrDuration: '1 min each leg', rpe: 2 },
      ],
    },
    {
      week: 1,
      day: 2,
      title: 'Conditioning Base',
      priority: 2,
      type: 'training',
      phase: 'Volume',
      warmup: [
        { id: 'jumping_jacks', sets: 2, repsOrDuration: '30 sec', rpe: 4 },
        { id: '6544f999050d4eaa9de64d3d1fe43ffc', sets: 2, repsOrDuration: '20 sec', rpe: 4 }, // High Knees
        { id: 'butt_kicks', sets: 2, repsOrDuration: '20 sec', rpe: 4 },
      ],
      exercises: [
        {
          id: '6544f999050d4eaa9de64d3d1fe43ffc', // High Knees (verified real ID)
          sets: 4,
          repsOrDuration: '2 min work, 1 min rest',
          rpe: 6,
          tags: ['cardio', 'full_body'],
          replacements: ['3d05fd6ffbb64691b892b13cdc6d98ff', '2da1345993f947bc858c50e3f09563c1'], // Mountain Climbers, Flutter Kicks
        },
        {
          id: '3d05fd6ffbb64691b892b13cdc6d98ff', // Mountain Climbers (verified real ID)
          sets: 3,
          repsOrDuration: '30 sec',
          rpe: 7,
          tags: ['cardio', 'core'],
          replacements: ['6544f999050d4eaa9de64d3d1fe43ffc', '2da1345993f947bc858c50e3f09563c1'], // High Knees, Flutter Kicks
        },
        {
          id: '2227e83231e640e79270d5f86cb15c2f', // Jump Squats (verified real ID)
          sets: 3,
          repsOrDuration: '20 reps',
          rpe: 7,
          tags: ['power', 'legs'],
          replacements: ['9b5bdbf6f49e478e8444c4a8616a594e', '25aef4fb46f74fabb92c69334cc7edc4'], // Bodyweight Squat, Broad Jumps
        },
        {
          id: 'e3a5b94933474fd3b9156f0fe030e3ee', // Burpees (verified real ID)
          sets: 3,
          repsOrDuration: '8-12 reps',
          rpe: 8,
          tags: ['cardio', 'full_body'],
          replacements: ['3d05fd6ffbb64691b892b13cdc6d98ff', '92dd1f1400f44ebf89be03da8249a03a'], // Mountain Climbers, Push-Ups
        },
      ],
      cooldown: [
        { id: 'walking', sets: 1, repsOrDuration: '10 min slow pace', rpe: 3 },
        { id: 'quad_stretch', sets: 1, repsOrDuration: '1 min each leg', rpe: 2 },
        { id: 'calf_stretch', sets: 1, repsOrDuration: '1 min each leg', rpe: 2 },
      ],
    },
    {
      week: 1,
      day: 3,
      title: 'Functional Strength',
      priority: 3,
      type: 'training',
      phase: 'Strength',
      warmup: [
        { id: 'arm_swings', sets: 2, repsOrDuration: '10 each direction', rpe: 3 },
        { id: 'leg_swings', sets: 2, repsOrDuration: '10 each leg', rpe: 3 },
        { id: 'torso_twist', sets: 2, repsOrDuration: '10 each direction', rpe: 3 },
      ],
      exercises: [
        {
          id: '9b5bdbf6f49e478e8444c4a8616a594e', // Bodyweight Squat (verified real ID)
          sets: 4,
          repsOrDuration: '8 reps',
          rpe: 7,
          tags: ['legs', 'posterior'],
          replacements: ['d39835ca44974225aec0dd225dfd1488', '2227e83231e640e79270d5f86cb15c2f'], // Bulgarian Split Squat, Jump Squats
        },
        {
          id: '916c972c91f040c7b27e3d1b8305b1d5', // Pike Push-Ups (verified real ID)
          sets: 3,
          repsOrDuration: '10 reps',
          rpe: 7,
          tags: ['push', 'vertical'],
          replacements: ['fd42038c774944c38bedbfe0d6d13182', '92dd1f1400f44ebf89be03da8249a03a'], // Handstand Push-Ups, Push-Ups
        },
        {
          id: '92dd1f1400f44ebf89be03da8249a03a', // Push-Ups (verified real ID)
          sets: 3,
          repsOrDuration: '5-10 reps',
          rpe: 8,
          tags: ['push', 'vertical'],
          replacements: ['71bd492a76ea406ebf9314bc2e2d3b7e', 'd4fad6729b0548159e9bf3872c7d9e3b'], // Diamond Push-Ups, Decline Push-Ups
        },
        {
          id: '73bdd1b8fc104ae79e26da0ff0a7b7db', // Single-Leg Glute Bridge (verified real ID)
          sets: 3,
          repsOrDuration: '8 each leg',
          rpe: 6,
          tags: ['unilateral', 'glutes'],
          replacements: ['d68572790c034f40afbd39433926bc96', '24967aab5df74da6912a9e19ffa392a2'], // Glute Bridge, Bird Dog
        },
        {
          id: 'a53bdf65c7f64767bee6d113c6a544cc', // Side Plank (verified real ID)
          sets: 2,
          repsOrDuration: '20-30 sec each side',
          rpe: 6,
          tags: ['core', 'lateral'],
          replacements: ['fcc13cf6cc3f4a39970187e732b33e64', 'cabcf53d38034628aa74848e97eb33fa'], // Plank, Hollow Body Hold
        },
      ],
      cooldown: [
        { id: 'walking', sets: 1, repsOrDuration: '5 min', rpe: 3 },
        { id: 'pigeon_pose', sets: 1, repsOrDuration: '1 min each side', rpe: 2 },
        { id: 'seated_spinal_twist', sets: 1, repsOrDuration: '1 min each side', rpe: 2 },
      ],
    },
    {
      week: 1,
      day: 4,
      title: 'Work Capacity',
      priority: 4,
      type: 'training',
      phase: 'Volume',
      warmup: [
        { id: 'light_jogging', sets: 1, repsOrDuration: '5 min', rpe: 4 },
        { id: 'dynamic_stretching', sets: 1, repsOrDuration: '5 min', rpe: 3 },
      ],
      exercises: [
        {
          id: 'e3a5b94933474fd3b9156f0fe030e3ee', // Burpees (verified real ID)
          sets: 3,
          repsOrDuration: '12 min AMRAP: 5 burpees, 10 squats, 15 push-ups',
          rpe: 7,
          tags: ['circuit', 'metabolic'],
          replacements: ['3d05fd6ffbb64691b892b13cdc6d98ff', '9b5bdbf6f49e478e8444c4a8616a594e'], // Mountain Climbers, Bodyweight Squat
        },
        {
          id: '0dca3ee6ce5247aba713fe2d7ee4c962', // Battle Ropes (verified real ID)
          sets: 3,
          repsOrDuration: '30 sec work, 30 sec rest',
          rpe: 8,
          tags: ['cardio', 'arms'],
          replacements: ['6544f999050d4eaa9de64d3d1fe43ffc', '3d05fd6ffbb64691b892b13cdc6d98ff'], // High Knees, Mountain Climbers
        },
        {
          id: '09f4a00ba8594ee9bdc4c7a7dd1934d3', // Step-Ups (verified real ID)
          sets: 3,
          repsOrDuration: '45 sec',
          rpe: 6,
          tags: ['legs', 'cardio'],
          replacements: ['9b5bdbf6f49e478e8444c4a8616a594e', '2227e83231e640e79270d5f86cb15c2f'], // Bodyweight Squat, Jump Squats
        },
        {
          id: '25aef4fb46f74fabb92c69334cc7edc4', // Broad Jumps (verified real ID)
          sets: 3,
          repsOrDuration: '15 reps',
          rpe: 8,
          tags: ['power', 'core'],
          replacements: ['2227e83231e640e79270d5f86cb15c2f', '8c7091baa9944a62a646e73fe27b32c6'], // Jump Squats, Tuck Jumps
        },
      ],
      cooldown: [
        { id: 'walking', sets: 1, repsOrDuration: '10 min', rpe: 3 },
        { id: 'full_body_stretch_routine', sets: 1, repsOrDuration: '10 min', rpe: 2 },
      ],
    },

    // WEEK 2 - Progression
    {
      week: 2,
      day: 1,
      title: 'Strength Progression',
      priority: 1,
      type: 'training',
      phase: 'Strength',
      warmup: [
        { id: 'arm_circle', sets: 2, repsOrDuration: '10 each direction', rpe: 3 },
        { id: '9b5bdbf6f49e478e8444c4a8616a594e', sets: 2, repsOrDuration: '20 reps', rpe: 4 }, // Bodyweight Squat
        { id: 'd68572790c034f40afbd39433926bc96', sets: 2, repsOrDuration: '20 reps', rpe: 4 }, // Glute Bridge
      ],
      exercises: [
        {
          id: '9b5bdbf6f49e478e8444c4a8616a594e', // Bodyweight Squat (verified real ID)
          sets: 4,
          repsOrDuration: '15 reps',
          rpe: 7,
          tags: ['legs', 'functional'],
          replacements: ['2227e83231e640e79270d5f86cb15c2f', 'd39835ca44974225aec0dd225dfd1488'], // Jump Squats, Bulgarian Split Squat
        },
        {
          id: '92dd1f1400f44ebf89be03da8249a03a', // Push-Ups (verified real ID)
          sets: 4,
          repsOrDuration: '12-18 reps',
          rpe: 7,
          tags: ['push', 'bodyweight'],
          replacements: ['71bd492a76ea406ebf9314bc2e2d3b7e', 'd4fad6729b0548159e9bf3872c7d9e3b'], // Diamond Push-Ups, Decline Push-Ups
        },
        {
          id: '9f162328a5434638989a63b9251b9f3a', // Reverse Lunge (verified real ID)
          sets: 4,
          repsOrDuration: '15 reps',
          rpe: 7,
          tags: ['pull', 'back'],
          replacements: ['ac171422a1b14732857cf35be90d74b2', 'd39835ca44974225aec0dd225dfd1488'], // Jumping Lunges, Bulgarian Split Squat
        },
        {
          id: 'fcc13cf6cc3f4a39970187e732b33e64', // Plank (verified real ID)
          sets: 3,
          repsOrDuration: '45-60 sec',
          rpe: 7,
          tags: ['core', 'stability'],
          replacements: ['a53bdf65c7f64767bee6d113c6a544cc', '24967aab5df74da6912a9e19ffa392a2'], // Side Plank, Bird Dog
        },
        {
          id: 'e80844ef7445418c987deea6641ce22e', // Farmer's Carries (verified real ID)
          sets: 4,
          repsOrDuration: '45 sec',
          rpe: 7,
          tags: ['carry', 'functional'],
          replacements: ['3dc3ed9c502a416592abcd207e8bc51f', 'd68572790c034f40afbd39433926bc96'], // Wall Sit, Glute Bridge
        },
      ],
      cooldown: [
        { id: 'walking', sets: 1, repsOrDuration: '5 min easy pace', rpe: 3 },
        { id: 'child_pose_stretch', sets: 1, repsOrDuration: '1 min', rpe: 2 },
        { id: 'hip_flexor_stretch', sets: 1, repsOrDuration: '1 min each leg', rpe: 2 },
      ],
    },

    // WEEK 3 - Strength & Power Development
    {
      week: 3,
      day: 1,
      title: 'Power & Explosiveness',
      priority: 1,
      type: 'training',
      phase: 'Strength',
      warmup: [
        { id: 'dynamic_warmup', sets: 1, repsOrDuration: '8 min', rpe: 4 },
        { id: 'activation_exercises', sets: 1, repsOrDuration: '5 min', rpe: 4 },
      ],
      exercises: [
        {
          id: '25aef4fb46f74fabb92c69334cc7edc4', // Broad Jumps (verified real ID)
          sets: 4,
          repsOrDuration: '5 reps',
          rpe: 8,
          tags: ['power', 'plyometric', 'firefighter'],
          replacements: ['09f4a00ba8594ee9bdc4c7a7dd1934d3', '2227e83231e640e79270d5f86cb15c2f'], // Step-Ups, Jump Squats
        },
        {
          id: '9b5bdbf6f49e478e8444c4a8616a594e', // Bodyweight Squat (verified real ID)
          sets: 4,
          repsOrDuration: '6-8 reps',
          rpe: 8,
          tags: ['strength', 'posterior_chain'],
          replacements: ['d39835ca44974225aec0dd225dfd1488', '2227e83231e640e79270d5f86cb15c2f'], // Bulgarian Split Squat, Jump Squats
        },
        {
          id: '916c972c91f040c7b27e3d1b8305b1d5', // Pike Push-Ups (verified real ID)
          sets: 4,
          repsOrDuration: '6-8 reps',
          rpe: 7,
          tags: ['push', 'functional'],
          replacements: ['fd42038c774944c38bedbfe0d6d13182', '92dd1f1400f44ebf89be03da8249a03a'], // Handstand Push-Ups, Push-Ups
        },
        {
          id: '92dd1f1400f44ebf89be03da8249a03a', // Push-Ups (verified real ID)
          sets: 3,
          repsOrDuration: '5-8 reps',
          rpe: 8,
          tags: ['pull', 'strength'],
          replacements: ['71bd492a76ea406ebf9314bc2e2d3b7e', 'd4fad6729b0548159e9bf3872c7d9e3b'], // Diamond Push-Ups, Decline Push-Ups
        },
        {
          id: 'e80844ef7445418c987deea6641ce22e', // Farmer's Carries (verified real ID)
          sets: 3,
          repsOrDuration: '40 yards',
          rpe: 7,
          tags: ['carry', 'functional', 'firefighter'],
          replacements: ['3dc3ed9c502a416592abcd207e8bc51f', 'd68572790c034f40afbd39433926bc96'], // Wall Sit, Glute Bridge
        },
      ],
      cooldown: [
        { id: 'walking', sets: 1, repsOrDuration: '5 min', rpe: 3 },
        { id: 'stretching', sets: 1, repsOrDuration: '10 min', rpe: 2 },
      ],
    },
    {
      week: 3,
      day: 2,
      title: 'Work Capacity Challenge',
      priority: 2,
      type: 'training',
      phase: 'Strength',
      warmup: [
        { id: 'light_jog', sets: 1, repsOrDuration: '5 min', rpe: 4 },
        { id: 'movement_prep', sets: 1, repsOrDuration: '5 min', rpe: 3 },
      ],
      exercises: [
        {
          id: 'e3a5b94933474fd3b9156f0fe030e3ee', // Burpees (verified real ID)
          sets: 4,
          repsOrDuration: '8 min AMRAP: 5 burpees, 10 squats, 15 push-ups',
          rpe: 8,
          tags: ['circuit', 'conditioning', 'firefighter'],
          replacements: ['3d05fd6ffbb64691b892b13cdc6d98ff', '9b5bdbf6f49e478e8444c4a8616a594e'], // Mountain Climbers, Bodyweight Squat
        },
        {
          id: '08290306ba654e349a6660fa9b9c2ac1', // Tire Flip (verified real ID)
          sets: 3,
          repsOrDuration: '8-10 flips',
          rpe: 8,
          tags: ['functional', 'power', 'firefighter'],
          replacements: ['25aef4fb46f74fabb92c69334cc7edc4', 'b07d4b7db5fc429285e1e99bcfadf28e'], // Broad Jumps, Superman Hold
        },
        {
          id: '6544f999050d4eaa9de64d3d1fe43ffc', // High Knees (verified real ID)
          sets: 3,
          repsOrDuration: '45 sec',
          rpe: 8,
          tags: ['cardio', 'coordination'],
          replacements: ['3d05fd6ffbb64691b892b13cdc6d98ff', '2da1345993f947bc858c50e3f09563c1'], // Mountain Climbers, Flutter Kicks
        },
        {
          id: '09f4a00ba8594ee9bdc4c7a7dd1934d3', // Step-Ups (verified real ID)
          sets: 3,
          repsOrDuration: '3 flights worth',
          rpe: 8,
          tags: ['cardio', 'functional', 'firefighter'],
          replacements: ['9b5bdbf6f49e478e8444c4a8616a594e', '2227e83231e640e79270d5f86cb15c2f'], // Bodyweight Squat, Jump Squats
        },
      ],
      cooldown: [
        { id: 'cool_down_walk', sets: 1, repsOrDuration: '8 min', rpe: 3 },
        { id: 'recovery_stretching', sets: 1, repsOrDuration: '12 min', rpe: 2 },
      ],
    },
    {
      week: 3,
      day: 3,
      title: 'Strength Endurance',
      priority: 3,
      type: 'training',
      phase: 'Strength',
      warmup: [
        { id: 'rowing_warmup', sets: 1, repsOrDuration: '5 min', rpe: 4 },
        { id: 'mobility_flow', sets: 1, repsOrDuration: '5 min', rpe: 3 },
      ],
      exercises: [
        {
          id: '9b5bdbf6f49e478e8444c4a8616a594e', // Bodyweight Squat (verified real ID)
          sets: 4,
          repsOrDuration: '12-15 reps',
          rpe: 7,
          tags: ['legs', 'endurance'],
          replacements: ['2227e83231e640e79270d5f86cb15c2f', 'd39835ca44974225aec0dd225dfd1488'], // Jump Squats, Bulgarian Split Squat
        },
        {
          id: '92dd1f1400f44ebf89be03da8249a03a', // Push-Ups (verified real ID)
          sets: 4,
          repsOrDuration: '10-12 reps',
          rpe: 7,
          tags: ['push', 'chest'],
          replacements: ['71bd492a76ea406ebf9314bc2e2d3b7e', 'd4fad6729b0548159e9bf3872c7d9e3b'], // Diamond Push-Ups, Decline Push-Ups
        },
        {
          id: '6544f999050d4eaa9de64d3d1fe43ffc', // High Knees (verified real ID)
          sets: 4,
          repsOrDuration: '500m intervals',
          rpe: 7,
          tags: ['cardio', 'pull'],
          replacements: ['3d05fd6ffbb64691b892b13cdc6d98ff', '9f162328a5434638989a63b9251b9f3a'], // Mountain Climbers, Reverse Lunge
        },
        {
          id: 'fcc13cf6cc3f4a39970187e732b33e64', // Plank (verified real ID)
          sets: 3,
          repsOrDuration: '90 sec',
          rpe: 7,
          tags: ['core', 'isometric'],
          replacements: ['a53bdf65c7f64767bee6d113c6a544cc', '0522b05982994490947be4dc0e37cfe5'], // Side Plank, Deadbug
        },
      ],
      cooldown: [
        { id: 'easy_bike', sets: 1, repsOrDuration: '10 min', rpe: 3 },
        { id: 'full_body_stretch', sets: 1, repsOrDuration: '15 min', rpe: 2 },
      ],
    },

    // WEEK 4 - Tactical Integration
    {
      week: 4,
      day: 1,
      title: 'Tactical Movements',
      priority: 1,
      type: 'training',
      phase: 'Strength',
      warmup: [
        { id: 'tactical_warmup', sets: 1, repsOrDuration: '10 min', rpe: 4 },
        { id: 'gear_simulation_light', sets: 1, repsOrDuration: '5 min', rpe: 4 },
      ],
      exercises: [
        {
          id: 'e80844ef7445418c987deea6641ce22e', // Farmer's Carries (verified real ID)
          sets: 4,
          repsOrDuration: '50 yards',
          rpe: 8,
          tags: ['functional', 'drag', 'firefighter'],
          replacements: ['d13bc13f6e354ebbaa4384378d154cef', '3dc3ed9c502a416592abcd207e8bc51f'], // Bear Crawl, Wall Sit
        },
        {
          id: '25aef4fb46f74fabb92c69334cc7edc4', // Broad Jumps (verified real ID)
          sets: 3,
          repsOrDuration: '8-10 reps',
          rpe: 8,
          tags: ['functional', 'overhead', 'firefighter'],
          replacements: ['2227e83231e640e79270d5f86cb15c2f', '8c7091baa9944a62a646e73fe27b32c6'], // Jump Squats, Tuck Jumps
        },
        {
          id: 'e80844ef7445418c987deea6641ce22e', // Farmer's Carries (verified real ID)
          sets: 3,
          repsOrDuration: '30 yards',
          rpe: 8,
          tags: ['carry', 'functional', 'firefighter'],
          replacements: ['d13bc13f6e354ebbaa4384378d154cef', '3dc3ed9c502a416592abcd207e8bc51f'], // Bear Crawl, Wall Sit
        },
        {
          id: '09f4a00ba8594ee9bdc4c7a7dd1934d3', // Step-Ups (verified real ID)
          sets: 3,
          repsOrDuration: '5 flights',
          rpe: 9,
          tags: ['cardio', 'weighted', 'firefighter'],
          replacements: ['9b5bdbf6f49e478e8444c4a8616a594e', '2227e83231e640e79270d5f86cb15c2f'], // Bodyweight Squat, Jump Squats
        },
        {
          id: 'fa8a52d240e440e39887cd6c16d3fed9', // Hammer Strike (Tire) (verified real ID)
          sets: 3,
          repsOrDuration: '2 min',
          rpe: 8,
          tags: ['functional', 'endurance', 'firefighter'],
          replacements: ['0dca3ee6ce5247aba713fe2d7ee4c962', '3d05fd6ffbb64691b892b13cdc6d98ff'], // Battle Ropes, Mountain Climbers
        },
      ],
      cooldown: [
        { id: 'gear_removal_stretch', sets: 1, repsOrDuration: '5 min', rpe: 2 },
        { id: 'tactical_recovery', sets: 1, repsOrDuration: '10 min', rpe: 2 },
      ],
    },
    {
      week: 4,
      day: 2,
      title: 'Emergency Response Prep',
      priority: 2,
      type: 'training',
      phase: 'Strength',
      warmup: [
        { id: 'alarm_response_sim', sets: 1, repsOrDuration: '5 min', rpe: 5 },
        { id: 'dynamic_prep', sets: 1, repsOrDuration: '5 min', rpe: 4 },
      ],
      exercises: [
        {
          id: '6544f999050d4eaa9de64d3d1fe43ffc', // High Knees (verified real ID)
          sets: 6,
          repsOrDuration: '30 sec on, 90 sec off',
          rpe: 9,
          tags: ['speed', 'conditioning', 'firefighter'],
          replacements: ['3d05fd6ffbb64691b892b13cdc6d98ff', '2da1345993f947bc858c50e3f09563c1'], // Mountain Climbers, Flutter Kicks
        },
        {
          id: 'e3a5b94933474fd3b9156f0fe030e3ee', // Burpees (verified real ID)
          sets: 4,
          repsOrDuration: '10-15 reps',
          rpe: 8,
          tags: ['full_body', 'explosive'],
          replacements: ['3d05fd6ffbb64691b892b13cdc6d98ff', '92dd1f1400f44ebf89be03da8249a03a'], // Mountain Climbers, Push-Ups
        },
        {
          id: '855bcdfeb19240d8b43b196955cde7f1', // Lateral Shuffles (verified real ID)
          sets: 4,
          repsOrDuration: '2 lengths',
          rpe: 7,
          tags: ['agility', 'coordination'],
          replacements: ['8e3e90f5710a4c9b9772bdbcf3e74305', '6544f999050d4eaa9de64d3d1fe43ffc'], // Skater Jumps, High Knees
        },
        {
          id: 'e80844ef7445418c987deea6641ce22e', // Farmer's Carries (verified real ID)
          sets: 1,
          repsOrDuration: '15 min',
          rpe: 7,
          tags: ['endurance', 'weighted', 'firefighter'],
          replacements: ['3dc3ed9c502a416592abcd207e8bc51f', 'd13bc13f6e354ebbaa4384378d154cef'], // Wall Sit, Bear Crawl
        },
      ],
      cooldown: [
        { id: 'active_recovery_walk', sets: 1, repsOrDuration: '10 min', rpe: 3 },
        { id: 'post_workout_stretch', sets: 1, repsOrDuration: '15 min', rpe: 2 },
      ],
    },
    {
      week: 4,
      day: 3,
      title: 'Recovery & Mobility',
      priority: 3,
      type: 'recovery',
      phase: 'Deload',
      warmup: [
        { id: 'gentle_movement', sets: 1, repsOrDuration: '5 min', rpe: 3 },
      ],
      exercises: [
        {
          id: 'yoga_flow',
          sets: 1,
          repsOrDuration: '30 min',
          rpe: 4,
          tags: ['mobility', 'recovery'],
          replacements: ['stretching_routine', 'tai_chi'],
        },
        {
          id: 'foam_rolling',
          sets: 1,
          repsOrDuration: '15 min',
          rpe: 3,
          tags: ['recovery', 'myofascial'],
          replacements: ['self_massage', 'lacrosse_ball'],
        },
        {
          id: 'breathing_exercises',
          sets: 3,
          repsOrDuration: '5 min',
          rpe: 2,
          tags: ['recovery', 'stress_management'],
          replacements: ['meditation', 'relaxation'],
        },
      ],
      cooldown: [
        { id: 'meditation', sets: 1, repsOrDuration: '10 min', rpe: 1 },
      ],
    },

    // WEEK 5 - Intensity Peak
    {
      week: 5,
      day: 1,
      title: 'Maximum Effort',
      priority: 1,
      type: 'training',
      phase: 'Peak',
      warmup: [
        { id: 'thorough_warmup', sets: 1, repsOrDuration: '12 min', rpe: 5 },
        { id: 'nervous_system_prep', sets: 1, repsOrDuration: '5 min', rpe: 4 },
      ],
      exercises: [
        {
          id: '9b5bdbf6f49e478e8444c4a8616a594e', // Bodyweight Squat (verified real ID)
          sets: 5,
          repsOrDuration: '3-5 reps',
          rpe: 9,
          tags: ['strength', 'max_effort'],
          replacements: ['d39835ca44974225aec0dd225dfd1488', '2227e83231e640e79270d5f86cb15c2f'], // Bulgarian Split Squat, Jump Squats
        },
        {
          id: '9b5bdbf6f49e478e8444c4a8616a594e', // Bodyweight Squat (verified real ID)
          sets: 4,
          repsOrDuration: '4-6 reps',
          rpe: 8,
          tags: ['legs', 'strength'],
          replacements: ['2227e83231e640e79270d5f86cb15c2f', 'd39835ca44974225aec0dd225dfd1488'], // Jump Squats, Bulgarian Split Squat
        },
        {
          id: '92dd1f1400f44ebf89be03da8249a03a', // Push-Ups (verified real ID)
          sets: 4,
          repsOrDuration: '3-6 reps',
          rpe: 9,
          tags: ['pull', 'max_effort'],
          replacements: ['71bd492a76ea406ebf9314bc2e2d3b7e', 'd4fad6729b0548159e9bf3872c7d9e3b'], // Diamond Push-Ups, Decline Push-Ups
        },
        {
          id: 'e80844ef7445418c987deea6641ce22e', // Farmer's Carries (verified real ID)
          sets: 3,
          repsOrDuration: '60 yards',
          rpe: 9,
          tags: ['carry', 'grip', 'firefighter'],
          replacements: ['3dc3ed9c502a416592abcd207e8bc51f', 'd13bc13f6e354ebbaa4384378d154cef'], // Wall Sit, Bear Crawl
        },
      ],
      cooldown: [
        { id: 'extended_cooldown', sets: 1, repsOrDuration: '15 min', rpe: 2 },
        { id: 'ice_bath_optional', sets: 1, repsOrDuration: '5 min', rpe: 2 },
      ],
    },
    {
      week: 5,
      day: 2,
      title: 'Competition Prep',
      priority: 2,
      type: 'training',
      phase: 'Peak',
      warmup: [
        { id: 'competition_warmup', sets: 1, repsOrDuration: '10 min', rpe: 5 },
      ],
      exercises: [
        {
          id: 'e3a5b94933474fd3b9156f0fe030e3ee', // Burpees (verified real ID)
          sets: 2,
          repsOrDuration: 'Full course simulation',
          rpe: 9,
          tags: ['competition', 'functional', 'firefighter'],
          replacements: ['3d05fd6ffbb64691b892b13cdc6d98ff', '9b5bdbf6f49e478e8444c4a8616a594e'], // Mountain Climbers, Bodyweight Squat
        },
        {
          id: '6544f999050d4eaa9de64d3d1fe43ffc', // High Knees (verified real ID)
          sets: 3,
          repsOrDuration: 'Various stations',
          rpe: 9,
          tags: ['speed', 'competition', 'firefighter'],
          replacements: ['3d05fd6ffbb64691b892b13cdc6d98ff', '2da1345993f947bc858c50e3f09563c1'], // Mountain Climbers, Flutter Kicks
        },
      ],
      cooldown: [
        { id: 'competition_recovery', sets: 1, repsOrDuration: '20 min', rpe: 2 },
      ],
    },
    {
      week: 5,
      day: 3,
      title: 'Active Recovery',
      priority: 3,
      type: 'recovery',
      phase: 'Deload',
      warmup: [
        { id: 'light_movement', sets: 1, repsOrDuration: '5 min', rpe: 3 },
      ],
      exercises: [
        {
          id: 'light_swimming',
          sets: 1,
          repsOrDuration: '30 min',
          rpe: 4,
          tags: ['recovery', 'low_impact'],
          replacements: ['walking', 'easy_bike'],
        },
        {
          id: 'mobility_session',
          sets: 1,
          repsOrDuration: '20 min',
          rpe: 3,
          tags: ['mobility', 'recovery'],
          replacements: ['stretching', 'yoga'],
        },
      ],
      cooldown: [
        { id: 'relaxation', sets: 1, repsOrDuration: '15 min', rpe: 1 },
      ],
    },

    // WEEK 6 - PEAK WEEK
    {
      week: 6,
      day: 1,
      title: 'Peak Strength + Power',
      priority: 1,
      type: 'training',
      phase: 'Peak',
      warmup: [
        { id: 'dynamic_warm_up', sets: 1, repsOrDuration: '10 min', rpe: 4 },
        { id: 'activation_exercises', sets: 2, repsOrDuration: '8-10 reps each', rpe: 5 },
      ],
      exercises: [
        {
          id: '9b5bdbf6f49e478e8444c4a8616a594e', // Bodyweight Squat (verified real ID)
          sets: 4,
          repsOrDuration: '5 reps',
          rpe: 8,
          tags: ['legs', 'strength'],
          replacements: ['2227e83231e640e79270d5f86cb15c2f', 'd39835ca44974225aec0dd225dfd1488'], // Jump Squats, Bulgarian Split Squat
        },
        {
          id: '92dd1f1400f44ebf89be03da8249a03a', // Push-Ups (verified real ID)
          sets: 4,
          repsOrDuration: '6 reps',
          rpe: 8,
          tags: ['push', 'strength'],
          replacements: ['71bd492a76ea406ebf9314bc2e2d3b7e', 'd4fad6729b0548159e9bf3872c7d9e3b'], // Diamond Push-Ups, Decline Push-Ups
        },
        {
          id: '92dd1f1400f44ebf89be03da8249a03a', // Push-Ups (verified real ID)
          sets: 3,
          repsOrDuration: '6 reps',
          rpe: 8,
          tags: ['pull', 'strength'],
          replacements: ['71bd492a76ea406ebf9314bc2e2d3b7e', 'd4fad6729b0548159e9bf3872c7d9e3b'], // Diamond Push-Ups, Decline Push-Ups
        },
        {
          id: '2227e83231e640e79270d5f86cb15c2f', // Jump Squats (verified real ID)
          sets: 3,
          repsOrDuration: '3 reps',
          rpe: 8,
          tags: ['power', 'explosive'],
          replacements: ['25aef4fb46f74fabb92c69334cc7edc4', '8c7091baa9944a62a646e73fe27b32c6'], // Broad Jumps, Tuck Jumps
        },
        {
          id: 'e80844ef7445418c987deea6641ce22e', // Farmer's Carries (verified real ID)
          sets: 3,
          repsOrDuration: '60 sec',
          rpe: 8,
          tags: ['carry', 'conditioning'],
          replacements: ['3dc3ed9c502a416592abcd207e8bc51f', 'd13bc13f6e354ebbaa4384378d154cef'], // Wall Sit, Bear Crawl
        },
      ],
      cooldown: [
        { id: 'cool_down_walk', sets: 1, repsOrDuration: '10 min', rpe: 3 },
        { id: 'mobility_routine', sets: 1, repsOrDuration: '15 min', rpe: 2 },
      ],
    },
  ],
};
