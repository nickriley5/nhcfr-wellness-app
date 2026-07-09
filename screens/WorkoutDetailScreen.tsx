import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { auth, db } from '../firebase';
import { doc, setDoc, Timestamp, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import Toast from 'react-native-toast-message';
import Video from 'react-native-video';
import YoutubePlayer from 'react-native-youtube-iframe';
import { resolveExercise } from '../utils/exerciseMatching';
import { exercises } from '../data/exercises';
import PRCelebration from '../components/PRCelebration';

type WorkoutDetailRoute = RouteProp<RootStackParamList, 'WorkoutDetail'>;

interface ExerciseData {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: string;
  videoUrl?: string;
  swapOptions?: string[];
  equipment?: string;
  notes?: string;
}

interface SetData {
  weight: string;
  reps: string;
  completed: boolean;
}

const WorkoutDetailScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<WorkoutDetailRoute>();
  
  const { day, weekIdx, dayIdx } = route.params || {};
  
  const [exerciseList, setExerciseList] = useState<ExerciseData[]>([]);
  const [workoutSets, setWorkoutSets] = useState<Record<string, SetData[]>>({});
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapModalExercise, setSwapModalExercise] = useState<ExerciseData | null>(null);
  const [restTimer, setRestTimer] = useState(0);
  const [_restTargetExercise, setRestTargetExercise] = useState<string | null>(null);
  const [isResting, setIsResting] = useState(false);
  const [workoutStartTime] = useState(Date.now());
  const [notes, setNotes] = useState('');
  const [feeling, setFeeling] = useState<'easy' | 'moderate' | 'hard' | 'crushed' | null>(null);
  const [showPR, setShowPR] = useState(false);
  const [prMsgs, setPrMsgs] = useState<string[]>([]);
  const [videoLoading, setVideoLoading] = useState<Record<string, boolean>>({});
  
  const restIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoLoadStartRef = useRef<Record<string, number>>({});

  const formatContextBlock = (block: any) => {
    if (!block) return 'Exercise';
    if (typeof block === 'string') return block;
    const name = block.name || block.id || 'Exercise';
    const details: string[] = [];
    if (block.sets) details.push(`${block.sets} sets`);
    if (block.repsOrDuration) details.push(`${block.repsOrDuration}`);
    if (block.restSeconds) details.push(`${block.restSeconds}s rest`);
    const detailText = details.length ? ` (${details.join(', ')})` : '';
    const notes = block.notes ? ` - ${block.notes}` : '';
    return `${name}${detailText}${notes}`;
  };

  const buildWorkoutContext = () => {
    if (!day) return 'No workout loaded.';
    const warmupLines = (day.warmup || []).map(formatContextBlock);
    const mainLines = (day.exercises || []).map(formatContextBlock);
    const cooldownLines = (day.cooldown || []).map(formatContextBlock);
    return [
      `Workout: ${day.title || 'Workout'}`,
      `Week ${weekIdx + 1} Day ${dayIdx + 1}`,
      warmupLines.length ? `Warm-Up: ${warmupLines.join('; ')}` : 'Warm-Up: none',
      mainLines.length ? `Main: ${mainLines.join('; ')}` : 'Main: none',
      cooldownLines.length ? `Cool-Down: ${cooldownLines.join('; ')}` : 'Cool-Down: none',
    ].join('\n');
  };

  useEffect(() => {
    if (!day) return;
    
    const parseExerciseList = (list: any[]) =>
      (list || []).map((ex: any) => {
        const rawName =
          typeof ex === 'string' ? ex : (ex.id || ex.exerciseId || ex.name);
        const resolved = resolveExercise(rawName);
        return {
          id: resolved?.id || rawName,
          name: resolved?.name || rawName || 'Unknown Exercise',
          sets: ex.sets || 3,
          reps: ex.reps || ex.repsOrDuration || ex.reps_or_time || '10',
          weight: ex.weight,
          videoUrl: resolved?.videoUrl,
          swapOptions: resolved?.swapOptions,
          equipment: resolved?.equipment,
          notes: ex.notes,
        };
      });

    const warmupList = parseExerciseList(day.warmup || []);
    const mainList = parseExerciseList(day.exercises || []);
    const cooldownList = parseExerciseList(day.cooldown || []);
    const parsedExercises: ExerciseData[] = [...warmupList, ...mainList, ...cooldownList];
    
    setExerciseList(parsedExercises);
    
    // Initialize workout sets
    const initialSets: Record<string, SetData[]> = {};
    parsedExercises.forEach(ex => {
      initialSets[ex.id] = Array.from({ length: ex.sets }, () => ({
        weight: ex.weight || '',
        reps: '',
        completed: false,
      }));
    });
    setWorkoutSets(initialSets);
  }, [day]);

  useEffect(() => {
    return () => {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
      }
    };
  }, []);

  const toggleVideoExpand = (exerciseId: string) => {
    setExpandedExercises(prev => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
        setVideoLoading(current => ({ ...current, [exerciseId]: false }));
      } else {
        next.add(exerciseId);
        videoLoadStartRef.current[exerciseId] = Date.now();
        setVideoLoading(current => ({ ...current, [exerciseId]: true }));
      }
      return next;
    });
  };

  const startRestTimer = (exerciseId: string, seconds: number = 90) => {
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
    }
    
    setRestTimer(seconds);
    setRestTargetExercise(exerciseId);
    setIsResting(true);
    
    restIntervalRef.current = setInterval(() => {
      setRestTimer(prev => {
        if (prev <= 1) {
          if (restIntervalRef.current) {
            clearInterval(restIntervalRef.current);
          }
          setIsResting(false);
          setRestTargetExercise(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopRestTimer = () => {
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
    }
    setIsResting(false);
    setRestTimer(0);
    setRestTargetExercise(null);
  };

  const formatRestTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getYoutubeVideoId = (url: string): string | null => {
    if (!url) return null;
    
    // Handle youtube.com/watch?v=VIDEO_ID
    const match1 = url.match(/youtube\.com\/watch\?v=([^&]+)/);
    if (match1) return match1[1];
    
    // Handle youtu.be/VIDEO_ID
    const match2 = url.match(/youtu\.be\/([^?]+)/);
    if (match2) return match2[1];
    
    // Handle youtube.com/embed/VIDEO_ID
    const match3 = url.match(/youtube\.com\/embed\/([^?]+)/);
    if (match3) return match3[1];
    
    return null;
  };

  const updateSet = (exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: string) => {
    setWorkoutSets(prev => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((set, idx) => 
        idx === setIndex ? { ...set, [field]: value } : set
      ),
    }));
  };

  const toggleSetComplete = (exerciseId: string, setIndex: number) => {
    setWorkoutSets(prev => {
      const updated = {
        ...prev,
        [exerciseId]: prev[exerciseId].map((set, idx) => 
          idx === setIndex ? { ...set, completed: !set.completed } : set
        ),
      };
      
      // Auto-start rest timer after completing a set
      if (!prev[exerciseId][setIndex].completed) {
        startRestTimer(exerciseId, 90);
      }
      
      return updated;
    });
  };

  const handleSwapExercise = (exercise: ExerciseData) => {
    try {
      // Use the same richer adaptation flow as dashboard Adapt.
      navigation.navigate('AdaptWorkout', {
        day,
        weekIdx,
        dayIdx,
        sourceType: route.params?.sourceType,
        workoutId: route.params?.workoutId,
        weekNumber: route.params?.weekNumber,
      });
    } catch (error) {
      // Fallback to legacy local swap modal if navigation fails.
      console.warn('Unable to open AdaptWorkout, using local swap modal:', error);
      setSwapModalExercise(exercise);
      setShowSwapModal(true);
    }
  };

  const confirmSwap = (newExerciseName: string) => {
    if (!swapModalExercise) return;
    
    // Resolve new exercise from library
    const resolved = resolveExercise(newExerciseName);
    if (!resolved) return;
    
    setExerciseList(prev => prev.map(ex => 
      ex.id === swapModalExercise.id 
        ? {
            ...ex,
            id: resolved.id,
            name: resolved.name,
            videoUrl: resolved.videoUrl,
            swapOptions: resolved.swapOptions,
            equipment: resolved.equipment,
          }
        : ex
    ));
    
    // Preserve set data structure
    setWorkoutSets(prev => {
      const oldSets = prev[swapModalExercise.id];
      const newSets = { ...prev };
      delete newSets[swapModalExercise.id];
      newSets[resolved.id] = oldSets;
      return newSets;
    });
    
    setShowSwapModal(false);
    setSwapModalExercise(null);
    
    Toast.show({
      type: 'success',
      text1: 'Exercise Swapped',
      text2: `${swapModalExercise.name} → ${resolved.name}`,
    });
  };

  const handleCompleteWorkout = async () => {
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

      // Calculate workout duration
      const duration = Math.floor((Date.now() - workoutStartTime) / 1000 / 60);

      // Prepare workout data
      const workoutData = {
        dayTitle: day.title || 'Workout',
        weekIdx,
        dayIdx,
        exercises: exerciseList.map(ex => ({
          name: ex.name,
          id: ex.id,
          sets: workoutSets[ex.id].map(set => ({
            weight: set.weight || '0',
            reps: set.reps || '0',
            completed: set.completed,
          })),
        })),
        duration,
        feeling,
        notes,
        completedAt: Timestamp.now(),
        workoutType: 'strength',
      };

      // ---- PR detection (compare against previous logs) ----
      const currentMaxByExercise: Record<string, { maxWeight: number; reps: number }> = {};
      exerciseList.forEach(ex => {
        const sets = workoutSets[ex.id] || [];
        sets.forEach(set => {
          if (!set.completed) {return;}
          const weight = Number(set.weight);
          const reps = Number(set.reps);
          if (!Number.isFinite(weight)) {return;}
          const prev = currentMaxByExercise[ex.name];
          if (!prev || weight > prev.maxWeight) {
            currentMaxByExercise[ex.name] = { maxWeight: weight, reps: Number.isFinite(reps) ? reps : 0 };
          }
        });
      });

      const previousMaxByExercise: Record<string, number> = {};
      const historySnap = await getDocs(
        query(
          collection(db, 'users', uid, 'workoutLogs'),
          orderBy('completedAt', 'desc'),
          limit(20)
        )
      );
      historySnap.forEach(docSnap => {
        const log = docSnap.data() as any;
        if (!Array.isArray(log.exercises)) {return;}
        log.exercises.forEach((ex: any) => {
          if (!Array.isArray(ex.sets)) {return;}
          ex.sets.forEach((set: any) => {
            const weight = Number(set.weight);
            if (!Number.isFinite(weight)) {return;}
            if (!previousMaxByExercise[ex.name] || weight > previousMaxByExercise[ex.name]) {
              previousMaxByExercise[ex.name] = weight;
            }
          });
        });
      });

      const newPRs: string[] = [];
      Object.entries(currentMaxByExercise).forEach(([name, data]) => {
        const prevMax = previousMaxByExercise[name] ?? 0;
        if (data.maxWeight > prevMax) {
          const repsText = data.reps ? ` x ${data.reps}` : '';
          newPRs.push(`${name}: ${data.maxWeight} lbs${repsText}`);
        }
      });

      // Save to workout logs (matches WorkoutHistoryScreen collection name)
      const historyRef = doc(collection(db, 'users', uid, 'workoutLogs'));
      await setDoc(historyRef, workoutData);
      
      console.log('✅ Workout saved to workoutLogs collection:', workoutData.dayTitle);

      if (newPRs.length > 0) {
        setPrMsgs(newPRs);
        setShowPR(true);
        setTimeout(() => {
          setShowPR(false);
          navigation.goBack();
        }, 3200);
      } else {
        Toast.show({
          type: 'success',
          text1: '🎉 Workout Complete!',
          text2: `${duration} minutes • ${exerciseList.length} exercises`,
          visibilityTime: 3000,
        });
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error saving workout:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to save',
        text2: 'Please try again',
      });
    }
  };

  if (!day) {
    return (
      <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No workout data</Text>
        </View>
      </LinearGradient>
    );
  }

  const feelingOptions = [
    { value: 'easy', label: 'Easy', icon: 'happy-outline', color: '#4CAF50' },
    { value: 'moderate', label: 'Good', icon: 'thumbs-up-outline', color: '#2196F3' },
    { value: 'hard', label: 'Hard', icon: 'flame-outline', color: '#FF9800' },
    { value: 'crushed', label: 'Crushed It', icon: 'trophy-outline', color: '#9C27B0' },
  ];
  const warmupCount = day?.warmup?.length || 0;
  const mainCount = day?.exercises?.length || 0;
  const cooldownCount = day?.cooldown?.length || 0;
  const sectionConfigs = [
    { title: 'Warm-Up', count: warmupCount },
    { title: 'Main Workout', count: mainCount },
    { title: 'Cool-Down', count: cooldownCount },
  ];
  let sectionOffset = 0;
  const sectionData = sectionConfigs.map(section => {
    const start = sectionOffset;
    const end = start + section.count;
    sectionOffset = end;
    return { ...section, exercises: exerciseList.slice(start, end) };
  });

  return (
    <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{day.title || 'Workout'}</Text>
          <Text style={styles.headerSubtitle}>Week {weekIdx + 1} • Day {dayIdx + 1}</Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('AIChat', { context: buildWorkoutContext() })}
          style={styles.coachButton}
        >
          <Ionicons name="chatbubbles-outline" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* REST TIMER BANNER */}
      {isResting && (
        <View style={styles.restBanner}>
          <Ionicons name="time-outline" size={24} color="#FF9800" />
          <Text style={styles.restText}>Rest: {formatRestTime(restTimer)}</Text>
          <Pressable onPress={stopRestTimer}>
            <Ionicons name="close-circle" size={24} color="#fff" />
          </Pressable>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        {/* EXERCISES */}
        {sectionData.map((section, sectionIdx) => {
          if (!section.exercises.length) return null;
          return (
            <View key={`${section.title}-${sectionIdx}`} style={styles.sectionBlock}>
              <Text style={styles.sectionHeaderText}>{section.title}</Text>
              {section.exercises.map((exercise, exerciseIdx) => {
                const isExpanded = expandedExercises.has(exercise.id);
                const sets = workoutSets[exercise.id] || [];
                const completedSets = sets.filter(s => s.completed).length;
                
                return (
                  <View key={`${section.title}-${sectionIdx}-${exercise.id}-${exerciseIdx}`} style={styles.exerciseCard}>
                    {/* EXERCISE HEADER */}
                    <Pressable 
                      style={styles.exerciseHeader}
                      onPress={() => toggleVideoExpand(exercise.id)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <Text style={styles.exerciseInfo}>
                          {exercise.sets} sets × {exercise.reps} • {completedSets}/{exercise.sets} complete
                        </Text>
                        {exercise.notes ? (
                          <Text style={styles.exerciseNotes}>{exercise.notes}</Text>
                        ) : null}
                      </View>
                      <Pressable 
                        onPress={(e) => {
                          e.stopPropagation();
                          handleSwapExercise(exercise);
                        }}
                        style={styles.swapButton}
                      >
                        <Ionicons name="swap-horizontal" size={20} color="#4fc3f7" />
                      </Pressable>
                      <Ionicons 
                        name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                        size={24} 
                        color="#999" 
                      />
                    </Pressable>

                    {/* COLLAPSIBLE VIDEO */}
                    {isExpanded && exercise.videoUrl && (
                      <View style={styles.videoContainer}>
                        {(() => {
                          const youtubeId = getYoutubeVideoId(exercise.videoUrl);
                          if (youtubeId) {
                            return (
                              <YoutubePlayer
                                height={220}
                                videoId={youtubeId}
                                play={false}
                                webViewProps={{
                                  cacheEnabled: true,
                                  domStorageEnabled: true,
                                  allowsInlineMediaPlayback: true,
                                }}
                                onReady={() => {
                                  const elapsed = Date.now() - (videoLoadStartRef.current[exercise.id] || Date.now());
                                  console.log(`🎥 YouTube ready (${exercise.name}) in ${elapsed}ms`);
                                  setVideoLoading(current => ({ ...current, [exercise.id]: false }));
                                }}
                                onError={(error: any) => {
                                  console.warn(`⚠️ YouTube load error for ${exercise.name}:`, error);
                                  setVideoLoading(current => ({ ...current, [exercise.id]: false }));
                                }}
                              />
                            );
                          } else {
                            return (
                              <Video
                                source={{ uri: exercise.videoUrl }}
                                style={styles.video}
                                controls
                                resizeMode="contain"
                                paused={false}
                                automaticallyWaitsToMinimizeStalling={false}
                                bufferConfig={{
                                  minBufferMs: 1000,
                                  maxBufferMs: 6000,
                                  bufferForPlaybackMs: 300,
                                  bufferForPlaybackAfterRebufferMs: 500,
                                }}
                                onLoadStart={() => {
                                  videoLoadStartRef.current[exercise.id] = Date.now();
                                  setVideoLoading(current => ({ ...current, [exercise.id]: true }));
                                }}
                                onLoad={() => {
                                  const elapsed = Date.now() - (videoLoadStartRef.current[exercise.id] || Date.now());
                                  console.log(`🎥 MP4 ready (${exercise.name}) in ${elapsed}ms`);
                                  setVideoLoading(current => ({ ...current, [exercise.id]: false }));
                                }}
                                onError={(error) => {
                                  console.warn(`⚠️ MP4 load error for ${exercise.name}:`, error);
                                  setVideoLoading(current => ({ ...current, [exercise.id]: false }));
                                }}
                              />
                            );
                          }
                        })()}
                        {videoLoading[exercise.id] && (
                          <View style={styles.videoLoadingOverlay}>
                            <ActivityIndicator size="small" color="#fff" />
                            <Text style={styles.videoLoadingText}>Loading video...</Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* SETS */}
                    {sets.map((set, setIdx) => (
                      <View 
                        key={`${exercise.id}-set-${setIdx}`} 
                        style={[styles.setRow, set.completed && styles.setRowCompleted]}
                      >
                        <View style={styles.setNumber}>
                          <Text style={styles.setNumberText}>{setIdx + 1}</Text>
                        </View>
                        
                        <View style={styles.setInputs}>
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Weight</Text>
                            <TextInput
                              style={styles.input}
                              placeholder={exercise.weight || '0'}
                              placeholderTextColor="#666"
                              keyboardType="numeric"
                              value={set.weight}
                              onChangeText={(val) => updateSet(exercise.id, setIdx, 'weight', val)}
                              editable={!set.completed}
                            />
                          </View>
                          
                          <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Reps</Text>
                            <TextInput
                              style={styles.input}
                              placeholder={exercise.reps}
                              placeholderTextColor="#666"
                              keyboardType="numeric"
                              value={set.reps}
                              onChangeText={(val) => updateSet(exercise.id, setIdx, 'reps', val)}
                              editable={!set.completed}
                            />
                          </View>
                        </View>
                        
                        <Pressable onPress={() => toggleSetComplete(exercise.id, setIdx)}>
                          <Ionicons
                            name={set.completed ? 'checkmark-circle' : 'ellipse-outline'}
                            size={32}
                            color={set.completed ? '#4CAF50' : '#666'}
                          />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          );
        })}

        {/* FEELING */}
        <View style={styles.feelingCard}>
          <Text style={styles.sectionTitle}>How did it feel?</Text>
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
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="How did the workout go? Any PRs or issues?"
            placeholderTextColor="#666"
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* COMPLETE BUTTON */}
        <Pressable style={styles.completeButton} onPress={handleCompleteWorkout}>
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
          <Text style={styles.completeButtonText}>Complete Workout</Text>
        </Pressable>
      </ScrollView>

      {showPR && (
        <PRCelebration visible={showPR} messages={prMsgs} onClose={() => setShowPR(false)} />
      )}

      {/* SWAP MODAL */}
      <Modal
        visible={showSwapModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSwapModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Swap Exercise</Text>
              <Pressable onPress={() => setShowSwapModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>
            
            {swapModalExercise?.swapOptions && swapModalExercise.swapOptions.length > 0 ? (
              <ScrollView style={styles.swapList}>
                {swapModalExercise.swapOptions.map((swapName, idx) => {
                  const swapEx = exercises.find(ex => ex.name === swapName);
                  return (
                    <Pressable
                      key={`swap-${swapName}-${idx}`}
                      style={styles.swapOption}
                      onPress={() => confirmSwap(swapName)}
                    >
                      <View>
                        <Text style={styles.swapOptionName}>{swapName}</Text>
                        {swapEx && (
                          <Text style={styles.swapOptionEquipment}>{swapEx.equipment}</Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#4fc3f7" />
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.noSwapsContainer}>
                <Text style={styles.noSwapsText}>No swap options available for this exercise</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  headerSubtitle: {
    fontSize: 14,
    color: '#FF9800',
    marginTop: 2,
  },
  restBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FF9800',
  },
  restText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF9800',
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
  sectionBlock: {
    marginBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFB74D',
    marginBottom: 10,
    paddingLeft: 4,
  },
  exerciseCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  exerciseInfo: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  exerciseNotes: {
    fontSize: 12,
    color: '#FFB74D',
    marginTop: 6,
  },
  swapButton: {
    padding: 8,
  },
  videoContainer: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#444',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  videoPlaceholder: {
    fontSize: 14,
    color: '#4fc3f7',
    textAlign: 'center',
    padding: 20,
  },
  videoLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  videoLoadingText: {
    fontSize: 12,
    color: '#fff',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  setRowCompleted: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  setNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  setNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  setInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
    textAlign: 'center',
  },
  feelingCard: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
    fontSize: 11,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  swapList: {
    padding: 16,
  },
  swapOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 12,
  },
  swapOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  swapOptionEquipment: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  noSwapsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noSwapsText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default WorkoutDetailScreen;
