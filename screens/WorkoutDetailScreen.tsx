// screens/WorkoutDetailScreen.tsx
import React, { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from '../components/Toast';
import PRCelebration from '../components/PRCelebration';
import { useNavigation, useRoute, RouteProp, StackActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { auth, db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { checkAndAdjustRestDays } from '../utils/performanceMonitor';
import type { ExerciseBlock } from '../utils/types';
import EnhancedTimerBar from '../components/EnhancedTimerBar';
import VideoToggle from '../components/VideoToggle';
import { resolveExerciseDetails } from '../utils/exerciseUtils';
import { exercises } from '../data/exercises';

type WorkoutSet = { reps: string; weight: string };

/* ───────── helpers ───────── */
const pretty = (id: string) => {
  // Try to look up the actual exercise name from the database first
  const exercise = resolveExerciseDetails(id);
  if (exercise && exercise.name) {
    return exercise.name;
  }

  // Fallback to formatting the ID if not found in database
  return id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const fmtTime = (sec: number) => `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`;
const numFromStr = (s?: string) =>
  s ? parseInt(s.match(/\d+/)?.[0] ?? '', 10) : undefined;

/* ───────── util types ───────── */
type IntervalId = ReturnType<typeof setInterval>;
type WorkoutDetailRoute = RouteProp<RootStackParamList, 'WorkoutDetail'>;

/* ───────── types ───────── */
interface FirestoreExercise {
  name?: string;
  videoUrl?: string;
  sets?: number;
  reps?: number;
  repsOrTime?: number;
  type?: 'reps' | 'time';
}

interface EnrichedExercise {
  id: string;
  name: string;
  videoUri: string;
  setsCount: number;
  repsCount: number; // seconds if type === 'time'
  rpe: number;
  type: 'reps' | 'time' | 'amrap' | 'max_effort' | 'competition' | 'special';
}

interface TimedStatus {
  running: boolean;
  seconds: number;
  done: boolean;
  mode: 'stopwatch' | 'countdown';
  intervalId?: IntervalId;
}

/* ───────── child component ───────── */
interface MainExercisesSectionProps {
  title: string;
  list: EnrichedExercise[];
  progress: WorkoutSet[][];
  lastSession: Record<string, { reps: string; weight: string }[]>;
  timedRef: React.MutableRefObject<Record<string, TimedStatus[]>>;
  formatDesc: (ex: EnrichedExercise) => string;
  startTimedSet: (exId: string, setIdx: number, targetSec: number) => void;
  resetTimedSet: (exId: string, setIdx: number, targetSec: number) => void;
  updateInput: (
    exIdx: number,
    setIdx: number,
    field: 'reps' | 'weight',
    val: string
  ) => void;
  onPressChart: (exerciseId: string) => void;
}

const MainExercisesSection: React.FC<MainExercisesSectionProps> = ({
  title,
  list,
  progress,
  lastSession,
  timedRef,
  formatDesc,
  startTimedSet,
  resetTimedSet,
  updateInput,
  onPressChart,
}) => {
  return (
    <>
      <Text style={styles.sectionHeader}>{title}</Text>

      {list.map((ex, exIdx) => {
        const isComplete = progress[exIdx]?.every((s) => s.reps && s.weight);
        const last = lastSession[ex.id] ?? [];

        return (
          <View key={ex.id} style={[styles.card, isComplete && styles.cardDone]}>
            {/* header */}
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, isComplete && styles.cardTitleDone]}>
                {ex.name}
              </Text>

              <Pressable onPress={() => onPressChart(ex.id)}>
                <Ionicons name="stats-chart" size={20} color="#4fc3f7" />
              </Pressable>

              {/* ○ / ✔︎ toggle */}
              <Pressable
                onPress={() => {
                  const next = progress.map((sets, i) =>
                    i === exIdx
                      ? sets.map((_s) =>
                          isComplete ? { reps: '', weight: '' } : { reps: '✓', weight: '✓' }
                        )
                      : sets
                  );
                  next[exIdx].forEach((s, j) => {
                    updateInput(exIdx, j, 'reps', s.reps);
                    updateInput(exIdx, j, 'weight', s.weight);
                  });
                }}
              >
                <Ionicons
                  name={isComplete ? 'checkmark-circle' : 'ellipse-outline'}
                  size={28}
                  color={isComplete ? '#66bb6a' : '#bbb'}
                />
              </Pressable>
            </View>

            <Text style={styles.recommend}>
              {formatDesc(ex)} • RPE {ex.rpe}
            </Text>

            {/* video */}
            {!!ex.videoUri && <VideoToggle uri={ex.videoUri} />}

            {/* sets */}
            {Array.from({ length: ex.setsCount }).map((_, si) => {
              if (ex.type === 'time') {
                const t = timedRef.current[ex.id][si];
                return (
                  <View key={si} style={styles.setBlock}>
                    <View style={styles.setRow}>
                      <Text style={styles.setLabel}>Set {si + 1}</Text>
                      <Text style={styles.timerDigits}>
                        {fmtTime(t.mode === 'countdown' ? Math.max(0, t.seconds) : t.seconds)}
                      </Text>
                      <Pressable onPress={() => startTimedSet(ex.id, si, ex.repsCount)}>
                        <Ionicons
                          name={t.running ? 'pause-circle' : 'play-circle'}
                          size={28}
                          color="#4caf50"
                        />
                      </Pressable>
                      <Pressable onPress={() => resetTimedSet(ex.id, si, ex.repsCount)} style={styles.ml6}>
                        <Ionicons name="refresh" size={20} color="#ff9800" />
                      </Pressable>
                    </View>
                    {t.done && <Text style={styles.lastTxt}>Done ✔</Text>}
                  </View>
                );
              }

              if (ex.type === 'amrap') {
                const t = timedRef.current[ex.id][si];
                const set = progress[exIdx][si];
                return (
                  <View key={si} style={styles.setBlock}>
                    <View style={styles.setRow}>
                      <Text style={styles.setLabel}>AMRAP {ex.repsCount / 60} min</Text>
                      <Text style={styles.timerDigits}>
                        {fmtTime(t.mode === 'countdown' ? Math.max(0, t.seconds) : t.seconds)}
                      </Text>
                      <Pressable onPress={() => startTimedSet(ex.id, si, ex.repsCount)}>
                        <Ionicons
                          name={t.running ? 'pause-circle' : 'play-circle'}
                          size={28}
                          color="#4caf50"
                        />
                      </Pressable>
                      <Pressable onPress={() => resetTimedSet(ex.id, si, ex.repsCount)} style={styles.ml6}>
                        <Ionicons name="refresh" size={20} color="#ff9800" />
                      </Pressable>
                    </View>
                    <View style={styles.setRow}>
                      <Text style={styles.setLabel}>Rounds</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="rounds"
                        placeholderTextColor="#777"
                        keyboardType="number-pad"
                        editable={!isComplete}
                        value={String(set.reps ?? '')}
                        onChangeText={(text) => updateInput(exIdx, si, 'reps', text)}
                      />
                    </View>
                    {t.done && <Text style={styles.lastTxt}>AMRAP Complete ✔</Text>}
                  </View>
                );
              }

              if (ex.type === 'max_effort' || ex.type === 'competition' || ex.type === 'special') {
                const set = progress[exIdx][si];
                return (
                  <View key={si} style={styles.setBlock}>
                    <View style={styles.setRow}>
                      <Text style={styles.setLabel}>Performance</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="result"
                        placeholderTextColor="#777"
                        keyboardType="decimal-pad"
                        editable={!isComplete}
                        value={String(set.reps ?? '')}
                        onChangeText={(text) => updateInput(exIdx, si, 'reps', text)}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="time/weight"
                        placeholderTextColor="#777"
                        keyboardType="decimal-pad"
                        editable={!isComplete}
                        value={String(set.weight ?? '')}
                        onChangeText={(text) => updateInput(exIdx, si, 'weight', text)}
                      />
                    </View>
                    {last[si] && (
                      <Text style={styles.lastTxt}>
                        Last: {last[si].reps} @ {last[si].weight}
                      </Text>
                    )}
                  </View>
                );
              }

              // regular reps / weight
              const set = progress[exIdx][si];
              return (
                <View key={si} style={styles.setBlock}>
                  <View style={styles.setRow}>
                    <Text style={styles.setLabel}>Set {si + 1}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="reps"
                      placeholderTextColor="#777"
                      keyboardType="number-pad"
                      editable={!isComplete}
                      value={String(set.reps ?? '')}
                      onChangeText={(text) => updateInput(exIdx, si, 'reps', text)}
                    />

                    <TextInput
                      style={styles.input}
                      placeholder="lbs"
                      placeholderTextColor="#777"
                      keyboardType="decimal-pad"
                      editable={!isComplete}
                      value={String(set.weight ?? '')}
                      onChangeText={(text) => updateInput(exIdx, si, 'weight', text)}
                    />
                  </View>
                  {last[si] && (
                    <Text style={styles.lastTxt}>
                      Last: {last[si].reps} reps @ {last[si].weight} lbs
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        );
      })}
    </>
  );
};

/* ───────── component ───────── */
const WorkoutDetailScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<WorkoutDetailRoute>();
  const { day, weekIdx, dayIdx } = params;

  /* -------- loading -------- */
  const [loading, setLoading] = useState(true);

  /* -------- data -------- */
  const [warmup, setWarmup] = useState<EnrichedExercise[]>([]);
  const [main, setMain] = useState<EnrichedExercise[]>([]);
  const [cooldown, setCooldown] = useState<EnrichedExercise[]>([]);

  function navigateToWorkoutRoot() {
  // hop to the Workout tab if you use tabs
  navigation.getParent?.()?.navigate?.('Workout');
  // then clear this stack back to its root so Adapt/Detail aren’t left behind
  navigation.dispatch(StackActions.popToTop());
}

  /* -------- inputs -------- */
  const [progress, setProgress] = useState<WorkoutSet[][]>(() =>
    day.exercises.map((blk: ExerciseBlock) =>
      Array.from({ length: blk.sets ?? 1 }).map(() => ({ reps: '', weight: '' } as WorkoutSet))
    )
  );

  const [lastSession, setLastSession] = useState<
    Record<string, { reps: string; weight: string }[]>
  >({});

  /* -------- timers -------- */
  const [elapsedSec, setElapsedSec] = useState(0);
  const [workState, setWorkState] = useState<'idle' | 'running' | 'paused' | 'stopped'>('idle');
  const globalTimer = useRef<IntervalId | null>(null);

  // per-exercise timers  ➜  { exerciseId: TimedStatus[] }
  const timedRef = useRef<Record<string, TimedStatus[]>>({});

  /* -------- toasts & pop-ups -------- */
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [nextUp, setNextUp] = useState<string | null>(null);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [prMsgs, setPrMsgs] = useState<string[]>([]);
  const [showPR, setShowPR] = useState(false);

  /* -------- large countdown display -------- */
  const [activeTimer, setActiveTimer] = useState<{
    exerciseId: string;
    setIndex: number;
    exerciseName: string;
    totalTime: number;
  } | null>(null);

  /* ---- header: Adapt button ---- */
  // Move headerRight button out of render to avoid inline component definition
  const HeaderRightButton = React.useCallback(() => (
    <Pressable
      onPress={() => navigation.navigate('AdaptWorkout')}
      disabled={workState === 'running'}
      style={({ pressed }) => ({
        opacity: pressed || workState === 'running' ? 0.6 : 1,
        paddingHorizontal: 8,
        paddingVertical: 4,
      })}
      accessibilityLabel="Adapt workout"
    >
      <Ionicons name="swap-horizontal" size={22} color="#fff" />
    </Pressable>
  ), [navigation, workState]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: HeaderRightButton,
    });
  }, [navigation, workState, HeaderRightButton]);

  /* ── enrichment ── */
  const enrich = async (blk: ExerciseBlock): Promise<EnrichedExercise> => {
    // Map human-readable IDs to actual hexadecimal IDs in database
    const exerciseIdMap: Record<string, string> = {
      'banded_face_pull': '609e6c422c9349a885fa69c2dd2141f7', // Banded Face Pulls
      'glute_bridge': 'd68572790c034f40afbd39433926bc96', // Glute Bridge
      'worlds_greatest_stretch': '39292bf9cd8d403e9279d4c9bb8497c9', // World's Greatest Stretch
      // Add more mappings as needed - we'll get the video URLs from Firebase now!
    };

    // Use mapped ID if available, otherwise use the original ID
    const actualId = exerciseIdMap[blk.id] || blk.id;

    const snap = await getDoc(doc(db, 'exercises', actualId));
    const meta: FirestoreExercise = snap.exists() ? (snap.data() as any) : {};

    // If Firebase doesn't have the exercise, try to find it in local exercises.ts by name
    if (!snap.exists() || !meta.videoUrl) {
      // First try direct ID lookup in local exercises
      const localExercise = resolveExerciseDetails(actualId);

      if (localExercise && localExercise.videoUrl) {
        Object.assign(meta, {
          name: localExercise.name,
          videoUrl: localExercise.videoUrl,
          sets: localExercise.sets || 1,
          reps: localExercise.reps || 8,
        });
      } else {
        // If direct ID lookup fails, try name-based lookup with fuzzy matching
        // Convert the human-readable ID to a display name for searching
        const searchName = pretty(blk.id);

        // Helper function to normalize names for better matching
        const normalizeForSearch = (name: string) => {
          return name.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '') // Remove special characters
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim();
        };

        // Helper function to create search variations
        const createSearchVariations = (name: string) => {
          const normalized = normalizeForSearch(name);
          const variations = [
            normalized,
            normalized.replace(/s$/, ''), // Remove trailing 's' (singular/plural)
            normalized + 's', // Add trailing 's'
            normalized.replace(/\b(\w+)\b/g, '$1s'), // Make all words plural
            normalized.replace(/\bs\b/g, ''), // Remove standalone 's'
          ];
          return [...new Set(variations)]; // Remove duplicates
        };

        const searchVariations = createSearchVariations(searchName);
        const normalizedSearchName = normalizeForSearch(searchName);

        // Search exercises array with multiple strategies
        let foundByName = exercises.find((ex: any) => {
          const normalizedExName = normalizeForSearch(ex.name);

          // Strategy 1: Exact normalized match
          if (normalizedExName === normalizedSearchName) {
            return true;
          }

          // Strategy 2: Check if search variations match exercise name
          if (searchVariations.some(variation => normalizedExName.includes(variation))) {
            return true;
          }

          // Strategy 3: Check if exercise name variations match search name
          const exVariations = createSearchVariations(ex.name);
          if (exVariations.some(variation => normalizedSearchName.includes(normalizeForSearch(variation)))) {
            return true;
          }

          // Strategy 4: Original bidirectional partial matching (fallback)
          return ex.name.toLowerCase().includes(searchName.toLowerCase()) ||
                 searchName.toLowerCase().includes(ex.name.toLowerCase());
        });        if (foundByName && foundByName.videoUrl) {
          Object.assign(meta, {
            name: foundByName.name,
            videoUrl: foundByName.videoUrl,
            sets: foundByName.sets || 1,
            reps: foundByName.reps || 8,
          });
        }
      }
    }

    // Check for special workout types
    const repsText = blk.repsOrDuration.toLowerCase();
    const isAMRAP = repsText.includes('amrap');
    const isMaxEffort = repsText.includes('max') && (repsText.includes('distance') || repsText.includes('reps') || repsText.includes('flips') || repsText.includes('flights'));
    const isCompetition = repsText.includes('competition') || repsText.includes('test') || repsText.includes('challenge');

    // Fallback video URL - try to provide exercise-specific videos
    let fallbackVideoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4'; // default fallback

    // Map common warm-up/cool-down exercises to appropriate videos
    const exerciseVideoMap: Record<string, string> = {
      'banded_face_pull': 'https://www.youtube.com/watch?v=HSoHeSjvIdY', // Face Pull demonstration
      'wall_slide': 'https://www.youtube.com/watch?v=d6V2Exzb324', // Wall Slide mobility
      'arm_circle_pvc_pass': 'https://www.youtube.com/watch?v=qvqLMgOhFFE', // Arm circles
      'glute_bridge': 'https://firebasestorage.googleapis.com/v0/b/firefighter-wellness-app.firebasestorage.app/o/glute-bridge.mp4?alt=media', // Use existing if available
      'scap_pushup': 'https://www.youtube.com/watch?v=akgQbxhrhOc', // Scapular push-ups
      'worlds_greatest_stretch': 'https://www.youtube.com/watch?v=EKckKcZEK1E', // World's greatest stretch
      'hip_flexor_stretch': 'https://www.youtube.com/watch?v=UGEpQ1BRx-4', // Hip flexor stretch
      'hamstring_stretch_floor': 'https://www.youtube.com/watch?v=5f7bJg98TgI', // Hamstring stretch
      'box_breathing': 'https://www.youtube.com/watch?v=tEmt1Znux58', // Box breathing
      'band_shoulder_stretch': 'https://www.youtube.com/watch?v=HSoHeSjvIdY', // Band shoulder stretch
      'wall_pec_stretch': 'https://www.youtube.com/watch?v=dOJy_qGNqWg', // Wall pec stretch
      'incline_walk': 'https://www.youtube.com/watch?v=mrpzaCJGMQs', // Incline walking
    };

    if (exerciseVideoMap[blk.id]) {
      fallbackVideoUrl = exerciseVideoMap[blk.id];
    }

    // For special workouts, use custom logic
    if (isAMRAP || isMaxEffort || isCompetition) {
      return {
        id: blk.id,
        name: meta.name ?? pretty(blk.id),
        videoUri:
          meta.videoUrl && meta.videoUrl.trim()
            ? meta.videoUrl
            : fallbackVideoUrl,
        setsCount: 1, // Special workouts are typically single efforts
        repsCount: isAMRAP ? (numFromStr(blk.repsOrDuration) ?? 1) * 60 : 1, // AMRAP time in seconds, others just 1
        rpe: blk.rpe,
        type: isAMRAP ? 'amrap' : isMaxEffort ? 'max_effort' : isCompetition ? 'competition' : 'special',
      };
    }

    // Original logic for normal exercises
    return {
      id: blk.id,
      name: meta.name ?? pretty(blk.id),
      videoUri:
        meta.videoUrl && meta.videoUrl.trim()
          ? meta.videoUrl
          : fallbackVideoUrl,
      setsCount: meta.sets ?? blk.sets ?? 3,
      repsCount:
        meta.reps ??
        (blk.repsOrDuration.toLowerCase().includes('min')
          ? (numFromStr(blk.repsOrDuration) ?? 1) * 60
          : numFromStr(blk.repsOrDuration) ?? 8),
      rpe: blk.rpe,
      type:
        meta.type ??
        (blk.repsOrDuration.toLowerCase().includes('sec') ||
        blk.repsOrDuration.toLowerCase().includes('min')
          ? 'time'
          : 'reps'),
    };
  };

  /* ── fetch / initialise ── */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [w, m, c] = await Promise.all([
          Promise.all(day.warmup.map(enrich)),
          Promise.all(day.exercises.map(enrich)),
          Promise.all(day.cooldown.map(enrich)),
        ]);

        /* progress */
        const progInit = m.map((ex) =>
          Array.from({ length: ex.setsCount }).map(() => ({
            reps: '',
            weight: '',
          }))
        );

        /* timer state */
        const timerInit: Record<string, TimedStatus[]> = {};
        [...w, ...m, ...c].forEach((ex) => {
          if (ex.type === 'time' || ex.type === 'amrap') {
            timerInit[ex.id] = Array.from({ length: ex.setsCount }).map(() => ({
              running: false,
              seconds: 0,
              done: false,
              mode: ex.type === 'amrap' ? 'countdown' : 'countdown', // Default to countdown for both
            }));
          }
        });
        timedRef.current = timerInit;

        /* last-session lookup */
        const uid = auth.currentUser?.uid;
        const last: Record<string, { reps: string; weight: string }[]> = {};
        if (uid) {
          for (const ex of m) {
            const q = await getDocs(
              query(
                collection(db, 'users', uid, 'workoutLogs'),
                orderBy('completedAt', 'desc'),
                limit(5)
              )
            );
            for (const d of q.docs) {
              const data: any = d.data();
              const hit = data.exercises.find((e: any) => e.name === ex.id);
              if (hit) {
                last[ex.id] = hit.sets;
                break;
              }
            }
          }
        }

        if (alive) {
          setWarmup(w);
          setMain(m);
          setCooldown(c);
          setProgress(progInit);
          setLastSession(last);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (alive) {setLoading(false);}
      }
    })();
    return () => {
      alive = false;

      // Clear global timer
      if (globalTimer.current) {
        clearInterval(globalTimer.current);
      }

      // Clear all individual exercise timers
      Object.values(timedRef.current).forEach(exerciseTimers => {
        exerciseTimers.forEach(timer => {
          if (timer.intervalId) {
            clearInterval(timer.intervalId);
          }
        });
      });
    };
  }, [day]);

  /* ── GLOBAL TIMER EFFECT ── */
  useEffect(() => {
    if (workState === 'running') {
      globalTimer.current = setInterval(() => setElapsedSec((prev) => prev + 1), 1000);
    } else if (globalTimer.current) {
      clearInterval(globalTimer.current);
      globalTimer.current = null;
    }
  }, [workState]);

  /* ── helpers ── */
  const formatDesc = (ex: EnrichedExercise) => {
    if (ex.type === 'amrap') {
      return `${ex.repsCount / 60} min AMRAP`;
    } else if (ex.type === 'max_effort') {
      return 'Max Effort Challenge';
    } else if (ex.type === 'competition') {
      return 'Competition Test';
    } else if (ex.type === 'special') {
      return 'Special Challenge';
    } else if (ex.type === 'time') {
      return `${ex.setsCount}×${
        ex.repsCount % 60 === 0 ? `${ex.repsCount / 60} min` : `${ex.repsCount} sec`
      }`;
    } else {
      return `${ex.setsCount}×${ex.repsCount} reps`;
    }
  };

  const updateInput = (
    exIdx: number,
    setIdx: number,
    field: 'reps' | 'weight',
    val: string
  ) => {
    setProgress((prev) =>
      prev.map((exerciseSets, i) =>
        i === exIdx
          ? exerciseSets.map((set, j) => (j === setIdx ? { ...set, [field]: val } : set))
          : exerciseSets
      )
    );
  };

  /* ── PER-SET TIMER HANDLERS ── */
  const startTimedSet = (exId: string, setIdx: number, targetSec: number) => {
    const status = timedRef.current[exId]?.[setIdx];
    if (!status) {return;}

    // Find the exercise name
    const exercise = [...warmup, ...main, ...cooldown].find(ex => ex.id === exId);
    const exerciseName = exercise?.name || pretty(exId);

    // If already done, reset the timer
    if (status.done) {
      status.done = false;
      status.seconds = status.mode === 'countdown' ? targetSec : 0;
    }

    // Toggle running state (play/pause functionality)
    if (status.running) {
      // Pause the timer
      status.running = false;
      if (status.intervalId) {
        clearInterval(status.intervalId);
        status.intervalId = undefined;
      }
      // Clear the active timer display when pausing
      setActiveTimer(null);
      setElapsedSec((_prev) => _prev); // force re-render
      return;
    }

    // Start the timer
    status.running = true;

    // Initialize seconds if not set or if starting fresh
    if (status.seconds === 0 && status.mode === 'countdown') {
      status.seconds = targetSec;
    } else if (status.seconds === 0 && status.mode === 'stopwatch') {
      status.seconds = 0;
    }

    // Set the active timer for large countdown display
    setActiveTimer({
      exerciseId: exId,
      setIndex: setIdx,
      exerciseName,
      totalTime: targetSec,
    });

    const id = setInterval(() => {
      if (!status.running) {
        clearInterval(id);
        return;
      }

      status.seconds = status.mode === 'countdown' ? status.seconds - 1 : status.seconds + 1;

      // kick a re-render
      setElapsedSec((_prev) => _prev);

      if (status.mode === 'countdown' && status.seconds <= 0) {
        clearInterval(id);
        status.running = false;
        status.done = true;
        status.intervalId = undefined;
        // Clear the active timer display when completed
        setActiveTimer(null);
        markTimedSetComplete(exId, setIdx);
      }
    }, 1000) as IntervalId;

    status.intervalId = id;
  };

  const resetTimedSet = (exId: string, setIdx: number, targetSec: number) => {
    const status = timedRef.current[exId]?.[setIdx];
    if (!status) {return;}

    // Stop the timer if running
    if (status.running && status.intervalId) {
      clearInterval(status.intervalId);
      status.intervalId = undefined;
    }

    // Clear the active timer display
    setActiveTimer(null);

    // Reset all values
    status.running = false;
    status.done = false;
    status.seconds = status.mode === 'countdown' ? targetSec : 0;
    setElapsedSec((_prev) => _prev); // force re-render
  };

  const markTimedSetComplete = (exId: string, setIdx: number) => {
    const exIndex = main.findIndex((e) => e.id === exId);
    if (exIndex === -1) {return;}
    setProgress((p) => {
      const next = [...p];
      next[exIndex][setIdx] = { reps: '✓', weight: '✓' };
      return next;
    });

    // Toast next-up
    const flat = [...warmup, ...main, ...cooldown];
    const curIdx = flat.findIndex((e) => e.id === exId);
    if (curIdx !== -1 && curIdx + 1 < flat.length) {
      setNextUp(flat[curIdx + 1].name);
      setTimeout(() => setNextUp(null), 3500);
    }
  };

  /* ── SAVE ── */
  const saveWorkout = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {return;}

    const logId = Date.now().toString();

    // Pre-calculate PR information for each exercise
    const exercisePRInfo: Record<string, { currentMax: number; previousMax: number; isPR: boolean }> = {};
    main.forEach((ex, i) => {
      const currentMaxWeight = Math.max(
        ...progress[i]
          .map(s => Number(s.weight))
          .filter(w => !isNaN(w) && w > 0)
      );

      let previousMaxWeight = 0;
      if (currentMaxWeight > 0) {
        const lastSessionData = lastSession[ex.id];
        if (lastSessionData && lastSessionData.length > 0) {
          previousMaxWeight = Math.max(
            ...lastSessionData
              .map(s => Number(s.weight))
              .filter(w => !isNaN(w) && w > 0)
          );
        }
      }

      exercisePRInfo[ex.id] = {
        currentMax: currentMaxWeight,
        previousMax: previousMaxWeight,
        isPR: currentMaxWeight > 0 && currentMaxWeight > previousMaxWeight,
      };
    });

    const payload = main.map((ex, i) => ({
      name: pretty(ex.id), // Use pretty name instead of ID
      sets: progress[i].map((s) => {
        const weight = parseFloat(s.weight === '✓' ? '0' : s.weight);
        const prInfo = exercisePRInfo[ex.id];
        const isPR = prInfo.isPR && weight === prInfo.currentMax;

        return {
          reps: s.reps === '✓' ? ex.repsCount.toString() : s.reps,
          weight: s.weight === '✓' ? '0' : s.weight,
          isPR: isPR,
        };
      }),
    }));

    const log = {
      dayTitle: day.title,
      weekIdx,
      dayIdx,
      completedAt: Timestamp.now(),
      elapsedSec,
      exercises: payload,
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', uid, 'workoutLogs', logId), log);
      batch.update(doc(db, 'users', uid, 'program', 'active'), { 'metadata.currentDay': increment(1) });
      await batch.commit();
      await checkAndAdjustRestDays(uid);

      // PR detection - compare against previous session data
      const truePRs: string[] = [];
      main.forEach((ex, i) => {
        const currentMaxWeight = Math.max(
          ...progress[i]
            .map(s => Number(s.weight))
            .filter(w => !isNaN(w) && w > 0)
        );

        // Only process if we have a valid weight for this exercise
        if (currentMaxWeight > 0) {
          const lastSessionData = lastSession[ex.id];
          let previousMaxWeight = 0;

          if (lastSessionData && lastSessionData.length > 0) {
            previousMaxWeight = Math.max(
              ...lastSessionData
                .map(s => Number(s.weight))
                .filter(w => !isNaN(w) && w > 0)
            );
          }

          // It's a PR if current weight is higher than previous max
          if (currentMaxWeight > previousMaxWeight) {
            truePRs.push(`${pretty(ex.id)}: ${currentMaxWeight} lbs`);
          }
        }
      });

      setToastMessage('Workout saved!');
      if (truePRs.length > 0) {
        setPrMsgs(truePRs);
        setShowPR(true);
      }
      setSummaryVisible(true);
    } catch (e) {
      console.error(e);
      setToastMessage('Could not save workout.');
    }
  };

  /* ── SUMMARY CALCS ── */
  const setsPlanned = useMemo(
    () => main.reduce((sum, ex) => sum + ex.setsCount, 0),
    [main]
  );
  const setsCompleted = useMemo(
    () => progress.flat().filter((s) => s.reps || s.weight).length,
    [progress]
  );

  /* -------- render -------- */
  if (loading) {
    return (
      <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex1}
      />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <Text style={styles.title}>{day.title}</Text>

        {/* Adapt CTA */}
        <Pressable
          style={styles.adaptBtn}
          onPress={() => navigation.navigate('AdaptWorkout')}
          disabled={workState === 'running'}
        >
          <Ionicons name="swap-horizontal" size={20} color="#fff" style={styles.iconRight} />
          <Text style={styles.btnTxt}>Adapt Today’s Workout</Text>
        </Pressable>

        {/* WARM-UP – motivational message */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Warm-up</Text>
          <View style={styles.motivationalCard}>
            <View style={styles.motivationalHeader}>
              <Ionicons name="flame" size={24} color="#ff6b35" />
              <Text style={styles.motivationalTitle}>Prepare Your Body</Text>
            </View>
            <Text style={styles.motivationalText}>
              Take 5-10 minutes to properly warm up your body. Focus on dynamic movements that increase your heart rate, mobilize your joints, and activate the muscle groups you'll be training today.
            </Text>
            <View style={styles.motivationalPoints}>
              <View style={styles.motivationalPoint}>
                <Ionicons name="heart" size={16} color="#ff6b35" />
                <Text style={styles.motivationalPointText}>Get your blood flowing</Text>
              </View>
              <View style={styles.motivationalPoint}>
                <Ionicons name="refresh" size={16} color="#ff6b35" />
                <Text style={styles.motivationalPointText}>Mobilize your joints</Text>
              </View>
              <View style={styles.motivationalPoint}>
                <Ionicons name="fitness" size={16} color="#ff6b35" />
                <Text style={styles.motivationalPointText}>Prime your muscles</Text>
              </View>
            </View>
          </View>
        </View>

        {/* MAIN WORK */}
        <MainExercisesSection
          title="Exercises"
          list={main}
          progress={progress}
          lastSession={lastSession}
          timedRef={timedRef}
          formatDesc={formatDesc}
          startTimedSet={startTimedSet}
          resetTimedSet={resetTimedSet}
          updateInput={updateInput}
          onPressChart={(exerciseId) =>
            navigation.navigate('ProgressChart', { exerciseName: exerciseId })
          }
        />

        {/* COOL-DOWN – motivational message */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cool-down</Text>
          <View style={styles.motivationalCard}>
            <View style={styles.motivationalHeader}>
              <Ionicons name="leaf" size={24} color="#4caf50" />
              <Text style={styles.motivationalTitle}>Recovery & Restoration</Text>
            </View>
            <Text style={styles.motivationalText}>
              Excellent work! Now take 5-10 minutes to properly cool down. Focus on gentle stretching, deep breathing, and allowing your heart rate to gradually return to normal.
            </Text>
            <View style={styles.motivationalPoints}>
              <View style={styles.motivationalPoint}>
                <Ionicons name="heart-outline" size={16} color="#4caf50" />
                <Text style={styles.motivationalPointText}>Lower your heart rate</Text>
              </View>
              <View style={styles.motivationalPoint}>
                <Ionicons name="body" size={16} color="#4caf50" />
                <Text style={styles.motivationalPointText}>Stretch your muscles</Text>
              </View>
              <View style={styles.motivationalPoint}>
                <Ionicons name="medical" size={16} color="#4caf50" />
                <Text style={styles.motivationalPointText}>Promote recovery</Text>
              </View>
            </View>
          </View>
        </View>

        <Pressable
          style={styles.saveBtn}
          onPress={saveWorkout}
          disabled={workState === 'running'}
        >
          <Ionicons name="save" size={20} color="#fff" style={styles.iconRight} />
          <Text style={styles.btnTxt}>Save Workout</Text>
        </Pressable>

        <Pressable
          style={[styles.saveBtn, styles.backBtn]}
          onPress={() => navigation.goBack()}
          disabled={workState === 'running'}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" style={styles.iconRight} />
          <Text style={styles.btnTxt}>Back</Text>
        </Pressable>
      </ScrollView>

      <EnhancedTimerBar
        seconds={elapsedSec}
        state={workState}
        onStart={() => setWorkState('running')}
        onPause={() => setWorkState('paused')}
        onStop={() => setWorkState('stopped')}
      />

      {/* SUMMARY MODAL */}
      <Modal visible={summaryVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Session Complete</Text>
            <Text style={styles.summaryText}>Total time: {fmtTime(elapsedSec)}</Text>
            <Text style={styles.summaryText}>Sets: {setsCompleted}/{setsPlanned}</Text>
            {prMsgs.length > 0 && (
              <>
                <Text style={[styles.summaryText, styles.summarySubheading]}>🔥 New PRs:</Text>
                {prMsgs.map((m) => (
                  <Text key={m} style={styles.summaryText}>
                    • {m}
                  </Text>
                ))}
              </>
            )}
            <Pressable style={[styles.saveBtn, styles.mt16]}
            onPress={() => {
    setSummaryVisible(false);
    navigateToWorkoutRoot(); // Navigate when summary is closed
  }}
>
              <Text style={styles.btnTxt}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* LARGE COUNTDOWN TIMER MODAL */}
      <Modal
        visible={activeTimer !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveTimer(null)}
      >
        <View style={styles.countdownModalBackdrop}>
          <View style={styles.countdownModalContainer}>
            {activeTimer && (
              <>
                <Text style={styles.countdownExerciseName}>
                  {activeTimer.exerciseName}
                </Text>
                <Text style={styles.countdownSetLabel}>
                  Set {activeTimer.setIndex + 1}
                </Text>

                {(() => {
                  const status = timedRef.current[activeTimer.exerciseId]?.[activeTimer.setIndex];
                  const currentTime = status ? status.seconds : 0;
                  const timeToDisplay = status?.mode === 'countdown' ? Math.max(0, currentTime) : currentTime;
                  const timerProgress = status?.mode === 'countdown'
                    ? (activeTimer.totalTime > 0 ? (activeTimer.totalTime - timeToDisplay) / activeTimer.totalTime : 0)
                    : (activeTimer.totalTime > 0 ? Math.min(1, timeToDisplay / activeTimer.totalTime) : 0);

                  // Color based on time remaining (for countdown) or progress (for stopwatch)
                  const getTimerColor = () => {
                    if (status?.mode === 'countdown') {
                      if (timeToDisplay <= 10) {
                        return '#f44336'; // Red for last 10 seconds
                      }
                      if (timeToDisplay <= 30) {
                        return '#ff9800'; // Orange for last 30 seconds
                      }
                      return '#4caf50'; // Green for normal time
                    } else {
                      // Stopwatch mode - green throughout
                      return '#4caf50';
                    }
                  };

                  return (
                    <>
                      <View style={styles.countdownTimerContainer}>
                        <Text style={[styles.countdownTimer, { color: getTimerColor() }]}>
                          {fmtTime(timeToDisplay)}
                        </Text>
                      </View>

                      {/* Progress ring/circle */}
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBackground}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                transform: [{ rotate: `${timerProgress * 360}deg` }],
                                borderColor: getTimerColor(),
                              },
                            ]}
                          />
                        </View>
                      </View>

                      <Text style={styles.countdownSubtext}>
                        {status?.mode === 'countdown' ? (
                          timeToDisplay <= 10 ? '🔥 PUSH THROUGH!' :
                          timeToDisplay <= 30 ? '💪 ALMOST THERE!' :
                          '⏱️ STAY FOCUSED'
                        ) : (
                          '⏱️ KEEP GOING!'
                        )}
                      </Text>
                    </>
                  );
                })()}

                <View style={styles.countdownControls}>
                  <Pressable
                    style={styles.countdownButton}
                    onPress={() => {
                      const status = timedRef.current[activeTimer.exerciseId]?.[activeTimer.setIndex];
                      if (status?.running) {
                        startTimedSet(activeTimer.exerciseId, activeTimer.setIndex, activeTimer.totalTime);
                      }
                    }}
                  >
                    <Ionicons
                      name={
                        (() => {
                          const status = timedRef.current[activeTimer.exerciseId]?.[activeTimer.setIndex];
                          return status?.running ? 'pause-circle' : 'play-circle';
                        })()
                      }
                      size={40}
                      color="#fff"
                    />
                  </Pressable>

                  <Pressable
                    style={styles.countdownButton}
                    onPress={() => resetTimedSet(activeTimer.exerciseId, activeTimer.setIndex, activeTimer.totalTime)}
                  >
                    <Ionicons name="refresh-circle" size={40} color="#ff9800" />
                  </Pressable>

                  <Pressable
                    style={styles.countdownButton}
                    onPress={() => setActiveTimer(null)}
                  >
                    <Ionicons name="close-circle" size={40} color="#f44336" />
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* toasts & celebrations */}
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      {nextUp && <Toast message={`Next: ${nextUp}`} onClose={() => setNextUp(null)} />}
      {showPR && (
        <PRCelebration visible={showPR} messages={prMsgs} onClose={() => setShowPR(false)} />
      )}
    </LinearGradient>
  );
};

/* ───────── styles ───────── */
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 120 }, // leave space for timer bar
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#d32f2f',
    marginBottom: 12,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#d32f2f',
    marginTop: 18,
    marginBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#d32f2f',
  },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  cardDone: { opacity: 1, borderColor: '#4caf50', borderWidth: 1, backgroundColor: '#2e7d32' },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  cardTitleDone: { textDecorationLine: 'line-through', color: '#aaa' },
  recommend: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  /* sets UI */
  setBlock: { marginBottom: 6 },
  setRow: { flexDirection: 'row', alignItems: 'center' },
  setLabel: { color: '#ccc', width: 60, marginRight: 8 },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    padding: 8,
    borderRadius: 6,
    width: 80,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 6,
  },
  lastTxt: {
    color: '#999',
    fontSize: 12,
    fontStyle: 'italic',
    marginLeft: 60,
    marginBottom: 4,
  },
  timerDigits: {
    color: '#fff',
    fontVariant: ['tabular-nums'],
    marginRight: 8,
    width: 60,
    textAlign: 'center',
  },
  /* buttons */
  adaptBtn: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1.5,
    borderColor: '#4fc3f7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 12,
    justifyContent: 'center',
  },
  saveBtn: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1.5,
    borderColor: '#d32f2f',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 24,
    justifyContent: 'center',
  },
  backBtn: { marginTop: 12, borderColor: '#888' },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },
  /* summary */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryBox: {
    backgroundColor: '#1e1e1e',
    padding: 24,
    borderRadius: 12,
    width: '80%',
  },
  summaryTitle: {
    fontSize: 20,
    color: '#d32f2f',
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryText: { color: '#fff', textAlign: 'center', marginVertical: 2 },

  /* sections */
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },

  /* extracted replacements for inline styles */
  ml6: { marginLeft: 6 },
  flex1: { flex: 1 },
  iconRight: { marginRight: 8 },
  summarySubheading: { marginTop: 8, fontWeight: '700' },
  mt16: { marginTop: 16 },

  /* countdown modal styles */
  countdownModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownModalContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    width: '90%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#333',
  },
  countdownExerciseName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  countdownSetLabel: {
    fontSize: 18,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 20,
  },
  countdownTimerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 100,
  },
  countdownTimer: {
    fontSize: 72,
    fontWeight: '900',
    textAlign: 'center',
    marginVertical: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0,
    width: 240,
    alignSelf: 'center',
  },
  countdownSubtext: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
    fontWeight: '600',
  },
  countdownControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  countdownButton: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 10,
  },
  progressContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  progressBackground: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 8,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressFill: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
    borderColor: '#4caf50',
    position: 'absolute',
  },

  /* motivational card styles */
  motivationalCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
  },
  motivationalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  motivationalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 10,
  },
  motivationalText: {
    fontSize: 15,
    color: '#e0e0e0',
    lineHeight: 22,
    marginBottom: 12,
  },
  motivationalSubtext: {
    fontSize: 13,
    color: '#bbb',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  motivationalPoints: {
    marginTop: 8,
  },
  motivationalPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    paddingLeft: 8,
  },
  motivationalPointText: {
    fontSize: 14,
    color: '#bbb',
    marginLeft: 10,
  },
});

export default WorkoutDetailScreen;
