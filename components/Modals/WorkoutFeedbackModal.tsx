// components/Modals/WorkoutFeedbackModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

interface WorkoutFeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (feedback: WorkoutFeedback) => void;
}

export interface WorkoutFeedback {
  feeling: 'strong' | 'good' | 'okay' | 'tough' | 'exhausted';
  note: string;
}

const feedbackOptions = [
  { value: 'strong', icon: 'barbell', label: 'Strong', color: '#4caf50', emoji: '💪' },
  { value: 'good', icon: 'happy', label: 'Good', color: '#33d6a6', emoji: '😊' },
  { value: 'okay', icon: 'remove-circle', label: 'Okay', color: '#ff9800', emoji: '😐' },
  { value: 'tough', icon: 'sad', label: 'Tough', color: '#ff6b35', emoji: '😓' },
  { value: 'exhausted', icon: 'battery-dead', label: 'Exhausted', color: '#d32f2f', emoji: '🔥' },
];

export default function WorkoutFeedbackModal({
  visible,
  onClose,
  onSubmit,
}: WorkoutFeedbackModalProps) {
  const [selectedFeeling, setSelectedFeeling] = useState<WorkoutFeedback['feeling'] | null>(null);
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    if (!selectedFeeling) return;

    onSubmit({
      feeling: selectedFeeling,
      note: note.trim(),
    });

    // Reset for next time
    setSelectedFeeling(null);
    setNote('');
  };

  const handleSkip = () => {
    // Submit default "good" feedback with no note
    onSubmit({
      feeling: 'good',
      note: '',
    });
    
    setSelectedFeeling(null);
    setNote('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <LinearGradient
          colors={['#1a1a1a', '#2a2a2a']}
          style={styles.modalContainer}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
              <Ionicons name="fitness" size={32} color="#d32f2f" />
              <Text style={styles.title}>How did today's workout feel?</Text>
              <Text style={styles.subtitle}>
                Your feedback helps us adjust your training for optimal results
              </Text>
            </View>

            {/* Feeling Options */}
            <View style={styles.optionsContainer}>
              {feedbackOptions.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.option,
                    selectedFeeling === option.value && {
                      borderColor: option.color,
                      borderWidth: 2,
                      backgroundColor: `${option.color}15`,
                    },
                  ]}
                  onPress={() => setSelectedFeeling(option.value as WorkoutFeedback['feeling'])}
                >
                  <Text style={styles.emoji}>{option.emoji}</Text>
                  <Text
                    style={[
                      styles.optionLabel,
                      selectedFeeling === option.value && { color: option.color, fontWeight: '700' },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Optional Note */}
            <View style={styles.noteContainer}>
              <Text style={styles.noteLabel}>
                Anything to note? <Text style={styles.optional}>(optional)</Text>
              </Text>
              <TextInput
                style={styles.noteInput}
                placeholder="e.g., 'structure fire last night' or 'felt strong today'"
                placeholderTextColor="#666"
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
              <Text style={styles.charCount}>{note.length}/200</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <Pressable
                style={[
                  styles.button,
                  styles.submitButton,
                  !selectedFeeling && styles.buttonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!selectedFeeling}
              >
                <Text style={styles.buttonText}>Submit Feedback</Text>
              </Pressable>

              <Pressable style={[styles.button, styles.skipButton]} onPress={handleSkip}>
                <Text style={styles.skipButtonText}>Skip</Text>
              </Pressable>
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 16,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  emoji: {
    fontSize: 28,
    marginRight: 16,
  },
  optionLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  noteContainer: {
    marginBottom: 24,
  },
  noteLabel: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
    fontWeight: '600',
  },
  optional: {
    color: '#999',
    fontWeight: '400',
    fontSize: 13,
  },
  noteInput: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  actions: {
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#d32f2f',
  },
  buttonDisabled: {
    backgroundColor: '#444',
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
  },
  skipButtonText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
  },
});
