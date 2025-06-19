import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { auth, db } from '../firebase';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  writeBatch,
  increment,
  limit,
} from 'firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Video from 'react-native-video';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import PRCelebration from '../components/PRCelebration';
import Toast from '../components/Toast';
import { checkAndAdjustRestDays } from '../utils/performanceMonitor';
import type { ExerciseBlock } from '../utils/types';

/* ───────── helpers ───────── */
const pretty = (id: string) =>
  id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const parseRepsFromString = (str?: string): number | null => {
  if (!str) return null;
  const m = str.match(/\d+/);
  return m ? parseInt(m[0]) : null;
};

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
  setsCount: number;  // used only for main section
  repsCount: number;
  rpe: number;
  type: 'reps' | 'time';
}

type WorkoutDetailRoute = RouteProp<RootStackParamList, 'WorkoutDetail'>;

/* ───────── component ───────── */
const WorkoutDetailScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<WorkoutDetailRoute>();
  const { day, weekIdx, dayIdx } = params;

  /* ── state ── */
  const [loading, setLoading] = useState(true);
  const [warmup, setWarmup] = useState<EnrichedExercise[]>([]);
  const [main, setMain] = useState<EnrichedExercise[]>([]);
  const [cooldown, setCooldown] = useState<EnrichedExercise[]>([]);
  const [progress, setProgress] = useState<{ reps: string; weight: string }[][]>(
    [],
  );
  const [lastSession, setLastSession] = useState<
    Record<string, { reps: string; weight: string }[]>
  >({});
  const [playing, setPlaying] = useState<string | null>(null);
  const [showPR, setShowPR] = useState(false);
  const [prMsgs, setPrMsgs] = useState<string[]>([]);
  const [showToast, setShowToast] = useState(false);

  /* ── enrich a block with Firestore meta ── */
  const enrich = async (blk: ExerciseBlock): Promise<EnrichedExercise> => {
    const snap = await getDoc(doc(db, 'exercises', blk.id));
    const data = snap.exists() ? (snap.data() as FirestoreExercise) : {};
    return {
      id: blk.id,
      name: data.name ?? pretty(blk.id),
      videoUri: data.videoUrl && data.videoUrl.trim() !== '' 
  ? data.videoUrl 
  : 'https://www.w3schools.com/html/mov_bbb.mp4',

      setsCount: data.sets ?? blk.sets ?? 3,
      repsCount: data.reps ?? parseRepsFromString(blk.repsOrDuration) ?? 8,
      rpe: blk.rpe,
      type:
        data.type ??
        (blk.repsOrDuration.toLowerCase().includes('sec') ? 'time' : 'reps'),
    };
  };

  /* ── fetch & build all three sections ── */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [w, m, c] = await Promise.all([
          Promise.all(day.warmup.map(enrich)),
          Promise.all(day.exercises.map(enrich)),
          Promise.all(day.cooldown.map(enrich)),
        ]);

        /* init progress for main only */
        const progInit = m.map(ex =>
          Array.from({ length: ex.setsCount }).map(() => ({
            reps: '',
            weight: '',
          })),
        );

        /* last-session lookup for PR hints */
        const uid = auth.currentUser?.uid;
        const last: Record<
          string,
          { reps: string; weight: string }[]
        > = {};
        if (uid) {
          for (const ex of m) {
            const q = await getDocs(
              query(
                collection(db, 'users', uid, 'workoutLogs'),
                orderBy('completedAt', 'desc'),
                limit(5),
              ),
            );
            for (const d of q.docs) {
              const dat: any = d.data();
              const hit = dat.exercises.find((e: any) => e.name === ex.id);
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
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [day]);

  /* ── helpers ── */
  const updateInput = (
    exIdx: number,
    setIdx: number,
    field: 'reps' | 'weight',
    val: string,
  ) =>
    setProgress(p => {
      const n = [...p];
      n[exIdx][setIdx][field] = val;
      return n;
    });

  const setsDone = (arr: { reps: string; weight: string }[]) =>
    arr.every(s => s.reps && s.weight);

  const togglePlay = (id: string) =>
    setPlaying(prev => (prev === id ? null : id));

  /* ── save workout ── */
  const saveWorkout = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const now = Timestamp.now();
    const logId = Date.now().toString();

    const log = {
      dayTitle: day.title,
      weekIdx,
      dayIdx,
      completedAt: now,
      exercises: main.map((ex, i) => ({
        name: ex.id,
        sets: progress[i],
      })),
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', uid, 'workoutLogs', logId), log);
      batch.update(doc(db, 'users', uid, 'program', 'active'), {
        currentDay: increment(1),
      });
      await batch.commit();
      await checkAndAdjustRestDays(uid);

      /* PR detection */
      const prs: Record<string, number> = {};
      main.forEach((ex, i) =>
        progress[i].forEach(s => {
          const w = Number(s.weight);
          if (!isNaN(w)) prs[ex.id] = Math.max(prs[ex.id] || 0, w);
        }),
      );
      const newMsgs = Object.entries(prs).map(
        ([k, v]) => `${pretty(k)}: ${v} lbs`,
      );

      setShowToast(true);
      if (newMsgs.length) {
        setPrMsgs(newMsgs);
        setShowPR(true);
      }
      navigation.goBack();
    } catch (e) {
      console.error(e);
      alert('Could not save workout.');
    }
  };

  /* ── UI ── */
  if (loading) {
    return (
      <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </LinearGradient>
    );
  }

  const Section = ({
    title,
    list,
    trackSets,
  }: {
    title: string;
    list: EnrichedExercise[];
    trackSets?: boolean;
  }) => (
    <>
      <Text style={styles.sectionHeader}>{title}</Text>
      {list.map((ex, i) => {
        const done = trackSets ? setsDone(progress[i]) : false;
        const last = lastSession[ex.id] ?? [];
        const play = playing === ex.id;

        return (
          <View key={ex.id} style={[styles.card, done && styles.cardDone]}>
            <View style={styles.cardHeader}>
              <Text
                style={[styles.cardTitle, done && styles.cardTitleDone]}>
                {ex.name}
              </Text>
              {trackSets && (
                <Pressable
                  onPress={() =>
                    navigation.navigate('ProgressChart', {
                      exerciseName: ex.id,
                    })
                  }>
                  <Ionicons name="stats-chart" size={20} color="#4fc3f7" />
                </Pressable>
              )}
            </View>

            <Text style={styles.recommend}>
              {ex.setsCount}×{ex.repsCount}{' '}
              {ex.type === 'time' ? 'sec' : 'reps'} • RPE {ex.rpe}
            </Text>

            {!!ex.videoUri && (
              <TouchableOpacity
                onPress={() => togglePlay(ex.id)}
                style={styles.videoBox}>
                {play ? (
                  <Video
                    source={{ uri: ex.videoUri }}
                    style={styles.video}
                    controls
                    paused={false}
                    onEnd={() => setPlaying(null)}
                  />
                ) : (
                  <View style={styles.playOverlay}>
                    <Ionicons
                      name="play-circle-outline"
                      size={42}
                      color="#fff"
                    />
                    <Text style={styles.playText}>Play Video</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {trackSets &&
              progress[i].map((s, si) => (
                <View key={si} style={styles.setBlock}>
                  <View style={styles.setRow}>
                    <Text style={styles.setLabel}>Set {si + 1}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="reps"
                      placeholderTextColor="#777"
                      keyboardType="numeric"
                      value={s.reps}
                      onChangeText={t => updateInput(i, si, 'reps', t)}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="lbs"
                      placeholderTextColor="#777"
                      keyboardType="numeric"
                      value={s.weight}
                      onChangeText={t => updateInput(i, si, 'weight', t)}
                    />
                  </View>
                  {last[si] && (
                    <Text style={styles.lastTxt}>
                      Last: {last[si].reps} reps @ {last[si].weight} lbs
                    </Text>
                  )}
                </View>
              ))}
          </View>
        );
      })}
    </>
  );

  return (
    <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{day.title}</Text>

        {/* WARM-UP */}
        <Section title="Warm-up" list={warmup} />

        {/* MAIN */}
        <Section title="Exercises" list={main} trackSets />

        {/* COOL-DOWN */}
        <Section title="Cool-down" list={cooldown} />

        <Pressable style={styles.saveBtn} onPress={saveWorkout}>
          <Ionicons name="save" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.btnTxt}>Save Workout</Text>
        </Pressable>

        <Pressable
          style={[styles.saveBtn, styles.backBtn]}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.btnTxt}>Back</Text>
        </Pressable>

        {showPR && (
          <PRCelebration
            visible={showPR}
            messages={prMsgs}
            onClose={() => setShowPR(false)}
          />
        )}
      </ScrollView>

      {showToast && (
        <Toast
          message="Workout saved successfully!"
          onClose={() => setShowToast(false)}
        />
      )}
    </LinearGradient>
  );
};

/* ───────── styles ───────── */
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#d32f2f',
    marginBottom: 20,
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

  /* card */
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  cardDone: { opacity: 0.6, borderColor: '#4caf50', borderWidth: 1 },
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

  /* sets */
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

  /* video */
  videoBox: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: { width: '100%', height: '100%' },
  playOverlay: { alignItems: 'center', justifyContent: 'center' },
  playText: { color: '#fff', fontSize: 14, marginTop: 4 },

  /* buttons */
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
});

export default WorkoutDetailScreen;
