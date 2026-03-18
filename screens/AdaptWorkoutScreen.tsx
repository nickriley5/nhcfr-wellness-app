// screens/AdaptWorkoutScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import Toast from '../components/Toast';
import VideoToggle from '../components/VideoToggle';
import { getExerciseVideoData } from '../utils/exerciseVideoMap';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type AdaptRoute = RouteProp<RootStackParamList, 'AdaptWorkout'>;

/* ---------- types ---------- */
type ExCategory = 'strength' | 'mobility' | 'conditioning' | 'skill' | 'unknown';

type ExerciseCard = {
  id: string;
  name: string;
  tags: string[];
  focusArea?: string;
  videoUri?: string;
  thumbnailUri?: string;

  // signals for relevance
  pattern?: string;      // e.g. 'vertical_pull' | 'elbow_flexion'
  muscles?: string[];    // e.g. ['lats','biceps']
  equipKey?: string;     // canonical equipment key (e.g. 'pullup_bar','cable','db')
  equipment?: string;    // display string
  category?: ExCategory; // strength/mobility/conditioning/skill
};

const fallbackVideos: Record<string, string> = {
  Pushups: 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Bent-over Rows': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Overhead Press': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'Air Squat': 'https://www.w3schools.com/html/mov_bbb.mp4',
};

const pretty = (id: string) =>
  id?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Exercise';

/* ---------------- inference helpers ---------------- */
const norm = (s?: string) => (s || '').toLowerCase();

const equipKeyFrom = (equip?: string | string[], nameOrTags = ''): string => {
  const s = Array.isArray(equip) ? equip.join(' ') : (equip || '') + ' ' + nameOrTags;
  const t = norm(s);
  if (t.includes('ez')) {return 'ez_bar';}
  if (t.includes('barbell')) {return 'barbell';}
  if (t.includes('dumbbell') || t.includes('db')) {return 'db';}
  if (t.includes('kettlebell') || t.includes('kb')) {return 'kb';}
  if (t.includes('cable') || t.includes('lat pull')) {return 'cable';}
  if (t.includes('machine')) {return 'machine';}
  if (t.includes('ring')) {return 'rings';}
  if (t.includes('band')) {return 'band';}
  if (t.includes('pull-up') || t.includes('pullup') || t.includes('chin')) {return 'pullup_bar';}
  if (t.includes('sled')) {return 'sled';}
  if (t.includes('trap bar') || t.includes('hex')) {return 'trapbar';}
  if (t.includes('smith')) {return 'smith';}
  if (t.includes('bodyweight') || t.includes('no equipment') || t.includes('air')) {return 'none';}
  return (Array.isArray(equip) ? equip[0] : equip)
    ? norm(Array.isArray(equip) ? equip[0] : equip)
    : 'unknown';
};

const inferPatternAndMuscles = (name: string, tags: string[] = []) => {
  const text = `${norm(name)} ${norm(tags.join(' '))}`;

  // ⭐ precise accessory: curls / elbow flexion
  if (/curl|bicep|biceps|hammer curl|preacher/.test(text)) {
    return { pattern: 'elbow_flexion', muscles: ['biceps', 'brachialis', 'forearms'] };
  }

  if (/(pull-?up|chin-?up)/.test(text)) {
    return { pattern: 'vertical_pull', muscles: ['lats', 'biceps', 'upper_back'] };
  }
  if (/(lat\s?pull-?down|pulldown|pull-down)/.test(text)) {
    return { pattern: 'vertical_pull', muscles: ['lats', 'biceps'] };
  }
  if (/row|inverted row|seal row|pendlay/.test(text)) {
    return { pattern: 'horizontal_pull', muscles: ['upper_back', 'lats', 'rear_delts', 'biceps'] };
  }
  if (/(bench|push-?up)/.test(text)) {
    return { pattern: 'horizontal_push', muscles: ['chest', 'triceps', 'front_delts'] };
  }
  if (/(ohp|overhead|shoulder press)/.test(text)) {
    return { pattern: 'vertical_push', muscles: ['shoulders', 'triceps', 'upper_chest'] };
  }
  if (/deadlift|rdl|hinge|good morning/.test(text)) {
    return { pattern: 'hinge', muscles: ['glutes', 'hamstrings', 'erectors'] };
  }
  if (/squat|front squat|back squat|air squat/.test(text)) {
    return { pattern: 'squat', muscles: ['quads', 'glutes', 'adductors'] };
  }
  if (/lunge|split squat|step-?up/.test(text)) {
    return { pattern: 'lunge', muscles: ['quads', 'glutes', 'calves'] };
  }

  // broad fallbacks
  if (text.includes('pull')) {return { pattern: 'pull', muscles: ['upper_back', 'lats', 'biceps'] };}
  if (text.includes('push')) {return { pattern: 'push', muscles: ['chest', 'shoulders', 'triceps'] };}

  return { pattern: undefined, muscles: [] as string[] };
};

const inferCategory = (name: string, tags: string[] = []): ExCategory => {
  const t = `${norm(name)} ${norm(tags.join(' '))}`;

  // mobility (CARs, flows, stretches)
  if (/car(s)?|controlled\s*articular|mobility|stretch|flow|yoga|t-?spine|thoracic|pass-?through/.test(t)) {
    return 'mobility';
  }
  // conditioning / circuits / cardio
  if (/run|rower|bike|burpee|carry|sled|jump rope|double under|metcon|amrap|emom|assault|airdyne|scba/.test(t)) {
    return 'conditioning';
  }
  // skill/core (leave in strength family unless clearly mobility/conditioning)
  if (/plank|hollow|toes to bar|skill/.test(t)) {return 'skill';}

  return 'strength';
};

const macroFromPattern = (p?: string) => {
  if (!p) {return undefined;}
  if (p.includes('pull')) {return 'pull';}
  if (p.includes('push')) {return 'push';}
  if (['squat', 'lunge', 'hinge'].includes(p)) {return 'lower';}
  if (p === 'elbow_flexion') {return 'upper_accessory';}
  return p;
};

const isYoutubeUrl = (url?: string) => !!url && (url.includes('youtube.com') || url.includes('youtu.be'));

const dedupeSuggestionCards = (cards: ExerciseCard[]): ExerciseCard[] => {
  const byName = new Map<string, ExerciseCard>();
  cards.forEach((card) => {
    const key = norm(card.name).trim();
    const existing = byName.get(key);

    if (!existing) {
      byName.set(key, card);
      return;
    }

    const existingHasVideo = !!existing.videoUri;
    const currentHasVideo = !!card.videoUri;

    if (!existingHasVideo && currentHasVideo) {
      byName.set(key, card);
      return;
    }

    if (
      existingHasVideo &&
      currentHasVideo &&
      isYoutubeUrl(existing.videoUri) &&
      !isYoutubeUrl(card.videoUri)
    ) {
      byName.set(key, card);
    }
  });

  return Array.from(byName.values());
};

const isDeadbugVariant = (name?: string): boolean => /dead\s*bug|deadbug/.test(norm(name));

/* ---------------- relevance scoring ---------------- */
const overlapCount = (a: string[] = [], b: string[] = []) => {
  if (!a.length || !b.length) {return 0;}
  const A = new Set(a);
  let n = 0;
  b.forEach((x) => A.has(x) && n++);
  return n;
};

const tokenize = (s = ''): string[] =>
  norm(s)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

const tokenOverlap = (a = '', b = ''): number => {
  const A = new Set(tokenize(a));
  if (!A.size) {return 0;}
  let n = 0;
  tokenize(b).forEach((t) => {
    if (A.has(t)) {n++;}
  });
  return n;
};

const scoreCandidate = (current: ExerciseCard, cand: ExerciseCard) => {
  if (current.id === cand.id) {return -1;}

  // category preference (not a hard filter)
  if (current.category && cand.category && current.category !== 'unknown' && cand.category !== 'unknown') {
    if (current.category !== cand.category) {return -4;}
  }

  const musclesShared = overlapCount(current.muscles || [], cand.muscles || []);
  const samePattern = !!(current.pattern && cand.pattern && current.pattern === cand.pattern);

  let score = 0;

  // pattern match is king
  if (samePattern) {score += 12;}

  // muscles
  score += musclesShared * 3;

  // macro bump
  const m1 = macroFromPattern(current.pattern);
  const m2 = macroFromPattern(cand.pattern);
  if (m1 && m2 && m1 === m2) {score += 2;}

  // prefer different equipment (for variety)
  if (current.equipKey && cand.equipKey) {
    if (current.equipKey !== cand.equipKey) {score += 2;}
    if (current.equipKey === cand.equipKey) {score -= 1;}
  }

  // weak lexical tie-breaker for sparse metadata libraries
  score += tokenOverlap(current.name, cand.name);

  return score;
};

/* =================================================================== */
const AdaptWorkoutScreen: React.FC = () => {
  console.log('🔴 AdaptWorkoutScreen COMPONENT MOUNTED 🔴');
  const navigation = useNavigation<Nav>();
  const route = useRoute<AdaptRoute>();
  const routeDay = route.params?.day;
  const routeWeekIdx = route.params?.weekIdx;
  const routeDayIdx = route.params?.dayIdx;
  const routeSourceType = route.params?.sourceType;
  const routeWorkoutId = route.params?.workoutId;
  const routeWeekNumber = route.params?.weekNumber;
  const [adapted, setAdapted] = useState<ExerciseCard[]>([]);
  const [library, setLibrary] = useState<ExerciseCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [showAllReplacements, setShowAllReplacements] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [activeWorkoutSource, setActiveWorkoutSource] = useState<{
    type: 'ai' | 'program' | 'aiProgram';
    workoutId?: string;
    dayIdx: number;
    weekNumber?: number;
  } | null>(null);

  // ---------- load today's plan (enriched) + full library ----------
  const loadData = async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      console.log('AdaptWorkout: Starting load');
      const uid = auth.currentUser?.uid;
      if (!uid) {
        console.error('AdaptWorkout: No user authenticated');
        Alert.alert('Error', 'No user authenticated');
        if (showLoadingSpinner) setLoading(false);
        else setRefreshing(false);
        return;
        }
        console.log('AdaptWorkout: User ID:', uid);
        
        type LatestAiWorkout = {
          id: string;
          data: Record<string, any>;
          createdAt: Date;
        };
        let latestAiWorkout: LatestAiWorkout | null = null;
        
        let blocks: any[] = [];
        let dayIdx = 0;
        let currentProgramDay = 1;
        let totalProgramDays = 0;

        if (routeSourceType === 'ai' && routeWorkoutId) {
          console.log('AdaptWorkout: Loading AI workout by explicit workoutId');
          const aiRef = doc(db, 'users', uid, 'aiWorkouts', routeWorkoutId);
          const aiSnap = await getDoc(aiRef);
          if (!aiSnap.exists()) {
            Alert.alert('Not Found', 'The selected AI workout could not be found.');
            if (showLoadingSpinner) {setLoading(false);}
            else {setRefreshing(false);}
            navigation.goBack();
            return;
          }

          const aiData = aiSnap.data() as any;
          dayIdx = Math.max(0, routeDayIdx ?? 0);
          const aiDay = aiData.days?.[dayIdx] || aiData.days?.[0];
          blocks = aiDay?.exercises ?? [];
          currentProgramDay = dayIdx + 1;
          totalProgramDays = Array.isArray(aiData.days) ? aiData.days.length : 1;

          setActiveWorkoutSource({
            type: 'ai',
            workoutId: routeWorkoutId,
            dayIdx,
          });
        } else if (routeDay) {
          console.log('AdaptWorkout: Using workout passed from route context');
          blocks = routeDay.exercises ?? [];
          dayIdx = Math.max(0, routeDayIdx ?? 0);
          currentProgramDay = dayIdx + 1;
          totalProgramDays = (routeWeekIdx ?? 0) + 1;

          setActiveWorkoutSource({
            type: routeSourceType || 'program',
            workoutId: routeWorkoutId,
            dayIdx,
            weekNumber:
              routeSourceType === 'aiProgram'
                ? routeWeekNumber || (routeWeekIdx ?? 0) + 1
                : undefined,
          });
        } else {
          // Check for AI workouts first (takes precedence)
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);

          const aiWorkoutsQuery = query(
            collection(db, 'users', uid, 'aiWorkouts'),
            orderBy('createdAt', 'desc')
          );
          const aiWorkoutsSnap = await getDocs(aiWorkoutsQuery);

          for (const docSnap of aiWorkoutsSnap.docs) {
            const data = docSnap.data() as Record<string, any>;
            const createdAt = data.createdAt?.toDate();
            if (createdAt && createdAt >= todayStart) {
              if (!latestAiWorkout || createdAt > latestAiWorkout.createdAt) {
                latestAiWorkout = {
                  id: docSnap.id,
                  data,
                  createdAt,
                };
              }
            }
          }
        }

        if (!routeDay && latestAiWorkout) {
          // Use AI workout exercises
          console.log('AdaptWorkout: Using AI workout from today');
          const aiDay = latestAiWorkout.data.days?.[0];
          blocks = aiDay?.exercises ?? [];
          console.log('AdaptWorkout: AI Exercises count:', blocks.length);
          setActiveWorkoutSource({
            type: 'ai',
            workoutId: latestAiWorkout.id,
            dayIdx: 0,
          });
        } else if (!routeDay) {
          // Fall back to active program
          console.log('AdaptWorkout: Using active program');
          const progRef = doc(db, 'users', uid, 'program', 'active');
          const progSnap = await getDoc(progRef);
          console.log('AdaptWorkout: Program exists:', progSnap.exists());
          if (progSnap.exists()) {
            const data = progSnap.data() as any;
            const curDay = data?.metadata?.currentDay ?? data?.currentDay ?? 1;
            dayIdx = Math.max(0, curDay - 1);
            currentProgramDay = curDay;
            totalProgramDays = Array.isArray(data?.days) ? data.days.length : 0;
            console.log('AdaptWorkout: Current day:', curDay, 'Day index:', dayIdx);

            blocks = data.days?.[dayIdx]?.exercises ?? [];
            setActiveWorkoutSource({
              type: 'program',
              dayIdx,
            });
          } else {
            // Fall back to active aiProgram (periodized program structure)
            console.log('AdaptWorkout: Checking active aiPrograms');
            const aiProgramsRef = collection(db, 'users', uid, 'aiPrograms');
            const activeProgramsSnap = await getDocs(query(aiProgramsRef, where('isActive', '==', true)));
            const activePrograms = activeProgramsSnap.docs.filter((d) => !d.data()?.isArchived);

            if (activePrograms.length === 0) {
              Alert.alert('No Program', 'No active program found. Please set up your workout program first.');
              if (showLoadingSpinner) setLoading(false);
              else setRefreshing(false);
              navigation.goBack();
              return;
            }

            const activeProgramDoc = activePrograms[0];
            const activeProgram = activeProgramDoc.data() as any;
            const currentWeek = activeProgram.currentWeek || 1;
            const currentDay = activeProgram.currentDay || 1;
            const week = activeProgram.weeks?.find((w: any) => w.weekNumber === currentWeek);
            const day = week?.days?.find((d: any) => d.dayNumber === currentDay);

            dayIdx = Math.max(0, currentDay - 1);
            currentProgramDay = currentDay;
            totalProgramDays = Array.isArray(week?.days) ? week.days.length : 0;
            blocks = day?.exercises ?? [];

            setActiveWorkoutSource({
              type: 'aiProgram',
              workoutId: activeProgramDoc.id,
              dayIdx,
              weekNumber: currentWeek,
            });
          }
        }
        console.log('AdaptWorkout: Exercises count:', blocks.length);

        if (blocks.length === 0) {
          const dayLabel = activeWorkoutSource?.type === 'ai' ? 1 : currentProgramDay;
          const suffix =
            activeWorkoutSource?.type === 'ai'
              ? 'AI workout had no exercises for today.'
              : `Total days in program: ${totalProgramDays}`;
          Alert.alert('No Exercises', `No exercises found for day ${dayLabel}. ${suffix}`);
          if (showLoadingSpinner) setLoading(false);
          else setRefreshing(false);
          navigation.goBack();
          return;
        }

        // Enrich today's items
        const enriched: ExerciseCard[] = await Promise.all(
          blocks.map(async (blk: any) => {
            const exId = blk.id || blk.exerciseId || blk.name;
            const snap = exId ? await getDoc(doc(db, 'exercises', exId)) : null;
            const r = snap?.exists() ? (snap.data() as any) : {};
            
            console.log('Exercise data for', exId, ':', {
              hasVideoUrl: !!r.videoUrl,
              hasVideoUri: !!r.videoUri,
              hasVideo_url: !!r.video_url,
              hasBlkVideoUri: !!blk.videoUri,
              videoUrl: r.videoUrl,
              videoUri: r.videoUri,
              video_url: r.video_url,
              allKeys: Object.keys(r)
            });
            
            const name = r.name || blk.name || pretty(exId);
            const tags: string[] = Array.isArray(r.tags) ? r.tags : Array.isArray(blk.tags) ? blk.tags : [];
            const { pattern, muscles } = inferPatternAndMuscles(name, tags);
            const equipKey = equipKeyFrom(r.equipment, `${name} ${tags.join(' ')}`);
            const equipment =
              Array.isArray(r.equipment) ? r.equipment.join(', ') :
              (r.equipment ?? blk.equipment ?? undefined);
            const category = inferCategory(name, tags);

            // Try multiple sources for video URL
            let videoUri = r.videoUrl || r.videoUri || r.video_url || blk.videoUri;
            
            // If no video URL found, try the exerciseVideoMap
            if (!videoUri || videoUri.includes('w3schools')) {
              const videoData = getExerciseVideoData(exId) || getExerciseVideoData(name);
              if (videoData?.videoUrl) {
                videoUri = videoData.videoUrl;
                console.log('Using exerciseVideoMap for', name, ':', videoUri);
              }
            }
            
            // Final fallback
            if (!videoUri) {
              videoUri = fallbackVideos[name] || fallbackVideos.Pushups;
            }
            
            console.log('Final videoUri for', name, ':', videoUri);

            return {
              id: exId,
              name,
              tags,
              focusArea: r.focusArea ?? blk.focusArea,
              videoUri,
              thumbnailUri: r.thumbnailUri || blk.thumbnailUri,
              pattern, muscles, equipKey, equipment, category,
            } as ExerciseCard;
          })
        );        // Full library
        const libSnap = await getDocs(collection(db, 'exercises'));
        const lib: ExerciseCard[] = libSnap.docs.map((d: any) => {
          const r = d.data() as any;
          const name = r.name || pretty(d.id);
          const tags: string[] = Array.isArray(r.tags) ? r.tags : [];
          const { pattern, muscles } = inferPatternAndMuscles(name, tags);
          const equipKey = equipKeyFrom(r.equipment, `${name} ${tags.join(' ')}`);
          const category = inferCategory(name, tags);
          
          // Try multiple possible video URL field names
          const videoUri = r.videoUrl || r.videoUri || r.video_url || fallbackVideos[name] || fallbackVideos.Pushups;
          
          return {
            id: d.id,
            name,
            tags,
            focusArea: r.focusArea,
            videoUri,
            thumbnailUri: r.thumbnailUri,
            equipment: Array.isArray(r.equipment) ? r.equipment.join(', ') : r.equipment,
            pattern, muscles, equipKey, category,
          };
        });

        console.log('AdaptWorkout: Setting adapted exercises:', enriched.length);
        console.log('AdaptWorkout: Setting library:', lib.length);
        setAdapted(enriched);
        setLibrary(lib);
        console.log('AdaptWorkout: Data set, loading should end');
      } catch (err) {
        console.error('Adapt load error:', err);
        Alert.alert('Error', `Failed to load workout: ${err}`);
        if (showLoadingSpinner) setLoading(false);
        else setRefreshing(false);
        navigation.goBack();
      } finally {
        console.log('AdaptWorkout: Setting loading to false');
        if (showLoadingSpinner) setLoading(false);
        else setRefreshing(false);
      }
    };
  
  // Initial load
  useEffect(() => {
    loadData(true);
  }, []);

  // Refocus load
  useFocusEffect(
    React.useCallback(() => {
      if (!loading) {
        loadData(false);
      }
    }, [loading])
  );

  // ---------- suggestions tailored to the selected exercise ----------
  const suggestions: ExerciseCard[] = useMemo(() => {
    if (currentIndex == null) {return [];}
    const cur = adapted[currentIndex];
    if (!cur) {return [];}

    // category gate first (keeps curls away from mobility/conditioning lists)
    const pool =
      cur.category && cur.category !== 'unknown'
        ? library.filter((c: ExerciseCard) => (c.category ?? 'unknown') === cur.category)
        : library;
    const excludeDeadbugFamily = isDeadbugVariant(cur.name);
    const filteredPool = excludeDeadbugFamily
      ? pool.filter((c: ExerciseCard) => !isDeadbugVariant(c.name))
      : pool;

    const MIN_SCORE = 2;

    const ranked = filteredPool
      .map((c: ExerciseCard) => ({ c, s: scoreCandidate(cur, c) }))
      .filter((x: { c: ExerciseCard; s: number }) => x.s >= MIN_SCORE)
      .sort((a: { c: ExerciseCard; s: number }, b: { c: ExerciseCard; s: number }) => b.s - a.s)
      .map((x: { c: ExerciseCard; s: number }) => x.c);

    // elbow_flexion fallback: seed with curl family if nothing hit
    if (ranked.length === 0 && cur.pattern === 'elbow_flexion') {
      return dedupeSuggestionCards(
        filteredPool
        .filter((c: ExerciseCard) => /curl|bicep|biceps|preacher|hammer/.test(norm(c.name)))
        .filter((c: ExerciseCard) => c.id !== cur.id)
      ).slice(0, 20);
    }

    // relaxed fallback by macro pattern
    if (ranked.length === 0 && cur.pattern) {
      const macro = macroFromPattern(cur.pattern);
      const relaxed = filteredPool.filter((c: ExerciseCard) => macroFromPattern(c.pattern) === macro && c.id !== cur.id);
      return dedupeSuggestionCards(relaxed).slice(0, 20);
    }

    const primary = dedupeSuggestionCards(ranked.filter((c: ExerciseCard) => c.id !== cur.id));
    if (primary.length >= 5) {
      return primary.slice(0, 20);
    }

    // Final fallback: broaden to full library sorted by soft similarity.
    const broad = library
      .filter((c: ExerciseCard) => c.id !== cur.id)
      .map((c: ExerciseCard) => ({
        c,
        s:
          scoreCandidate(cur, c) +
          overlapCount(cur.tags || [], c.tags || []) +
          tokenOverlap(cur.name, c.name),
      }))
      .sort((a: { c: ExerciseCard; s: number }, b: { c: ExerciseCard; s: number }) => b.s - a.s)
      .map((x: { c: ExerciseCard; s: number }) => x.c);

    return dedupeSuggestionCards([...primary, ...broad]).slice(0, 20);
  }, [currentIndex, adapted, library]);

  // ---------- handlers ----------
  const handleAdapt = (i: number) => {
    setCurrentIndex(i);
    setShowAllReplacements(false);
    setModalVisible(true);
  };

  const selectReplacement = (replacement: ExerciseCard) => {
    if (currentIndex === null) {return;}
    const next = [...adapted];
    next[currentIndex] = { ...next[currentIndex], ...replacement };
    setAdapted(next);
    setModalVisible(false);
    setCurrentIndex(null);
  };

  const handleSave = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid || !activeWorkoutSource) {
        Alert.alert('Error', 'User not authenticated or no workout source found');
        return;
      }

      if (activeWorkoutSource.type === 'ai') {
        // Save to AI workout
        const aiRef = doc(db, 'users', uid, 'aiWorkouts', activeWorkoutSource.workoutId!);
        const aiSnap = await getDoc(aiRef);
        if (!aiSnap.exists()) {
          Alert.alert('Error', 'AI workout not found');
          return;
        }
        
        const aiData = aiSnap.data() as any;
        const dayIdx = activeWorkoutSource.dayIdx;
        
        const merged = (aiData.days?.[dayIdx]?.exercises ?? []).map((orig: any, i: number) => {
          const a = adapted[i];
          return {
            ...orig,
            id: a?.id ?? orig.id,
            name: a?.name ?? orig.name,
            videoUri: a?.videoUri ?? orig.videoUri ?? '',
            thumbnailUri: a?.thumbnailUri ?? orig.thumbnailUri ?? '',
          };
        });
        
        aiData.days[dayIdx].exercises = merged;
        await setDoc(aiRef, aiData, { merge: true });
        setShowToast(true);
        
        setTimeout(() => {
          navigation.navigate('WorkoutDetail', {
            day: aiData.days[dayIdx],
            weekIdx: 0,
            dayIdx,
            adapt: true,
            sourceType: 'ai',
            workoutId: activeWorkoutSource.workoutId,
          });
        }, 800);
      } else if (activeWorkoutSource.type === 'program') {
        // Save to regular program
        const ref = doc(db, 'users', uid, 'program', 'active');
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          Alert.alert('Error', 'No active program found. Please set up your program first.');
          return;
        }
        const data = snap.data() as any;
        const dayIdx = activeWorkoutSource.dayIdx;

        const merged = (data.days?.[dayIdx]?.exercises ?? []).map((orig: any, i: number) => {
          const a = adapted[i];
          return {
            ...orig,
            id: a?.id ?? orig.id,
            name: a?.name ?? orig.name,
            videoUri: a?.videoUri ?? orig.videoUri ?? '',
            thumbnailUri: a?.thumbnailUri ?? orig.thumbnailUri ?? '',
          };
        });

        data.days[dayIdx].exercises = merged;
        await setDoc(ref, data, { merge: true });
        setShowToast(true);

        setTimeout(() => {
          navigation.navigate('WorkoutDetail', {
            day: data.days[dayIdx],
            weekIdx: data.currentWeek ?? 0,
            dayIdx,
            adapt: true,
            sourceType: 'program',
          });
        }, 800);
      } else {
        // Save to aiProgram
        const aiProgramId = activeWorkoutSource.workoutId;
        if (!aiProgramId) {
          Alert.alert('Error', 'No active AI program source found.');
          return;
        }

        const aiProgramRef = doc(db, 'users', uid, 'aiPrograms', aiProgramId);
        const aiProgramSnap = await getDoc(aiProgramRef);
        if (!aiProgramSnap.exists()) {
          Alert.alert('Error', 'Active AI program not found.');
          return;
        }

        const aiProgramData = aiProgramSnap.data() as any;
        const currentWeek = activeWorkoutSource.weekNumber || aiProgramData.currentWeek || 1;
        const targetWeek = aiProgramData.weeks?.find((w: any) => w.weekNumber === currentWeek);
        if (!targetWeek) {
          Alert.alert('Error', 'Current week not found in active AI program.');
          return;
        }

        const dayIdx = activeWorkoutSource.dayIdx;
        const targetDay = targetWeek.days?.[dayIdx];
        if (!targetDay) {
          Alert.alert('Error', 'Current day not found in active AI program.');
          return;
        }

        const merged = (targetDay.exercises ?? []).map((orig: any, i: number) => {
          const a = adapted[i];
          return {
            ...orig,
            id: a?.id ?? orig.id,
            name: a?.name ?? orig.name,
            videoUri: a?.videoUri ?? orig.videoUri ?? '',
            thumbnailUri: a?.thumbnailUri ?? orig.thumbnailUri ?? '',
          };
        });

        targetDay.exercises = merged;
        await setDoc(aiProgramRef, aiProgramData, { merge: true });
        setShowToast(true);

        setTimeout(() => {
          navigation.navigate('WorkoutDetail', {
            day: targetDay,
            weekIdx: currentWeek - 1,
            dayIdx,
            adapt: true,
            sourceType: 'aiProgram',
            workoutId: aiProgramId,
            weekNumber: currentWeek,
          });
        }, 800);
      }
    } catch (err) {
      console.error('Save error:', err);
      Alert.alert('Error', `Failed to save adapted workout: ${err}`);
    }
  };

  // ---------- render ----------
  console.log('AdaptWorkout: Rendering, loading:', loading, 'adapted count:', adapted.length);
  
  if (loading) {
    console.log('AdaptWorkout: Still loading, showing spinner');
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0f0f0f' }} edges={['top']}>
        <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
          <View style={styles.content}>
            <ActivityIndicator size="large" color="#d32f2f" />
            <Text style={{ color: '#fff', marginTop: 20, textAlign: 'center' }}>Loading exercises...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Check if we have exercises to show
  if (adapted.length === 0) {
    console.log('AdaptWorkout: No exercises in adapted array');
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0f0f0f' }} edges={['top']}>
        <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
          <View style={styles.content}>
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
              <Text style={styles.backText}>Back</Text>
            </Pressable>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <Ionicons name="barbell-outline" size={64} color="#666" />
              <Text style={styles.title}>No Exercises Found</Text>
              <Text style={{ color: '#999', textAlign: 'center', marginTop: 12 }}>
                There are no exercises in today's workout to adapt.
              </Text>
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  console.log('AdaptWorkout: Rendering main content with', adapted.length, 'exercises');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f0f0f' }} edges={['top']}>
      <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.topBar}>
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          </View>

          <Text style={styles.title}>Adapt Today's Workout</Text>

        {adapted.map((ex: any, i: number) => {
          console.log('AdaptWorkout: Rendering exercise', i, ex.name);
          return (
          <View key={`${ex.id}-${i}`} style={styles.card}>
            <Text style={styles.cardTitle}>{ex.name}</Text>

            {ex.videoUri && (
              <View style={styles.videoBox}>
                <VideoToggle uri={ex.videoUri} />
              </View>
            )}

            <Text style={styles.metaLine}>
              {ex.equipment ? `🏷 ${ex.equipment}` : '🏷 No Equipment'}
              {ex.pattern ? ` • ${ex.pattern.replace(/_/g, ' ')}` : ''}
            </Text>

            <Pressable style={styles.button} onPress={() => handleAdapt(i)}>
              <Text style={styles.buttonText}>Swap Exercise</Text>
            </Pressable>
          </View>
          );
        })}

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="save" size={20} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Save Adapted Workout</Text>
        </Pressable>
      </ScrollView>

      {/* Replacement Modal */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {currentIndex !== null && adapted[currentIndex] && (
              <>
                <Text style={styles.modalTitle}>
                  Replacing: <Text style={styles.replacementName}>{adapted[currentIndex].name}</Text>
                </Text>
                <Text style={styles.modalSubTitle}>Choose a replacement:</Text>

                <FlatList
                  data={(suggestions || []).slice(0, showAllReplacements ? undefined : 10)}
                  keyExtractor={(item: ExerciseCard) => item.id}
                  renderItem={({ item }: { item: ExerciseCard }) => (
                    <Pressable style={styles.replacementItem} onPress={() => selectReplacement(item)}>
                      <View style={styles.rowAlignCenter}>
                        {item.thumbnailUri ? (
                          <Image source={{ uri: item.thumbnailUri }} style={styles.thumbnailImage} />
                        ) : (
                          <View style={styles.thumbnailImage} />
                        )}
                        <View>
                          <Text style={styles.replacementText}>{item.name}</Text>
                          <Text style={styles.replacementTag}>
                            🏷 {item.equipment || 'No Equipment'}
                            {item.pattern ? ` • ${item.pattern.replace(/_/g, ' ')}` : ''}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  )}
                  ListEmptyComponent={
                    <Text style={[styles.replacementText, styles.replacementEmpty]}>
                      No close matches yet. Add tags to this exercise to improve suggestions.
                    </Text>
                  }
                />

                {suggestions.length > 10 && (
                  <Pressable
                    onPress={() => setShowAllReplacements((p: boolean) => !p)}
                    style={styles.showMoreButton}
                  >
                    <Text style={styles.showMoreText}>
                      {showAllReplacements ? '➖ Show Less' : '➕ Show More'}
                    </Text>
                  </Pressable>
                )}
              </>
            )}

            <Pressable
              style={[styles.button, styles.buttonMarginTop]}
              onPress={() => {
                setModalVisible(false);
                setShowAllReplacements(false);
              }}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {showToast && (
        <Toast message="Adapted workout saved!" onClose={() => setShowToast(false)} />
      )}
    </LinearGradient>
    </SafeAreaView>
  );
};

/* ---------------- styles ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, alignItems: 'center' },
  topBar: { alignSelf: 'flex-start', marginBottom: 12, marginTop: 8 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#d32f2f',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  videoBox: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: { width: '100%', height: '100%' },
  playOverlay: { alignItems: 'center', justifyContent: 'center' },
  playText: { color: '#fff', fontSize: 14, marginTop: 4 },
  metaLine: { color: '#bbb', marginBottom: 10 },
  button: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#d32f2f',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#2a2a2a',
    borderColor: '#d32f2f',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 12,
    alignItems: 'center',
    width: '100%',
  },
  icon: { marginRight: 8 },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  backText: { color: '#fff', fontSize: 16, marginLeft: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxHeight: '80%',
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  modalSubTitle: { fontSize: 14, color: '#bbb', textAlign: 'center', marginBottom: 10 },
  replacementItem: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#333' },
  replacementText: { color: '#fff', fontSize: 16 },
  replacementTag: { fontSize: 12, color: '#aaa', marginTop: 2, fontStyle: 'italic' },
  replacementName: { color: '#4fc3f7' },
  rowAlignCenter: { flexDirection: 'row', alignItems: 'center' },
  thumbnailImage: { width: 50, height: 50, marginRight: 10, borderRadius: 8, backgroundColor: '#333' },
  showMoreButton: { alignItems: 'center', marginVertical: 8 },
  showMoreText: { color: '#4fc3f7', fontSize: 14 },
  buttonMarginTop: { marginTop: 12 },
  replacementEmpty: { textAlign: 'center', opacity: 0.8 },
});

export default AdaptWorkoutScreen;
