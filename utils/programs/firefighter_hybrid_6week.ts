import type { ProgramTemplate } from '../types';

export const firefighter_hybrid_6week: ProgramTemplate = {
  id: 'firefighter_hybrid_6week',
  name: 'Firefighter Hybrid Training (6-Week)',
  durationWeeks: 6,
  daysPerWeek: 4,
  description: 'Progressive hybrid program combining strength, conditioning, and work capacity for operational readiness. Perfect for firefighters and tactical athletes.',
  days: [
    // WEEK 1 - Foundation Building
    {
      week: 1,
      day: 1,
      title: 'Strength Foundation',
      priority: 1,
      type: 'training',
      phase: 'Volume',
      warmup: [
        { id: 'c928f09a55f943578dde958c6459dab3', sets: 2, repsOrDuration: '10 each direction', rpe: 3 },
        { id: '9b5bdbf6f49e478e8444c4a8616a594e', sets: 2, repsOrDuration: '15 reps', rpe: 4 }, // Bodyweight Squat
        { id: 'd68572790c034f40afbd39433926bc96', sets: 2, repsOrDuration: '15 reps', rpe: 4 }, // Glute Bridge
      ],
      exercises: [
        {
          id: '9b5bdbf6f49e478e8444c4a8616a594e', // Bodyweight Squat
          sets: 3,
          repsOrDuration: '12 reps',
          rpe: 7,
          tags: ['legs', 'functional'],
          replacements: ['d39835ca44974225aec0dd225dfd1488', '2227e83231e640e79270d5f86cb15c2f'],
        },
        {
          id: '92dd1f1400f44ebf89be03da8249a03a', // Push-Ups
          sets: 3,
          repsOrDuration: '10-15 reps',
          rpe: 7,
          tags: ['push', 'bodyweight'],
          replacements: ['71bd492a76ea406ebf9314bc2e2d3b7e', 'd4fad6729b0548159e9bf3872c7d9e3b'],
        },
        {
          id: '9f162328a5434638989a63b9251b9f3a', // Reverse Lunge
          sets: 3,
          repsOrDuration: '12 each leg',
          rpe: 7,
          tags: ['legs', 'unilateral'],
          replacements: ['ac171422a1b14732857cf35be90d74b2', 'd39835ca44974225aec0dd225dfd1488'],
        },
        {
          id: 'fcc13cf6cc3f4a39970187e732b33e64', // Plank
          sets: 3,
          repsOrDuration: '30-45 sec',
          rpe: 6,
          tags: ['core', 'stability'],
          replacements: ['a53bdf65c7f64767bee6d113c6a544cc', 'cabcf53d38034628aa74848e97eb33fa'],
        },
        {
          id: 'e80844ef7445418c987deea6641ce22e', // Farmer's Carries
          sets: 3,
          repsOrDuration: '30 sec',
          rpe: 7,
          tags: ['carry', 'functional'],
          replacements: ['3dc3ed9c502a416592abcd207e8bc51f', 'd68572790c034f40afbd39433926bc96'],
        },
      ],
      cooldown: [
        { id: 'ae0e9a5388f64ad6918e6903a535a1dc', sets: 1, repsOrDuration: '5 min easy pace', rpe: 3 },
        { id: '39292bf9cd8d403e9279d4c9bb8497c9', sets: 1, repsOrDuration: '1 min', rpe: 2 },
        { id: '407c3d1c5e604f3893e354403eaed6ad', sets: 1, repsOrDuration: '1 min each leg', rpe: 2 },
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
        { id: 'c928f09a55f943578dde958c6459dab3', sets: 2, repsOrDuration: '30 sec', rpe: 4 },
        { id: '6544f999050d4eaa9de64d3d1fe43ffc', sets: 2, repsOrDuration: '20 sec', rpe: 4 }, // High Knees
        { id: 'd6014151966a4b9a9ce6502a498135de', sets: 2, repsOrDuration: '20 sec', rpe: 4 },
      ],
      exercises: [
        {
          id: '6544f999050d4eaa9de64d3d1fe43ffc', // High Knees
          sets: 4,
          repsOrDuration: '2 min work, 1 min rest',
          rpe: 6,
          tags: ['cardio', 'conditioning'],
          replacements: ['3d05fd6ffbb64691b892b13cdc6d98ff', '2da1345993f947bc858c50e3f09563c1'],
        },
        {
          id: '3d05fd6ffbb64691b892b13cdc6d98ff', // Mountain Climbers
          sets: 3,
          repsOrDuration: '30 sec',
          rpe: 7,
          tags: ['cardio', 'core'],
          replacements: ['6544f999050d4eaa9de64d3d1fe43ffc', '2da1345993f947bc858c50e3f09563c1'],
        },
        {
          id: '2227e83231e640e79270d5f86cb15c2f', // Jump Squats
          sets: 3,
          repsOrDuration: '20 reps',
          rpe: 7,
          tags: ['power', 'legs'],
          replacements: ['9b5bdbf6f49e478e8444c4a8616a594e', '25aef4fb46f74fabb92c69334cc7edc4'],
        },
        {
          id: 'e3a5b94933474fd3b9156f0fe030e3ee', // Burpees
          sets: 3,
          repsOrDuration: '8-12 reps',
          rpe: 8,
          tags: ['cardio', 'full_body'],
          replacements: ['3d05fd6ffbb64691b892b13cdc6d98ff', '92dd1f1400f44ebf89be03da8249a03a'],
        },
      ],
      cooldown: [
        { id: 'ae0e9a5388f64ad6918e6903a535a1dc', sets: 1, repsOrDuration: '10 min slow pace', rpe: 3 },
        { id: '407c3d1c5e604f3893e354403eaed6ad', sets: 1, repsOrDuration: '1 min each leg', rpe: 2 },
        { id: 'ae0e9a5388f64ad6918e6903a535a1dc', sets: 1, repsOrDuration: '1 min each leg', rpe: 2 },
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
        { id: 'c928f09a55f943578dde958c6459dab3', sets: 2, repsOrDuration: '10 each direction', rpe: 3 },
        { id: 'd6014151966a4b9a9ce6502a498135de', sets: 2, repsOrDuration: '10 each leg', rpe: 3 },
        { id: '86610e53215b4266a1d7ecdb3cad4a13', sets: 2, repsOrDuration: '10 each direction', rpe: 3 },
      ],
      exercises: [
        {
          id: 'd39835ca44974225aec0dd225dfd1488', // Bulgarian Split Squat
          sets: 3,
          repsOrDuration: '8 each leg',
          rpe: 7,
          tags: ['legs', 'unilateral'],
          replacements: ['9b5bdbf6f49e478e8444c4a8616a594e', '2227e83231e640e79270d5f86cb15c2f'],
        },
        {
          id: '916c972c91f040c7b27e3d1b8305b1d5', // Pike Push-Ups
          sets: 3,
          repsOrDuration: '8-10 reps',
          rpe: 7,
          tags: ['push', 'vertical'],
          replacements: ['fd42038c774944c38bedbfe0d6d13182', '92dd1f1400f44ebf89be03da8249a03a'],
        },
        {
          id: '73bdd1b8fc104ae79e26da0ff0a7b7db', // Single-Leg Glute Bridge
          sets: 3,
          repsOrDuration: '8 each leg',
          rpe: 6,
          tags: ['glutes', 'unilateral'],
          replacements: ['d68572790c034f40afbd39433926bc96', '24967aab5df74da6912a9e19ffa392a2'],
        },
        {
          id: 'a53bdf65c7f64767bee6d113c6a544cc', // Side Plank
          sets: 2,
          repsOrDuration: '20-30 sec each side',
          rpe: 6,
          tags: ['core', 'lateral'],
          replacements: ['fcc13cf6cc3f4a39970187e732b33e64', 'cabcf53d38034628aa74848e97eb33fa'],
        },
        {
          id: '24967aab5df74da6912a9e19ffa392a2', // Bird Dog
          sets: 2,
          repsOrDuration: '8 each side',
          rpe: 5,
          tags: ['core', 'stability'],
          replacements: ['fcc13cf6cc3f4a39970187e732b33e64', 'a53bdf65c7f64767bee6d113c6a544cc'],
        },
      ],
      cooldown: [
        { id: 'ae0e9a5388f64ad6918e6903a535a1dc', sets: 1, repsOrDuration: '5 min', rpe: 3 },
        { id: '63efec73b2fe49c8b9780773695c0726', sets: 1, repsOrDuration: '1 min each side', rpe: 2 },
        { id: '5e2106d0160949dba1a88bde622d343f', sets: 1, repsOrDuration: '1 min each side', rpe: 2 },
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
        { id: '6a17372890d54d949fe5779a88bb328a', sets: 1, repsOrDuration: '5 min', rpe: 4 },
        { id: '14831f115d0c4ca3ba83610639fc53a2', sets: 1, repsOrDuration: '5 min', rpe: 3 },
      ],
      exercises: [
        {
          id: 'e3a5b94933474fd3b9156f0fe030e3ee', // Burpees
          sets: 1,
          repsOrDuration: '12 min AMRAP: 5 burpees, 10 squats, 15 push-ups',
          rpe: 7,
          tags: ['circuit', 'metabolic', 'firefighter'],
          replacements: ['3d05fd6ffbb64691b892b13cdc6d98ff', '9b5bdbf6f49e478e8444c4a8616a594e'],
        },
        {
          id: '0dca3ee6ce5247aba713fe2d7ee4c962', // Battle Ropes
          sets: 3,
          repsOrDuration: '30 sec work, 30 sec rest',
          rpe: 8,
          tags: ['cardio', 'arms'],
          replacements: ['6544f999050d4eaa9de64d3d1fe43ffc', '3d05fd6ffbb64691b892b13cdc6d98ff'],
        },
        {
          id: '09f4a00ba8594ee9bdc4c7a7dd1934d3', // Step-Ups
          sets: 3,
          repsOrDuration: '45 sec',
          rpe: 6,
          tags: ['legs', 'cardio', 'firefighter'],
          replacements: ['9b5bdbf6f49e478e8444c4a8616a594e', '2227e83231e640e79270d5f86cb15c2f'],
        },
        {
          id: 'e80844ef7445418c987deea6641ce22e', // Farmer's Carries
          sets: 3,
          repsOrDuration: '40 yards',
          rpe: 7,
          tags: ['carry', 'functional', 'firefighter'],
          replacements: ['3dc3ed9c502a416592abcd207e8bc51f', 'd13bc13f6e354ebbaa4384378d154cef'],
        },
      ],
      cooldown: [
        { id: 'ae0e9a5388f64ad6918e6903a535a1dc', sets: 1, repsOrDuration: '10 min', rpe: 3 },
        { id: 'de15be379c2648faa860a085999b8545', sets: 1, repsOrDuration: '10 min', rpe: 2 },
      ],
    },

    // WEEK 2 - Volume Progression
    {
      week: 2,
      day: 1,
      title: 'Strength Progression',
      priority: 1,
      type: 'training',
      phase: 'Strength',
      warmup: [
        { id: 'c928f09a55f943578dde958c6459dab3', sets: 2, repsOrDuration: '10 each direction', rpe: 3 },
        { id: '9b5bdbf6f49e478e8444c4a8616a594e', sets: 2, repsOrDuration: '20 reps', rpe: 4 }, // Bodyweight Squat
        { id: 'd68572790c034f40afbd39433926bc96', sets: 2, repsOrDuration: '20 reps', rpe: 4 }, // Glute Bridge
      ],
      exercises: [
        {
          id: '9b5bdbf6f49e478e8444c4a8616a594e', // Bodyweight Squat
          sets: 4,
          repsOrDuration: '15 reps',
          rpe: 7,
          tags: ['legs', 'functional'],
          replacements: ['2227e83231e640e79270d5f86cb15c2f', 'd39835ca44974225aec0dd225dfd1488'],
        },
        {
          id: '92dd1f1400f44ebf89be03da8249a03a', // Push-Ups
          sets: 4,
          repsOrDuration: '12-18 reps',
          rpe: 7,
          tags: ['push', 'bodyweight'],
          replacements: ['71bd492a76ea406ebf9314bc2e2d3b7e', 'd4fad6729b0548159e9bf3872c7d9e3b'],
        },
        {
          id: '9f162328a5434638989a63b9251b9f3a', // Reverse Lunge
          sets: 4,
          repsOrDuration: '15 each leg',
          rpe: 7,
          tags: ['legs', 'unilateral'],
          replacements: ['ac171422a1b14732857cf35be90d74b2', 'd39835ca44974225aec0dd225dfd1488'],
        },
        {
          id: 'fcc13cf6cc3f4a39970187e732b33e64', // Plank
          sets: 3,
          repsOrDuration: '45-60 sec',
          rpe: 7,
          tags: ['core', 'stability'],
          replacements: ['a53bdf65c7f64767bee6d113c6a544cc', '24967aab5df74da6912a9e19ffa392a2'],
        },
        {
          id: 'e80844ef7445418c987deea6641ce22e', // Farmer's Carries
          sets: 4,
          repsOrDuration: '45 sec',
          rpe: 7,
          tags: ['carry', 'functional'],
          replacements: ['3dc3ed9c502a416592abcd207e8bc51f', 'd68572790c034f40afbd39433926bc96'],
        },
      ],
      cooldown: [
        { id: 'ae0e9a5388f64ad6918e6903a535a1dc', sets: 1, repsOrDuration: '5 min easy pace', rpe: 3 },
        { id: '39292bf9cd8d403e9279d4c9bb8497c9', sets: 1, repsOrDuration: '1 min', rpe: 2 },
        { id: '407c3d1c5e604f3893e354403eaed6ad', sets: 1, repsOrDuration: '1 min each leg', rpe: 2 },
      ],
    },
    {
      week: 2,
      day: 2,
      title: 'Enhanced Conditioning',
      priority: 2,
      type: 'training',
      phase: 'Volume',
      warmup: [
        { id: 'c928f09a55f943578dde958c6459dab3', sets: 2, repsOrDuration: '45 sec', rpe: 4 },
        { id: '6544f999050d4eaa9de64d3d1fe43ffc', sets: 2, repsOrDuration: '30 sec', rpe: 4 }, // High Knees
        { id: 'd6014151966a4b9a9ce6502a498135de', sets: 2, repsOrDuration: '30 sec', rpe: 4 },
      ],
      exercises: [
        {
          id: '6544f999050d4eaa9de64d3d1fe43ffc', // High Knees
          sets: 5,
          repsOrDuration: '90 sec work, 45 sec rest',
          rpe: 7,
          tags: ['cardio', 'conditioning'],
          replacements: ['3d05fd6ffbb64691b892b13cdc6d98ff', '2da1345993f947bc858c50e3f09563c1'],
        },
        {
          id: '3d05fd6ffbb64691b892b13cdc6d98ff', // Mountain Climbers
          sets: 4,
          repsOrDuration: '45 sec',
          rpe: 7,
          tags: ['cardio', 'core'],
          replacements: ['6544f999050d4eaa9de64d3d1fe43ffc', '2da1345993f947bc858c50e3f09563c1'],
        },
        {
          id: '2227e83231e640e79270d5f86cb15c2f', // Jump Squats
          sets: 4,
          repsOrDuration: '25 reps',
          rpe: 7,
          tags: ['power', 'legs'],
          replacements: ['9b5bdbf6f49e478e8444c4a8616a594e', '25aef4fb46f74fabb92c69334cc7edc4'],
        },
        {
          id: 'e3a5b94933474fd3b9156f0fe030e3ee', // Burpees
          sets: 4,
          repsOrDuration: '10-15 reps',
          rpe: 8,
          tags: ['cardio', 'full_body'],
          replacements: ['3d05fd6ffbb64691b892b13cdc6d98ff', '92dd1f1400f44ebf89be03da8249a03a'],
        },
      ],
      cooldown: [
        { id: 'ae0e9a5388f64ad6918e6903a535a1dc', sets: 1, repsOrDuration: '10 min slow pace', rpe: 3 },
        { id: '407c3d1c5e604f3893e354403eaed6ad', sets: 1, repsOrDuration: '1 min each leg', rpe: 2 },
        { id: 'ae0e9a5388f64ad6918e6903a535a1dc', sets: 1, repsOrDuration: '1 min each leg', rpe: 2 },
      ],
    },
    {
      week: 2,
      day: 3,
      title: 'Complex Movements',
      priority: 3,
      type: 'training',
      phase: 'Strength',
      warmup: [
        { id: 'c928f09a55f943578dde958c6459dab3', sets: 2, repsOrDuration: '12 each direction', rpe: 3 },
        { id: 'd6014151966a4b9a9ce6502a498135de', sets: 2, repsOrDuration: '12 each leg', rpe: 3 },
        { id: '86610e53215b4266a1d7ecdb3cad4a13', sets: 2, repsOrDuration: '12 each direction', rpe: 3 },
      ],
      exercises: [
        {
          id: 'd39835ca44974225aec0dd225dfd1488', // Bulgarian Split Squat
          sets: 4,
          repsOrDuration: '10 each leg',
          rpe: 7,
          tags: ['legs', 'unilateral'],
          replacements: ['9b5bdbf6f49e478e8444c4a8616a594e', '2227e83231e640e79270d5f86cb15c2f'],
        },
        {
          id: '916c972c91f040c7b27e3d1b8305b1d5', // Pike Push-Ups
          sets: 4,
          repsOrDuration: '10-12 reps',
          rpe: 7,
          tags: ['push', 'vertical'],
          replacements: ['fd42038c774944c38bedbfe0d6d13182', '92dd1f1400f44ebf89be03da8249a03a'],
        },
        {
          id: '71bd492a76ea406ebf9314bc2e2d3b7e', // Diamond Push-Ups
          sets: 3,
          repsOrDuration: '6-10 reps',
          rpe: 8,
          tags: ['push', 'triceps'],
          replacements: ['92dd1f1400f44ebf89be03da8249a03a', 'd4fad6729b0548159e9bf3872c7d9e3b'],
        },
        {
          id: '73bdd1b8fc104ae79e26da0ff0a7b7db', // Single-Leg Glute Bridge
          sets: 3,
          repsOrDuration: '10 each leg',
          rpe: 6,
          tags: ['glutes', 'unilateral'],
          replacements: ['d68572790c034f40afbd39433926bc96', '24967aab5df74da6912a9e19ffa392a2'],
        },
        {
          id: 'a53bdf65c7f64767bee6d113c6a544cc', // Side Plank
          sets: 3,
          repsOrDuration: '30-40 sec each side',
          rpe: 6,
          tags: ['core', 'lateral'],
          replacements: ['fcc13cf6cc3f4a39970187e732b33e64', 'cabcf53d38034628aa74848e97eb33fa'],
        },
      ],
      cooldown: [
        { id: 'ae0e9a5388f64ad6918e6903a535a1dc', sets: 1, repsOrDuration: '5 min', rpe: 3 },
        { id: '63efec73b2fe49c8b9780773695c0726', sets: 1, repsOrDuration: '1 min each side', rpe: 2 },
        { id: '5e2106d0160949dba1a88bde622d343f', sets: 1, repsOrDuration: '1 min each side', rpe: 2 },
      ],
    },
    {
      week: 2,
      day: 4,
      title: 'Tactical Conditioning',
      priority: 4,
      type: 'training',
      phase: 'Volume',
      warmup: [
        { id: '6a17372890d54d949fe5779a88bb328a', sets: 1, repsOrDuration: '6 min', rpe: 4 },
        { id: '14831f115d0c4ca3ba83610639fc53a2', sets: 1, repsOrDuration: '6 min', rpe: 3 },
      ],
      exercises: [
        {
          id: 'e3a5b94933474fd3b9156f0fe030e3ee', // Burpees
          sets: 1,
          repsOrDuration: '15 min AMRAP: 6 burpees, 12 squats, 18 push-ups',
          rpe: 8,
          tags: ['circuit', 'metabolic', 'firefighter'],
          replacements: ['3d05fd6ffbb64691b892b13cdc6d98ff', '9b5bdbf6f49e478e8444c4a8616a594e'],
        },
        {
          id: '25aef4fb46f74fabb92c69334cc7edc4', // Broad Jumps
          sets: 4,
          repsOrDuration: '8 reps',
          rpe: 7,
          tags: ['power', 'explosive', 'firefighter'],
          replacements: ['2227e83231e640e79270d5f86cb15c2f', '8c7091baa9944a62a646e73fe27b32c6'],
        },
        {
          id: '09f4a00ba8594ee9bdc4c7a7dd1934d3', // Step-Ups
          sets: 4,
          repsOrDuration: '60 sec',
          rpe: 7,
          tags: ['legs', 'cardio', 'firefighter'],
          replacements: ['9b5bdbf6f49e478e8444c4a8616a594e', '2227e83231e640e79270d5f86cb15c2f'],
        },
        {
          id: 'e80844ef7445418c987deea6641ce22e', // Farmer's Carries
          sets: 4,
          repsOrDuration: '50 yards',
          rpe: 8,
          tags: ['carry', 'functional', 'firefighter'],
          replacements: ['3dc3ed9c502a416592abcd207e8bc51f', 'd13bc13f6e354ebbaa4384378d154cef'],
        },
      ],
      cooldown: [
        { id: 'ae0e9a5388f64ad6918e6903a535a1dc', sets: 1, repsOrDuration: '10 min', rpe: 3 },
        { id: 'de15be379c2648faa860a085999b8545', sets: 1, repsOrDuration: '12 min', rpe: 2 },
      ],
    },

    // WEEK 3 - Power & Tactical Development
    {
      week: 3,
      day: 1,
      title: 'Power & Explosiveness',
      priority: 1,
      type: 'training',
      phase: 'Strength',
      warmup: [
        { id: 'c928f09a55f943578dde958c6459dab3', sets: 2, repsOrDuration: '10 each direction', rpe: 3 },
        { id: '9b5bdbf6f49e478e8444c4a8616a594e', sets: 2, repsOrDuration: '20 reps', rpe: 4 }, // Bodyweight Squat
        { id: 'd68572790c034f40afbd39433926bc96', sets: 2, repsOrDuration: '20 reps', rpe: 4 }, // Glute Bridge
      ],
      exercises: [
        {
          id: '25aef4fb46f74fabb92c69334cc7edc4', // Broad Jumps
          sets: 4,
          repsOrDuration: '5 reps',
          rpe: 8,
          tags: ['power', 'plyometric', 'firefighter'],
          replacements: ['09f4a00ba8594ee9bdc4c7a7dd1934d3', '2227e83231e640e79270d5f86cb15c2f'],
        },
        {
          id: '9b5bdbf6f49e478e8444c4a8616a594e', // Bodyweight Squat
          sets: 4,
          repsOrDuration: '6-8 reps',
          rpe: 8,
          tags: ['strength', 'posterior_chain'],
          replacements: ['d39835ca44974225aec0dd225dfd1488', '2227e83231e640e79270d5f86cb15c2f'],
        },
        {
          id: '916c972c91f040c7b27e3d1b8305b1d5', // Pike Push-Ups
          sets: 4,
          repsOrDuration: '6-8 reps',
          rpe: 7,
          tags: ['push', 'functional'],
          replacements: ['fd42038c774944c38bedbfe0d6d13182', '92dd1f1400f44ebf89be03da8249a03a'],
        },
        {
          id: '08290306ba654e349a6660fa9b9c2ac1', // Tire Flip
          sets: 3,
          repsOrDuration: '6-8 flips',
          rpe: 8,
          tags: ['functional', 'power', 'firefighter'],
          replacements: ['25aef4fb46f74fabb92c69334cc7edc4', 'b07d4b7db5fc429285e1e99bcfadf28e'],
        },
        {
          id: 'e80844ef7445418c987deea6641ce22e', // Farmer's Carries
          sets: 3,
          repsOrDuration: '40 yards',
          rpe: 7,
          tags: ['carry', 'functional', 'firefighter'],
          replacements: ['3dc3ed9c502a416592abcd207e8bc51f', 'd68572790c034f40afbd39433926bc96'],
        },
      ],
      cooldown: [
        { id: 'ae0e9a5388f64ad6918e6903a535a1dc', sets: 1, repsOrDuration: '5 min easy pace', rpe: 3 },
        { id: '39292bf9cd8d403e9279d4c9bb8497c9', sets: 1, repsOrDuration: '1 min', rpe: 2 },
        { id: '407c3d1c5e604f3893e354403eaed6ad', sets: 1, repsOrDuration: '1 min each leg', rpe: 2 },
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
        { id: '6a17372890d54d949fe5779a88bb328a', sets: 1, repsOrDuration: '5 min', rpe: 4 },
        { id: '14831f115d0c4ca3ba83610639fc53a2', sets: 1, repsOrDuration: '5 min', rpe: 3 },
      ],
      exercises: [
        {
          id: 'e3a5b94933474fd3b9156f0fe030e3ee', // Burpees
          sets: 1,
          repsOrDuration: '18 min AMRAP: 8 burpees, 16 squats, 24 push-ups',
          rpe: 8,
          tags: ['circuit', 'conditioning', 'firefighter'],
          replacements: ['3d05fd6ffbb64691b892b13cdc6d98ff', '9b5bdbf6f49e478e8444c4a8616a594e'],
        },
        {
          id: '6544f999050d4eaa9de64d3d1fe43ffc', // High Knees
          sets: 3,
          repsOrDuration: '45 sec',
          rpe: 8,
          tags: ['cardio', 'coordination'],
          replacements: ['3d05fd6ffbb64691b892b13cdc6d98ff', '2da1345993f947bc858c50e3f09563c1'],
        },
        {
          id: '09f4a00ba8594ee9bdc4c7a7dd1934d3', // Step-Ups
          sets: 3,
          repsOrDuration: '3 flights worth',
          rpe: 8,
          tags: ['cardio', 'functional', 'firefighter'],
          replacements: ['9b5bdbf6f49e478e8444c4a8616a594e', '2227e83231e640e79270d5f86cb15c2f'],
        },
        {
          id: 'fa8a52d240e440e39887cd6c16d3fed9', // Hammer Strike (Tire)
          sets: 3,
          repsOrDuration: '90 sec',
          rpe: 8,
          tags: ['functional', 'power', 'firefighter'],
          replacements: ['0dca3ee6ce5247aba713fe2d7ee4c962', '3d05fd6ffbb64691b892b13cdc6d98ff'],
        },
      ],
      cooldown: [
        { id: 'ae0e9a5388f64ad6918e6903a535a1dc', sets: 1, repsOrDuration: '8 min', rpe: 3 },
        { id: '407c3d1c5e604f3893e354403eaed6ad', sets: 1, repsOrDuration: '12 min', rpe: 2 },
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
        { id: '6a17372890d54d949fe5779a88bb328a', sets: 1, repsOrDuration: '5 min', rpe: 4 },
        { id: '14831f115d0c4ca3ba83610639fc53a2', sets: 1, repsOrDuration: '5 min', rpe: 3 },
      ],
      exercises: [
        {
          id: 'd39835ca44974225aec0dd225dfd1488', // Bulgarian Split Squat
          sets: 4,
          repsOrDuration: '12 each leg',
          rpe: 7,
          tags: ['legs', 'endurance', 'unilateral'],
          replacements: ['9b5bdbf6f49e478e8444c4a8616a594e', '2227e83231e640e79270d5f86cb15c2f'],
        },
        {
          id: '71bd492a76ea406ebf9314bc2e2d3b7e', // Diamond Push-Ups
          sets: 4,
          repsOrDuration: '8-12 reps',
          rpe: 7,
          tags: ['push', 'triceps', 'endurance'],
          replacements: ['92dd1f1400f44ebf89be03da8249a03a', 'd4fad6729b0548159e9bf3872c7d9e3b'],
        },
        {
          id: 'ac171422a1b14732857cf35be90d74b2', // Jumping Lunges
          sets: 4,
          repsOrDuration: '20 reps total',
          rpe: 7,
          tags: ['power', 'legs', 'unilateral'],
          replacements: ['9f162328a5434638989a63b9251b9f3a', 'd39835ca44974225aec0dd225dfd1488'],
        },
        {
          id: 'fcc13cf6cc3f4a39970187e732b33e64', // Plank
          sets: 3,
          repsOrDuration: '75-90 sec',
          rpe: 7,
          tags: ['core', 'endurance'],
          replacements: ['a53bdf65c7f64767bee6d113c6a544cc', '0522b05982994490947be4dc0e37cfe5'],
        },
        {
          id: 'd13bc13f6e354ebbaa4384378d154cef', // Bear Crawl
          sets: 3,
          repsOrDuration: '20 yards',
          rpe: 7,
          tags: ['full_body', 'crawl', 'firefighter'],
          replacements: ['3dc3ed9c502a416592abcd207e8bc51f', '24967aab5df74da6912a9e19ffa392a2'],
        },
      ],
      cooldown: [
        { id: 'ae0e9a5388f64ad6918e6903a535a1dc', sets: 1, repsOrDuration: '10 min', rpe: 3 },
        { id: 'de15be379c2648faa860a085999b8545', sets: 1, repsOrDuration: '15 min', rpe: 2 },
      ],
    },
    {
      week: 3,
      day: 4,
      title: 'Fire Ground Simulation',
      priority: 4,
      type: 'training',
      phase: 'Strength',
      warmup: [
        { id: '6a17372890d54d949fe5779a88bb328a', sets: 1, repsOrDuration: '8 min', rpe: 4 },
        { id: 'c928f09a55f943578dde958c6459dab3', sets: 1, repsOrDuration: '5 min', rpe: 4 },
      ],
      exercises: [
        {
          id: 'e80844ef7445418c987deea6641ce22e', // Farmer's Carries
          sets: 4,
          repsOrDuration: '60 yards',
          rpe: 8,
          tags: ['carry', 'functional', 'firefighter'],
          replacements: ['d13bc13f6e354ebbaa4384378d154cef', '3dc3ed9c502a416592abcd207e8bc51f'],
        },
        {
          id: '855bcdfeb19240d8b43b196955cde7f1', // Lateral Shuffles
          sets: 4,
          repsOrDuration: '2 lengths',
          rpe: 7,
          tags: ['agility', 'coordination', 'firefighter'],
          replacements: ['8e3e90f5710a4c9b9772bdbcf3e74305', '6544f999050d4eaa9de64d3d1fe43ffc'],
        },
        {
          id: '09f4a00ba8594ee9bdc4c7a7dd1934d3', // Step-Ups
          sets: 4,
          repsOrDuration: '4 flights',
          rpe: 8,
          tags: ['cardio', 'functional', 'firefighter'],
          replacements: ['9b5bdbf6f49e478e8444c4a8616a594e', '2227e83231e640e79270d5f86cb15c2f'],
        },
        {
          id: '25aef4fb46f74fabb92c69334cc7edc4', // Broad Jumps
          sets: 3,
          repsOrDuration: '10 reps',
          rpe: 8,
          tags: ['power', 'explosive', 'firefighter'],
          replacements: ['2227e83231e640e79270d5f86cb15c2f', '8c7091baa9944a62a646e73fe27b32c6'],
        },
      ],
      cooldown: [
        { id: 'ae0e9a5388f64ad6918e6903a535a1dc', sets: 1, repsOrDuration: '10 min', rpe: 3 },
        { id: 'de15be379c2648faa860a085999b8545', sets: 1, repsOrDuration: '15 min', rpe: 2 },
      ],
    },

    // WEEK 4 - Tactical Integration
    {
      week: 4,
      day: 1,
      title: 'Emergency Response Prep',
      priority: 1,
      type: 'training',
      phase: 'Peak',
      warmup: [
        { id: 'c928f09a55f943578dde958c6459dab3', sets: 2, repsOrDuration: '10 each direction', rpe: 3 },
        { id: '9b5bdbf6f49e478e8444c4a8616a594e', sets: 2, repsOrDuration: '20 reps', rpe: 4 }, // Bodyweight Squat
        { id: 'd68572790c034f40afbd39433926bc96', sets: 2, repsOrDuration: '20 reps', rpe: 4 }, // Glute Bridge
      ],
      exercises: [
        {
          id: '08290306ba654e349a6660fa9b9c2ac1', // Tire Flip
          sets: 4,
          repsOrDuration: '8-10 flips',
          rpe: 8,
          tags: ['functional', 'power', 'firefighter'],
          replacements: ['25aef4fb46f74fabb92c69334cc7edc4', 'b07d4b7db5fc429285e1e99bcfadf28e'],
        },
        {
          id: 'e80844ef7445418c987deea6641ce22e', // Farmer's Carries
          sets: 4,
          repsOrDuration: '80 yards',
          rpe: 8,
          tags: ['carry', 'functional', 'firefighter'],
          replacements: ['d13bc13f6e354ebbaa4384378d154cef', '3dc3ed9c502a416592abcd207e8bc51f'],
        },
        {
          id: '25aef4fb46f74fabb92c69334cc7edc4', // Broad Jumps
          sets: 4,
          repsOrDuration: '6 reps',
          rpe: 8,
          tags: ['power', 'explosive', 'firefighter'],
          replacements: ['09f4a00ba8594ee9bdc4c7a7dd1934d3', '2227e83231e640e79270d5f86cb15c2f'],
        },
        {
          id: 'fa8a52d240e440e39887cd6c16d3fed9', // Hammer Strike (Tire)
          sets: 4,
          repsOrDuration: '2 min',
          rpe: 8,
          tags: ['functional', 'power', 'firefighter'],
          replacements: ['0dca3ee6ce5247aba713fe2d7ee4c962', '3d05fd6ffbb64691b892b13cdc6d98ff'],
        },
        {
          id: 'd13bc13f6e354ebbaa4384378d154cef', // Bear Crawl
          sets: 3,
          repsOrDuration: '30 yards',
          rpe: 7,
          tags: ['full_body', 'crawl', 'firefighter'],
          replacements: ['3dc3ed9c502a416592abcd207e8bc51f', '24967aab5df74da6912a9e19ffa392a2'],
        },
      ],
      cooldown: [
        { id: 'ae0e9a5388f64ad6918e6903a535a1dc', sets: 1, repsOrDuration: '5 min easy pace', rpe: 3 },
        { id: '39292bf9cd8d403e9279d4c9bb8497c9', sets: 1, repsOrDuration: '1 min', rpe: 2 },
        { id: '407c3d1c5e604f3893e354403eaed6ad', sets: 1, repsOrDuration: '1 min each leg', rpe: 2 },
      ],
    },
    {
      week: 4,
      day: 2,
      title: 'High-Intensity Circuit',
      priority: 2,
      type: 'training',
      phase: 'Peak',
      warmup: [
        { id: '6a17372890d54d949fe5779a88bb328a', sets: 1, repsOrDuration: '8 min', rpe: 4 },
        { id: 'c928f09a55f943578dde958c6459dab3', sets: 1, repsOrDuration: '5 min', rpe: 4 },
      ],
      exercises: [
        {
          id: 'e3a5b94933474fd3b9156f0fe030e3ee', // Burpees
          sets: 1,
          repsOrDuration: '20 min AMRAP: 10 burpees, 20 squats, 30 push-ups, 40 step-ups',
          rpe: 9,
          tags: ['circuit', 'conditioning', 'firefighter'],
          replacements: ['3d05fd6ffbb64691b892b13cdc6d98ff', '9b5bdbf6f49e478e8444c4a8616a594e'],
        },
        {
          id: '855bcdfeb19240d8b43b196955cde7f1', // Lateral Shuffles
          sets: 4,
          repsOrDuration: '3 lengths',
          rpe: 8,
          tags: ['agility', 'coordination', 'firefighter'],
          replacements: ['8e3e90f5710a4c9b9772bdbcf3e74305', '6544f999050d4eaa9de64d3d1fe43ffc'],
        },
        {
          id: '0dca3ee6ce5247aba713fe2d7ee4c962', // Battle Ropes
          sets: 4,
          repsOrDuration: '45 sec work, 15 sec rest',
          rpe: 8,
          tags: ['cardio', 'arms', 'firefighter'],
          replacements: ['fa8a52d240e440e39887cd6c16d3fed9', '3d05fd6ffbb64691b892b13cdc6d98ff'],
        },
      ],
      cooldown: [
        { id: 'ae0e9a5388f64ad6918e6903a535a1dc', sets: 1, repsOrDuration: '12 min', rpe: 3 },
        { id: '3f319177c32e43b4a92da36676167f84', sets: 1, repsOrDuration: '15 min', rpe: 2 },
      ],
    },
    {
      week: 4,
      day: 3,
      title: 'Maximal Strength Focus',
      priority: 3,
      type: 'training',
      phase: 'Peak',
      warmup: [
        { id: '6a17372890d54d949fe5779a88bb328a', sets: 1, repsOrDuration: '10 min', rpe: 4 },
        { id: '14831f115d0c4ca3ba83610639fc53a2', sets: 1, repsOrDuration: '5 min', rpe: 3 },
      ],
      exercises: [
        {
          id: '9b5bdbf6f49e478e8444c4a8616a594e', // Bodyweight Squat
          sets: 5,
          repsOrDuration: '5-6 reps',
          rpe: 9,
          tags: ['strength', 'legs', 'maximal'],
          replacements: ['d39835ca44974225aec0dd225dfd1488', '2227e83231e640e79270d5f86cb15c2f'],
        },
        {
          id: '916c972c91f040c7b27e3d1b8305b1d5', // Pike Push-Ups
          sets: 5,
          repsOrDuration: '5-6 reps',
          rpe: 9,
          tags: ['push', 'vertical', 'maximal'],
          replacements: ['fd42038c774944c38bedbfe0d6d13182', '92dd1f1400f44ebf89be03da8249a03a'],
        },
        {
          id: '71bd492a76ea406ebf9314bc2e2d3b7e', // Diamond Push-Ups
          sets: 4,
          repsOrDuration: '4-6 reps',
          rpe: 8,
          tags: ['push', 'triceps', 'strength'],
          replacements: ['92dd1f1400f44ebf89be03da8249a03a', 'd4fad6729b0548159e9bf3872c7d9e3b'],
        },
        {
          id: 'd39835ca44974225aec0dd225dfd1488', // Bulgarian Split Squat
          sets: 4,
          repsOrDuration: '6-8 each leg',
          rpe: 8,
          tags: ['legs', 'unilateral', 'strength'],
          replacements: ['9b5bdbf6f49e478e8444c4a8616a594e', '2227e83231e640e79270d5f86cb15c2f'],
        },
        {
          id: 'fcc13cf6cc3f4a39970187e732b33e64', // Plank
          sets: 3,
          repsOrDuration: '90+ sec',
          rpe: 8,
          tags: ['core', 'endurance', 'stability'],
          replacements: ['a53bdf65c7f64767bee6d113c6a544cc', '0522b05982994490947be4dc0e37cfe5'],
        },
      ],
      cooldown: [
        { id: 'ae0e9a5388f64ad6918e6903a535a1dc', sets: 1, repsOrDuration: '8 min', rpe: 3 },
        { id: '407c3d1c5e604f3893e354403eaed6ad', sets: 1, repsOrDuration: '12 min', rpe: 2 },
      ],
    },
    {
      week: 4,
      day: 4,
      title: 'Fire Ground Mastery',
      priority: 4,
      type: 'training',
      phase: 'Peak',
      warmup: [
        { id: '6a17372890d54d949fe5779a88bb328a', sets: 1, repsOrDuration: '10 min', rpe: 4 },
        { id: 'c928f09a55f943578dde958c6459dab3', sets: 1, repsOrDuration: '5 min', rpe: 4 },
      ],
      exercises: [
        {
          id: '09f4a00ba8594ee9bdc4c7a7dd1934d3', // Step-Ups
          sets: 5,
          repsOrDuration: '5 flights',
          rpe: 9,
          tags: ['cardio', 'functional', 'firefighter'],
          replacements: ['9b5bdbf6f49e478e8444c4a8616a594e', '2227e83231e640e79270d5f86cb15c2f'],
        },
        {
          id: 'e80844ef7445418c987deea6641ce22e', // Farmer's Carries
          sets: 4,
          repsOrDuration: '100 yards',
          rpe: 9,
          tags: ['carry', 'functional', 'firefighter'],
          replacements: ['d13bc13f6e354ebbaa4384378d154cef', '3dc3ed9c502a416592abcd207e8bc51f'],
        },
        {
          id: '08290306ba654e349a6660fa9b9c2ac1', // Tire Flip
          sets: 4,
          repsOrDuration: '12-15 flips',
          rpe: 9,
          tags: ['functional', 'power', 'firefighter'],
          replacements: ['25aef4fb46f74fabb92c69334cc7edc4', 'b07d4b7db5fc429285e1e99bcfadf28e'],
        },
        {
          id: '855bcdfeb19240d8b43b196955cde7f1', // Lateral Shuffles
          sets: 3,
          repsOrDuration: '4 lengths',
          rpe: 8,
          tags: ['agility', 'coordination', 'firefighter'],
          replacements: ['8e3e90f5710a4c9b9772bdbcf3e74305', '6544f999050d4eaa9de64d3d1fe43ffc'],
        },
        {
          id: 'fa8a52d240e440e39887cd6c16d3fed9', // Hammer Strike (Tire)
          sets: 3,
          repsOrDuration: '3 min',
          rpe: 8,
          tags: ['functional', 'power', 'firefighter'],
          replacements: ['0dca3ee6ce5247aba713fe2d7ee4c962', '3d05fd6ffbb64691b892b13cdc6d98ff'],
        },
      ],
      cooldown: [
        { id: 'ae0e9a5388f64ad6918e6903a535a1dc', sets: 1, repsOrDuration: '15 min', rpe: 3 },
        { id: 'de15be379c2648faa860a085999b8545', sets: 1, repsOrDuration: '10 min', rpe: 2 },
      ],
    },

    // WEEK 5 - Intensity Peak
    {
      week: 5,
      day: 1,
      title: 'Maximum Power Output',
      priority: 1,
      type: 'training',
      phase: 'Peak',
      warmup: [
        { id: 'c928f09a55f943578dde958c6459dab3', sets: 2, repsOrDuration: '10 each direction', rpe: 3 },
        { id: '9b5bdbf6f49e478e8444c4a8616a594e', sets: 2, repsOrDuration: '20 reps', rpe: 4 }, // Bodyweight Squat
        { id: 'd68572790c034f40afbd39433926bc96', sets: 2, repsOrDuration: '20 reps', rpe: 4 }, // Glute Bridge
      ],
      exercises: [
        {
          id: '08290306ba654e349a6660fa9b9c2ac1', // Tire Flip
          sets: 5,
          repsOrDuration: '6 reps',
          rpe: 9,
          tags: ['functional', 'power', 'firefighter'],
          replacements: ['25aef4fb46f74fabb92c69334cc7edc4', 'b07d4b7db5fc429285e1e99bcfadf28e'],
        },
        {
          id: '25aef4fb46f74fabb92c69334cc7edc4', // Broad Jumps
          sets: 5,
          repsOrDuration: '5 reps',
          rpe: 9,
          tags: ['power', 'explosive', 'firefighter'],
          replacements: ['09f4a00ba8594ee9bdc4c7a7dd1934d3', '2227e83231e640e79270d5f86cb15c2f'],
        },
        {
          id: 'fa8a52d240e440e39887cd6c16d3fed9', // Hammer Strike (Tire)
          sets: 4,
          repsOrDuration: '3 min',
          rpe: 9,
          tags: ['functional', 'power', 'firefighter'],
          replacements: ['0dca3ee6ce5247aba713fe2d7ee4c962', '3d05fd6ffbb64691b892b13cdc6d98ff'],
        },
        {
          id: 'e80844ef7445418c987deea6641ce22e', // Farmer's Carries
          sets: 4,
          repsOrDuration: '120 yards',
          rpe: 9,
          tags: ['carry', 'functional', 'firefighter'],
          replacements: ['d13bc13f6e354ebbaa4384378d154cef', '3dc3ed9c502a416592abcd207e8bc51f'],
        },
        {
          id: '0dca3ee6ce5247aba713fe2d7ee4c962', // Battle Ropes
          sets: 3,
          repsOrDuration: '60 sec',
          rpe: 8,
          tags: ['cardio', 'arms', 'firefighter'],
          replacements: ['fa8a52d240e440e39887cd6c16d3fed9', '3d05fd6ffbb64691b892b13cdc6d98ff'],
        },
      ],
      cooldown: [
        { id: 'ae0e9a5388f64ad6918e6903a535a1dc', sets: 1, repsOrDuration: '5 min easy pace', rpe: 3 },
        { id: '39292bf9cd8d403e9279d4c9bb8497c9', sets: 1, repsOrDuration: '1 min', rpe: 2 },
        { id: '407c3d1c5e604f3893e354403eaed6ad', sets: 1, repsOrDuration: '1 min each leg', rpe: 2 },
      ],
    },
    {
      week: 5,
      day: 2,
      title: 'Elite Conditioning Test',
      priority: 2,
      type: 'training',
      phase: 'Peak',
      warmup: [
        { id: '6a17372890d54d949fe5779a88bb328a', sets: 1, repsOrDuration: '12 min', rpe: 5 },
        { id: 'c928f09a55f943578dde958c6459dab3', sets: 1, repsOrDuration: '8 min', rpe: 5 },
      ],
      exercises: [
        {
          id: 'e3a5b94933474fd3b9156f0fe030e3ee', // Burpees
          sets: 1,
          repsOrDuration: '25 min AMRAP: 12 burpees, 24 squats, 36 push-ups, 48 step-ups',
          rpe: 9,
          tags: ['circuit', 'conditioning', 'firefighter'],
          replacements: ['3d05fd6ffbb64691b892b13cdc6d98ff', '9b5bdbf6f49e478e8444c4a8616a594e'],
        },
        {
          id: '09f4a00ba8594ee9bdc4c7a7dd1934d3', // Step-Ups
          sets: 3,
          repsOrDuration: '6 flights',
          rpe: 9,
          tags: ['cardio', 'functional', 'firefighter'],
          replacements: ['9b5bdbf6f49e478e8444c4a8616a594e', '2227e83231e640e79270d5f86cb15c2f'],
        },
        {
          id: '855bcdfeb19240d8b43b196955cde7f1', // Lateral Shuffles
          sets: 4,
          repsOrDuration: '5 lengths',
          rpe: 9,
          tags: ['agility', 'coordination', 'firefighter'],
          replacements: ['8e3e90f5710a4c9b9772bdbcf3e74305', '6544f999050d4eaa9de64d3d1fe43ffc'],
        },
      ],
      cooldown: [
        { id: '3f319177c32e43b4a92da36676167f84', sets: 1, repsOrDuration: '15 min', rpe: 3 },
        { id: 'de15be379c2648faa860a085999b8545', sets: 1, repsOrDuration: '20 min', rpe: 2 },
      ],
    },
    {
      week: 5,
      day: 3,
      title: 'Peak Strength Challenge',
      priority: 3,
      type: 'training',
      phase: 'Peak',
      warmup: [
        { id: '6a17372890d54d949fe5779a88bb328a', sets: 1, repsOrDuration: '15 min', rpe: 5 },
        { id: 'c928f09a55f943578dde958c6459dab3', sets: 1, repsOrDuration: '10 min', rpe: 4 },
      ],
      exercises: [
        {
          id: '9b5bdbf6f49e478e8444c4a8616a594e', // Bodyweight Squat
          sets: 6,
          repsOrDuration: '3-4 reps',
          rpe: 10,
          tags: ['strength', 'legs', 'maximal'],
          replacements: ['d39835ca44974225aec0dd225dfd1488', '2227e83231e640e79270d5f86cb15c2f'],
        },
        {
          id: '916c972c91f040c7b27e3d1b8305b1d5', // Pike Push-Ups
          sets: 6,
          repsOrDuration: '3-4 reps',
          rpe: 10,
          tags: ['push', 'vertical', 'maximal'],
          replacements: ['fd42038c774944c38bedbfe0d6d13182', '92dd1f1400f44ebf89be03da8249a03a'],
        },
        {
          id: '71bd492a76ea406ebf9314bc2e2d3b7e', // Diamond Push-Ups
          sets: 4,
          repsOrDuration: '3-5 reps',
          rpe: 9,
          tags: ['push', 'triceps', 'strength'],
          replacements: ['92dd1f1400f44ebf89be03da8249a03a', 'd4fad6729b0548159e9bf3872c7d9e3b'],
        },
        {
          id: 'd39835ca44974225aec0dd225dfd1488', // Bulgarian Split Squat
          sets: 4,
          repsOrDuration: '5-6 each leg',
          rpe: 9,
          tags: ['legs', 'unilateral', 'strength'],
          replacements: ['9b5bdbf6f49e478e8444c4a8616a594e', '2227e83231e640e79270d5f86cb15c2f'],
        },
        {
          id: 'fcc13cf6cc3f4a39970187e732b33e64', // Plank
          sets: 2,
          repsOrDuration: '2+ min',
          rpe: 9,
          tags: ['core', 'endurance', 'stability'],
          replacements: ['a53bdf65c7f64767bee6d113c6a544cc', '0522b05982994490947be4dc0e37cfe5'],
        },
      ],
      cooldown: [
        { id: 'ae0e9a5388f64ad6918e6903a535a1dc', sets: 1, repsOrDuration: '10 min', rpe: 3 },
        { id: '3f319177c32e43b4a92da36676167f84', sets: 1, repsOrDuration: '20 min', rpe: 2 },
      ],
    },
    {
      week: 5,
      day: 4,
      title: 'Ultimate Fire Ground Test',
      priority: 4,
      type: 'training',
      phase: 'Peak',
      warmup: [
        { id: '6a17372890d54d949fe5779a88bb328a', sets: 1, repsOrDuration: '15 min', rpe: 5 },
        { id: 'c928f09a55f943578dde958c6459dab3', sets: 1, repsOrDuration: '10 min', rpe: 5 },
      ],
      exercises: [
        {
          id: 'e80844ef7445418c987deea6641ce22e', // Farmer's Carries
          sets: 5,
          repsOrDuration: '150 yards',
          rpe: 10,
          tags: ['carry', 'functional', 'firefighter'],
          replacements: ['d13bc13f6e354ebbaa4384378d154cef', '3dc3ed9c502a416592abcd207e8bc51f'],
        },
        {
          id: '08290306ba654e349a6660fa9b9c2ac1', // Tire Flip
          sets: 4,
          repsOrDuration: '20 flips',
          rpe: 10,
          tags: ['functional', 'power', 'firefighter'],
          replacements: ['25aef4fb46f74fabb92c69334cc7edc4', 'b07d4b7db5fc429285e1e99bcfadf28e'],
        },
        {
          id: '09f4a00ba8594ee9bdc4c7a7dd1934d3', // Step-Ups
          sets: 3,
          repsOrDuration: '7 flights',
          rpe: 10,
          tags: ['cardio', 'functional', 'firefighter'],
          replacements: ['9b5bdbf6f49e478e8444c4a8616a594e', '2227e83231e640e79270d5f86cb15c2f'],
        },
        {
          id: 'd13bc13f6e354ebbaa4384378d154cef', // Bear Crawl
          sets: 3,
          repsOrDuration: '50 yards',
          rpe: 9,
          tags: ['full_body', 'crawl', 'firefighter'],
          replacements: ['3dc3ed9c502a416592abcd207e8bc51f', '24967aab5df74da6912a9e19ffa392a2'],
        },
        {
          id: 'fa8a52d240e440e39887cd6c16d3fed9', // Hammer Strike (Tire)
          sets: 2,
          repsOrDuration: '5 min',
          rpe: 9,
          tags: ['functional', 'power', 'firefighter'],
          replacements: ['0dca3ee6ce5247aba713fe2d7ee4c962', '3d05fd6ffbb64691b892b13cdc6d98ff'],
        },
      ],
      cooldown: [
        { id: 'ae0e9a5388f64ad6918e6903a535a1dc', sets: 1, repsOrDuration: '20 min', rpe: 3 },
        { id: '3f319177c32e43b4a92da36676167f84', sets: 1, repsOrDuration: '25 min', rpe: 2 },
      ],
    },

    // WEEK 6 - Peak Week
    {
      week: 6,
      day: 1,
      title: 'Peak Performance Day',
      priority: 1,
      type: 'training',
      phase: 'Peak',
      warmup: [
        { id: 'c928f09a55f943578dde958c6459dab3', sets: 2, repsOrDuration: '10 each direction', rpe: 3 },
        { id: '9b5bdbf6f49e478e8444c4a8616a594e', sets: 2, repsOrDuration: '20 reps', rpe: 4 }, // Bodyweight Squat
        { id: 'd68572790c034f40afbd39433926bc96', sets: 2, repsOrDuration: '20 reps', rpe: 4 }, // Glute Bridge
      ],
      exercises: [
        {
          id: '08290306ba654e349a6660fa9b9c2ac1', // Tire Flip
          sets: 3,
          repsOrDuration: '1 rep max effort',
          rpe: 10,
          tags: ['functional', 'power', 'firefighter'],
          replacements: ['25aef4fb46f74fabb92c69334cc7edc4', 'b07d4b7db5fc429285e1e99bcfadf28e'],
        },
        {
          id: '25aef4fb46f74fabb92c69334cc7edc4', // Broad Jumps
          sets: 3,
          repsOrDuration: '3 reps max distance',
          rpe: 10,
          tags: ['power', 'explosive', 'firefighter'],
          replacements: ['09f4a00ba8594ee9bdc4c7a7dd1934d3', '2227e83231e640e79270d5f86cb15c2f'],
        },
        {
          id: 'e80844ef7445418c987deea6641ce22e', // Farmer's Carries
          sets: 2,
          repsOrDuration: 'Max distance',
          rpe: 10,
          tags: ['carry', 'functional', 'firefighter'],
          replacements: ['d13bc13f6e354ebbaa4384378d154cef', '3dc3ed9c502a416592abcd207e8bc51f'],
        },
        {
          id: '09f4a00ba8594ee9bdc4c7a7dd1934d3', // Step-Ups
          sets: 1,
          repsOrDuration: 'Max flights in 10 min',
          rpe: 10,
          tags: ['cardio', 'functional', 'firefighter'],
          replacements: ['9b5bdbf6f49e478e8444c4a8616a594e', '2227e83231e640e79270d5f86cb15c2f'],
        },
      ],
      cooldown: [
        { id: 'ae0e9a5388f64ad6918e6903a535a1dc', sets: 1, repsOrDuration: '5 min easy pace', rpe: 3 },
        { id: '39292bf9cd8d403e9279d4c9bb8497c9', sets: 1, repsOrDuration: '1 min', rpe: 2 },
        { id: '407c3d1c5e604f3893e354403eaed6ad', sets: 1, repsOrDuration: '1 min each leg', rpe: 2 },
      ],
    },
    {
      week: 6,
      day: 2,
      title: 'Technical Mastery',
      priority: 2,
      type: 'training',
      phase: 'Peak',
      warmup: [
        { id: 'c928f09a55f943578dde958c6459dab3', sets: 2, repsOrDuration: '10 each direction', rpe: 3 },
        { id: '9b5bdbf6f49e478e8444c4a8616a594e', sets: 2, repsOrDuration: '20 reps', rpe: 4 }, // Bodyweight Squat
        { id: 'd68572790c034f40afbd39433926bc96', sets: 2, repsOrDuration: '20 reps', rpe: 4 }, // Glute Bridge
      ],
      exercises: [
        {
          id: '9b5bdbf6f49e478e8444c4a8616a594e', // Bodyweight Squat
          sets: 3,
          repsOrDuration: '5 perfect reps',
          rpe: 8,
          tags: ['strength', 'technical', 'quality'],
          replacements: ['d39835ca44974225aec0dd225dfd1488', '2227e83231e640e79270d5f86cb15c2f'],
        },
        {
          id: '916c972c91f040c7b27e3d1b8305b1d5', // Pike Push-Ups
          sets: 3,
          repsOrDuration: '5 perfect reps',
          rpe: 8,
          tags: ['push', 'technical', 'quality'],
          replacements: ['fd42038c774944c38bedbfe0d6d13182', '92dd1f1400f44ebf89be03da8249a03a'],
        },
        {
          id: 'd39835ca44974225aec0dd225dfd1488', // Bulgarian Split Squat
          sets: 3,
          repsOrDuration: '8 each leg - perfect form',
          rpe: 7,
          tags: ['legs', 'unilateral', 'technical'],
          replacements: ['9b5bdbf6f49e478e8444c4a8616a594e', '2227e83231e640e79270d5f86cb15c2f'],
        },
        {
          id: 'fcc13cf6cc3f4a39970187e732b33e64', // Plank
          sets: 2,
          repsOrDuration: '90 sec perfect form',
          rpe: 7,
          tags: ['core', 'technical', 'stability'],
          replacements: ['a53bdf65c7f64767bee6d113c6a544cc', '0522b05982994490947be4dc0e37cfe5'],
        },
        {
          id: '855bcdfeb19240d8b43b196955cde7f1', // Lateral Shuffles
          sets: 3,
          repsOrDuration: '3 lengths - technique focus',
          rpe: 6,
          tags: ['agility', 'technical', 'firefighter'],
          replacements: ['8e3e90f5710a4c9b9772bdbcf3e74305', '6544f999050d4eaa9de64d3d1fe43ffc'],
        },
      ],
      cooldown: [
        { id: 'ae0e9a5388f64ad6918e6903a535a1dc', sets: 1, repsOrDuration: '15 min', rpe: 3 },
        { id: '3f319177c32e43b4a92da36676167f84', sets: 1, repsOrDuration: '20 min', rpe: 2 },
      ],
    },
    {
      week: 6,
      day: 3,
      title: 'Competition Simulation',
      priority: 3,
      type: 'training',
      phase: 'Peak',
      warmup: [
        { id: 'c928f09a55f943578dde958c6459dab3', sets: 2, repsOrDuration: '10 each direction', rpe: 3 },
        { id: '9b5bdbf6f49e478e8444c4a8616a594e', sets: 2, repsOrDuration: '20 reps', rpe: 4 }, // Bodyweight Squat
        { id: 'd68572790c034f40afbd39433926bc96', sets: 2, repsOrDuration: '20 reps', rpe: 4 }, // Glute Bridge
      ],
      exercises: [
        {
          id: 'e3a5b94933474fd3b9156f0fe030e3ee', // Burpees
          sets: 1,
          repsOrDuration: 'Competition Test: Max rounds in 30 min - 15 burpees, 30 squats, 45 push-ups, 60 step-ups',
          rpe: 10,
          tags: ['circuit', 'competition', 'firefighter'],
          replacements: ['3d05fd6ffbb64691b892b13cdc6d98ff', '9b5bdbf6f49e478e8444c4a8616a594e'],
        },
        {
          id: 'fa8a52d240e440e39887cd6c16d3fed9', // Hammer Strike (Tire)
          sets: 1,
          repsOrDuration: 'Max strikes in 8 min',
          rpe: 10,
          tags: ['functional', 'competition', 'firefighter'],
          replacements: ['0dca3ee6ce5247aba713fe2d7ee4c962', '3d05fd6ffbb64691b892b13cdc6d98ff'],
        },
      ],
      cooldown: [
        { id: 'ae0e9a5388f64ad6918e6903a535a1dc', sets: 1, repsOrDuration: '25 min', rpe: 3 },
        { id: '3f319177c32e43b4a92da36676167f84', sets: 1, repsOrDuration: '30 min', rpe: 2 },
      ],
    },
    {
      week: 6,
      day: 4,
      title: 'Championship Final',
      priority: 4,
      type: 'training',
      phase: 'Peak',
      warmup: [
        { id: '6a17372890d54d949fe5779a88bb328a', sets: 1, repsOrDuration: '10 min', rpe: 4 },
        { id: '14831f115d0c4ca3ba83610639fc53a2', sets: 1, repsOrDuration: '8 min', rpe: 3 },
        { id: 'c928f09a55f943578dde958c6459dab3', sets: 2, repsOrDuration: '15 each direction', rpe: 4 },
      ],
      exercises: [
        {
          id: 'e80844ef7445418c987deea6641ce22e', // Farmer's Carries
          sets: 1,
          repsOrDuration: 'Ultimate Test: Max distance with max weight',
          rpe: 10,
          tags: ['carry', 'championship', 'firefighter'],
          replacements: ['d13bc13f6e354ebbaa4384378d154cef', '3dc3ed9c502a416592abcd207e8bc51f'],
        },
        {
          id: '08290306ba654e349a6660fa9b9c2ac1', // Tire Flip
          sets: 1,
          repsOrDuration: 'Final Challenge: Max flips in 15 min',
          rpe: 10,
          tags: ['functional', 'championship', 'firefighter'],
          replacements: ['25aef4fb46f74fabb92c69334cc7edc4', 'b07d4b7db5fc429285e1e99bcfadf28e'],
        },
        {
          id: '09f4a00ba8594ee9bdc4c7a7dd1934d3', // Step-Ups
          sets: 1,
          repsOrDuration: 'Peak Test: 10 flights maximum effort',
          rpe: 10,
          tags: ['cardio', 'championship', 'firefighter'],
          replacements: ['9b5bdbf6f49e478e8444c4a8616a594e', '2227e83231e640e79270d5f86cb15c2f'],
        },
        {
          id: 'd13bc13f6e354ebbaa4384378d154cef', // Bear Crawl
          sets: 1,
          repsOrDuration: 'Championship Finish: 100 yards',
          rpe: 10,
          tags: ['full_body', 'championship', 'firefighter'],
          replacements: ['3dc3ed9c502a416592abcd207e8bc51f', '24967aab5df74da6912a9e19ffa392a2'],
        },
      ],
      cooldown: [
        { id: '3f319177c32e43b4a92da36676167f84', sets: 1, repsOrDuration: '10 min', rpe: 2 },
        { id: 'de15be379c2648faa860a085999b8545', sets: 1, repsOrDuration: '15 min', rpe: 2 },
        { id: '39292bf9cd8d403e9279d4c9bb8497c9', sets: 1, repsOrDuration: '5 min', rpe: 2 },
      ],
    },
  ],
};
