import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Vibration,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Sound from 'react-native-sound';
import Video from 'react-native-video';
import YoutubePlayer from 'react-native-youtube-iframe';
import { auth, db } from '../firebase';
import { doc, setDoc, Timestamp, collection, getDocs, getDoc, query, where, updateDoc } from 'firebase/firestore';
import Toast from 'react-native-toast-message';
import {
  CARDIO_MODALITIES,
  CardioGoalMode,
  getHiitTemplateForModality,
  getInitialCardioModalityId,
} from '../utils/cardioTemplates';

type CardioWorkoutRouteProp = RouteProp<RootStackParamList, 'CardioWorkout'>;

const CardioWorkoutScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<CardioWorkoutRouteProp>();
  
  const { session, weekNumber } = route.params || {};
  
  const [isActive, setIsActive] = useState(false);
  const [hasStopped, setHasStopped] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [actualDuration, setActualDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [pace, setPace] = useState('');
  const [avgHeartRate, setAvgHeartRate] = useState('');
  const [maxHeartRate, setMaxHeartRate] = useState('');
  const [calories, setCalories] = useState('');
  const [feeling, setFeeling] = useState<'easy' | 'moderate' | 'hard' | 'max' | null>(null);
  const [userNotes, setUserNotes] = useState('');
  const [roundsCompleted, setRoundsCompleted] = useState('');
  const [showOptionalData, setShowOptionalData] = useState(false);
  const [profileWeightLbs, setProfileWeightLbs] = useState<number | null>(null);
  const [intervalActive, setIntervalActive] = useState(false);
  const [intervalPaused, setIntervalPaused] = useState(true);
  const [intervalPhase, setIntervalPhase] = useState<'work' | 'rest'>('work');
  const [intervalMsLeft, setIntervalMsLeft] = useState(0);
  const [intervalRound, setIntervalRound] = useState(1);
  const [intervalExerciseIndex, setIntervalExerciseIndex] = useState(0);
  const [intervalElapsedMs, setIntervalElapsedMs] = useState(0);
  const [customRounds, setCustomRounds] = useState('');
  const [customWorkSec, setCustomWorkSec] = useState('');
  const [customRestSec, setCustomRestSec] = useState('');
  const [selectedModalityId, setSelectedModalityId] = useState(() => getInitialCardioModalityId(session?.type));
  const [goalMode, setGoalMode] = useState<CardioGoalMode>('time');
  const [targetDuration, setTargetDuration] = useState(session?.duration ? String(session.duration) : '');
  const [targetDistance, setTargetDistance] = useState('');
  const intervalLastTickRef = useRef<number | null>(null);
  const intervalCountdownRef = useRef<string | null>(null);
  const beepRef = useRef<any>(null);
  const [expandedVideos, setExpandedVideos] = useState<Set<string>>(new Set());

  const selectedModality = CARDIO_MODALITIES.find(option => option.id === selectedModalityId) || CARDIO_MODALITIES[0];
  const selectedHiitTemplate = getHiitTemplateForModality(selectedModalityId);
  const isIntervalWorkout = selectedModality.category === 'hiit';

  useEffect(() => {
    setGoalMode(selectedModality.defaultGoalMode);
    setExpandedVideos(new Set());
  }, [selectedModality.defaultGoalMode, selectedModalityId]);

  const parseIntervalNotes = (notes?: string) => {
    if (!notes) return null;
    const normalized = notes.toLowerCase();
    const match = normalized.match(/(\d+)\s*rounds?[:\s-]*\s*(\d+)\s*s(?:ec|econds)?\s*work\s*\/\s*(\d+)\s*s(?:ec|econds)?\s*rest/);
    const matchCompact = normalized.match(/(\d+)\s*[x×]\s*(\d+)\s*s(?:ec|econds)?\s*\/\s*(\d+)\s*s(?:ec|econds)?/);
    if (!match) {
      if (!matchCompact) return null;
      const rounds = parseInt(matchCompact[1], 10);
      const workSec = parseInt(matchCompact[2], 10);
      const restSec = parseInt(matchCompact[3], 10);
      if (!rounds || !workSec || !restSec) return null;
      return { rounds, workSec, restSec };
    }
    const rounds = parseInt(match[1], 10);
    const workSec = parseInt(match[2], 10);
    const restSec = parseInt(match[3], 10);
    if (!rounds || !workSec || !restSec) return null;
    return { rounds, workSec, restSec };
  };

  const normalizePrepList = (list?: Array<string | { name: string; notes?: string }>) => {
    if (!list) return [];
    return list
      .map(item => {
        if (typeof item === 'string') return { name: item };
        return { name: item?.name || 'Exercise', notes: item?.notes };
      })
      .filter(item => item.name);
  };
  const warmupList = normalizePrepList(session?.warmup);
  const cooldownList = normalizePrepList(session?.cooldown);

  const baseIntervalConfig = useMemo(
    () => {
      if (!isIntervalWorkout) return null;
      if (session?.circuit && selectedModalityId === getInitialCardioModalityId(session?.type)) {
        return {
          rounds: session.circuit.rounds,
          workSec: session.circuit.workSec,
          restSec: session.circuit.restSec,
        };
      }
      return parseIntervalNotes(session?.notes) || {
        rounds: selectedHiitTemplate.rounds,
        workSec: selectedHiitTemplate.workSec,
        restSec: selectedHiitTemplate.restSec,
      };
    },
    [isIntervalWorkout, selectedHiitTemplate, selectedModalityId, session?.circuit, session?.notes, session?.type]
  );

  useEffect(() => {
    if (!baseIntervalConfig) return;
    setCustomRounds(String(baseIntervalConfig.rounds));
    setCustomWorkSec(String(baseIntervalConfig.workSec));
    setCustomRestSec(String(baseIntervalConfig.restSec));
  }, [baseIntervalConfig]);

  useEffect(() => {
    const loadProfileWeight = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      try {
        const profileSnap = await getDoc(doc(db, 'users', uid));
        const profile = profileSnap.data();
        const rawWeight = Number(profile?.currentWeight || profile?.weight);
        if (Number.isFinite(rawWeight) && rawWeight > 0) {
          setProfileWeightLbs(rawWeight);
        }
      } catch (error) {
        console.warn('Could not load profile weight for cardio estimate:', error);
      }
    };

    loadProfileWeight();
  }, []);

  const intervalConfig = useMemo(() => {
    if (!baseIntervalConfig) return null;
    const rounds = parseInt(customRounds, 10);
    const workSec = parseInt(customWorkSec, 10);
    const restSec = parseInt(customRestSec, 10);

    return {
      rounds: Number.isFinite(rounds) && rounds > 0 ? rounds : baseIntervalConfig.rounds,
      workSec: Number.isFinite(workSec) && workSec > 0 ? workSec : baseIntervalConfig.workSec,
      restSec: Number.isFinite(restSec) && restSec >= 0 ? restSec : baseIntervalConfig.restSec,
    };
  }, [baseIntervalConfig, customRestSec, customRounds, customWorkSec]);

  const suggestedCircuit: Array<string | { name: string; notes?: string }> = useMemo(
    () => isIntervalWorkout && session?.circuit?.exercises?.length && selectedModalityId === getInitialCardioModalityId(session?.type)
      ? session.circuit.exercises
      : isIntervalWorkout
        ? selectedHiitTemplate.exercises
        : [],
    [isIntervalWorkout, selectedHiitTemplate.exercises, selectedModalityId, session?.circuit?.exercises, session?.type]
  );

  const isCircuitFormat = !!intervalConfig && suggestedCircuit.length > 0;

  const getYoutubeVideoId = (url: string): string | null => {
    if (!url) return null;
    try {
      const normalized = url.trim();
      const watchMatch = normalized.match(/[?&]v=([^&]+)/);
      if (watchMatch?.[1]) return watchMatch[1];
      const shortMatch = normalized.match(/youtu\.be\/([^?/]+)/);
      if (shortMatch?.[1]) return shortMatch[1];
      const embedMatch = normalized.match(/youtube\.com\/embed\/([^?/]+)/);
      if (embedMatch?.[1]) return embedMatch[1];
      const shortsMatch = normalized.match(/youtube\.com\/shorts\/([^?/]+)/);
      if (shortsMatch?.[1]) return shortsMatch[1];
    } catch {
      return null;
    }
    return null;
  };

  const toggleVideo = (exerciseKey: string) => {
    setExpandedVideos(prev => {
      const next = new Set(prev);
      if (next.has(exerciseKey)) {
        next.delete(exerciseKey);
      } else {
        next.add(exerciseKey);
      }
      return next;
    });
  };

  const resolveCircuitExercise = (exercise: string | { name: string; notes?: string }) => {
    const name = typeof exercise === 'string' ? exercise : (exercise?.name || 'Exercise');
    const notes = typeof exercise === 'string' ? '' : (exercise?.notes || '');
    let matched: any = null;
    try {
      const { exercises: exerciseLibrary } = require('../data/exercises');
      matched = exerciseLibrary.find((ex: any) => ex.name.toLowerCase() === name.toLowerCase());
    } catch {
      matched = null;
    }
    return { name, notes, matched };
  };

  const resolvedCircuit = useMemo(
    () => suggestedCircuit.map(
      (exercise: string | { name: string; notes?: string }) => resolveCircuitExercise(exercise)
    ),
    [suggestedCircuit]
  );

  const formatPrepLine = (item: { name: string; notes?: string }) =>
    item.notes ? `${item.name} - ${item.notes}` : item.name;

  const buildCardioContext = () => {
    if (!session) return 'No cardio session loaded.';
    const lines = [
      `Cardio: ${selectedModality.label} (${plannedDurationMinutes || session.duration} min, ${session.intensity})`,
      `Day: ${session.dayOfWeek} • Week ${weekNumber}`,
      session.notes ? `Coach Notes: ${session.notes}` : 'Coach Notes: none',
      warmupList.length ? `Warm-Up: ${warmupList.map(formatPrepLine).join('; ')}` : 'Warm-Up: none',
      cooldownList.length ? `Cool-Down: ${cooldownList.map(formatPrepLine).join('; ')}` : 'Cool-Down: none',
    ];

    if (intervalConfig && suggestedCircuit.length > 0) {
      lines.push(
        `Interval: ${intervalConfig.rounds} rounds, ${intervalConfig.workSec}s work / ${intervalConfig.restSec}s rest`,
        `Circuit: ${suggestedCircuit
          .map((ex: string | { name: string; notes?: string }) => (typeof ex === 'string' ? ex : ex.name))
          .join(', ')}`
      );
    }

    return lines.join('\n');
  };

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    Sound.setCategory('Playback');
    const sound = new Sound(require('../assets/sounds/beep.wav'), (error: any) => {
      if (error) {
        console.warn('Failed to load beep sound', error);
      }
    });
    beepRef.current = sound;
    return () => {
      sound.release();
    };
  }, []);

  const playBeep = useCallback(() => {
    const sound = beepRef.current;
    if (!sound) return;
    sound.stop(() => sound.play());
  }, []);

  const playBeepSequence = useCallback((count: number) => {
    for (let i = 0; i < count; i += 1) {
      setTimeout(() => playBeep(), i * 200);
    }
  }, [playBeep]);

  // Interval timer logic (HIIT/rounds)
  useEffect(() => {
    if (!intervalConfig) return;
    if (!intervalActive || intervalPaused) return;

    intervalLastTickRef.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const last = intervalLastTickRef.current || now;
      const delta = now - last;
      intervalLastTickRef.current = now;

      setIntervalMsLeft(prev => {
        const nextMs = Math.max(0, prev - delta);
        const secondsLeft = Math.ceil(nextMs / 1000);
        if (secondsLeft > 0 && secondsLeft <= 3) {
          const countdownKey = `${intervalPhase}-${secondsLeft}`;
          if (intervalCountdownRef.current !== countdownKey) {
            playBeep();
            intervalCountdownRef.current = countdownKey;
          }
        }
        if (nextMs > 0) {
          return nextMs;
        }

        if (intervalPhase === 'rest') {
          if (isCircuitFormat) {
            const nextExerciseIndex = intervalExerciseIndex + 1;
            if (nextExerciseIndex >= resolvedCircuit.length) {
              const nextRound = intervalRound + 1;
              if (nextRound > intervalConfig.rounds) {
                setIntervalActive(false);
                setIntervalPaused(true);
                setIsActive(false);
                Vibration.vibrate(300);
                setRoundsCompleted((prev) => prev || String(intervalConfig.rounds));
                setActualDuration((prev) => prev || String(Math.max(1, Math.ceil(intervalElapsedMs / 60000))));
                playBeepSequence(3);
                intervalCountdownRef.current = null;
                return 0;
              }
              setIntervalRound(nextRound);
              setIntervalExerciseIndex(0);
            } else {
              setIntervalExerciseIndex(nextExerciseIndex);
            }
          } else {
            if (intervalRound >= intervalConfig.rounds) {
              setIntervalActive(false);
              setIntervalPaused(true);
              setIsActive(false);
              Vibration.vibrate(300);
              setRoundsCompleted((prev) => prev || String(intervalConfig.rounds));
              setActualDuration((prev) => prev || String(Math.max(1, Math.ceil(intervalElapsedMs / 60000))));
              playBeepSequence(3);
              intervalCountdownRef.current = null;
              return 0;
            }
            setIntervalRound(intervalRound + 1);
          }
        }

        const nextPhase = intervalPhase === 'work' ? 'rest' : 'work';
        const nextMsPhase = (nextPhase === 'work' ? intervalConfig.workSec : intervalConfig.restSec) * 1000;
        setIntervalPhase(nextPhase);
        Vibration.vibrate(150);
        intervalCountdownRef.current = null;
        return nextMsPhase;
      });
      setIntervalElapsedMs(prev => prev + delta);
    }, 250);

    return () => clearInterval(interval);
  }, [
    intervalActive,
    intervalConfig,
    intervalElapsedMs,
    intervalExerciseIndex,
    intervalPaused,
    intervalPhase,
    intervalRound,
    isCircuitFormat,
    playBeep,
    playBeepSequence,
    resolvedCircuit.length,
  ]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEstimatedCalories = (minutes: number) => {
    const weightLbs = profileWeightLbs || 185;
    const weightKg = weightLbs * 0.453592;
    const intensityText = `${session?.type || ''} ${session?.intensity || ''} ${session?.notes || ''}`.toLowerCase();
    const feelingMet = feeling === 'easy'
      ? 4.5
      : feeling === 'moderate'
      ? 6.5
      : feeling === 'hard'
      ? 8.5
      : feeling === 'max'
      ? 10.5
      : null;
    let met = feelingMet || 6.5;

    if (!feelingMet) {
      if (isIntervalWorkout) {
        met = 9.5;
      } else if (intensityText.includes('zone 2') || intensityText.includes('easy')) {
        met = 5.5;
      } else if (intensityText.includes('hard') || intensityText.includes('high')) {
        met = 8.5;
      } else if (intensityText.includes('run')) {
        met = 9;
      } else if (intensityText.includes('row') || intensityText.includes('bike') || intensityText.includes('assault')) {
        met = 7;
      } else if (intensityText.includes('walk')) {
        met = 3.8;
      }
    }

    return Math.max(1, Math.round((met * 3.5 * weightKg * minutes) / 200));
  };

  const getDerivedMinutes = () => {
    if (isIntervalWorkout && intervalConfig) {
      return Math.max(1, Math.ceil(intervalElapsedMs / 60000));
    }
    return Math.max(1, Math.ceil(elapsedSeconds / 60));
  };

  const hasTimedWork = elapsedSeconds > 0 || intervalElapsedMs > 0;
  const plannedDurationMinutes = parseInt(targetDuration, 10) || Number(session?.duration) || 0;
  const goalUsesDistance = !isIntervalWorkout && (goalMode === 'distance' || goalMode === 'both');
  const previewMinutes = actualDuration
    ? parseInt(actualDuration, 10) || getDerivedMinutes()
    : hasTimedWork
    ? getDerivedMinutes()
    : plannedDurationMinutes || getDerivedMinutes();
  const estimatedCalories = getEstimatedCalories(previewMinutes);

  const getAutoPace = (completedDistance: number, minutes: number) => {
    if (!completedDistance || !minutes) {
      return null;
    }
    const totalSecondsPerUnit = Math.round((minutes * 60) / completedDistance);
    const paceMinutes = Math.floor(totalSecondsPerUnit / 60);
    const paceSeconds = totalSecondsPerUnit % 60;
    return `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}/mi`;
  };

  const handleStartStop = () => {
    if (hasStopped) {
      return;
    }
    setIsActive(!isActive);
  };

  const handleStop = () => {
    if (elapsedSeconds === 0) {
      return;
    }
    setIsActive(false);
    setHasStopped(true);
    if (!actualDuration) {
      const minutes = Math.max(1, Math.ceil(elapsedSeconds / 60));
      setActualDuration(String(minutes));
    }
  };

  const handleReset = () => {
    setIsActive(false);
    setHasStopped(false);
    setElapsedSeconds(0);
    if (!actualDuration) {
      setActualDuration('');
    }
  };

  const startIntervalTimer = () => {
    if (!intervalConfig) return;
    setIntervalActive(true);
    setIntervalPaused(false);
    setIntervalPhase('work');
    setIntervalRound(1);
    setIntervalExerciseIndex(0);
    setIntervalMsLeft(intervalConfig.workSec * 1000);
    intervalCountdownRef.current = null;
    setIntervalElapsedMs(0);
    if (!isActive) {
      setIsActive(true);
    }
  };

  const toggleIntervalPause = () => {
    if (!intervalActive) {
      startIntervalTimer();
      return;
    }
    setIntervalPaused(prev => {
      const next = !prev;
      setIsActive(!next);
      if (!next) {
        intervalLastTickRef.current = Date.now();
      }
      return next;
    });
  };

  const resetIntervalTimer = () => {
    setIntervalActive(false);
    setIntervalPaused(true);
    setIntervalPhase('work');
    setIntervalRound(1);
    setIntervalExerciseIndex(0);
    setIntervalMsLeft(intervalConfig ? intervalConfig.workSec * 1000 : 0);
    setIsActive(false);
    intervalCountdownRef.current = null;
    setIntervalElapsedMs(0);
  };

  const stopIntervalTimer = () => {
    if (!intervalActive) return;
    setIntervalActive(false);
    setIntervalPaused(true);
    setIsActive(false);
    intervalCountdownRef.current = null;
    const completedRounds = intervalPhase === 'work'
      ? Math.max(0, intervalRound - 1)
      : intervalRound;
    setRoundsCompleted((prev) => prev || String(completedRounds));
    setActualDuration((prev) => prev || String(Math.max(1, Math.ceil(intervalElapsedMs / 60000))));
  };

  const handleComplete = async () => {
    if (!isActive && elapsedSeconds === 0) {
      Toast.show({
        type: 'error',
        text1: 'Start Timer First',
        text2: 'Please start the workout timer',
      });
      return;
    }

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

      const derivedMinutes = getDerivedMinutes();
      const finalDuration = actualDuration ? parseInt(actualDuration, 10) : derivedMinutes;
      const finalCalories = calories ? parseInt(calories, 10) : getEstimatedCalories(finalDuration);
      const completedDistance = distance ? parseFloat(distance) : null;
      const finalPace = pace || (completedDistance ? getAutoPace(completedDistance, finalDuration) : null);

      const cardioData = {
        dayTitle: `${selectedModality.label} - ${session.dayOfWeek}`,
        type: selectedModality.label,
        originalType: session.type,
        selectedModalityId,
        hiitTemplateId: isIntervalWorkout ? selectedHiitTemplate.id : null,
        plannedDuration: plannedDurationMinutes || session.duration,
        targetDistance: targetDistance ? parseFloat(targetDistance) : null,
        completedDistance,
        goalMode,
        actualDuration: finalDuration,
        plannedIntensity: session.intensity,
        perceivedFeeling: feeling,
        roundsCompleted: roundsCompleted ? parseInt(roundsCompleted, 10) : null,
        intervalSettings: intervalConfig
          ? {
              rounds: intervalConfig.rounds,
              workSec: intervalConfig.workSec,
              restSec: intervalConfig.restSec,
            }
          : null,
        distance: completedDistance,
        pace: finalPace,
        paceSource: pace ? 'manual' : finalPace ? 'calculated' : null,
        avgHeartRate: avgHeartRate ? parseInt(avgHeartRate, 10) : null,
        maxHeartRate: maxHeartRate ? parseInt(maxHeartRate, 10) : null,
        calories: finalCalories,
        caloriesSource: calories ? 'manual' : 'estimated',
        notes: userNotes || session.notes || '',
        completedAt: Timestamp.now(),
        weekNumber,
        dayOfWeek: session.dayOfWeek,
        workoutType: 'cardio',
      };

      // Save to workout logs (matches WorkoutHistoryScreen collection name)
      const historyRef = doc(collection(db, 'users', uid, 'workoutLogs'));
      await setDoc(historyRef, cardioData);
      
      console.log('✅ Cardio workout saved to workoutLogs collection:', cardioData.dayTitle);

      // Mark the cardio day as complete in AI program if applicable
      try {
        const aiProgramsRef = collection(db, 'users', uid, 'aiPrograms');
        const activeQuery = query(aiProgramsRef, where('isActive', '==', true));
        const activeProgramSnap = await getDocs(activeQuery);
        
        if (!activeProgramSnap.empty) {
          const programDoc = activeProgramSnap.docs[0];
          const programData = programDoc.data();
          const completedCardioSessions = programData.completedCardioSessions || [];
          const sessionKey = `week${weekNumber}-${session.dayOfWeek}`;
          
          if (!completedCardioSessions.includes(sessionKey)) {
            await updateDoc(programDoc.ref, {
              completedCardioSessions: [...completedCardioSessions, sessionKey],
            });
            console.log('✅ Marked cardio session complete in AI program:', sessionKey);
          }
        }
      } catch (error) {
        console.warn('⚠️ Could not update AI program cardio completion:', error);
      }

      Toast.show({
        type: 'success',
        text1: '🎉 Cardio Complete!',
        text2: `${selectedModality.label} - ${finalDuration} minutes`,
        visibilityTime: 3000,
      });

      navigation.goBack();
    } catch (error) {
      console.error('Error saving cardio workout:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to save',
        text2: 'Please try again',
      });
    }
  };

  if (!session) {
    return (
      <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No cardio session data</Text>
        </View>
      </LinearGradient>
    );
  }

  const feelingOptions = [
    { value: 'easy', label: 'Easy', icon: 'happy-outline', color: '#4CAF50' },
    { value: 'moderate', label: 'Moderate', icon: 'remove-circle-outline', color: '#FF9800' },
    { value: 'hard', label: 'Hard', icon: 'sad-outline', color: '#FF5722' },
    { value: 'max', label: 'Maxed Out', icon: 'flame-outline', color: '#d32f2f' },
  ];

  return (
    <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Cardio Workout</Text>
        <Pressable
          onPress={() => navigation.navigate('AIChat', { context: buildCardioContext() })}
          style={styles.coachButton}
        >
          <Ionicons name="chatbubbles-outline" size={22} color="#fff" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* SESSION INFO */}
        <View style={styles.sessionCard}>
          <View style={styles.sessionHeader}>
            <Ionicons name="fitness" size={32} color="#FF6B35" />
            <View style={{ flex: 1 }}>
              <Text style={styles.sessionType}>{selectedModality.label}</Text>
              <Text style={styles.sessionDay}>{session.dayOfWeek} • Week {weekNumber}</Text>
            </View>
          </View>
          <View style={styles.sessionDetails}>
            <View style={styles.sessionDetail}>
              <Text style={styles.sessionDetailLabel}>Planned Duration</Text>
              <Text style={styles.sessionDetailValue}>{plannedDurationMinutes || session.duration} min</Text>
            </View>
            <View style={styles.sessionDetail}>
              <Text style={styles.sessionDetailLabel}>Target Intensity</Text>
              <Text style={styles.sessionDetailValue}>{session.intensity}</Text>
            </View>
          </View>
          {session.notes && (
            <View style={styles.sessionNotes}>
              <Text style={styles.sessionNotesLabel}>Coach Notes:</Text>
              <Text style={styles.sessionNotesText}>{session.notes}</Text>
            </View>
          )}
        </View>

        <View style={styles.customizeCard}>
          <View style={styles.customizeHeader}>
            <Text style={styles.dataCardTitle}>Customize Today</Text>
            <Text style={styles.customizeSubtitle}>Match the plan to your equipment and time</Text>
          </View>

          <Text style={styles.inputLabel}>Cardio option</Text>
          <View style={styles.modalityGrid}>
            {CARDIO_MODALITIES.map(option => (
              <Pressable
                key={option.id}
                style={[
                  styles.modalityChip,
                  selectedModalityId === option.id && styles.modalityChipActive,
                ]}
                onPress={() => {
                  if (intervalActive) return;
                  setSelectedModalityId(option.id);
                }}
              >
                <Ionicons
                  name={option.icon as any}
                  size={17}
                  color={selectedModalityId === option.id ? '#fff' : '#FFB74D'}
                />
                <Text
                  style={[
                    styles.modalityChipText,
                    selectedModalityId === option.id && styles.modalityChipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {isIntervalWorkout ? (
            <View style={styles.templateSummary}>
              <Text style={styles.templateTitle}>{selectedHiitTemplate.label}</Text>
              <Text style={styles.templateText}>{selectedHiitTemplate.equipment}</Text>
            </View>
          ) : (
            <>
              <Text style={styles.inputLabel}>Goal type</Text>
              <View style={styles.goalModeRow}>
                {(['time', 'distance', 'both'] as CardioGoalMode[]).map(mode => (
                  <Pressable
                    key={mode}
                    style={[styles.goalModeChip, goalMode === mode && styles.goalModeChipActive]}
                    onPress={() => setGoalMode(mode)}
                  >
                    <Text style={[styles.goalModeText, goalMode === mode && styles.goalModeTextActive]}>
                      {mode === 'time' ? 'Time' : mode === 'distance' ? 'Distance' : 'Both'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.inputRow}>
                {(goalMode === 'time' || goalMode === 'both') && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Target Time (min)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={String(session.duration)}
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                      value={targetDuration}
                      onChangeText={setTargetDuration}
                    />
                  </View>
                )}
                {(goalMode === 'distance' || goalMode === 'both') && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Target Distance</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="3.0 mi"
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                      value={targetDistance}
                      onChangeText={setTargetDistance}
                    />
                  </View>
                )}
              </View>
            </>
          )}
        </View>

        {warmupList.length > 0 && (
          <View style={styles.prepCard}>
            <Text style={styles.dataCardTitle}>Warm-Up</Text>
            <View style={styles.prepList}>
              {warmupList.map((item, idx) => (
                <View key={`warmup-${idx}`} style={styles.prepItemRow}>
                  <Text style={styles.prepItem}>• {item.name}</Text>
                  {item.notes ? (
                    <Text style={styles.prepItemNotes}>{item.notes}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        )}

        {cooldownList.length > 0 && (
          <View style={styles.prepCard}>
            <Text style={styles.dataCardTitle}>Cool-Down</Text>
            <View style={styles.prepList}>
              {cooldownList.map((item, idx) => (
                <View key={`cooldown-${idx}`} style={styles.prepItemRow}>
                  <Text style={styles.prepItem}>• {item.name}</Text>
                  {item.notes ? (
                    <Text style={styles.prepItemNotes}>{item.notes}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* TIMER */}
        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>Workout Timer</Text>
          <Text style={styles.timerDisplay}>
            {isIntervalWorkout && intervalConfig
              ? formatTime(Math.floor(intervalElapsedMs / 1000))
              : formatTime(elapsedSeconds)}
          </Text>
          {isIntervalWorkout && intervalConfig ? (
            <Text style={styles.timerHelperText}>
              Controlled by the interval timer
            </Text>
          ) : (
            <View style={styles.timerButtonRow}>
              <Pressable
                style={[styles.timerButton, isActive && styles.timerButtonActive, hasStopped && styles.timerButtonDisabled]}
                onPress={handleStartStop}
                disabled={hasStopped}
              >
                <Ionicons name={isActive ? 'pause' : 'play'} size={28} color="#fff" />
                <Text style={styles.timerButtonText}>{isActive ? 'Pause' : 'Start'}</Text>
              </Pressable>
              <Pressable
                style={[styles.timerButtonSecondary, elapsedSeconds === 0 && styles.timerButtonDisabled]}
                onPress={handleStop}
                disabled={elapsedSeconds === 0}
              >
                <Ionicons name="stop-circle-outline" size={26} color="#fff" />
                <Text style={styles.timerButtonText}>Stop</Text>
              </Pressable>
              <Pressable
                style={[styles.timerButtonGhost, elapsedSeconds === 0 && styles.timerButtonDisabled]}
                onPress={handleReset}
                disabled={elapsedSeconds === 0}
              >
                <Ionicons name="refresh" size={24} color="#fff" />
                <Text style={styles.timerButtonText}>Reset</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.estimateCard}>
          <View style={styles.estimateTextBlock}>
            <Text style={styles.estimateLabel}>Estimated Burn</Text>
            <Text style={styles.estimateHelper}>
              Based on duration, intensity, and {profileWeightLbs ? 'profile weight' : 'default body weight'}
            </Text>
          </View>
          <Text style={styles.estimateValue}>
            {calories ? calories : estimatedCalories} cal
          </Text>
        </View>

        {/* HIIT CIRCUIT DETAILS */}
        {isIntervalWorkout && intervalConfig && suggestedCircuit.length > 0 && (
          <View style={styles.circuitCard}>
            <Text style={styles.dataCardTitle}>HIIT Circuit</Text>
            <Text style={styles.circuitMeta}>
              {intervalConfig.rounds} rounds • {intervalConfig.workSec}s work / {intervalConfig.restSec}s rest
            </Text>
            <Text style={styles.circuitSubtext}>1 round = all exercises once</Text>
            <View style={styles.circuitList}>
              {suggestedCircuit.map((exercise: string | { name: string; notes?: string }, idx: number) => {
                const { name, notes, matched } = resolveCircuitExercise(exercise);
                const exerciseKey = `${name}-${idx}`;
                const youtubeId = matched?.videoUrl ? getYoutubeVideoId(matched.videoUrl) : null;
                return (
                  <View key={exerciseKey} style={styles.circuitItemCard}>
                    <View style={styles.circuitItemHeader}>
                      <Text style={styles.circuitBullet}>•</Text>
                      <Text style={styles.circuitText}>{name}</Text>
                    </View>
                    {notes ? (
                      <Text style={styles.circuitNotes}>{notes}</Text>
                    ) : null}

                    {matched?.videoUrl ? (
                      <View style={styles.exerciseVideoContainer}>
                        {expandedVideos.has(exerciseKey) ? (
                          <View style={styles.videoPlayerContainer}>
                            {youtubeId ? (
                              <YoutubePlayer
                                height={200}
                                videoId={youtubeId}
                                play={false}
                              />
                            ) : (
                              <Video
                                source={{ uri: matched.videoUrl }}
                                style={styles.videoPlayer}
                                resizeMode="contain"
                                controls={true}
                                paused={false}
                                repeat={false}
                                onEnd={() => toggleVideo(exerciseKey)}
                              />
                            )}
                            <Pressable
                              style={styles.hideVideoButton}
                              onPress={() => toggleVideo(exerciseKey)}
                            >
                              <Text style={styles.hideVideoText}>Hide Video</Text>
                              <Ionicons name="close" size={16} color="#fff" style={styles.closeIcon} />
                            </Pressable>
                          </View>
                        ) : (
                          <Pressable
                            style={styles.viewExerciseButton}
                            onPress={() => toggleVideo(exerciseKey)}
                          >
                            <Ionicons name="play-circle-outline" size={20} color="#fff" />
                            <Text style={styles.viewExerciseText}>View Exercise</Text>
                          </Pressable>
                        )}
                      </View>
                    ) : (
                      <View style={styles.noVideoContainer}>
                        <Ionicons name="videocam-off-outline" size={16} color="#666" />
                        <Text style={styles.noVideoText}>No video available</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* HIIT / INTERVAL TIMER */}
        {isIntervalWorkout && intervalConfig && (
          <View style={styles.intervalCard}>
            <Text style={styles.dataCardTitle}>Interval Timer</Text>
            <Text style={styles.intervalMeta}>
              {intervalConfig.rounds} rounds • {intervalConfig.workSec}s work / {intervalConfig.restSec}s rest
            </Text>
            <View style={styles.intervalSettingsCard}>
              <View style={styles.intervalSettingsHeader}>
                <Text style={styles.intervalSettingsTitle}>Adjust Intervals</Text>
                <Text style={styles.intervalSettingsHint}>
                  {intervalActive ? 'Pause or reset to change timing' : 'Customize before start'}
                </Text>
              </View>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Rounds</Text>
                  <TextInput
                    style={[styles.input, intervalActive && styles.inputDisabled]}
                    keyboardType="numeric"
                    value={customRounds}
                    onChangeText={setCustomRounds}
                    editable={!intervalActive}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Work (sec)</Text>
                  <TextInput
                    style={[styles.input, intervalActive && styles.inputDisabled]}
                    keyboardType="numeric"
                    value={customWorkSec}
                    onChangeText={setCustomWorkSec}
                    editable={!intervalActive}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Rest (sec)</Text>
                  <TextInput
                    style={[styles.input, intervalActive && styles.inputDisabled]}
                    keyboardType="numeric"
                    value={customRestSec}
                    onChangeText={setCustomRestSec}
                    editable={!intervalActive}
                  />
                </View>
              </View>
            </View>
            <View style={styles.intervalDisplay}>
              {isCircuitFormat && resolvedCircuit[intervalExerciseIndex] && (
                <Text style={styles.intervalExerciseText}>
                  Exercise {intervalExerciseIndex + 1}/{resolvedCircuit.length}: {resolvedCircuit[intervalExerciseIndex].name}
                </Text>
              )}
              <View style={styles.intervalPhaseBadge}>
                <Text style={styles.intervalPhaseText}>
                  {intervalPhase === 'work' ? 'WORK' : 'REST'}
                </Text>
              </View>
              <Text style={styles.intervalTimeText}>
                {intervalMsLeft > 0 ? Math.ceil(intervalMsLeft / 1000) : intervalActive ? intervalConfig.workSec : 0}s
              </Text>
              <Text style={styles.intervalRoundText}>
                Round {intervalRound}/{intervalConfig.rounds}
              </Text>
            </View>
            <View style={styles.timerButtonRow}>
              <Pressable
                style={[styles.timerButton, intervalActive && !intervalPaused && styles.timerButtonActive]}
                onPress={toggleIntervalPause}
              >
                <Ionicons name={intervalActive && !intervalPaused ? 'pause' : 'play'} size={28} color="#fff" />
                <Text style={styles.timerButtonText}>
                  {intervalActive && !intervalPaused ? 'Pause' : 'Start'}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.timerButtonSecondary, !intervalActive && styles.timerButtonDisabled]}
                onPress={stopIntervalTimer}
                disabled={!intervalActive}
              >
                <Ionicons name="stop-circle-outline" size={26} color="#fff" />
                <Text style={styles.timerButtonText}>Stop</Text>
              </Pressable>
              <Pressable
                style={[styles.timerButtonGhost, !intervalActive && styles.timerButtonDisabled]}
                onPress={resetIntervalTimer}
                disabled={!intervalActive}
              >
                <Ionicons name="refresh" size={24} color="#fff" />
                <Text style={styles.timerButtonText}>Reset</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* WORKOUT DATA */}
        <View style={styles.dataCard}>
          <Pressable style={styles.optionalHeader} onPress={() => setShowOptionalData(prev => !prev)}>
            <View>
              <Text style={[styles.dataCardTitle, styles.optionalTitle]}>Optional Workout Data</Text>
              <Text style={styles.optionalSubtitle}>
                {goalUsesDistance
                  ? 'Add completed distance to calculate pace'
                  : 'Add distance, heart rate, or override the estimate'}
              </Text>
            </View>
            <Ionicons
              name={showOptionalData ? 'chevron-up' : 'chevron-down'}
              size={22}
              color="#fff"
            />
          </Pressable>

          {showOptionalData && (
            <>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Actual Duration (min)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={session.duration.toString()}
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    value={actualDuration}
                    onChangeText={setActualDuration}
                  />
                </View>
                {isIntervalWorkout ? (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Rounds Completed</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={String(intervalConfig?.rounds || 8)}
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                      value={roundsCompleted}
                      onChangeText={setRoundsCompleted}
                    />
                  </View>
                ) : (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      {goalUsesDistance ? 'Completed Distance' : 'Distance'}
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder={targetDistance || '3.5 mi'}
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                      value={distance}
                      onChangeText={setDistance}
                    />
                  </View>
                )}
              </View>

              {!isIntervalWorkout && (
                <View style={styles.inputRow}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Avg Pace</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={
                        distance
                          ? getAutoPace(parseFloat(distance), previewMinutes) || '8:30/mi'
                          : 'Auto from distance + timer'
                      }
                      placeholderTextColor="#666"
                      value={pace}
                      onChangeText={setPace}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Calories</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={String(estimatedCalories)}
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                      value={calories}
                      onChangeText={setCalories}
                    />
                  </View>
                </View>
              )}

              <View style={styles.inputRow}>
                {isIntervalWorkout && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Calories</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={String(estimatedCalories)}
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                      value={calories}
                      onChangeText={setCalories}
                    />
                  </View>
                )}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Avg HR (bpm)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="145"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    value={avgHeartRate}
                    onChangeText={setAvgHeartRate}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Max HR (bpm)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="165"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    value={maxHeartRate}
                    onChangeText={setMaxHeartRate}
                  />
                </View>
              </View>
            </>
          )}
        </View>

        {/* FEELING */}
        <View style={styles.feelingCard}>
          <Text style={styles.dataCardTitle}>How did it feel?</Text>
          <View style={styles.feelingOptions}>
            {feelingOptions.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.feelingOption,
                  feeling === option.value && { backgroundColor: option.color, borderColor: option.color }
                ]}
                onPress={() => setFeeling(option.value as any)}
              >
                <Ionicons 
                  name={option.icon as any} 
                  size={28} 
                  color={feeling === option.value ? '#fff' : option.color} 
                />
                <Text style={[
                  styles.feelingLabel,
                  feeling === option.value && { color: '#fff' }
                ]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* NOTES */}
        <View style={styles.notesCard}>
          <Text style={styles.dataCardTitle}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="How did the workout go? Any issues?"
            placeholderTextColor="#666"
            multiline
            numberOfLines={4}
            value={userNotes}
            onChangeText={setUserNotes}
          />
        </View>

        {/* COMPLETE BUTTON */}
        <Pressable style={styles.completeButton} onPress={handleComplete}>
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
          <Text style={styles.completeButtonText}>Complete Workout</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  coachButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  sessionCard: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  sessionType: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  sessionDay: {
    fontSize: 14,
    color: '#FF9800',
    marginTop: 4,
  },
  sessionDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  sessionDetail: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 12,
  },
  sessionDetailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  sessionDetailValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  sessionNotes: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 12,
  },
  sessionNotesLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  sessionNotesText: {
    fontSize: 14,
    color: '#e0e0e0',
    fontStyle: 'italic',
  },
  customizeCard: {
    backgroundColor: '#1f1f1f',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.28)',
  },
  customizeHeader: {
    marginBottom: 12,
  },
  customizeSubtitle: {
    color: '#aaa',
    fontSize: 12,
    marginTop: -10,
  },
  modalityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  modalityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#141414',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  modalityChipActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  modalityChipText: {
    color: '#ddd',
    fontSize: 12,
    fontWeight: '700',
  },
  modalityChipTextActive: {
    color: '#fff',
  },
  goalModeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  goalModeChip: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    paddingVertical: 10,
    alignItems: 'center',
  },
  goalModeChipActive: {
    backgroundColor: '#2a1b1b',
    borderColor: '#FF6B35',
  },
  goalModeText: {
    color: '#bbb',
    fontSize: 13,
    fontWeight: '700',
  },
  goalModeTextActive: {
    color: '#fff',
  },
  templateSummary: {
    backgroundColor: '#141414',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    padding: 12,
  },
  templateTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  templateText: {
    color: '#FFB74D',
    fontSize: 12,
    fontWeight: '600',
  },
  timerCard: {
    backgroundColor: '#2a2a2a',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  timerLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  timerDisplay: {
    fontSize: 56,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 20,
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    minWidth: 120,
    flexGrow: 1,
    justifyContent: 'center',
  },
  timerButtonActive: {
    backgroundColor: '#FF9800',
  },
  timerButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
  },
  timerButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#d32f2f',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 110,
    flexGrow: 1,
    justifyContent: 'center',
  },
  timerButtonGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#555',
    minWidth: 110,
    flexGrow: 1,
    justifyContent: 'center',
  },
  timerButtonDisabled: {
    opacity: 0.5,
  },
  timerButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  timerHelperText: {
    marginTop: 8,
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
  },
  estimateCard: {
    backgroundColor: '#1f1f1f',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  estimateTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  estimateLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  estimateHelper: {
    color: '#aaa',
    fontSize: 12,
    flexShrink: 1,
  },
  estimateValue: {
    color: '#4CAF50',
    fontSize: 22,
    fontWeight: '800',
    flexShrink: 0,
    textAlign: 'right',
  },
  prepCard: {
    backgroundColor: '#1f1f1f',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  prepList: {
    gap: 6,
  },
  prepItemRow: {
    gap: 4,
  },
  prepItem: {
    color: '#e0e0e0',
    fontSize: 14,
  },
  prepItemNotes: {
    color: '#FFB74D',
    fontSize: 12,
  },
  circuitCard: {
    backgroundColor: '#1f1f1f',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.35)',
  },
  circuitMeta: {
    fontSize: 13,
    color: '#ffb74d',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  circuitSubtext: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 10,
  },
  circuitList: {
    gap: 8,
  },
  circuitItemCard: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  circuitItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  circuitBullet: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '700',
  },
  circuitText: {
    color: '#e0e0e0',
    fontSize: 14,
    fontWeight: '500',
  },
  circuitNotes: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 8,
  },
  exerciseVideoContainer: {
    position: 'relative' as const,
    marginTop: 4,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    padding: 8,
  },
  videoPlayerContainer: {
    position: 'relative' as const,
  },
  videoPlayer: {
    width: '100%' as const,
    height: 200,
    backgroundColor: '#000',
    borderRadius: 8,
  },
  hideVideoButton: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  hideVideoText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500' as const,
  },
  closeIcon: {
    marginLeft: 4,
  },
  viewExerciseButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(51, 214, 166, 0.8)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    minHeight: 44,
  },
  viewExerciseText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#fff',
    marginLeft: 8,
  },
  noVideoContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(102, 102, 102, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  noVideoText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 6,
    fontStyle: 'italic' as const,
  },
  intervalCard: {
    backgroundColor: '#1f1f1f',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  intervalMeta: {
    fontSize: 13,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 12,
  },
  intervalSettingsCard: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 14,
  },
  intervalSettingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  intervalSettingsTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  intervalSettingsHint: {
    color: '#999',
    fontSize: 11,
    textAlign: 'right',
    flexShrink: 1,
  },
  intervalDisplay: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  intervalPhaseBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  intervalPhaseText: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 1,
  },
  intervalTimeText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
  },
  intervalExerciseText: {
    fontSize: 13,
    color: '#FFB74D',
    fontWeight: '600',
    textAlign: 'center',
  },
  intervalRoundText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
  },
  dataCard: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  dataCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  optionalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionalTitle: {
    marginBottom: 4,
  },
  optionalSubtitle: {
    color: '#aaa',
    fontSize: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  inputDisabled: {
    opacity: 0.55,
  },
  feelingCard: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  feelingOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  feelingOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#444',
  },
  feelingLabel: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
  notesCard: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  notesInput: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 12,
    marginTop: 8,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});

export default CardioWorkoutScreen;
