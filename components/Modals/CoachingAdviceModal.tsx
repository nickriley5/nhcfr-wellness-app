/**
 * Coaching Advice Modal
 * Displays AI-generated coaching advice and workout adjustments based on feedback
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface Props {
  visible: boolean;
  onClose: () => void;
  coachingAdvice: string;
  shouldAdjust: boolean;
  adjustedWorkout?: {
    exercises: Array<{
      name: string;
      sets: number;
      reps: string;
      restSeconds: number;
      notes?: string;
    }>;
  };
  onAcceptAdjustments?: () => void;
  onUseOriginal?: () => void;
}

const CoachingAdviceModal: React.FC<Props> = ({
  visible,
  onClose,
  coachingAdvice,
  shouldAdjust,
  adjustedWorkout,
  onAcceptAdjustments,
  onUseOriginal,
}) => {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="person" size={32} color="#FF3C38" />
            </View>
            <Text style={styles.headerTitle}>Your Coach</Text>
          </View>

          <ScrollView style={styles.content}>
            {/* Coaching Advice */}
            <View style={styles.adviceCard}>
              <Text style={styles.adviceText}>{coachingAdvice}</Text>
            </View>

            {/* Adjustments Preview */}
            {shouldAdjust && adjustedWorkout && (
              <View style={styles.adjustmentsCard}>
                <View style={styles.adjustmentsHeader}>
                  <Ionicons name="fitness" size={20} color="#FF3C38" />
                  <Text style={styles.adjustmentsTitle}>Today's Adjusted Workout</Text>
                </View>

                {adjustedWorkout.exercises.map((exercise, idx) => (
                  <View key={idx} style={styles.exerciseItem}>
                    <View style={styles.exerciseHeader}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseVolume}>
                        {exercise.sets} × {exercise.reps}
                      </Text>
                    </View>
                    {exercise.notes && (
                      <View style={styles.noteContainer}>
                        <Ionicons name="bulb" size={14} color="#FFA726" />
                        <Text style={styles.noteText}>{exercise.notes}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Info Box */}
            {shouldAdjust && (
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color="#2196F3" />
                <Text style={styles.infoText}>
                  These adjustments are based on your last workout feedback and overall program progression.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            {shouldAdjust ? (
              <View style={styles.buttonRow}>
                <Pressable
                  style={styles.originalButton}
                  onPress={() => {
                    onUseOriginal?.();
                    onClose();
                  }}
                >
                  <Text style={styles.originalButtonText}>Use Original</Text>
                </Pressable>

                <Pressable
                  style={styles.acceptButton}
                  onPress={() => {
                    onAcceptAdjustments?.();
                    onClose();
                  }}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.acceptButtonText}>Accept Changes</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={styles.gotItButton}
                onPress={onClose}
              >
                <Text style={styles.gotItButtonText}>Got it, let's train!</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  adviceCard: {
    backgroundColor: '#222',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3C38',
  },
  adviceText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
  },
  adjustmentsCard: {
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  adjustmentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  adjustmentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  exerciseItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    flex: 1,
  },
  exerciseVolume: {
    fontSize: 14,
    color: '#FF3C38',
    fontWeight: '600',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
    gap: 6,
  },
  noteText: {
    fontSize: 12,
    color: '#aaa',
    flex: 1,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1a2332',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#aaa',
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  originalButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#333',
    borderRadius: 12,
    alignItems: 'center',
  },
  originalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    gap: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  gotItButton: {
    paddingVertical: 16,
    backgroundColor: '#FF3C38',
    borderRadius: 12,
    alignItems: 'center',
  },
  gotItButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CoachingAdviceModal;
