import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
  InteractionManager,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, TabParamList } from '../App';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, Timestamp, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import type { ProgramDay } from '../types/Exercise';
import Toast from 'react-native-toast-message';
// import { regenerateActiveProgram } from '../utils/programService';
import { resolveExerciseDetails } from '../utils/exerciseUtils';
import { resolveExercise } from '../utils/exerciseMatching';
import AIWorkoutAssistant from '../components/AIWorkoutAssistant';
import PeriodizedProgramModal from '../components/Modals/PeriodizedProgramModal';
import PageHelpButton from '../components/Common/PageHelpButton';
import type { PeriodizedProgram } from '../utils/ai/aiService';


interface StoredState {
  currentDayIndex: number;
}

const formatExerciseName = (id?: string): string => {
  if (!id) {
    return 'Exercise';
  }

  // Try to look up the actual exercise name from the database first
  const exercise = resolveExerciseDetails(id);
  if (exercise && exercise.name) {
    return exercise.name;
  }

  // Fallback to formatting the ID if not found in database
  return id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase()); // capitalize each word
};

const formatWorkoutDescription = (repsOrDuration?: string): string => {
  if (!repsOrDuration) {
    return '';
  }

  const text = repsOrDuration.toLowerCase();

  // Handle AMRAP formats
  if (text.includes('amrap')) {
    const match = text.match(/(\d+)\s*min\s*amrap/);
    if (match) {
      return `${match[1]}min AMRAP`;
    }
    return 'AMRAP';
  }

  // Handle max effort formats
  if (text.includes('max') && (text.includes('distance') || text.includes('reps') || text.includes('flips') || text.includes('flights'))) {
    return 'Max Effort';
  }

  // Handle competition formats
  if (text.includes('competition') || text.includes('test') || text.includes('challenge')) {
    return 'Challenge';
  }

  // For very long descriptions, truncate
  if (repsOrDuration.length > 25) {
    return repsOrDuration.substring(0, 22) + '...';
  }

  return repsOrDuration;
};


const WorkoutScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<TabParamList, 'Workout'>>();

  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<StoredState | null>(null);
  const [days, setDays] = useState<ProgramDay[]>([]);
  const [weeksArr, setWeeksArr] = useState<ProgramDay[][]>([]);
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // AI Programs state
  const [aiPrograms, setAiPrograms] = useState<PeriodizedProgram[]>([]);
  const [activeAiProgram, setActiveAiProgram] = useState<PeriodizedProgram | null>(null);
  const [currentWeekNum, setCurrentWeekNum] = useState(1);
  const [currentDayNum, setCurrentDayNum] = useState(1);
  
  // Recent activity state
  const [recentWorkout, setRecentWorkout] = useState<any>(null);
  
  // Program management state
  const [showArchived, setShowArchived] = useState(false);
  const [selectedProgramForAction, setSelectedProgramForAction] = useState<PeriodizedProgram | null>(null);
  const [showProgramActionModal, setShowProgramActionModal] = useState(false);
  const quickWorkoutHandledRef = useRef(false);

  useEffect(() => {
    if (route.params?.openQuickWorkout && !quickWorkoutHandledRef.current) {
      quickWorkoutHandledRef.current = true;

      const task = InteractionManager.runAfterInteractions(() => {
        setShowAIAssistant(true);
        requestAnimationFrame(() => {
          navigation.setParams({ openQuickWorkout: false } as any);
        });
      });

      return () => {
        task.cancel();
      };
    }

    if (!route.params?.openQuickWorkout) {
      quickWorkoutHandledRef.current = false;
    }
  }, [route.params?.openQuickWorkout, navigation]);

  const handleApplyRecommendation = async (recommendation: any) => {
    console.log('📋 Applying AI workout recommendation:', recommendation);

    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        Toast.show({
          type: 'error',
          text1: 'Not logged in',
          text2: 'Please sign in to save workout',
        });
        return;
      }

      const recommendationAny = recommendation as any;
      const safeDifficulty =
        typeof recommendation?.difficultyScore === 'number' ? recommendation.difficultyScore : 5;
      const normalizePrepItem = (item: any) => {
        if (!item) return null;
        if (typeof item === 'string') return { name: item };
        const name = item.name || item.exercise || 'Exercise';
        const notes = item.notes || item.note;
        return { name, notes };
      };
      const warmupList = (recommendation.warmup || []).map(normalizePrepItem).filter(Boolean);
      const cooldownList = (recommendation.cooldown || []).map(normalizePrepItem).filter(Boolean);
      const trainingStyle = (recommendationAny._trainingStyle || '').toLowerCase();
      const isHiitStyle = trainingStyle.includes('hiit') || trainingStyle.includes('interval') || trainingStyle.includes('conditioning');
      const isEnduranceStyle = trainingStyle.includes('endurance');

      if (isHiitStyle) {
        const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const interval = recommendationAny.interval;
        const defaultInterval = interval || { rounds: 8, workSec: 30, restSec: 90 };
        const { exercises: exerciseLibrary } = await import('../data/exercises');
        const userEquipment = (userProfile?.equipment || []).map((e: string) => e.toLowerCase());
        const hasVideo = (ex: any) => ex.videoUrl && ex.videoUrl.trim() !== '';
        const isBodyweight = (ex: any) =>
          (ex.category || '').toLowerCase().includes('bodyweight') ||
          (ex.equipment || '').toLowerCase().includes('bodyweight');
        const hasEquipment = (ex: any) =>
          isBodyweight(ex) ||
          userEquipment.length === 0 ||
          userEquipment.some((eq: string) => (ex.equipment || '').toLowerCase().includes(eq));
        const hiitPool = exerciseLibrary.filter((ex: any) => hasVideo(ex) && hasEquipment(ex));

        const circuitExercises = (recommendation.exercises || [])
          .map((ex: any) => (typeof ex === 'string' ? { name: ex } : ex))
          .map((ex: any) => {
            const match = exerciseLibrary.find((lib: any) => lib.name.toLowerCase() === (ex.name || '').toLowerCase());
            if (match && hasVideo(match)) {
              return { name: match.name, notes: ex.notes };
            }
            return null;
          })
          .filter(Boolean) as Array<{ name: string; notes?: string }>;

        if (circuitExercises.length < 4) {
          const existing = new Set(circuitExercises.map(ex => ex.name));
          for (const ex of hiitPool) {
            if (existing.has(ex.name)) continue;
            circuitExercises.push({ name: ex.name });
            if (circuitExercises.length >= 4) break;
          }
        }

        navigation.navigate('CardioWorkout', {
          session: {
            dayOfWeek: todayName,
            type: 'HIIT',
            duration: recommendation.estimatedDuration || recommendationAny._duration || 20,
            intensity: 'Intervals',
            notes: interval
              ? `${interval.rounds} rounds: ${interval.workSec}s work/${interval.restSec}s rest`
              : '8 rounds: 30s work/90s rest',
            warmup: warmupList,
            cooldown: cooldownList,
            circuit: {
              rounds: defaultInterval.rounds,
              workSec: defaultInterval.workSec,
              restSec: defaultInterval.restSec,
              exercises: circuitExercises.length
                ? circuitExercises
                : ['Burpees', 'Kettlebell Swings', 'Mountain Climbers', 'Jump Rope'],
            },
          },
          weekNumber: 1,
        });
        return;
      }

      if (isEnduranceStyle) {
        const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const cardio = recommendationAny.cardio;
        const intensityLabel = cardio?.intensity || (safeDifficulty >= 8 ? 'Hard' : safeDifficulty >= 6 ? 'Moderate' : 'Easy');
        navigation.navigate('CardioWorkout', {
          session: {
            dayOfWeek: todayName,
            type: cardio?.type || 'Endurance',
            duration: cardio?.duration || recommendation.estimatedDuration || recommendationAny._duration || 30,
            intensity: intensityLabel,
            notes: cardio?.notes || recommendation.rationale || 'Steady-state effort',
            targetHeartRate: cardio?.targetHeartRate,
            warmup: warmupList,
            cooldown: cooldownList,
          },
          weekNumber: 1,
        });
        return;
      }

      // Import exercise library to match names to IDs
      const { exercises: exerciseLibrary } = await import('../data/exercises');
      const { resolveExercise } = await import('../utils/exerciseMatching');
      
      // Helper function to map exercise name to library entry
      const mapExercise = (exerciseInput: any, defaultSets: number = 3, defaultReps: string = '8-12 reps') => {
        const exerciseName = typeof exerciseInput === 'string' ? exerciseInput : (exerciseInput?.name || 'Exercise');
        const matchedExercise = resolveExercise(exerciseName) || exerciseLibrary.find(
          ex => ex.name.toLowerCase() === exerciseName.toLowerCase()
        );
        
        if (matchedExercise) {
          const isYouTube = matchedExercise.videoUrl?.includes('youtube.com') || matchedExercise.videoUrl?.includes('youtu.be');
          console.log(`✅ Matched: \"${exerciseName}\"`);
          console.log(`   ID: ${matchedExercise.id}`);
          console.log(`   Video: ${matchedExercise.videoUrl ? (isYouTube ? 'YouTube' : 'Direct MP4') : 'NONE'}`);
        } else {
          console.error(`❌ NOT FOUND: \"${exerciseName}\" - video will not be available`);
        }
        
        const repsValue = exerciseInput?.reps || exerciseInput?.reps_or_time || exerciseInput?.repsOrTime || defaultReps;
        const setsValue = typeof exerciseInput?.sets === 'number' ? exerciseInput.sets : defaultSets;
        const restValue = exerciseInput?.rest || exerciseInput?.rest_seconds || exerciseInput?.restSeconds;

        return {
          id: matchedExercise?.id || exerciseName.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
          name: matchedExercise?.name || exerciseName,
          sets: setsValue,
          repsOrDuration: repsValue,
          rpe: safeDifficulty,
          tags: recommendation.focusAreas || [],
          replacements: matchedExercise?.swapOptions || [],
          restSeconds: typeof restValue === 'number' ? restValue : null,
          notes: exerciseInput?.notes,
        };
      };
      
      // Convert AI recommendation to workout program format with warm-ups and cool-downs
      console.log('🎯 AI recommended:');
      console.log('   Warm-up:', recommendation.warmup);
      console.log('   Main exercises:', recommendation.exercises);
      console.log('   Cool-down:', recommendation.cooldown);
      
      const aiWorkoutDays: ProgramDay[] = [{
        week: 1,
        day: 1,
        title: 'AI Generated Workout',
        priority: 1,
        type: 'training' as const,
        phase: 'Strength' as const,
        warmup: (recommendation.warmup || []).map((ex: any) => mapExercise(ex, 2, '10 reps')),
        exercises: (recommendation.exercises || []).map((ex: any) => mapExercise(ex, 3, '8-12 reps')),
        cooldown: (recommendation.cooldown || []).map((ex: any) => mapExercise(ex, 1, '30 sec hold')),
      }];
      
      console.log('💾 Saving AI workout:');
      console.log(`   Warm-up: ${aiWorkoutDays[0].warmup.length} exercises`);
      console.log(`   Main: ${aiWorkoutDays[0].exercises.length} exercises`);
      console.log(`   Cool-down: ${aiWorkoutDays[0].cooldown.length} exercises`);

      // Save as a separate AI workout document (doesn't overwrite active program)
      const aiWorkoutId = `ai_${Date.now()}`;
      await setDoc(
        doc(db, 'users', uid, 'aiWorkouts', aiWorkoutId),
        {
          programId: 'ai-generated',
          createdAt: Timestamp.now(),
          metadata: {
            currentDay: 1,
            startDate: Timestamp.now(),
            daysPerWeek: 1,
            aiGenerated: true,
          },
          template: {
            name: 'AI Generated Workout',
            description: recommendation.rationale || '',
            daysPerWeek: 1,
            durationWeeks: 1,
            difficulty: safeDifficulty > 7 ? 'Advanced' : safeDifficulty > 4 ? 'Intermediate' : 'Beginner',
            focus: recommendation.focusAreas || [],
          },
          days: aiWorkoutDays,
        }
      );

      console.log(`✅ Saved AI workout to: aiWorkouts/${aiWorkoutId}`);
      
      Toast.show({
        type: 'success',
        text1: 'AI Workout Ready! 💪',
        text2: 'Starting your workout now',
      });

      // Navigate directly to workout detail
      navigation.navigate('WorkoutDetail', {
        day: aiWorkoutDays[0],
        weekIdx: 0,
        dayIdx: 0,
        sourceType: 'ai',
        workoutId: aiWorkoutId,
      });
    } catch (error) {
      console.error('Error applying AI workout:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to apply workout',
        text2: 'Please try again',
      });
    }
  };

  // Load recent workout history
  const fetchRecentWorkout = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      const historyQuery = query(
        collection(db, 'users', uid, 'workoutHistory'),
        orderBy('completedAt', 'desc'),
        limit(1)
      );
      const snapshot = await getDocs(historyQuery);
      
      console.log('📊 Recent workout query result:', snapshot.size, 'documents');
      
      if (!snapshot.empty) {
        const lastWorkout = snapshot.docs[0].data();
        console.log('📊 Last workout:', lastWorkout);
        setRecentWorkout(lastWorkout);
      } else {
        console.log('📊 No workout history found');
      }
    } catch (error) {
      console.error('Error loading recent workout:', error);
    }
  };

  // Archive a program
  const handleArchiveProgram = async (program: PeriodizedProgram) => {
    const uid = auth.currentUser?.uid;
    if (!uid || !program.id) return;

    try {
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'users', uid, 'aiPrograms', program.id), {
        isActive: false,
        isArchived: true,
        archivedAt: Timestamp.now(),
      });
      
      Toast.show({
        type: 'success',
        text1: 'Program Archived',
        text2: 'You can resume it anytime',
      });
      
      fetchAiPrograms();
    } catch (error) {
      console.error('Error archiving program:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to archive',
        text2: 'Please try again',
      });
    }
  };

  // Delete a program permanently
  const handleDeleteProgram = async (program: PeriodizedProgram) => {
    const uid = auth.currentUser?.uid;
    if (!uid || !program.id) return;

    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'users', uid, 'aiPrograms', program.id));
      
      Toast.show({
        type: 'success',
        text1: 'Program Deleted',
        text2: 'Program removed permanently',
      });
      
      fetchAiPrograms();
    } catch (error) {
      console.error('Error deleting program:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to delete',
        text2: 'Please try again',
      });
    }
  };

  // Resume an archived program
  const handleResumeProgram = async (program: PeriodizedProgram, startFresh: boolean) => {
    const uid = auth.currentUser?.uid;
    if (!uid || !program.id) return;

    try {
      const { updateDoc } = await import('firebase/firestore');
      
      // Deactivate all other programs
      const allPrograms = await getDocs(collection(db, 'users', uid, 'aiPrograms'));
      await Promise.all(
        allPrograms.docs.map(d => updateDoc(d.ref, { isActive: false }))
      );
      
      // Activate this program
      await updateDoc(doc(db, 'users', uid, 'aiPrograms', program.id), {
        isActive: true,
        isArchived: false,
        archivedAt: null,
        currentWeek: startFresh ? 1 : (program.currentWeek || 1),
        currentDay: startFresh ? 1 : (program.currentDay || 1),
      });
      
      Toast.show({
        type: 'success',
        text1: 'Program Resumed',
        text2: startFresh ? 'Starting from week 1' : 'Continuing from where you left off',
      });
      
      fetchAiPrograms();
    } catch (error) {
      console.error('Error resuming program:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to resume',
        text2: 'Please try again',
      });
    }
  };

  // Load AI-generated programs
  const fetchAiPrograms = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    
    try {
      const programsRef = collection(db, 'users', uid, 'aiPrograms');
      const q = query(programsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const programs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      console.log('📋 Loaded programs:', programs.length, 'programs');
      
      // 🔧 MIGRATION: Fix exercise IDs for existing programs
      const { resolveExercise } = await import('../utils/exerciseMatching');
      let needsUpdate = false;
      
      programs.forEach(program => {
        if (!program.weeks) return;
        
        program.weeks.forEach((week: any) => {
          if (!week.days) return;
          
          week.days.forEach((day: any) => {
            if (!day.exercises) return;
            
            day.exercises.forEach((exercise: any) => {
              if (!exercise.id || exercise.name === 'Unknown Exercise') {
                // Try to resolve using fuzzy matching
                const resolved = resolveExercise(exercise.name || exercise.id);
                if (resolved) {
                  console.log(`🔧 Fixed: "${exercise.name}" -> "${resolved.name}" (${resolved.id})`);
                  exercise.id = resolved.id;
                  exercise.name = resolved.name;
                  needsUpdate = true;
                } else {
                  console.warn(`⚠️ Could not resolve: "${exercise.name || exercise.id}"`);
                }
              }
            });
          });
        });
      });
      
      // If we fixed exercises, save back to Firestore and reload
      if (needsUpdate) {
        console.log('💾 Saving fixed exercises to Firestore...');
        const { updateDoc } = await import('firebase/firestore');
        await Promise.all(
          programs.map(p => 
            updateDoc(doc(db, 'users', uid, 'aiPrograms', p.id), {
              weeks: p.weeks
            })
          )
        );
        console.log('✅ Exercise fixes saved! Reloading programs...');
        
        // Reload from Firestore to get fresh data
        const reloadedSnapshot = await getDocs(q);
        const reloadedPrograms = reloadedSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as any[];
        
        setAiPrograms(reloadedPrograms);
        
        // Update active program reference
        const nonArchivedReloaded = reloadedPrograms.filter(p => !p.isArchived);
        const activeReloaded = nonArchivedReloaded.find(p => p.isActive) || nonArchivedReloaded[0];
        if (activeReloaded) {
          setActiveAiProgram(activeReloaded);
        }
        
        console.log('✅ Programs reloaded with fixed exercises!');
      } else {
        setAiPrograms(programs);
      }

      const prewrittenSnap = await getDoc(doc(db, 'users', uid, 'program', 'active'));
      const prewrittenData = prewrittenSnap.exists() ? prewrittenSnap.data() : null;
      if (Array.isArray(prewrittenData?.days) && prewrittenData.days.length > 0) {
        console.log('📋 Pre-made program is active; skipping AI program activation');
        setActiveAiProgram(null);
        return;
      }
      
      // Only proceed with activation if we didn't already reload
      if (needsUpdate) {
        return; // Exit early since we already set active program above
      }
      
      // Set active program (first one with isActive=true and isArchived=false)
      const nonArchivedPrograms = programs.filter(p => !p.isArchived);
      const active = nonArchivedPrograms.find(p => p.isActive) || nonArchivedPrograms[0];
      console.log('📋 Active program:', active ? active.programName : 'none');
      
      if (active) {
        // If program exists but isn't marked as active in Firestore, activate it now
        if (!active.isActive) {
          console.log('🔄 Auto-activating program:', active.programName);
          const { updateDoc } = await import('firebase/firestore');
          
          // Deactivate all other programs
          await Promise.all(
            programs.map(p => updateDoc(doc(db, 'users', uid, 'aiPrograms', p.id), { isActive: false }))
          );
          
          // Activate this one
          await updateDoc(doc(db, 'users', uid, 'aiPrograms', active.id), {
            isActive: true,
            isArchived: false,
          });
          
          // Update local state
          active.isActive = true;
        }
        
        setActiveAiProgram(active);
        // Load progress if exists
        const progressSnap = await getDoc(doc(db, 'users', uid, 'aiPrograms', active.id, 'progress', 'current'));
        if (progressSnap.exists()) {
          const progress = progressSnap.data();
          setCurrentWeekNum(progress.currentWeek || 1);
          setCurrentDayNum(progress.currentDay || 1);
        }
      } else {
        // No active programs - reset to empty state
        console.log('📋 No active programs, showing empty state');
        setActiveAiProgram(null);
      }
    } catch (err) {
      console.error('Error loading AI programs:', err);
    }
  }, []);

  // Check if program is completed and prompt for next action
  const checkProgramCompletion = useCallback(async () => {
    if (!activeAiProgram || !activeAiProgram.id) return;
    
    const currentWeek = activeAiProgram.currentWeek || currentWeekNum;
    const totalGeneratedWeeks = activeAiProgram.weeks.length;
    const totalPlannedWeeks = activeAiProgram.totalWeeks;
    
    // Check if user completed all generated weeks
    if (currentWeek > totalGeneratedWeeks) {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      
      // Check if program is fully complete or needs more weeks
      if (totalGeneratedWeeks >= totalPlannedWeeks) {
        // Program is complete!
        Alert.alert(
          '🎉 Program Completed!',
          `Congratulations! You've completed ${activeAiProgram.programName}. What would you like to do next?`,
          [
            {
              text: 'Archive & Build New Program',
              onPress: async () => {
                const { updateDoc, Timestamp } = await import('firebase/firestore');
                await updateDoc(doc(db, 'users', uid, 'aiPrograms', activeAiProgram.id!), {
                  isActive: false,
                  isArchived: true,
                  completedAt: Timestamp.now(),
                  archivedAt: Timestamp.now(),
                });
                setShowProgramModal(true);
                fetchAiPrograms();
              },
            },
            {
              text: 'Restart This Program',
              onPress: () => {
                setCurrentWeekNum(1);
                setCurrentDayNum(1);
              },
            },
            { text: 'Maybe Later', style: 'cancel' },
          ]
        );
      } else {
        // Need to generate next block of weeks
        Alert.alert(
          '📈 Ready for More?',
          `You've completed ${totalGeneratedWeeks} weeks. Generate the next block to continue your progress!`,
          [
            {
              text: 'Generate Next 2 Weeks',
              onPress: () => {
                Toast.show({
                  type: 'info',
                  text1: 'Coming Soon',
                  text2: 'Next block generation feature in development',
                });
                // TODO: Implement next block generation
              },
            },
            { text: 'Not Yet', style: 'cancel' },
          ]
        );
      }
    }
  }, [activeAiProgram, currentWeekNum, fetchAiPrograms]);

  // Check completion on week/day change
  useEffect(() => {
    if (activeAiProgram) {
      checkProgramCompletion();
    }
  }, [activeAiProgram, checkProgramCompletion, currentDayNum, currentWeekNum]);

  // Load legacy program structure (backward compatibility)
  const fetchProgram = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {return;}
    try {
      const snap = await getDoc(doc(db, 'users', uid, 'program', 'active'));
      if (snap.exists()) {
        const data = snap.data();
        const programDays = Array.isArray(data.days) ? data.days : [];
        const currentDay = Number(data.metadata?.currentDay ?? 1);
        setState({ currentDayIndex: Math.max(0, currentDay - 1) });
        setDays(programDays as ProgramDay[]);
        if (programDays.length > 0) {
          setActiveAiProgram(null);
        }
      } else {
        setDays([]);
        setState({ currentDayIndex: 0 });
      }
    } catch (err) {
      console.error('Error loading program:', err);
    }
  };

  useEffect(() => { 
    fetchAiPrograms(); 
    fetchProgram();
    fetchRecentWorkout();
  }, [fetchAiPrograms]);

  useFocusEffect(
    React.useCallback(() => {
      fetchAiPrograms();
      fetchProgram();
      fetchRecentWorkout();
      return () => {};
    }, [fetchAiPrograms])
  );

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const snap = await getDoc(doc(db, 'users', uid, 'profile', 'data'));
      if (snap.exists()) setUserProfile(snap.data());
    };
    loadProfile();
  }, []);

  /* ───────── 1. LOAD PROGRAM ───────── */
  useEffect(() => {
    (async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {return;}

      try {
        const snap = await getDoc(doc(db, 'users', uid, 'program', 'active'));
        if (snap.exists()) {
          const data = snap.data();
          const programDays = Array.isArray(data.days) ? data.days : [];
          const currentDay = Number(data.metadata?.currentDay ?? 1);
          setState({ currentDayIndex: Math.max(0, currentDay - 1) });
          setDays(programDays as ProgramDay[]);
          if (programDays.length > 0) {
            setActiveAiProgram(null);
          }
        }
      } catch (err) {
        console.error('Error loading program:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ───────── 2. BUILD weeksArr ───────── */
  useEffect(() => {
    if (!state || days.length === 0) {return;}

    const map: Record<number, ProgramDay[]> = {};
    days.forEach((d) => {
      const explicitWeek = Number((d as any).week);
      const titleWeek = parseInt(d.title?.match(/Week\s+(\d+)/)?.[1] ?? '1', 10);
      const wk = Math.max(0, (Number.isFinite(explicitWeek) ? explicitWeek : titleWeek) - 1);

      (map[wk] ||= []).push(d);
    });

    const weeks = Object.keys(map)
      .map(Number)
      .sort((a, b) => a - b)
      .map((wk) =>
        [...map[wk]].sort(
          (a, b) =>
            Number((a as any).day ?? 0) - Number((b as any).day ?? 0),
        ),
      );

    setWeeksArr(weeks);

    /* Position cursor on current day */
    let remaining = state.currentDayIndex;
    let w = 0;
    while (w < weeks.length && remaining >= weeks[w].length) {
      remaining -= weeks[w].length;
      w++;
    }
    setSelectedWeekIdx(Math.min(w, weeks.length - 1));
    setSelectedDayIdx(Math.max(0, remaining));
  }, [state, days]);

  const renderWorkoutHelp = () => (
    <PageHelpButton
      pageKey="workout"
      title="Workout Tips"
      intro="Use this page to start a planned program, generate a new one, or grab a quick session."
      top={70}
      tips={[
        {
          title: 'Program is the long-term plan',
          body: 'Generate Program builds a multi-week plan. Use this when you want the app to manage progression over time.',
        },
        {
          title: 'Quick Workout is for today only',
          body: 'Use Quick Workout when you need one session right now. Pick time, focus, and style, then apply it.',
        },
        {
          title: 'Use the icons',
          body: 'Rocket builds or manages programs, sparkles opens quick workout, calendar shows history, and book opens the exercise library.',
        },
      ]}
    />
  );

  /* ───────── 3. RENDER ───────── */
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </View>
    );
  }

  // Show AI program UI if available
  if (activeAiProgram && days.length === 0) {
    const currentWeek = activeAiProgram.weeks.find(w => w.weekNumber === currentWeekNum);
    const currentDay = currentWeek?.days.find(d => d.dayNumber === currentDayNum);
    
    return (
      <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>Your Program</Text>
            <View style={styles.headerIcons}>
              <Pressable onPress={() => setShowProgramModal(true)} style={styles.iconButton}>
                <Ionicons name="rocket" size={24} color="#FF9800" />
              </Pressable>
              <Pressable onPress={() => setShowAIAssistant(true)} style={styles.iconButton}>
                <Ionicons name="sparkles" size={24} color="#6a11cb" />
              </Pressable>
              <Pressable onPress={() => navigation.navigate('WorkoutHistory')} style={styles.iconButton}>
                <Ionicons name="calendar-outline" size={24} color="#d32f2f" />
              </Pressable>
              <Pressable onPress={() => navigation.navigate('ExerciseLibrary')} style={styles.iconButton}>
                <Ionicons name="book-outline" size={24} color="#d32f2f" />
              </Pressable>
            </View>
          </View>

          {/* ACTIVE PROGRAM CARD */}
          <View style={styles.activeProgramCard}>
            <View style={styles.programCardHeader}>
              <View style={{ flex: 1, paddingRight: 80 }}>
                <Text style={styles.programName}>{activeAiProgram.programName}</Text>
                <Text style={styles.programMeta}>
                  {activeAiProgram.periodizationModel} • Week {currentWeekNum}/{activeAiProgram.totalWeeks}
                </Text>
              </View>
            </View>
            <View style={styles.progressBadge}>
              <Text style={styles.progressText}>Day {currentDayNum}</Text>
            </View>
            
            {currentDay && (
              <>
                <Text style={styles.todayLabel}>Today's Workout</Text>
                <View style={styles.todayWorkout}>
                  <Text style={styles.dayTitle}>{currentDay.dayName}</Text>
                  <Text style={styles.dayFocus}>{currentDay.focus}</Text>
                  <Text style={styles.workoutStats}>
                    {currentDay.exercises.length} exercises • {currentDay.estimatedDuration} min
                  </Text>
                </View>
                
                <Pressable 
                  style={styles.startWorkoutButton}
                  onPress={async () => {
                    if (!currentDay) return;
                    
                    try {
                      const uid = auth.currentUser?.uid;
                      if (!uid) return;
                      
                      // Helper to convert exercise name to ID format (fallback if id not present)
                      const nameToId = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
                      const resolveExerciseId = (name: string) => resolveExercise(name)?.id || nameToId(name);
                      
                      // Convert AI program day to ProgramDay format for WorkoutDetail screen
                      const programDay: ProgramDay = {
                        week: currentWeekNum,
                        day: currentDayNum,
                        title: `${currentDay.dayName} - Week ${currentWeekNum}`,
                        priority: 1,
                        type: 'training',
                        phase: 'Strength',
                        warmup: currentDay.warmup.map(w => ({ 
                          id: resolveExerciseId(w),
                          exerciseId: resolveExerciseId(w),
                          sets: 1,
                          repsOrDuration: '5-10 reps',
                          rpe: 5
                        })),
                        exercises: currentDay.exercises.map(ex => ({
                          id: ex.id || nameToId(ex.name),
                          exerciseId: ex.id || nameToId(ex.name), // Use id field if available, fallback to name conversion
                          sets: ex.sets,
                          repsOrDuration: ex.reps,
                          rpe: 7,
                          restSeconds: ex.restSeconds,
                          notes: ex.notes || '',
                        })),
                        cooldown: currentDay.cooldown.map(c => ({ 
                          id: resolveExerciseId(c),
                          exerciseId: resolveExerciseId(c),
                          sets: 1,
                          repsOrDuration: '30-60 sec',
                          rpe: 5
                        })),
                      };
                      
                      // Navigate to workout detail
                      navigation.navigate('WorkoutDetail', {
                        day: programDay,
                        weekIdx: currentWeekNum - 1,
                        dayIdx: currentDayNum - 1,
                        sourceType: 'aiProgram',
                        weekNumber: currentWeekNum,
                      });
                    } catch (error) {
                      console.error('Error starting workout:', error);
                      Toast.show({
                        type: 'error',
                        text1: 'Failed to start workout',
                        text2: 'Please try again'
                      });
                    }
                  }}
                >
                  <Ionicons name="play" size={20} color="#fff" />
                  <Text style={styles.startWorkoutText}>Start Workout</Text>
                </Pressable>
              </>
            )}
          </View>

          {/* STRENGTH SCHEDULE */}
          {currentWeek && (
            <View style={styles.weekOverview}>
              <Text style={styles.sectionTitle}>This Week's Strength</Text>
              {currentWeek.days.map((day) => (
                <Pressable
                  key={day.dayNumber}
                  style={[
                    styles.dayItem,
                    day.dayNumber === currentDayNum && styles.dayItemActive
                  ]}
                  onPress={() => {
                    // Show day details in expanded view
                    setCurrentDayNum(day.dayNumber);
                  }}
                >
                  <View style={styles.dayItemLeft}>
                    <View style={[styles.dayDot, day.dayNumber === currentDayNum && styles.dayDotActive]} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.dayItemHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.dayItemName}>{day.dayName}</Text>
                          <Text style={styles.dayItemFocus}>{day.focus}</Text>
                        </View>
                        <Text style={styles.dayItemDuration}>{day.estimatedDuration}min</Text>
                      </View>
                      {day.dayNumber === currentDayNum && (
                        <View style={styles.dayItemExercises}>
                          {day.exercises && day.exercises.length > 0 ? (
                            day.exercises.map((ex, idx) => (
                              <Text key={idx} style={styles.exerciseListItem}>
                                • {ex.name} - {ex.sets}×{ex.reps}
                              </Text>
                            ))
                          ) : (
                            <Text style={styles.exerciseListItem}>
                              • {day.focus || 'Workout scheduled'}
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {/* CARDIO SCHEDULE */}
          {activeAiProgram?.cardioSchedule && (
            <View style={styles.cardioSchedule}>
              <View style={styles.cardioHeader}>
                <Ionicons name="fitness" size={24} color="#FF6B35" />
                <Text style={styles.sectionTitle}>🏃 Cardio Schedule</Text>
              </View>
              <Text style={styles.cardioFrequency}>
                {activeAiProgram.cardioSchedule.frequency} sessions per week
              </Text>
              {activeAiProgram.cardioSchedule.weeks
                .find(w => w.weekNumber === currentWeekNum)
                ?.sessions.map((session, idx) => (
                  (() => {
                    const completedCardioSessions = activeAiProgram.completedCardioSessions || [];
                    const sessionKey = `week${currentWeekNum}-${session.dayOfWeek}`;
                    const isCompleted = completedCardioSessions.includes(sessionKey);
                    return (
                  <Pressable
                    key={idx}
                    style={styles.cardioSession}
                    onPress={() => {
                      navigation.navigate('CardioWorkout', {
                        session,
                        weekNumber: currentWeekNum,
                      });
                    }}
                  >
                    <View style={styles.cardioSessionLeft}>
                      <View style={styles.cardioDayBadge}>
                        <Text style={styles.cardioDayText}>
                          {session.dayOfWeek.substring(0, 3)}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardioType}>{session.type}</Text>
                        <Text style={styles.cardioDetails}>
                          {session.duration} min • {session.intensity}
                        </Text>
                        {session.notes && (
                          <Text style={styles.cardioNotes}>{session.notes}</Text>
                        )}
                      </View>
                    </View>
                    <Ionicons
                      name={isCompleted ? 'checkmark-circle' : 'play-circle-outline'}
                      size={28}
                      color={isCompleted ? '#4CAF50' : '#FF6B35'}
                    />
                  </Pressable>
                    );
                  })()
                ))}
            </View>
          )}

          {/* PROGRAM LIBRARY */}
          {aiPrograms.length >= 1 && (
            <View style={styles.programLibrary}>
              <View style={styles.programLibraryHeader}>
                <Text style={styles.sectionTitle}>Your Programs</Text>
                <Pressable 
                  style={styles.filterToggle}
                  onPress={() => {
                    console.log('📋 Toggle archived. Current state:', showArchived);
                    setShowArchived(!showArchived);
                  }}
                >
                  <Ionicons 
                    name={showArchived ? "eye-off-outline" : "archive-outline"} 
                    size={20} 
                    color="#FF3C38" 
                  />
                  <Text style={styles.filterToggleText}>
                    {showArchived ? 'Hide Archived' : 'Show Archived'}
                  </Text>
                </Pressable>
              </View>
              
              {(() => {
                const filteredPrograms = aiPrograms.filter((p: any) => showArchived ? p.isArchived : !p.isArchived);
                console.log('📋 Showing', filteredPrograms.length, 'programs. Filter:', showArchived ? 'archived' : 'active');
                return filteredPrograms.map((program: any) => (
                <View key={program.id} style={styles.programItemWrapper}>
                  <Pressable
                    style={[
                      styles.programItem,
                      program.id === activeAiProgram?.id && styles.programItemActive,
                      program.isArchived && styles.programItemArchived
                    ]}
                    onPress={() => {
                      if (program.isArchived) {
                        // Show resume options
                        setSelectedProgramForAction(program);
                        setShowProgramActionModal(true);
                      } else {
                        // Switch to this program
                        setActiveAiProgram(program);
                        setCurrentWeekNum(program.currentWeek || 1);
                        setCurrentDayNum(program.currentDay || 1);
                      }
                    }}
                    onLongPress={() => {
                      setSelectedProgramForAction(program);
                      setShowProgramActionModal(true);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={styles.programItemHeader}>
                        <Text style={styles.programItemName}>{program.programName}</Text>
                        {program.isArchived && (
                          <View style={styles.archivedBadge}>
                            <Text style={styles.archivedBadgeText}>Archived</Text>
                          </View>
                        )}
                        {program.completedAt && (
                          <View style={styles.completedBadge}>
                            <Text style={styles.completedBadgeText}>✓ Completed</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.programItemMeta}>
                        {program.weeks?.length || 0} weeks • {program.periodizationModel}
                        {program.completedWeeks && ` • ${program.completedWeeks}/${program.totalWeeks} weeks done`}
                      </Text>
                    </View>
                    {program.id === activeAiProgram?.id && !program.isArchived && (
                      <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                    )}
                    {program.isArchived && (
                      <Ionicons name="refresh-outline" size={24} color="#2196F3" />
                    )}
                  </Pressable>
                </View>
              ));
              })()}
            </View>
          )}
        </ScrollView>

      {renderWorkoutHelp()}

      {/* AI ASSISTANT MODAL */}
      <AIWorkoutAssistant
        visible={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        onApplyRecommendation={handleApplyRecommendation}
      />
        
        {/* PROGRAM GENERATOR MODAL */}
        <PeriodizedProgramModal
          visible={showProgramModal}
          onClose={() => setShowProgramModal(false)}
          onProgramGenerated={() => {
            setShowProgramModal(false);
            fetchAiPrograms();
          }}
          userProfile={userProfile}
        />

        {/* PROGRAM ACTION MODAL */}
        <Modal
          visible={showProgramActionModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowProgramActionModal(false)}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setShowProgramActionModal(false)}
          >
            <View style={styles.actionModal}>
              <Text style={styles.actionModalTitle}>
                {selectedProgramForAction?.programName}
              </Text>
              <Text style={styles.actionModalSubtitle}>
                {selectedProgramForAction?.isArchived ? 'Archived Program' : 'Manage Program'}
              </Text>

              {selectedProgramForAction?.isArchived ? (
                <>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => {
                      if (selectedProgramForAction) {
                        handleResumeProgram(selectedProgramForAction, false);
                      }
                      setShowProgramActionModal(false);
                    }}
                  >
                    <Ionicons name="play-outline" size={24} color="#4CAF50" />
                    <Text style={styles.actionButtonText}>Resume from where I left off</Text>
                  </Pressable>

                  <Pressable
                    style={styles.actionButton}
                    onPress={() => {
                      if (selectedProgramForAction) {
                        handleResumeProgram(selectedProgramForAction, true);
                      }
                      setShowProgramActionModal(false);
                    }}
                  >
                    <Ionicons name="refresh-outline" size={24} color="#2196F3" />
                    <Text style={styles.actionButtonText}>Start fresh from Week 1</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.actionButton, styles.actionButtonDanger]}
                    onPress={() => {
                      if (selectedProgramForAction) {
                        handleDeleteProgram(selectedProgramForAction);
                      }
                      setShowProgramActionModal(false);
                    }}
                  >
                    <Ionicons name="trash-outline" size={24} color="#FF3C38" />
                    <Text style={[styles.actionButtonText, { color: '#FF3C38' }]}>Delete Permanently</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => {
                      if (selectedProgramForAction) {
                        handleArchiveProgram(selectedProgramForAction);
                      }
                      setShowProgramActionModal(false);
                    }}
                  >
                    <Ionicons name="archive-outline" size={24} color="#FF9800" />
                    <Text style={styles.actionButtonText}>Archive Program</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.actionButton, styles.actionButtonDanger]}
                    onPress={() => {
                      if (selectedProgramForAction) {
                        handleDeleteProgram(selectedProgramForAction);
                      }
                      setShowProgramActionModal(false);
                    }}
                  >
                    <Ionicons name="trash-outline" size={24} color="#FF3C38" />
                    <Text style={[styles.actionButtonText, { color: '#FF3C38' }]}>Delete Permanently</Text>
                  </Pressable>
                </>
              )}

              <Pressable
                style={[styles.actionButton, styles.actionButtonCancel]}
                onPress={() => setShowProgramActionModal(false)}
              >
                <Text style={styles.actionButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

      </LinearGradient>
    );
  }

  // EMPTY STATE - No active program (show even if there are archived programs)
  if (!activeAiProgram && days.length === 0) {
    return (
      <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.emptyStateContainer}>
          {/* HERO SECTION */}
          <View style={styles.emptyHero}>
            <Text style={styles.emptyHeroTitle}>🎯 Ready to Train?</Text>
            <Text style={styles.emptyHeroSubtitle}>Choose how you want to work out</Text>
          </View>

          {/* CUSTOM TRAINING PROGRAM CARD */}
          <Pressable 
            style={styles.emptyCard}
            onPress={() => setShowProgramModal(true)}
          >
            <LinearGradient
              colors={['rgba(255, 60, 56, 0.15)', 'rgba(255, 107, 53, 0.15)']}
              style={styles.emptyCardGradient}
            >
              <View style={styles.emptyCardIcon}>
                <Ionicons name="sparkles" size={32} color="#FF3C38" />
              </View>
              <Text style={styles.emptyCardTitle}>Custom Training Program</Text>
              <Text style={styles.emptyCardDescription}>
                Create a personalized multi-week program tailored to your goals and equipment
              </Text>
              <View style={styles.emptyCardButton}>
                <Text style={styles.emptyCardButtonText}>Generate Program</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </View>
            </LinearGradient>
          </Pressable>

          {/* QUICK WORKOUT CARD */}
          <Pressable 
            style={styles.emptyCard}
            onPress={() => setShowAIAssistant(true)}
          >
            <LinearGradient
              colors={['rgba(33, 150, 243, 0.15)', 'rgba(0, 188, 212, 0.15)']}
              style={styles.emptyCardGradient}
            >
              <View style={styles.emptyCardIcon}>
                <Ionicons name="flash" size={32} color="#2196F3" />
              </View>
              <Text style={styles.emptyCardTitle}>Quick Workout</Text>
              <Text style={styles.emptyCardDescription}>
                Get a single badass workout session right now - choose focus, time, and style
              </Text>
              <View style={styles.emptyCardButton}>
                <Text style={styles.emptyCardButtonText}>Get Quick Workout</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </View>
            </LinearGradient>
          </Pressable>

          {/* RECENT ACTIVITY CARD */}
          <Pressable 
            style={styles.recentActivityCard}
            onPress={() => navigation.navigate('WorkoutHistory')}
          >
            <Text style={styles.recentActivityTitle}>📊 Recent Activity</Text>
            {recentWorkout ? (
              <>
                <Text style={styles.recentWorkoutName}>{recentWorkout.title || 'Recent Workout'}</Text>
                <Text style={styles.recentWorkoutMeta}>
                  {recentWorkout.completedAt ? 
                    new Date(recentWorkout.completedAt.toDate()).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    }) : 'Recently completed'}
                  {recentWorkout.duration ? ` • ${recentWorkout.duration} min` : ''}
                </Text>
                <View style={styles.recentWorkoutFooter}>
                  <Text style={styles.recentWorkoutDetails}>View History</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FF3C38" />
                </View>
              </>
            ) : (
              <Text style={styles.recentActivityEmpty}>
                No workouts yet - let's change that!
              </Text>
            )}
          </Pressable>

          {/* ARCHIVED PROGRAMS SECTION */}
          {aiPrograms.filter((p: any) => p.isArchived).length > 0 && (
            <View style={styles.archivedProgramsSection}>
              <Text style={styles.sectionTitle}>📦 Archived Programs</Text>
              <Text style={styles.archivedProgramsSubtitle}>
                Tap any program to resume or view details
              </Text>
              {aiPrograms
                .filter((p: any) => p.isArchived)
                .map((program: any) => (
                  <Pressable
                    key={program.id}
                    style={styles.archivedProgramCard}
                    onPress={() => {
                      setSelectedProgramForAction(program);
                      setShowProgramActionModal(true);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={styles.programItemHeader}>
                        <Text style={styles.programItemName}>{program.programName}</Text>
                        {program.completedAt && (
                          <View style={styles.completedBadge}>
                            <Text style={styles.completedBadgeText}>✓ Completed</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.programItemMeta}>
                        {program.weeks?.length || 0} weeks • {program.periodizationModel}
                        {program.completedWeeks && ` • ${program.completedWeeks}/${program.totalWeeks} weeks done`}
                      </Text>
                      {program.archivedAt && (
                        <Text style={styles.archivedDateText}>
                          Archived {new Date(program.archivedAt.toDate()).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="refresh-outline" size={24} color="#2196F3" />
                  </Pressable>
                ))}
            </View>
          )}
        </ScrollView>

        {renderWorkoutHelp()}

        {/* AI ASSISTANT MODAL */}
        <AIWorkoutAssistant
          visible={showAIAssistant}
          onClose={() => setShowAIAssistant(false)}
          onApplyRecommendation={handleApplyRecommendation}
        />
        
        {/* PROGRAM GENERATOR MODAL */}
        <PeriodizedProgramModal
          visible={showProgramModal}
          onClose={() => setShowProgramModal(false)}
          onProgramGenerated={() => {
            setShowProgramModal(false);
            fetchAiPrograms();
          }}
          userProfile={userProfile}
        />
      </LinearGradient>
    );
  }

  // Fall back to legacy program structure
  if (!state || days.length === 0) {
    return (
      <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>🏋️ Workout Hub</Text>
          <Text style={styles.subtitle}>No active program.</Text>
          <Pressable
            style={styles.generateButton}
            onPress={() => setShowProgramModal(true)}
          >
            <Ionicons name="rocket" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Generate AI Program</Text>
          </Pressable>
        </View>
        
        <PeriodizedProgramModal
          visible={showProgramModal}
          onClose={() => setShowProgramModal(false)}
          onProgramGenerated={() => {
            setShowProgramModal(false);
            fetchAiPrograms();
          }}
          userProfile={userProfile}
        />
      </LinearGradient>
    );
  }

  const daysThisWeek = weeksArr[selectedWeekIdx] || [];
  const today = daysThisWeek[selectedDayIdx];

  return (
    <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Program</Text>
        <View style={styles.headerIcons}>
          <Pressable onPress={() => setShowProgramModal(true)} style={styles.iconButton}>
            <Ionicons name="rocket" size={24} color="#FF9800" />
          </Pressable>
          <Pressable onPress={() => setShowAIAssistant(true)} style={styles.iconButton}>
            <Ionicons name="sparkles" size={24} color="#6a11cb" />
          </Pressable>
          <Pressable onPress={() => navigation.navigate('WorkoutHistory')} style={styles.iconButton}>
            <Ionicons name="calendar-outline" size={24} color="#d32f2f" />
          </Pressable>
          <Pressable onPress={() => navigation.navigate('ExerciseLibrary')} style={styles.iconButton}>
            <Ionicons name="book-outline" size={24} color="#d32f2f" />
          </Pressable>
          {/* <Pressable
  onPress={async () => {
    try {
      // TEMP default goals. swap to your real user goals later.
      const goals = {
        focus: ['strength', 'conditioning'],
        daysPerWeek: 4,
        includeFireground: true,
        durationWeeks: 2,
        goalType: 'Build Muscle',
        experienceLevel: 'Intermediate',
        equipment: ['Bodyweight', 'Dumbbells', 'Kettlebells'],
      } as const;
      await regenerateActiveProgram(goals as any);
      Alert.alert('Program', 'New program generated and saved.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to regenerate');
    }
  }}
  style={styles.regenerateButton}
>
  <Text style={styles.buttonText}>Regenerate Program</Text>
</Pressable> */}

        </View>
      </View>

      {/* WEEK TABS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekTabs}>
        {weeksArr.map((_, wi) => (
          <Pressable
            key={wi}
            style={[styles.weekTab, selectedWeekIdx === wi && styles.weekTabSelected]}
            onPress={() => {
              setSelectedWeekIdx(wi);
              setSelectedDayIdx(0);
            }}
          >
            <Text style={styles.weekTabText}>Week {wi + 1}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* DAY TABS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayTabs}>
        {daysThisWeek.map((_, di) => (
          <Pressable
            key={di}
            style={[styles.dayTab, selectedDayIdx === di && styles.dayTabSelected]}
            onPress={() => setSelectedDayIdx(di)}
          >
            <Text style={styles.dayTabText}>Day {di + 1}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* WORKOUT PREVIEW */}
      <ScrollView contentContainerStyle={styles.content}>
        {today ? (
          <>
            <Text style={styles.cardTitle}>{today.title}</Text>

            {/* Warm-up */}
            <Text style={styles.sectionHeader}>Warm-up</Text>
            {(today.warmup || []).map((blk, i) => (
              <View
                key={`wu-${i}`}
                style={[
                  styles.exerciseRow,
                  i % 2 === 1 ? styles.rowAlt : undefined, // ✅ no “0” anymore
                ]}
              >
                <Text style={styles.exerciseName}>{formatExerciseName(blk.id)}</Text>
                <Text style={styles.exerciseSets}>{formatWorkoutDescription(blk.repsOrDuration)}</Text>
              </View>
            ))}

            {/* Main exercises */}
            <Text style={styles.sectionHeader}>Exercises</Text>
            {(today.exercises || []).map((blk, i) => (
              <View
                key={`ex-${i}`}
                style={[
                  styles.exerciseRow,
                  i % 2 === 1 ? styles.rowAlt : undefined,
                ]}
              >
                <Text style={styles.exerciseName}>{formatExerciseName(blk.id)}</Text>
                <Text style={styles.exerciseSets}>{formatWorkoutDescription(blk.repsOrDuration)}</Text>
              </View>
            ))}

            {/* Cool-down */}
            <Text style={styles.sectionHeader}>Cool-down</Text>
            {(today.cooldown || []).map((blk, i) => (
              <View
                key={`cd-${i}`}
                style={[
                  styles.exerciseRow,
                  i % 2 === 1 ? styles.rowAlt : undefined,
                ]}
              >
                <Text style={styles.exerciseName}>{formatExerciseName(blk.id)}</Text>
                <Text style={styles.exerciseSets}>{formatWorkoutDescription(blk.repsOrDuration)}</Text>
              </View>
            ))}

            {/* Start workout */}
            <Pressable
  style={styles.detailButton}
  onPress={() =>
    navigation.navigate('WorkoutDetail', {
      day: today,
      weekIdx: selectedWeekIdx,
      dayIdx: selectedDayIdx,
      sourceType: 'program',
    })
  }
>
  <Text style={styles.detailButtonText}>Start Workout</Text>
</Pressable>

          </>
        ) : (
          <Text style={styles.subtitle}>No workout for this day.</Text>
        )}
      </ScrollView>

      {renderWorkoutHelp()}

      {/* AI WORKOUT ASSISTANT MODAL */}
      <AIWorkoutAssistant
        visible={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        onApplyRecommendation={handleApplyRecommendation}
      />

      {/* PERIODIZED PROGRAM GENERATOR */}
      <PeriodizedProgramModal
        visible={showProgramModal}
        onClose={() => setShowProgramModal(false)}
        userProfile={{
          goals: userProfile?.goals || ['Build Strength'],
          experience: userProfile?.experienceLevel || 'intermediate',
          equipment: userProfile?.equipment || ['dumbbells', 'bodyweight'],
        }}
        onProgramGenerated={(programId) => {
          console.log('✅ Program generated:', programId);
          Toast.show({
            type: 'success',
            text1: 'Program Created!',
            text2: 'Your new program is active',
          });
          setShowProgramModal(false);
        }}
      />
    </LinearGradient>
  );
};

/* ───────── STYLES ───────── */
const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // EMPTY STATE
  emptyStateContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyHero: {
    alignItems: 'center',
    marginVertical: 40,
  },
  emptyHeroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyHeroSubtitle: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
  },
  emptyCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyCardGradient: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyCardIcon: {
    marginBottom: 16,
  },
  emptyCardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  emptyCardDescription: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 22,
    marginBottom: 20,
  },
  emptyCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyCardButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  recentActivityCard: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  recentActivityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  recentActivityEmpty: {
    fontSize: 15,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  recentWorkoutName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  recentWorkoutMeta: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 12,
  },
  recentWorkoutFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  recentWorkoutDetails: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF3C38',
  },
  archivedProgramsSection: {
    marginTop: 24,
  },
  archivedProgramsSubtitle: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 16,
    marginTop: -8,
  },
  archivedProgramCard: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  archivedDateText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    alignItems: 'center',
  },
  headerIcons: { flexDirection: 'row' },
  iconButton: { marginLeft: 12 },

  // WEEK TABS CONTAINER
weekTabs: {
  paddingHorizontal: 12,
  paddingTop: 10, // more top padding
  paddingBottom: 6,
},

weekTab: {
  paddingVertical: 12, // increased height
  paddingHorizontal: 26, // even wider
  marginRight: 12,
  marginBottom: 10,
  borderRadius: 20,
  backgroundColor: '#333',
  minWidth: 120,
  minHeight: 45,
  alignItems: 'center',
},
weekTabSelected: {
  backgroundColor: '#d32f2f',
  borderWidth: 1,
  borderColor: '#fff',
},
weekTabText: {
  color: '#fff',
  fontWeight: '700',
  fontSize: 16, // slightly larger
},

dayTabs: {
  paddingHorizontal: 12,
  paddingBottom: 10,
  paddingTop: 4,
  marginTop: 2,
},

dayTab: {
  paddingVertical: 10, // increased height
  paddingHorizontal: 24,
  marginRight: 12,
  marginBottom: 8,
  borderRadius: 20,
  backgroundColor: '#333',
  minWidth: 100,
  minHeight: 45,
  alignItems: 'center',
},
dayTabSelected: {
  backgroundColor: '#d32f2f',
  borderWidth: 1,
  borderColor: '#fff',
},
dayTabText: {
  color: '#fff',
  fontWeight: '700',
  fontSize: 15,
},


  // CONTENT BELOW PILLS
  content: { padding: 16, paddingBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', color: '#fff' },
  subtitle: { fontSize: 16, color: '#ccc', marginVertical: 12 },
  cardTitle: { fontSize: 20, fontWeight: '600', color: '#fff', marginBottom: 12 },

  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#d32f2f',
    marginTop: 20,
    marginBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#d32f2f',
  },

  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    minHeight: 40,
  },
  rowAlt: { backgroundColor: 'rgba(255,255,255,0.05)' },
  exerciseName: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
    marginRight: 10,
  },
  exerciseSets: {
    color: '#ccc',
    fontSize: 16,
    flexShrink: 1,
    textAlign: 'right',
    maxWidth: 150,
  },

  detailButton: {
    marginTop: 24,
    backgroundColor: '#d32f2f',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  detailButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  generateButton: {
    marginTop: 20,
    alignSelf: 'center',
    backgroundColor: '#d32f2f',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  regenerateButton: {
    padding: 10,
  },
  buttonText: { color: '#fff', fontWeight: '700' },
  
  // New AI Program styles
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  activeProgramCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FF3C38',
  },
  programCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  programName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  programMeta: {
    fontSize: 14,
    color: '#ccc',
  },
  progressBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#FF3C38',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexShrink: 0, // Prevent badge from shrinking
    minWidth: 60, // Ensure enough space for "Day X"
  },
  progressText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  todayLabel: {
    fontSize: 12,
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    fontWeight: '600',
  },
  todayWorkout: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  dayFocus: {
    fontSize: 14,
    color: '#FF9800',
    marginBottom: 8,
  },
  workoutStats: {
    fontSize: 14,
    color: '#ccc',
  },
  startWorkoutButton: {
    backgroundColor: '#FF3C38',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startWorkoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  weekOverview: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  dayItem: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  dayItemActive: {
    backgroundColor: '#333',
    borderWidth: 2,
    borderColor: '#FF3C38',
  },
  dayItemLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  dayItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  dayDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#444',
    marginTop: 4,
  },
  dayDotActive: {
    backgroundColor: '#FF3C38',
  },
  dayItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  dayItemFocus: {
    fontSize: 14,
    color: '#ccc',
  },
  dayItemExercises: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  exerciseListItem: {
    fontSize: 14,
    color: '#e0e0e0',
    marginVertical: 4,
    lineHeight: 20,
  },
  dayItemDuration: {
    fontSize: 14,
    color: '#bbb',
    fontWeight: '500',
  },
  // Cardio Schedule Styles
  cardioSchedule: {
    marginBottom: 24,
    backgroundColor: 'rgba(255, 107, 53, 0.05)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  cardioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardioFrequency: {
    fontSize: 14,
    color: '#FF9800',
    marginBottom: 16,
    fontWeight: '500',
  },
  cardioSession: {
    backgroundColor: '#2a2a2a',
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#444',
  },
  cardioSessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cardioDayBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cardioDayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  cardioType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  cardioDetails: {
    fontSize: 14,
    color: '#ccc',
  },
  cardioNotes: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  programLibrary: {
    marginBottom: 24,
  },
  programLibraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3C38',
  },
  programItemWrapper: {
    marginBottom: 8,
  },
  programItem: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  programItemActive: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: '#2d3a2d',
  },
  programItemArchived: {
    opacity: 0.7,
    borderWidth: 1,
    borderColor: '#666',
  },
  programItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  programItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  programItemMeta: {
    fontSize: 14,
    color: '#ccc',
  },
  archivedBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  archivedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  completedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  actionModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  actionModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  actionModalSubtitle: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  actionButtonDanger: {
    backgroundColor: 'rgba(255, 60, 56, 0.1)',
  },
  actionButtonCancel: {
    backgroundColor: '#333',
    justifyContent: 'center',
  },
});
export default WorkoutScreen;
