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

  useEffect(() => {
    if (visible) {
      loadUserContext();
    }
  }, [visible]);

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
          
          // Check if user has the equipment
          const hasEquipment = exerciseEquipment === 'bodyweight' || 
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
      });
      setRecommendation(rec);
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
            <Text style={styles.headerTitle}>🤖 AI Workout Assistant</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>

          <ScrollView style={styles.content}>
            {!recommendation && (
              <View style={styles.introSection}>
                <Text style={styles.introIcon}>💪</Text>
                <Text style={styles.introTitle}>Get a Smart Workout</Text>
                <Text style={styles.introText}>
                  Based on your goals, recent workouts, and available equipment,
                  I'll create the perfect workout for you today.
                </Text>

                {userContext && (
                  <View style={styles.contextCard}>
                    <Text style={styles.contextTitle}>Your Profile:</Text>
                    <Text style={styles.contextItem}>🎯 Goal: {userContext.goal}</Text>
                    <Text style={styles.contextItem}>📊 Level: {userContext.experience}</Text>
                    <Text style={styles.contextItem}>
                      🏋️ Equipment: {userContext.equipment.join(', ')}
                    </Text>
                    {userContext.recentWorkouts.length > 0 && (
                      <Text style={styles.contextItem}>
                        📅 Recent: {userContext.recentWorkouts[0]}
                      </Text>
                    )}
                  </View>
                )}

                <Pressable
                  style={styles.generateButton}
                  onPress={handleGetRecommendation}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.generateButtonText}>✨ Generate Workout</Text>
                  )}
                </Pressable>
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
                      Difficulty: {recommendation.difficultyScore}/10
                    </Text>
                  </View>
                </View>

                <View style={styles.rationaleCard}>
                  <Text style={styles.rationaleTitle}>Why This Workout?</Text>
                  <Text style={styles.rationaleText}>{recommendation.rationale}</Text>
                </View>

                <View style={styles.focusCard}>
                  <Text style={styles.focusTitle}>Focus Areas:</Text>
                  <View style={styles.focusTags}>
                    {recommendation.focusAreas.map((area, index) => (
                      <View key={index} style={styles.focusTag}>
                        <Text style={styles.focusTagText}>{area}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.exercisesCard}>
                  <Text style={styles.exercisesTitle}>Exercises ({recommendation.exercises.length}):</Text>
                  {recommendation.exercises.map((exercise, index) => (
                    <View key={index} style={styles.exerciseItem}>
                      <View style={styles.exerciseNumber}>
                        <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.exerciseName}>{exercise}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.buttonRow}>
                  <Pressable
                    style={styles.regenerateButton}
                    onPress={() => {
                      setRecommendation(null);
                      handleGetRecommendation();
                    }}
                  >
                    <Ionicons name="refresh-outline" size={20} color="#fff" />
                    <Text style={styles.regenerateButtonText}>Try Again</Text>
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
  introIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  introText: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 24,
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
  regenerateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#444',
    paddingVertical: 14,
    borderRadius: 12,
  },
  regenerateButtonText: {
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
