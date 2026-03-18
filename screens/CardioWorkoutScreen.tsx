import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
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
import { doc, setDoc, Timestamp, collection, getDoc, getDocs, query, where, updateDoc } from 'firebase/firestore';
import Toast from 'react-native-toast-message';

type CardioWorkoutRouteProp = RouteProp<RootStackParamList, 'CardioWorkout'>;

interface CardioSession {
  dayOfWeek: string;
  type: string;
  duration: number;
  intensity: string;
  notes?: string;
  targetHeartRate?: string;
  circuit?: {
    rounds: number;
    workSec: number;
    restSec: number;
    exercises: Array<string | { name: string; notes?: string }>;
  };
  warmup?: Array<string | { name: string; notes?: string }>;
  cooldown?: Array<string | { name: string; notes?: string }>;
}

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
  const [intervalActive, setIntervalActive] = useState(false);
  const [intervalPaused, setIntervalPaused] = useState(true);
  const [intervalPhase, setIntervalPhase] = useState<'work' | 'rest'>('work');
  const [intervalMsLeft, setIntervalMsLeft] = useState(0);
  const [intervalRound, setIntervalRound] = useState(1);
  const [intervalExerciseIndex, setIntervalExerciseIndex] = useState(0);
  const [intervalElapsedMs, setIntervalElapsedMs] = useState(0);
  const intervalLastTickRef = useRef<number | null>(null);
  const intervalCountdownRef = useRef<string | null>(null);
  const beepRef = useRef<any>(null);
  const [expandedVideos, setExpandedVideos] = useState<Set<string>>(new Set());

  // Detect if this is an interval/HIIT workout
  const isIntervalWorkout = !!session?.circuit ||
    session?.type?.toLowerCase().includes('hiit') || 
    session?.type?.toLowerCase().includes('circuit') ||
    session?.intensity?.toLowerCase().includes('interval') ||
    session?.notes?.toLowerCase().includes('rounds');

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

  const intervalConfig = session?.circuit
    ? {
        rounds: session.circuit.rounds,
        workSec: session.circuit.workSec,
        restSec: session.circuit.restSec,
      }
    : parseIntervalNotes(session?.notes);

  const suggestedCircuit: Array<string | { name: string; notes?: string }> = session?.circuit?.exercises?.length
    ? session.circuit.exercises
    : isIntervalWorkout
      ? ['Burpees', 'Kettlebell Swings', 'Mountain Climbers', 'Jump Rope', 'Air Squats']
      : [];

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

  const resolvedCircuit = suggestedCircuit.map(
    (exercise: string | { name: string; notes?: string }) => resolveCircuitExercise(exercise)
  );

  const formatPrepLine = (item: { name: string; notes?: string }) =>
    item.notes ? `${item.name} - ${item.notes}` : item.name;

  const buildCardioContext = () => {
    if (!session) return 'No cardio session loaded.';
    const lines = [
      `Cardio: ${session.type} (${session.duration} min, ${session.intensity})`,
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

  const playBeep = () => {
    const sound = beepRef.current;
    if (!sound) return;
    sound.stop(() => sound.play());
  };

  const playBeepSequence = (count: number) => {
    for (let i = 0; i < count; i += 1) {
      setTimeout(() => playBeep(), i * 200);
    }
  };

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
  }, [intervalActive, intervalPaused, intervalPhase, intervalConfig, intervalRound]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

      const derivedMinutes = isIntervalWorkout && intervalConfig
        ? Math.max(1, Math.ceil(intervalElapsedMs / 60000))
        : Math.max(1, Math.ceil(elapsedSeconds / 60));
      const finalDuration = actualDuration ? parseInt(actualDuration) : derivedMinutes;

      const cardioData = {
        dayTitle: `${session.type} - ${session.dayOfWeek}`,
        type: session.type,
        plannedDuration: session.duration,
        actualDuration: finalDuration,
        plannedIntensity: session.intensity,
        perceivedFeeling: feeling,
        roundsCompleted: roundsCompleted ? parseInt(roundsCompleted) : null,
        distance: distance ? parseFloat(distance) : null,
        pace: pace || null,
        avgHeartRate: avgHeartRate ? parseInt(avgHeartRate) : null,
        maxHeartRate: maxHeartRate ? parseInt(maxHeartRate) : null,
        calories: calories ? parseInt(calories) : null,
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
        text2: `${session.type} - ${finalDuration} minutes`,
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
              <Text style={styles.sessionType}>{session.type}</Text>
              <Text style={styles.sessionDay}>{session.dayOfWeek} • Week {weekNumber}</Text>
            </View>
          </View>
          <View style={styles.sessionDetails}>
            <View style={styles.sessionDetail}>
              <Text style={styles.sessionDetailLabel}>Planned Duration</Text>
              <Text style={styles.sessionDetailValue}>{session.duration} min</Text>
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
          <Text style={styles.dataCardTitle}>Workout Data (Optional)</Text>
          
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
                  placeholder="8"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={roundsCompleted}
                  onChangeText={setRoundsCompleted}
                />
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Distance</Text>
                <TextInput
                  style={styles.input}
                  placeholder="3.5 mi"
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
                  placeholder="8:30/mi"
                  placeholderTextColor="#666"
                  value={pace}
                  onChangeText={setPace}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Calories</Text>
                <TextInput
                  style={styles.input}
                  placeholder="300"
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
                  placeholder="300"
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
