/**
 * AI Workout Assistant
 * Provides smart workout recommendations based on user context
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getWorkoutRecommendation, WorkoutRecommendation } from '../utils/ai/aiService';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import Toast from 'react-native-toast-message';

interface Props {
  visible: boolean;
  onClose: () => void;
  onApplyRecommendation?: (recommendation: WorkoutRecommendation) => void;
}

const AIWorkoutAssistant: React.FC<Props> = ({ visible, onClose, onApplyRecommendation }) => {
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<WorkoutRecommendation | null>(null);
  const [userContext, setUserContext] = useState<any>(null);
  
  // Workout preferences
  const [duration, setDuration] = useState(30);
  const [focus, setFocus] = useState<string[]>(['Full Body']);
  const [trainingStyle, setTrainingStyle] = useState<string[]>(['Strength']);
  const [intensity, setIntensity] = useState(5);

  const formatExerciseItem = (exercise: any) => {
    if (!exercise) return 'Exercise';
    if (typeof exercise === 'string') return exercise;
    if (typeof exercise === 'object') {
      const name = exercise.name || 'Exercise';
      const reps = exercise.reps || exercise.reps_or_time || exercise.repsOrTime;
      const sets = exercise.sets;
      const rest = exercise.rest || exercise.rest_seconds || exercise.restSeconds;
      const notes = exercise.notes;
      const details = [
        sets ? `${sets} sets` : null,
        reps ? `${reps}` : null,
        rest ? `${rest}s rest` : null,
        notes ? `${notes}` : null,
      ].filter(Boolean).join(' • ');
      return details ? `${name} • ${details}` : name;
    }
    return String(exercise);
  };

  useEffect(() => {
    if (visible) {
      loadUserContext();
    }
  }, [visible]);

  useEffect(() => {
    if (trainingStyle.includes('Endurance')) {
      setFocus(['Cardio']);
    }
  }, [trainingStyle]);

  const loadUserContext = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      // Load user profile
      const profileDoc = await getDoc(doc(db, 'users', uid));
      const profileData = profileDoc.data();

      // Load recent workouts
      const workoutsQuery = query(
        collection(db, 'users', uid, 'workoutHistory'),
        orderBy('completedAt', 'desc'),
        limit(5)
      );
      const workoutsSnap = await getDocs(workoutsQuery);
      const recentWorkouts = workoutsSnap.docs.map(doc => doc.data().title || 'Workout');

      setUserContext({
        goal: profileData?.goalType || 'Build Muscle',
        experience: profileData?.experienceLevel || 'Intermediate',
        equipment: profileData?.equipment || ['Dumbbells', 'Bodyweight'],
        recentWorkouts,
        injuries: profileData?.injuries || [],
        preferences: profileData?.preferences || [],
      });
    } catch (error) {
      console.error('Error loading user context:', error);
    }
  };

  const handleGetRecommendation = async () => {
    if (!userContext) {
      Toast.show({
        type: 'error',
        text1: 'Context not loaded',
        text2: 'Please try again',
      });
      return;
    }

    setLoading(true);
    try {
      // Import exercise library
      const { exercises } = await import('../data/exercises');
      
      // Filter exercises based on available equipment
      const userEquipment = userContext.equipment.map((e: string) => e.toLowerCase());
      const availableExercises = exercises
        .filter(ex => {
          const exerciseEquipment = (ex.equipment || '').toLowerCase();
          const category = (ex.category || '').toLowerCase();
          const isBodyweight = category.includes('bodyweight') || exerciseEquipment.includes('bodyweight');

          // Check if user has the equipment (bodyweight always allowed)
          const hasEquipment = isBodyweight ||
                               exerciseEquipment === '' ||
                               userEquipment.some((eq: string) => exerciseEquipment.includes(eq.toLowerCase()));
          
          // Include exercises with video URLs (both YouTube and direct files)
          const hasVideo = ex.videoUrl && ex.videoUrl.trim() !== '';
          
          return hasEquipment && hasVideo;
        })
        .map(ex => ({
          id: ex.id,
          name: ex.name,
          equipment: ex.equipment || '',
          focusArea: ex.focusArea || '',
          videoUrl: ex.videoUrl, // Include video URL for debugging
        }));

      const youtubeCount = availableExercises.filter(ex => 
        ex.videoUrl?.includes('youtube.com') || ex.videoUrl?.includes('youtu.be')
      ).length;
      
      console.log(`📚 Filtered to ${availableExercises.length} exercises based on equipment:`, userEquipment);
      console.log(`   📺 YouTube videos: ${youtubeCount}, Direct videos: ${availableExercises.length - youtubeCount}`);
      console.log(`📊 Token estimate: ~${availableExercises.length * 4} input tokens for exercise list`);

      const rec = await getWorkoutRecommendation({
        ...userContext,
        availableExercises,
        duration,
        focus: focus[0] || 'Full Body',
        trainingStyle: trainingStyle[0] || 'Strength',
        intensity,
      });
      const styleValue = trainingStyle[0] || 'Strength';
      const isHiit = styleValue.toLowerCase().includes('hiit') || styleValue.toLowerCase().includes('conditioning');
      const isEndurance = styleValue.toLowerCase().includes('endurance');
      const defaultInterval = isHiit
        ? {
            rounds: intensity >= 8 ? 10 : intensity >= 6 ? 8 : 6,
            workSec: intensity >= 8 ? 50 : intensity >= 6 ? 40 : 30,
            restSec: intensity >= 8 ? 20 : intensity >= 6 ? 30 : 45,
            transitionSec: 10,
            format: 'circuit',
          }
        : null;

      setRecommendation({
        ...rec,
        _trainingStyle: trainingStyle[0] || 'Strength',
        _duration: duration,
        _intensity: intensity,
        _focus: focus[0] || 'Full Body',
        interval: rec.interval || defaultInterval,
        _isEndurance: isEndurance,
      } as any);
    } catch (error) {
      console.error('Error getting recommendation:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to get recommendation',
        text2: 'Please check your API configuration',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (recommendation && onApplyRecommendation) {
      onApplyRecommendation(recommendation);
      Toast.show({
        type: 'success',
        text1: 'Workout Applied',
        text2: 'AI recommendation has been added to your program',
      });
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>⚡ Quick Workout</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>

          <ScrollView style={styles.content}>
            {!recommendation && (
              <View style={styles.introSection}>
                <Text style={styles.introTitle}>Quick Workout Setup</Text>

                {/* DURATION SLIDER */}
                <View style={styles.preferenceSection}>
                  <Text style={styles.preferenceLabel}>Duration: {duration} minutes</Text>
                  <View style={styles.durationOptions}>
                    {[15, 20, 30, 45, 60].map(min => (
                      <Pressable
                        key={min}
                        style={[styles.durationChip, duration === min && styles.durationChipActive]}
                        onPress={() => setDuration(min)}
                      >
                        <Text style={[styles.durationChipText, duration === min && styles.durationChipTextActive]}>
                          {min}min
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* FOCUS AREA */}
                <View style={styles.preferenceSection}>
                  <Text style={styles.preferenceLabel}>Focus Area</Text>
                  <View style={styles.chipContainer}>
                    {(trainingStyle.includes('Endurance')
                      ? ['Cardio']
                      : ['Upper Body', 'Lower Body', 'Full Body', 'Core', 'Cardio']
                    ).map(area => (
                      <Pressable
                        key={area}
                        style={[styles.chip, focus.includes(area) && styles.chipActive]}
                        onPress={() => {
                          if (focus.includes(area)) {
                            setFocus(focus.filter(f => f !== area));
                          } else {
                            setFocus([area]); // Single selection
                          }
                        }}
                        disabled={trainingStyle.includes('Endurance') && area !== 'Cardio'}
                      >
                        <Text style={[styles.chipText, focus.includes(area) && styles.chipTextActive]}>
                          {area}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* TRAINING STYLE */}
                <View style={styles.preferenceSection}>
                  <Text style={styles.preferenceLabel}>Training Style</Text>
                  <View style={styles.chipContainer}>
                    {['Strength', 'Hypertrophy', 'HIIT', 'Conditioning', 'Endurance'].map(style => (
                      <Pressable
                        key={style}
                        style={[styles.chip, trainingStyle.includes(style) && styles.chipActive]}
                        onPress={() => {
                          if (trainingStyle.includes(style)) {
                            setTrainingStyle(trainingStyle.filter(s => s !== style));
                          } else {
                            setTrainingStyle([style]); // Single selection
                          }
                        }}
                      >
                        <Text style={[styles.chipText, trainingStyle.includes(style) && styles.chipTextActive]}>
                          {style}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  {trainingStyle.includes('Endurance') && (
                    <Text style={styles.helperInline}>
                      Endurance = steady-state cardio (Zone 2-3). Focus locked to Cardio.
                    </Text>
                  )}
                </View>

                {/* INTENSITY SLIDER */}
                <View style={styles.preferenceSection}>
                  <Text style={styles.preferenceLabel}>
                    Intensity: {['Chill', 'Light', 'Moderate', 'Hard', 'Beast Mode'][Math.floor((intensity - 1) / 2)]}
                  </Text>
                  <View style={styles.intensitySlider}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
                      <Pressable
                        key={level}
                        style={[styles.intensityDot, intensity >= level && styles.intensityDotActive]}
                        onPress={() => setIntensity(level)}
                      />
                    ))}
                  </View>
                </View>

                <Pressable
                  style={styles.generateButton}
                  onPress={handleGetRecommendation}
                  disabled={loading || focus.length === 0 || trainingStyle.length === 0}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.generateButtonText}>⚡ Generate Workout</Text>
                  )}
                </Pressable>
                {loading ? (
                  <Text style={styles.loadingHint}>
                    AI is building your session. This may take up to 30-45 seconds.
                  </Text>
                ) : null}
              </View>
            )}

            {recommendation && (
              <View style={styles.recommendationSection}>
                <View style={styles.recommendationHeader}>
                  <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
                  <Text style={styles.recommendationTitle}>Workout Ready!</Text>
                </View>

                <View style={styles.metaCard}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={20} color="#FF3C38" />
                    <Text style={styles.metaText}>{recommendation.estimatedDuration} min</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="flame-outline" size={20} color="#FF3C38" />
                    <Text style={styles.metaText}>
                      Intensity {recommendation.difficultyScore}/10
                    </Text>
                  </View>
                </View>

                {recommendation.cardio && (
                  <View style={styles.intervalSummaryCard}>
                    <Text style={styles.intervalSummaryTitle}>Endurance Plan</Text>
                    <Text style={styles.intervalSummaryText}>
                      {recommendation.cardio.type} • {recommendation.cardio.duration} min • {recommendation.cardio.intensity}
                    </Text>
                    {recommendation.cardio.notes && (
                      <Text style={styles.intervalSummaryText}>{recommendation.cardio.notes}</Text>
                    )}
                  </View>
                )}

                {recommendation.interval && (
                  <View style={styles.intervalSummaryCard}>
                    <Text style={styles.intervalSummaryTitle}>HIIT Structure</Text>
                    <Text style={styles.intervalSummaryText}>
                      {recommendation.interval.rounds} rounds • {recommendation.interval.workSec}s work / {recommendation.interval.restSec}s rest
                      {recommendation.interval.transitionSec ? ` • ${recommendation.interval.transitionSec}s transition` : ''}
                    </Text>
                    <Text style={styles.intervalSummaryText}>
                      1 round = all exercises once
                    </Text>
                  </View>
                )}

                {recommendation.rationale && (
                  <View style={styles.rationaleCard}>
                    <Text style={styles.rationaleTitle}>Coach Note</Text>
                    <Text style={styles.rationaleText}>{recommendation.rationale}</Text>
                  </View>
                )}

                {recommendation.warmup && recommendation.warmup.length > 0 && (
                  <View style={styles.exercisesCard}>
                    <Text style={styles.sectionTitle}>🔥 Warm-Up ({recommendation.warmup.length})</Text>
                    {recommendation.warmup.map((exercise, index) => (
                      <View key={index} style={styles.exerciseItem}>
                        <View style={[styles.exerciseNumber, { backgroundColor: '#FF9800' }]}>
                          <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.exerciseName}>{formatExerciseItem(exercise)}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.exercisesCard}>
                  <Text style={styles.sectionTitle}>💪 Main Exercises ({recommendation.exercises.length})</Text>
                  {recommendation.exercises.map((exercise, index) => (
                    <View key={index} style={styles.exerciseItem}>
                      <View style={styles.exerciseNumber}>
                        <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.exerciseName}>{formatExerciseItem(exercise)}</Text>
                    </View>
                  ))}
                </View>

                {recommendation.cooldown && recommendation.cooldown.length > 0 && (
                  <View style={styles.exercisesCard}>
                    <Text style={styles.sectionTitle}>🧘 Cool-Down ({recommendation.cooldown.length})</Text>
                    {recommendation.cooldown.map((exercise, index) => (
                      <View key={index} style={styles.exerciseItem}>
                        <View style={[styles.exerciseNumber, { backgroundColor: '#2196F3' }]}>
                          <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.exerciseName}>{formatExerciseItem(exercise)}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.buttonRow}>
                  <Pressable
                    style={styles.backButton}
                    onPress={() => {
                      setRecommendation(null);
                    }}
                  >
                    <Ionicons name="arrow-back-outline" size={20} color="#fff" />
                    <Text style={styles.backButtonText}>Back to Setup</Text>
                  </Pressable>

                  <Pressable style={styles.applyButton} onPress={handleApply}>
                    <Ionicons name="checkmark-outline" size={20} color="#fff" />
                    <Text style={styles.applyButtonText}>Apply Workout</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  introSection: {
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  helperInline: {
    marginTop: 8,
    fontSize: 12,
    color: '#aaa',
  },
  contextCard: {
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 24,
  },
  contextTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  contextItem: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  generateButton: {
    backgroundColor: '#FF3C38',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingHint: {
    color: '#9aa0a6',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  // Preference styles
  preferenceSection: {
    marginBottom: 24,
    width: '100%',
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  durationOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  durationChip: {
    backgroundColor: '#222',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  durationChipActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  durationChipText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
  },
  durationChipTextActive: {
    color: '#fff',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#222',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#444',
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: '#FF3C38',
    borderColor: '#FF3C38',
  },
  chipText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
  intensitySlider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  intensityDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#222',
    borderWidth: 2,
    borderColor: '#444',
  },
  intensityDotActive: {
    backgroundColor: '#FF3C38',
    borderColor: '#FF3C38',
  },
  recommendationSection: {
    paddingBottom: 20,
  },
  recommendationHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  recommendationTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  metaCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  rationaleCard: {
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  rationaleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3C38',
    marginBottom: 8,
  },
  rationaleText: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
  },
  focusCard: {
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  focusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  focusTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  focusTag: {
    backgroundColor: '#FF3C38',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  focusTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  intervalSummaryCard: {
    backgroundColor: '#1f1f1f',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.35)',
  },
  intervalSummaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFB74D',
    marginBottom: 6,
  },
  intervalSummaryText: {
    fontSize: 12,
    color: '#ddd',
    lineHeight: 18,
  },
  exercisesCard: {
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  exercisesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF3C38',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exerciseNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseName: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#444',
    paddingVertical: 14,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  applyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default AIWorkoutAssistant;
