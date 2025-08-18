import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import { resolveExerciseDetails, getRPEColor, getRPEDescription, getExerciseVideoUrl } from '../../utils/exerciseUtils';
import type { ExerciseBlock } from '../../types/Exercise';

const { height: screenHeight } = Dimensions.get('window');

// Utility function to format exercise names (convert underscores to spaces and capitalize)
const formatExerciseName = (id: string): string => {
  return id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase()); // capitalize each word
};

interface TomorrowInfo {
  day: any;
  weekIdx: number;
  dayIdx: number;
  isRestDay: boolean;
  environment: string;
}

interface TomorrowPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  tomorrowInfo: TomorrowInfo | null;
  getEnvironmentIcon: (environment: string) => string;
  getEnvironmentLabel: (environment: string) => string;
  _summarizeMains: (day: any) => string;
  countSets: (day: any) => number;
  estimateTime: (day: any) => number;
}

export const TomorrowPreviewModal: React.FC<TomorrowPreviewModalProps> = ({
  visible,
  onClose,
  tomorrowInfo,
  getEnvironmentIcon,
  getEnvironmentLabel,
  _summarizeMains,
  countSets,
  estimateTime,
}) => {
  // Track which exercise videos are expanded
  const [expandedVideos, setExpandedVideos] = useState<Set<string>>(new Set());

  const toggleVideo = (exerciseId: string) => {
    setExpandedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId);
      } else {
        newSet.add(exerciseId);
      }
      return newSet;
    });
  };

  const restDayActivities = [
    {
      icon: 'body-outline',
      title: 'Mobility & Stretching',
      description: 'Light stretching, foam rolling, or yoga for 15-30 minutes',
      duration: '15-30 min',
    },
    {
      icon: 'walk-outline',
      title: 'Active Recovery Walk',
      description: 'Easy-paced walk outdoors or on treadmill',
      duration: '20-45 min',
    },
    {
      icon: 'water-outline',
      title: 'Hydration Focus',
      description: 'Aim for extra water intake throughout the day',
      duration: 'All day',
    },
    {
      icon: 'moon-outline',
      title: 'Quality Sleep',
      description: 'Prioritize 7-9 hours of quality sleep for recovery',
      duration: '7-9 hours',
    },
    {
      icon: 'restaurant-outline',
      title: 'Meal Prep',
      description: 'Prepare meals for upcoming training days',
      duration: '30-60 min',
    },
    {
      icon: 'heart-outline',
      title: 'Stress Management',
      description: 'Meditation, breathing exercises, or relaxation',
      duration: '10-20 min',
    },
  ];

  const renderWorkoutPreview = () => {
    if (!tomorrowInfo?.day) {
      return null;
    }

    const { day } = tomorrowInfo;
    const exercises = day.exercises || [];
    const warmup = day.warmup || [];
    const cooldown = day.cooldown || [];

    return (
      <ScrollView style={{ maxHeight: screenHeight * 0.7 }}>
        <View style={styles.workoutSection}>
          <View style={styles.workoutHeader}>
            <View style={styles.workoutTitleContainer}>
              <Text style={styles.workoutTitle}>
                {getEnvironmentIcon(tomorrowInfo.environment)} {day.title || 'Workout'}
              </Text>
              <Text style={styles.workoutEnvironment}>
                {getEnvironmentLabel(tomorrowInfo.environment)}
              </Text>
            </View>
            <View style={styles.workoutStats}>
              <View style={styles.statItem}>
                <Ionicons name="barbell-outline" size={16} color="#33d6a6" />
                <Text style={styles.statNumber}>{exercises.length}</Text>
                <Text style={styles.statLabel}>exercises</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="stats-chart-outline" size={16} color="#33d6a6" />
                <Text style={styles.statNumber}>{countSets(day)}</Text>
                <Text style={styles.statLabel}>sets</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={16} color="#33d6a6" />
                <Text style={styles.statNumber}>{estimateTime(day)}</Text>
                <Text style={styles.statLabel}>min</Text>
              </View>
            </View>
          </View>

          {warmup.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="flash-outline" size={16} color="#ffa726" /> Warm-up
              </Text>
              {warmup.map((exerciseBlock: ExerciseBlock, index: number) => {
                const exercise = resolveExerciseDetails(exerciseBlock.id);
                return (
                  <View key={index} style={styles.exerciseCard}>
                    <View style={styles.exerciseHeader}>
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName}>
                          {exercise?.name || formatExerciseName(exerciseBlock.id)}
                        </Text>
                        <Text style={styles.exerciseDetails}>
                          {exerciseBlock.sets} sets • {exerciseBlock.repsOrDuration}
                        </Text>
                        {exercise?.focusArea && (
                          <Text style={styles.exerciseFocus}>{exercise.focusArea}</Text>
                        )}
                      </View>
                      <View style={[styles.rpeIndicator, { backgroundColor: getRPEColor(exerciseBlock.rpe) }]}>
                        <Text style={styles.rpeText}>{exerciseBlock.rpe}</Text>
                      </View>
                    </View>
                    {exercise?.coachingNotes && (
                      <View style={styles.coachingNotesContainer}>
                        <Ionicons name="bulb-outline" size={14} color="#ffa726" />
                        <Text style={styles.coachingNotes}>{exercise.coachingNotes}</Text>
                      </View>
                    )}
                    {exercise && exercise.videoUrl && exercise.videoUrl.trim() !== '' ? (
                      <View style={styles.exerciseVideoContainer}>
                        {expandedVideos.has(exercise.id) ? (
                          <View style={styles.videoPlayerContainer}>
                            <Video
                              source={{ uri: getExerciseVideoUrl(exercise) }}
                              style={styles.videoPlayer}
                              resizeMode="contain"
                              controls={true}
                              paused={false}
                              repeat={false}
                              onEnd={() => toggleVideo(exercise.id)}
                            />
                            <Pressable
                              style={styles.hideVideoButton}
                              onPress={() => toggleVideo(exercise.id)}
                            >
                              <Text style={styles.hideVideoText}>Hide Video</Text>
                              <Ionicons name="close" size={16} color="#fff" style={styles.closeIcon} />
                            </Pressable>
                          </View>
                        ) : (
                          <Pressable
                            style={styles.viewExerciseButton}
                            onPress={() => toggleVideo(exercise.id)}
                          >
                            <Ionicons name="play-circle-outline" size={20} color="#fff" />
                            <Text style={styles.viewExerciseText}>View Exercise</Text>
                          </Pressable>
                        )}
                      </View>
                    ) : exercise ? (
                      <View style={styles.noVideoContainer}>
                        <Ionicons name="videocam-off-outline" size={16} color="#666" />
                        <Text style={styles.noVideoText}>No video available</Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="barbell-outline" size={16} color="#33d6a6" /> Main Exercises
            </Text>
            {exercises.map((exerciseBlock: ExerciseBlock, index: number) => {
              const exercise = resolveExerciseDetails(exerciseBlock.id);
              return (
                <View key={index} style={styles.exerciseCard}>
                  <View style={styles.exerciseHeader}>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>
                        {exercise?.name || formatExerciseName(exerciseBlock.id)}
                      </Text>
                      <Text style={styles.exerciseDetails}>
                        {exerciseBlock.sets} sets • {exerciseBlock.repsOrDuration}
                      </Text>
                      {exercise?.focusArea && (
                        <Text style={styles.exerciseFocus}>{exercise.focusArea}</Text>
                      )}
                      <View style={styles.exerciseTags}>
                        <View style={[styles.rpeIndicator, { backgroundColor: getRPEColor(exerciseBlock.rpe) }]}>
                          <Text style={styles.rpeText}>RPE {exerciseBlock.rpe}</Text>
                        </View>
                        <Text style={styles.rpeDescription}>
                          {getRPEDescription(exerciseBlock.rpe)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {exercise?.coachingNotes && (
                    <View style={styles.coachingNotesContainer}>
                      <Ionicons name="bulb-outline" size={14} color="#ffa726" />
                      <Text style={styles.coachingNotes}>{exercise.coachingNotes}</Text>
                    </View>
                  )}
                  {exercise && exercise.videoUrl && exercise.videoUrl.trim() !== '' ? (
                    <View style={styles.exerciseVideoContainer}>
                      {expandedVideos.has(exercise.id) ? (
                        <View style={styles.videoPlayerContainer}>
                          <Video
                            source={{ uri: getExerciseVideoUrl(exercise) }}
                            style={styles.videoPlayer}
                            resizeMode="contain"
                            controls={true}
                            paused={false}
                            repeat={false}
                            onEnd={() => toggleVideo(exercise.id)}
                          />
                          <Pressable
                            style={styles.hideVideoButton}
                            onPress={() => toggleVideo(exercise.id)}
                          >
                            <Text style={styles.hideVideoText}>Hide Video</Text>
                            <Ionicons name="close" size={16} color="#fff" style={styles.closeIcon} />
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable
                          style={styles.viewExerciseButton}
                          onPress={() => toggleVideo(exercise.id)}
                        >
                          <Ionicons name="play-circle-outline" size={20} color="#fff" />
                          <Text style={styles.viewExerciseText}>View Exercise</Text>
                        </Pressable>
                      )}
                    </View>
                  ) : exercise ? (
                    <View style={styles.noVideoContainer}>
                      <Ionicons name="videocam-off-outline" size={16} color="#666" />
                      <Text style={styles.noVideoText}>No video available</Text>
                    </View>
                  ) : null}
                  {exercise?.swapOptions && exercise.swapOptions.length > 0 && (
                    <View style={styles.swapOptions}>
                      <Text style={styles.swapTitle}>Alternative exercises:</Text>
                      <Text style={styles.swapList}>{exercise.swapOptions.join(' • ')}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {cooldown.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="leaf-outline" size={16} color="#4fc3f7" /> Cool-down
              </Text>
              {cooldown.map((exerciseBlock: ExerciseBlock, index: number) => {
                const exercise = resolveExerciseDetails(exerciseBlock.id);
                return (
                  <View key={index} style={styles.exerciseCard}>
                    <View style={styles.exerciseHeader}>
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName}>
                          {exercise?.name || formatExerciseName(exerciseBlock.id)}
                        </Text>
                        <Text style={styles.exerciseDetails}>
                          {exerciseBlock.sets} sets • {exerciseBlock.repsOrDuration}
                        </Text>
                        {exercise?.focusArea && (
                          <Text style={styles.exerciseFocus}>{exercise.focusArea}</Text>
                        )}
                      </View>
                      <View style={[styles.rpeIndicator, { backgroundColor: getRPEColor(exerciseBlock.rpe) }]}>
                        <Text style={styles.rpeText}>{exerciseBlock.rpe}</Text>
                      </View>
                    </View>
                    {exercise?.coachingNotes && (
                      <View style={styles.coachingNotesContainer}>
                        <Ionicons name="bulb-outline" size={14} color="#ffa726" />
                        <Text style={styles.coachingNotes}>{exercise.coachingNotes}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderRestDayPreview = () => (
    <ScrollView style={{ maxHeight: screenHeight * 0.6 }}>
      <View style={styles.restDaySection}>
        <View style={styles.restDayHeader}>
          <Ionicons name="bed-outline" size={24} color="#ffa726" />
          <Text style={styles.restDayTitle}>Rest Day Recovery</Text>
          <Text style={styles.restDaySubtitle}>
            Focus on recovery and preparation for your next training session
          </Text>
        </View>

        <Text style={styles.activitiesTitle}>Suggested Activities</Text>
        {restDayActivities.map((activity, index) => (
          <View key={index} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name={activity.icon as any} size={20} color="#33d6a6" />
            </View>
            <View style={styles.activityContent}>
              <View style={styles.activityHeader}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDuration}>{activity.duration}</Text>
              </View>
              <Text style={styles.activityDescription}>{activity.description}</Text>
            </View>
          </View>
        ))}

        <View style={styles.recoveryTip}>
          <Ionicons name="bulb-outline" size={20} color="#ffa726" />
          <Text style={styles.recoveryTipText}>
            Remember: Recovery is when your body adapts and gets stronger. Use this time wisely!
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <View style={styles.modalTitleContainer}>
            <Ionicons name="calendar-outline" size={24} color="#33d6a6" />
            <Text style={styles.modalTitle}>Tomorrow's Plan</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.modalContent}>
          {tomorrowInfo?.isRestDay ? renderRestDayPreview() : renderWorkoutPreview()}
        </View>
      </LinearGradient>
    </Modal>
  );
};

const styles = {
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitleContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  workoutSection: {
    paddingBottom: 20,
  },
  workoutHeader: {
    marginBottom: 24,
  },
  workoutTitleContainer: {
    marginBottom: 12,
  },
  workoutTitle: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  workoutEnvironment: {
    fontSize: 16,
    color: '#33d6a6',
    fontWeight: '500' as const,
  },
  workoutStats: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    backgroundColor: 'rgba(51, 214, 166, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    alignItems: 'center' as const,
    gap: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 12,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  exerciseItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  exerciseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 8,
  },
  exerciseInfo: {
    flex: 1,
    marginRight: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#fff',
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: 14,
    color: '#33d6a6',
    marginBottom: 4,
  },
  exerciseFocus: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  exerciseTags: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  rpeIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center' as const,
  },
  rpeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  rpeDescription: {
    fontSize: 12,
    color: '#999',
  },
  coachingNotesContainer: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 8,
    gap: 6,
  },
  coachingNotes: {
    fontSize: 12,
    color: '#ffa726',
    fontStyle: 'italic' as const,
    lineHeight: 16,
    flex: 1,
  },
  exerciseVideoContainer: {
    position: 'relative' as const,
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden' as const,
  },
  exerciseVideo: {
    width: '100%' as const,
    height: 120,
    backgroundColor: '#333',
  },
  videoOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  swapOptions: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(255, 167, 38, 0.1)',
    borderRadius: 6,
  },
  swapTitle: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#ffa726',
    marginBottom: 4,
  },
  swapList: {
    fontSize: 11,
    color: '#999',
    lineHeight: 14,
  },
  exerciseInstructions: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic' as const,
  },
  restDaySection: {
    paddingBottom: 20,
  },
  restDayHeader: {
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  restDayTitle: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  restDaySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  activitiesTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(51, 214, 166, 0.2)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#fff',
    flex: 1,
  },
  activityDuration: {
    fontSize: 12,
    color: '#33d6a6',
    fontWeight: '500' as const,
  },
  activityDescription: {
    fontSize: 14,
    color: '#999',
    lineHeight: 18,
  },
  recoveryTip: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    backgroundColor: 'rgba(255, 167, 38, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  recoveryTipText: {
    fontSize: 14,
    color: '#ffa726',
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
  // Video player styles
  videoPlayerContainer: {
    position: 'relative' as const,
  },
  videoPlayer: {
    width: '100%' as const,
    height: 200,
    backgroundColor: '#000',
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: 48,
  },
  viewExerciseText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#fff',
    marginLeft: 8,
  },
  // No video available styles
  noVideoContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(102, 102, 102, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  noVideoText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 6,
    fontStyle: 'italic' as const,
  },
};
