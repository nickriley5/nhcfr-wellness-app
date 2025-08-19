import type { ProgramTemplate } from '../types';

export const calisthenics_foundation_6week: ProgramTemplate = {
  id: 'calisthenics_foundation_6week',
  name: 'Calisthenics Foundation (6-Week)',
  durationWeeks: 6,
  daysPerWeek: 3,
  description: 'Master your bodyweight with progressive calisthenics training. Build strength, mobility, and confidence using just your body - equipment optional.',
  days: [
    // WEEK 1 - Movement Foundation
    {
      week: 1,
      day: 1,
      title: 'Push Foundation',
      priority: 1,
      type: 'training',
      phase: 'Volume',
      warmup: [
        { id: 'arm_circles', sets: 2, repsOrDuration: '10 each direction', rpe: 3 },
        { id: 'shoulder_rolls', sets: 2, repsOrDuration: '10 forward, 10 back', rpe: 3 },
      ],
      exercises: [
        {
          id: '92dd1f1400f44ebf89be03da8249a03a', // Push-Ups (verified real ID)
          sets: 3,
          repsOrDuration: '5-12 reps',
          rpe: 6,
          tags: ['push', 'chest', 'bodyweight'],
          replacements: ['8c41d112a1b74556b7e05cce1891a9e8', 'd4fad6729b0548159e9bf3872c7d9e3b'], // Wide Push-Ups, Decline Push-Ups
        },
        {
          id: 'fcc13cf6cc3f4a39970187e732b33e64', // Plank (verified real ID)
          sets: 3,
          repsOrDuration: '20-45 sec',
          rpe: 6,
          tags: ['core', 'isometric'],
          replacements: ['a53bdf65c7f64767bee6d113c6a544cc'], // Side Plank
        },
        {
          id: '916c972c91f040c7b27e3d1b8305b1d5', // Pike Push-Ups (verified real ID)
          sets: 2,
          repsOrDuration: '5-10 reps',
          rpe: 6,
          tags: ['shoulders', 'push'],
          replacements: ['fd42038c774944c38bedbfe0d6d13182'], // Handstand Push-Ups
        },
        {
          id: '0522b05982994490947be4dc0e37cfe5', // Deadbug (verified real ID)
          sets: 2,
          repsOrDuration: '8-12 each side',
          rpe: 5,
          tags: ['core', 'stability'],
          replacements: ['24967aab5df74da6912a9e19ffa392a2'], // Bird Dog
        },
      ],
      cooldown: [
        { id: 'child_pose', sets: 1, repsOrDuration: '1 min', rpe: 2 },
        { id: 'chest_doorway_stretch', sets: 1, repsOrDuration: '30 sec each arm', rpe: 2 },
      ],
    },
    {
      week: 1,
      day: 2,
      title: 'Lower Body Foundation',
      priority: 2,
      type: 'training',
      phase: 'Volume',
      warmup: [
        { id: 'leg_swings_front_back', sets: 2, repsOrDuration: '10 each leg', rpe: 3 },
        { id: 'hip_circles', sets: 2, repsOrDuration: '8 each direction', rpe: 3 },
      ],
      exercises: [
        {
          id: '9b5bdbf6f49e478e8444c4a8616a594e', // Bodyweight Squat (verified real ID)
          sets: 3,
          repsOrDuration: '10-20 reps',
          rpe: 6,
          tags: ['legs', 'squat', 'bodyweight'],
          replacements: ['ebedcc389c77406eadcd18222a18a696', '2227e83231e640e79270d5f86cb15c2f'], // Tempo Squats, Jump Squats
        },
        {
          id: '9f162328a5434638989a63b9251b9f3a', // Reverse Lunge (verified real ID)
          sets: 3,
          repsOrDuration: '6-12 each leg',
          rpe: 6,
          tags: ['legs', 'unilateral'],
          replacements: ['71f8f1bc459d4609b45919032b827b8b', 'd39835ca44974225aec0dd225dfd1488'], // Split Squat, Bulgarian Split Squat
        },
        {
          id: '09f4a00ba8594ee9bdc4c7a7dd1934d3', // Step-Ups (verified real ID)
          sets: 2,
          repsOrDuration: '8-12 each leg',
          rpe: 5,
          tags: ['legs', 'unilateral'],
          replacements: ['d39835ca44974225aec0dd225dfd1488'], // Bulgarian Split Squat
        },
        {
          id: 'd68572790c034f40afbd39433926bc96', // Glute Bridge (verified real ID)
          sets: 2,
          repsOrDuration: '12-20 reps',
          rpe: 5,
          tags: ['glutes', 'posterior'],
          replacements: ['73bdd1b8fc104ae79e26da0ff0a7b7db'], // Single-Leg Glute Bridge
        },
        {
          id: '3dc3ed9c502a416592abcd207e8bc51f', // Wall Sit (verified real ID)
          sets: 2,
          repsOrDuration: '20-45 sec',
          rpe: 6,
          tags: ['legs', 'isometric'],
          replacements: ['cabcf53d38034628aa74848e97eb33fa'], // Hollow Body Hold
        },
      ],
      cooldown: [
        { id: 'seated_forward_fold', sets: 1, repsOrDuration: '1 min', rpe: 2 },
        { id: 'figure_four_stretch', sets: 1, repsOrDuration: '45 sec each leg', rpe: 2 },
      ],
    },
    {
      week: 1,
      day: 3,
      title: 'Movement Flow',
      priority: 3,
      type: 'training',
      phase: 'Volume',
      warmup: [
        { id: 'arm_circles', sets: 2, repsOrDuration: '8 each direction', rpe: 3 },
        { id: 'leg_swings_side', sets: 2, repsOrDuration: '8 each leg', rpe: 3 },
      ],
      exercises: [
        {
          id: '3d05fd6ffbb64691b892b13cdc6d98ff', // Mountain Climbers (verified real ID)
          sets: 3,
          repsOrDuration: '20-40 sec',
          rpe: 6,
          tags: ['cardio', 'core'],
          replacements: ['6544f999050d4eaa9de64d3d1fe43ffc'], // High Knees
        },
        {
          id: 'd13bc13f6e354ebbaa4384378d154cef', // Bear Crawl (verified real ID)
          sets: 2,
          repsOrDuration: '20-40 sec',
          rpe: 6,
          tags: ['full_body', 'coordination'],
          replacements: ['855bcdfeb19240d8b43b196955cde7f1'], // Lateral Shuffles
        },
        {
          id: 'b07d4b7db5fc429285e1e99bcfadf28e', // Superman Hold (verified real ID)
          sets: 2,
          repsOrDuration: '15-30 sec',
          rpe: 5,
          tags: ['posterior', 'back'],
          replacements: ['24967aab5df74da6912a9e19ffa392a2'], // Bird Dog
        },
        {
          id: '2da1345993f947bc858c50e3f09563c1', // Flutter Kicks (verified real ID)
          sets: 2,
          repsOrDuration: '20-40 sec',
          rpe: 5,
          tags: ['core', 'lower_abs'],
          replacements: ['e22d373c856942dbab4b982891980332'], // Leg Raises
        },
      ],
      cooldown: [
        { id: 'cat_cow_stretch', sets: 1, repsOrDuration: '1 min', rpe: 2 },
        { id: 'spinal_twist', sets: 1, repsOrDuration: '30 sec each side', rpe: 2 },
      ],
    },

    // WEEK 2 - Building Strength
    {
      week: 2,
      day: 1,
      title: 'Push Power',
      priority: 1,
      type: 'training',
      phase: 'Volume',
      warmup: [
        { id: 'arm_circles', sets: 2, repsOrDuration: '10 each direction', rpe: 3 },
        { id: 'shoulder_pass_through', sets: 2, repsOrDuration: '10 reps', rpe: 3 },
      ],
      exercises: [
        {
          id: '92dd1f1400f44ebf89be03da8249a03a', // Push-Ups
          sets: 4,
          repsOrDuration: '8-15 reps',
          rpe: 7,
          tags: ['push', 'chest', 'progression'],
          replacements: ['71bd492a76ea406ebf9314bc2e2d3b7e', '8c41d112a1b74556b7e05cce1891a9e8'], // Diamond Push-Ups, Wide Push-Ups
        },
        {
          id: '916c972c91f040c7b27e3d1b8305b1d5', // Pike Push-Ups
          sets: 3,
          repsOrDuration: '6-12 reps',
          rpe: 7,
          tags: ['shoulders', 'push'],
          replacements: ['fd42038c774944c38bedbfe0d6d13182'], // Handstand Push-Ups
        },
        {
          id: '01b65e5f845744459452dbc08a4ef2c8', // Archer Push-Ups (verified real ID)
          sets: 2,
          repsOrDuration: '4-8 each side',
          rpe: 7,
          tags: ['push', 'unilateral'],
          replacements: ['92dd1f1400f44ebf89be03da8249a03a'], // Push-Ups
        },
        {
          id: 'fcc13cf6cc3f4a39970187e732b33e64', // Plank
          sets: 3,
          repsOrDuration: '30-60 sec',
          rpe: 7,
          tags: ['core', 'isometric'],
          replacements: ['a53bdf65c7f64767bee6d113c6a544cc'], // Side Plank
        },
        {
          id: 'a53bdf65c7f64767bee6d113c6a544cc', // Side Plank (verified real ID)
          sets: 2,
          repsOrDuration: '20-45 sec each side',
          rpe: 6,
          tags: ['core', 'lateral'],
          replacements: ['fcc13cf6cc3f4a39970187e732b33e64'], // Plank
        },
      ],
      cooldown: [
        { id: 'chest_doorway_stretch', sets: 1, repsOrDuration: '45 sec each arm', rpe: 2 },
        { id: 'child_pose', sets: 1, repsOrDuration: '1 min', rpe: 2 },
      ],
    },
    {
      week: 2,
      day: 2,
      title: 'Lower Power',
      priority: 2,
      type: 'training',
      phase: 'Volume',
      warmup: [
        { id: 'leg_swings_front_back', sets: 2, repsOrDuration: '12 each leg', rpe: 3 },
        { id: 'walking_high_knees', sets: 2, repsOrDuration: '20 steps', rpe: 4 },
      ],
      exercises: [
        {
          id: '9b5bdbf6f49e478e8444c4a8616a594e', // Bodyweight Squat
          sets: 4,
          repsOrDuration: '15-25 reps',
          rpe: 7,
          tags: ['legs', 'endurance'],
          replacements: ['2227e83231e640e79270d5f86cb15c2f'], // Jump Squats
        },
        {
          id: '2227e83231e640e79270d5f86cb15c2f', // Jump Squats (verified real ID)
          sets: 3,
          repsOrDuration: '8-15 reps',
          rpe: 7,
          tags: ['power', 'legs'],
          replacements: ['9b5bdbf6f49e478e8444c4a8616a594e'], // Bodyweight Squat
        },
        {
          id: '9f162328a5434638989a63b9251b9f3a', // Reverse Lunge
          sets: 3,
          repsOrDuration: '10-15 each leg',
          rpe: 7,
          tags: ['legs', 'unilateral'],
          replacements: ['ac171422a1b14732857cf35be90d74b2'], // Jumping Lunges
        },
        {
          id: '73bdd1b8fc104ae79e26da0ff0a7b7db', // Single-Leg Glute Bridge (verified real ID)
          sets: 3,
          repsOrDuration: '10-15 each leg',
          rpe: 7,
          tags: ['glutes', 'unilateral'],
          replacements: ['d68572790c034f40afbd39433926bc96'], // Glute Bridge
        },
        {
          id: '3dc3ed9c502a416592abcd207e8bc51f', // Wall Sit
          sets: 2,
          repsOrDuration: '45-75 sec',
          rpe: 7,
          tags: ['legs', 'isometric'],
          replacements: ['9b5bdbf6f49e478e8444c4a8616a594e'], // Bodyweight Squat
        },
      ],
      cooldown: [
        { id: 'standing_quad_stretch', sets: 1, repsOrDuration: '45 sec each leg', rpe: 2 },
        { id: 'calf_stretch_wall', sets: 1, repsOrDuration: '45 sec each leg', rpe: 2 },
      ],
    },
    {
      week: 2,
      day: 3,
      title: 'Full Body Flow',
      priority: 3,
      type: 'training',
      phase: 'Volume',
      warmup: [
        { id: 'full_body_circles', sets: 2, repsOrDuration: '8 each direction', rpe: 3 },
        { id: 'dynamic_warm_up', sets: 1, repsOrDuration: '5 min', rpe: 4 },
      ],
      exercises: [
        {
          id: 'e3a5b94933474fd3b9156f0fe030e3ee', // Burpees (verified real ID)
          sets: 3,
          repsOrDuration: '5-10 reps',
          rpe: 7,
          tags: ['full_body', 'cardio'],
          replacements: ['3d05fd6ffbb64691b892b13cdc6d98ff'], // Mountain Climbers
        },
        {
          id: '3d05fd6ffbb64691b892b13cdc6d98ff', // Mountain Climbers
          sets: 3,
          repsOrDuration: '30-45 sec',
          rpe: 7,
          tags: ['cardio', 'core'],
          replacements: ['6544f999050d4eaa9de64d3d1fe43ffc'], // High Knees
        },
        {
          id: 'd13bc13f6e354ebbaa4384378d154cef', // Bear Crawl
          sets: 3,
          repsOrDuration: '30-45 sec',
          rpe: 6,
          tags: ['full_body', 'coordination'],
          replacements: ['855bcdfeb19240d8b43b196955cde7f1'], // Lateral Shuffles
        },
        {
          id: '25aef4fb46f74fabb92c69334cc7edc4', // Broad Jumps (verified real ID)
          sets: 2,
          repsOrDuration: '5-8 reps',
          rpe: 6,
          tags: ['power', 'explosive'],
          replacements: ['2227e83231e640e79270d5f86cb15c2f'], // Jump Squats
        },
      ],
      cooldown: [
        { id: 'full_body_stretch_flow', sets: 1, repsOrDuration: '8 min', rpe: 2 },
      ],
    },

    // WEEK 3 - Strength Development
    {
      week: 3,
      day: 1,
      title: 'Push Mastery',
      priority: 1,
      type: 'training',
      phase: 'Strength',
      warmup: [
        { id: 'dynamic_warm_up', sets: 1, repsOrDuration: '6 min', rpe: 4 },
      ],
      exercises: [
        {
          id: '71bd492a76ea406ebf9314bc2e2d3b7e', // Diamond Push-Ups (verified real ID)
          sets: 4,
          repsOrDuration: '6-12 reps',
          rpe: 8,
          tags: ['push', 'triceps'],
          replacements: ['92dd1f1400f44ebf89be03da8249a03a'], // Push-Ups
        },
        {
          id: '916c972c91f040c7b27e3d1b8305b1d5', // Pike Push-Ups
          sets: 4,
          repsOrDuration: '8-15 reps',
          rpe: 8,
          tags: ['shoulders', 'progression'],
          replacements: ['fd42038c774944c38bedbfe0d6d13182'], // Handstand Push-Ups
        },
        {
          id: '01b65e5f845744459452dbc08a4ef2c8', // Archer Push-Ups
          sets: 3,
          repsOrDuration: '5-10 each side',
          rpe: 8,
          tags: ['push', 'unilateral'],
          replacements: ['8c41d112a1b74556b7e05cce1891a9e8'], // Wide Push-Ups
        },
        {
          id: 'cabcf53d38034628aa74848e97eb33fa', // Hollow Body Hold (verified real ID)
          sets: 3,
          repsOrDuration: '30-60 sec',
          rpe: 8,
          tags: ['core', 'isometric'],
          replacements: ['fcc13cf6cc3f4a39970187e732b33e64'], // Plank
        },
        {
          id: '4dcfd5af3ca447fc99fbbe318577f748', // V-Ups (verified real ID)
          sets: 2,
          repsOrDuration: '10-20 reps',
          rpe: 7,
          tags: ['core', 'dynamic'],
          replacements: ['7215f1f500ba4583b005e6e4688a9238'], // Sit-Ups / Crunches
        },
      ],
      cooldown: [
        { id: 'upper_body_stretch_routine', sets: 1, repsOrDuration: '8 min', rpe: 2 },
      ],
    },
    {
      week: 3,
      day: 2,
      title: 'Lower Strength',
      priority: 2,
      type: 'training',
      phase: 'Strength',
      warmup: [
        { id: 'dynamic_leg_warm_up', sets: 1, repsOrDuration: '6 min', rpe: 4 },
      ],
      exercises: [
        {
          id: 'd39835ca44974225aec0dd225dfd1488', // Bulgarian Split Squat (verified real ID)
          sets: 4,
          repsOrDuration: '10-15 each leg',
          rpe: 8,
          tags: ['legs', 'unilateral'],
          replacements: ['71f8f1bc459d4609b45919032b827b8b'], // Split Squat
        },
        {
          id: '2227e83231e640e79270d5f86cb15c2f', // Jump Squats
          sets: 4,
          repsOrDuration: '12-20 reps',
          rpe: 8,
          tags: ['power', 'legs'],
          replacements: ['8c7091baa9944a62a646e73fe27b32c6'], // Tuck Jumps
        },
        {
          id: 'ac171422a1b14732857cf35be90d74b2', // Jumping Lunges (verified real ID)
          sets: 3,
          repsOrDuration: '10-16 total',
          rpe: 8,
          tags: ['power', 'legs'],
          replacements: ['9f162328a5434638989a63b9251b9f3a'], // Reverse Lunge
        },
        {
          id: '73bdd1b8fc104ae79e26da0ff0a7b7db', // Single-Leg Glute Bridge
          sets: 3,
          repsOrDuration: '12-20 each leg',
          rpe: 7,
          tags: ['glutes', 'unilateral'],
          replacements: ['3b209b32ec9a4a28a8c4252b7a045f00'], // Nordic Curl (Assisted)
        },
        {
          id: '8e3e90f5710a4c9b9772bdbcf3e74305', // Skater Jumps (verified real ID)
          sets: 2,
          repsOrDuration: '10-15 each side',
          rpe: 7,
          tags: ['lateral', 'balance'],
          replacements: ['855bcdfeb19240d8b43b196955cde7f1'], // Lateral Shuffles
        },
      ],
      cooldown: [
        { id: 'lower_body_stretch_routine', sets: 1, repsOrDuration: '10 min', rpe: 2 },
      ],
    },
    {
      week: 3,
      day: 3,
      title: 'Power Integration',
      priority: 3,
      type: 'training',
      phase: 'Strength',
      warmup: [
        { id: 'dynamic_full_body_warm_up', sets: 1, repsOrDuration: '8 min', rpe: 4 },
      ],
      exercises: [
        {
          id: 'e3a5b94933474fd3b9156f0fe030e3ee', // Burpees
          sets: 4,
          repsOrDuration: '8-15 reps',
          rpe: 8,
          tags: ['full_body', 'conditioning'],
          replacements: ['3d05fd6ffbb64691b892b13cdc6d98ff'], // Mountain Climbers
        },
        {
          id: '8c7091baa9944a62a646e73fe27b32c6', // Tuck Jumps (verified real ID)
          sets: 3,
          repsOrDuration: '8-15 reps',
          rpe: 8,
          tags: ['power', 'explosive'],
          replacements: ['2227e83231e640e79270d5f86cb15c2f'], // Jump Squats
        },
        {
          id: '25aef4fb46f74fabb92c69334cc7edc4', // Broad Jumps
          sets: 3,
          repsOrDuration: '6-10 reps',
          rpe: 7,
          tags: ['power', 'horizontal'],
          replacements: ['2227e83231e640e79270d5f86cb15c2f'], // Jump Squats
        },
        {
          id: 'd13bc13f6e354ebbaa4384378d154cef', // Bear Crawl
          sets: 3,
          repsOrDuration: '45-60 sec',
          rpe: 7,
          tags: ['full_body', 'endurance'],
          replacements: ['3d05fd6ffbb64691b892b13cdc6d98ff'], // Mountain Climbers
        },
      ],
      cooldown: [
        { id: 'active_recovery_stretch', sets: 1, repsOrDuration: '10 min', rpe: 2 },
      ],
    },

    // WEEK 4 - Skill Integration
    {
      week: 4,
      day: 1,
      title: 'Advanced Push Patterns',
      priority: 1,
      type: 'training',
      phase: 'Strength',
      warmup: [
        { id: 'comprehensive_warm_up', sets: 1, repsOrDuration: '8 min', rpe: 4 },
      ],
      exercises: [
        {
          id: 'fd42038c774944c38bedbfe0d6d13182', // Handstand Push-Ups (verified real ID)
          sets: 3,
          repsOrDuration: '2-8 reps',
          rpe: 8,
          tags: ['shoulders', 'advanced'],
          replacements: ['916c972c91f040c7b27e3d1b8305b1d5'], // Pike Push-Ups
        },
        {
          id: '01b65e5f845744459452dbc08a4ef2c8', // Archer Push-Ups
          sets: 4,
          repsOrDuration: '6-12 each side',
          rpe: 8,
          tags: ['push', 'unilateral'],
          replacements: ['71bd492a76ea406ebf9314bc2e2d3b7e'], // Diamond Push-Ups
        },
        {
          id: 'd4fad6729b0548159e9bf3872c7d9e3b', // Decline Push-Ups (verified real ID)
          sets: 3,
          repsOrDuration: '8-15 reps',
          rpe: 8,
          tags: ['push', 'upper_chest'],
          replacements: ['92dd1f1400f44ebf89be03da8249a03a'], // Push-Ups
        },
        {
          id: 'cabcf53d38034628aa74848e97eb33fa', // Hollow Body Hold
          sets: 3,
          repsOrDuration: '45-75 sec',
          rpe: 8,
          tags: ['core', 'strength'],
          replacements: ['4dcfd5af3ca447fc99fbbe318577f748'], // V-Ups
        },
        {
          id: 'e22d373c856942dbab4b982891980332', // Leg Raises (verified real ID)
          sets: 2,
          repsOrDuration: '12-20 reps',
          rpe: 7,
          tags: ['core', 'lower_abs'],
          replacements: ['2da1345993f947bc858c50e3f09563c1'], // Flutter Kicks
        },
      ],
      cooldown: [
        { id: 'advanced_upper_stretch', sets: 1, repsOrDuration: '10 min', rpe: 2 },
      ],
    },
    {
      week: 4,
      day: 2,
      title: 'Unilateral Mastery',
      priority: 2,
      type: 'training',
      phase: 'Strength',
      warmup: [
        { id: 'dynamic_movement_prep', sets: 1, repsOrDuration: '8 min', rpe: 4 },
      ],
      exercises: [
        {
          id: 'd39835ca44974225aec0dd225dfd1488', // Bulgarian Split Squat
          sets: 4,
          repsOrDuration: '12-20 each leg',
          rpe: 8,
          tags: ['legs', 'unilateral'],
          replacements: ['71f8f1bc459d4609b45919032b827b8b'], // Split Squat
        },
        {
          id: 'ac171422a1b14732857cf35be90d74b2', // Jumping Lunges
          sets: 3,
          repsOrDuration: '12-20 total',
          rpe: 8,
          tags: ['power', 'legs'],
          replacements: ['9f162328a5434638989a63b9251b9f3a'], // Reverse Lunge
        },
        {
          id: '73bdd1b8fc104ae79e26da0ff0a7b7db', // Single-Leg Glute Bridge
          sets: 3,
          repsOrDuration: '15-25 each leg',
          rpe: 8,
          tags: ['glutes', 'balance'],
          replacements: ['d68572790c034f40afbd39433926bc96'], // Glute Bridge
        },
        {
          id: '8e3e90f5710a4c9b9772bdbcf3e74305', // Skater Jumps
          sets: 3,
          repsOrDuration: '12-20 each side',
          rpe: 7,
          tags: ['lateral', 'agility'],
          replacements: ['855bcdfeb19240d8b43b196955cde7f1'], // Lateral Shuffles
        },
        {
          id: '25aef4fb46f74fabb92c69334cc7edc4', // Broad Jumps
          sets: 2,
          repsOrDuration: '6-10 reps',
          rpe: 7,
          tags: ['power', 'explosive'],
          replacements: ['2227e83231e640e79270d5f86cb15c2f'], // Jump Squats
        },
      ],
      cooldown: [
        { id: 'unilateral_stretch_routine', sets: 1, repsOrDuration: '12 min', rpe: 2 },
      ],
    },
    {
      week: 4,
      day: 3,
      title: 'Flow & Coordination',
      priority: 3,
      type: 'training',
      phase: 'Strength',
      warmup: [
        { id: 'movement_flow_prep', sets: 1, repsOrDuration: '10 min', rpe: 4 },
      ],
      exercises: [
        {
          id: 'e3a5b94933474fd3b9156f0fe030e3ee', // Burpees
          sets: 4,
          repsOrDuration: '10-15 reps',
          rpe: 8,
          tags: ['full_body', 'flow'],
          replacements: ['3d05fd6ffbb64691b892b13cdc6d98ff'], // Mountain Climbers
        },
        {
          id: 'd13bc13f6e354ebbaa4384378d154cef', // Bear Crawl
          sets: 3,
          repsOrDuration: '60-90 sec',
          rpe: 7,
          tags: ['movement', 'coordination'],
          replacements: ['855bcdfeb19240d8b43b196955cde7f1'], // Lateral Shuffles
        },
        {
          id: '8c7091baa9944a62a646e73fe27b32c6', // Tuck Jumps
          sets: 3,
          repsOrDuration: '10-15 reps',
          rpe: 7,
          tags: ['explosive', 'coordination'],
          replacements: ['2227e83231e640e79270d5f86cb15c2f'], // Jump Squats
        },
        {
          id: '24967aab5df74da6912a9e19ffa392a2', // Bird Dog (verified real ID)
          sets: 2,
          repsOrDuration: '10-15 each side',
          rpe: 6,
          tags: ['stability', 'control'],
          replacements: ['0522b05982994490947be4dc0e37cfe5'], // Deadbug
        },
      ],
      cooldown: [
        { id: 'flow_cooldown_stretch', sets: 1, repsOrDuration: '15 min', rpe: 2 },
      ],
    },

    // WEEK 5 - Peak Performance
    {
      week: 5,
      day: 1,
      title: 'Push Peak',
      priority: 1,
      type: 'training',
      phase: 'Peak',
      warmup: [
        { id: 'peak_warm_up', sets: 1, repsOrDuration: '10 min', rpe: 5 },
      ],
      exercises: [
        {
          id: 'fd42038c774944c38bedbfe0d6d13182', // Handstand Push-Ups
          sets: 4,
          repsOrDuration: '3-8 reps',
          rpe: 9,
          tags: ['shoulders', 'advanced'],
          replacements: ['916c972c91f040c7b27e3d1b8305b1d5'], // Pike Push-Ups
        },
        {
          id: '01b65e5f845744459452dbc08a4ef2c8', // Archer Push-Ups
          sets: 4,
          repsOrDuration: '8-15 each side',
          rpe: 9,
          tags: ['push', 'unilateral'],
          replacements: ['71bd492a76ea406ebf9314bc2e2d3b7e'], // Diamond Push-Ups
        },
        {
          id: 'd4fad6729b0548159e9bf3872c7d9e3b', // Decline Push-Ups
          sets: 3,
          repsOrDuration: '10-20 reps',
          rpe: 8,
          tags: ['push', 'chest'],
          replacements: ['92dd1f1400f44ebf89be03da8249a03a'], // Push-Ups
        },
        {
          id: 'cabcf53d38034628aa74848e97eb33fa', // Hollow Body Hold
          sets: 3,
          repsOrDuration: '60-90 sec',
          rpe: 9,
          tags: ['core', 'endurance'],
          replacements: ['4dcfd5af3ca447fc99fbbe318577f748'], // V-Ups
        },
      ],
      cooldown: [
        { id: 'peak_recovery_routine', sets: 1, repsOrDuration: '15 min', rpe: 2 },
      ],
    },
    {
      week: 5,
      day: 2,
      title: 'Lower Peak',
      priority: 2,
      type: 'training',
      phase: 'Peak',
      warmup: [
        { id: 'dynamic_peak_prep', sets: 1, repsOrDuration: '10 min', rpe: 5 },
      ],
      exercises: [
        {
          id: 'd39835ca44974225aec0dd225dfd1488', // Bulgarian Split Squat
          sets: 4,
          repsOrDuration: '15-25 each leg',
          rpe: 9,
          tags: ['legs', 'endurance'],
          replacements: ['71f8f1bc459d4609b45919032b827b8b'], // Split Squat
        },
        {
          id: '8c7091baa9944a62a646e73fe27b32c6', // Tuck Jumps
          sets: 4,
          repsOrDuration: '12-20 reps',
          rpe: 8,
          tags: ['power', 'explosive'],
          replacements: ['2227e83231e640e79270d5f86cb15c2f'], // Jump Squats
        },
        {
          id: 'ac171422a1b14732857cf35be90d74b2', // Jumping Lunges
          sets: 3,
          repsOrDuration: '16-24 total',
          rpe: 8,
          tags: ['power', 'endurance'],
          replacements: ['9f162328a5434638989a63b9251b9f3a'], // Reverse Lunge
        },
        {
          id: '8e3e90f5710a4c9b9772bdbcf3e74305', // Skater Jumps
          sets: 3,
          repsOrDuration: '15-25 each side',
          rpe: 8,
          tags: ['agility', 'conditioning'],
          replacements: ['855bcdfeb19240d8b43b196955cde7f1'], // Lateral Shuffles
        },
      ],
      cooldown: [
        { id: 'peak_lower_recovery', sets: 1, repsOrDuration: '15 min', rpe: 2 },
      ],
    },
    {
      week: 5,
      day: 3,
      title: 'Power Showcase',
      priority: 3,
      type: 'training',
      phase: 'Peak',
      warmup: [
        { id: 'showcase_warm_up', sets: 1, repsOrDuration: '12 min', rpe: 5 },
      ],
      exercises: [
        {
          id: 'e3a5b94933474fd3b9156f0fe030e3ee', // Burpees
          sets: 4,
          repsOrDuration: '12-20 reps',
          rpe: 9,
          tags: ['full_body', 'endurance'],
          replacements: ['3d05fd6ffbb64691b892b13cdc6d98ff'], // Mountain Climbers
        },
        {
          id: '25aef4fb46f74fabb92c69334cc7edc4', // Broad Jumps
          sets: 3,
          repsOrDuration: '8-12 reps',
          rpe: 8,
          tags: ['power', 'explosive'],
          replacements: ['2227e83231e640e79270d5f86cb15c2f'], // Jump Squats
        },
        {
          id: 'd13bc13f6e354ebbaa4384378d154cef', // Bear Crawl
          sets: 2,
          repsOrDuration: '90-120 sec',
          rpe: 8,
          tags: ['endurance', 'coordination'],
          replacements: ['3d05fd6ffbb64691b892b13cdc6d98ff'], // Mountain Climbers
        },
      ],
      cooldown: [
        { id: 'showcase_recovery', sets: 1, repsOrDuration: '20 min', rpe: 2 },
      ],
    },

    // WEEK 6 - Assessment & Mastery
    {
      week: 6,
      day: 1,
      title: 'Push Assessment',
      priority: 1,
      type: 'training',
      phase: 'Peak',
      warmup: [
        { id: 'assessment_warm_up', sets: 1, repsOrDuration: '12 min', rpe: 5 },
      ],
      exercises: [
        {
          id: '92dd1f1400f44ebf89be03da8249a03a', // Push-Ups
          sets: 1,
          repsOrDuration: 'Max reps test',
          rpe: 9,
          tags: ['test', 'push'],
          replacements: ['71bd492a76ea406ebf9314bc2e2d3b7e'], // Diamond Push-Ups
        },
        {
          id: 'fcc13cf6cc3f4a39970187e732b33e64', // Plank
          sets: 1,
          repsOrDuration: 'Max hold test',
          rpe: 9,
          tags: ['test', 'core'],
          replacements: ['cabcf53d38034628aa74848e97eb33fa'], // Hollow Body Hold
        },
        {
          id: '916c972c91f040c7b27e3d1b8305b1d5', // Pike Push-Ups
          sets: 1,
          repsOrDuration: 'Max reps test',
          rpe: 8,
          tags: ['test', 'shoulders'],
          replacements: ['fd42038c774944c38bedbfe0d6d13182'], // Handstand Push-Ups
        },
        {
          id: '01b65e5f845744459452dbc08a4ef2c8', // Archer Push-Ups
          sets: 1,
          repsOrDuration: 'Best attempt each side',
          rpe: 8,
          tags: ['skill', 'demonstration'],
          replacements: ['92dd1f1400f44ebf89be03da8249a03a'], // Push-Ups
        },
      ],
      cooldown: [
        { id: 'assessment_recovery', sets: 1, repsOrDuration: '15 min', rpe: 2 },
      ],
    },
    {
      week: 6,
      day: 2,
      title: 'Lower Assessment',
      priority: 2,
      type: 'training',
      phase: 'Peak',
      warmup: [
        { id: 'lower_test_warm_up', sets: 1, repsOrDuration: '15 min', rpe: 5 },
      ],
      exercises: [
        {
          id: '9b5bdbf6f49e478e8444c4a8616a594e', // Bodyweight Squat
          sets: 1,
          repsOrDuration: 'Max reps 2 min',
          rpe: 9,
          tags: ['test', 'endurance'],
          replacements: ['2227e83231e640e79270d5f86cb15c2f'], // Jump Squats
        },
        {
          id: 'd39835ca44974225aec0dd225dfd1488', // Bulgarian Split Squat
          sets: 1,
          repsOrDuration: 'Max each leg',
          rpe: 9,
          tags: ['test', 'unilateral'],
          replacements: ['71f8f1bc459d4609b45919032b827b8b'], // Split Squat
        },
        {
          id: '25aef4fb46f74fabb92c69334cc7edc4', // Broad Jumps
          sets: 3,
          repsOrDuration: 'Best distance',
          rpe: 8,
          tags: ['test', 'power'],
          replacements: ['2227e83231e640e79270d5f86cb15c2f'], // Jump Squats
        },
        {
          id: '3dc3ed9c502a416592abcd207e8bc51f', // Wall Sit
          sets: 1,
          repsOrDuration: 'Max hold test',
          rpe: 8,
          tags: ['test', 'endurance'],
          replacements: ['9b5bdbf6f49e478e8444c4a8616a594e'], // Bodyweight Squat
        },
      ],
      cooldown: [
        { id: 'power_test_recovery', sets: 1, repsOrDuration: '15 min', rpe: 2 },
      ],
    },
    {
      week: 6,
      day: 3,
      title: 'Mastery Celebration',
      priority: 3,
      type: 'training',
      phase: 'Peak',
      warmup: [
        { id: 'celebration_warm_up', sets: 1, repsOrDuration: '10 min', rpe: 4 },
      ],
      exercises: [
        {
          id: 'e3a5b94933474fd3b9156f0fe030e3ee', // Burpees
          sets: 2,
          repsOrDuration: '15-25 reps',
          rpe: 7,
          tags: ['celebration', 'full_body'],
          replacements: ['3d05fd6ffbb64691b892b13cdc6d98ff'], // Mountain Climbers
        },
        {
          id: 'd13bc13f6e354ebbaa4384378d154cef', // Bear Crawl
          sets: 1,
          repsOrDuration: '2-3 min',
          rpe: 6,
          tags: ['flow', 'celebration'],
          replacements: ['855bcdfeb19240d8b43b196955cde7f1'], // Lateral Shuffles
        },
        {
          id: '24967aab5df74da6912a9e19ffa392a2', // Bird Dog
          sets: 1,
          repsOrDuration: '15-20 each side',
          rpe: 5,
          tags: ['mindful', 'celebration'],
          replacements: ['0522b05982994490947be4dc0e37cfe5'], // Deadbug
        },
      ],
      cooldown: [
        { id: 'mastery_celebration_stretch', sets: 1, repsOrDuration: '20 min', rpe: 2 },
        { id: 'reflection_breathing', sets: 1, repsOrDuration: '10 min', rpe: 1 },
      ],
    },
  ],
};
