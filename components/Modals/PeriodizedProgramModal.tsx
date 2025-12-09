/**
 * Periodized Program Generator Modal
 * Allows users to create complete multi-week training programs with AI
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { generatePeriodizedProgram, PeriodizedProgram } from '../../utils/ai/aiService';
import { auth, db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import Toast from 'react-native-toast-message';

interface Props {
  visible: boolean;
  onClose: () => void;
  onProgramGenerated?: (programId: string) => void;
  userProfile?: {
    goals?: string[];
    experience?: string;
    equipment?: string[];
  };
}

const PeriodizedProgramModal: React.FC<Props> = ({
  visible,
  onClose,
  onProgramGenerated,
  userProfile,
}) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'setup' | 'generating' | 'preview'>('setup');
  const [generatedProgram, setGeneratedProgram] = useState<PeriodizedProgram | null>(null);

  // Form state
  const [goal, setGoal] = useState(userProfile?.goals?.[0] || 'Build Strength');
  const [totalWeeks, setTotalWeeks] = useState('12');
  const [daysPerWeek, setDaysPerWeek] = useState('4');
  const [periodizationModel, setPeriodizationModel] = useState<'linear' | 'undulating' | 'block'>(
    'linear'
  );

  const handleGenerate = async () => {
    setLoading(true);
    setStep('generating');

    try {
      // Import exercise library
      const { exercises } = await import('../../data/exercises');

      // Filter exercises based on available equipment
      const userEquipment = (userProfile?.equipment || ['dumbbells', 'bodyweight']).map(e =>
        e.toLowerCase()
      );
      const availableExercises = exercises
        .filter(ex => {
          const exerciseEquipment = (ex.equipment || '').toLowerCase();
          const hasEquipment =
            exerciseEquipment === 'bodyweight' ||
            exerciseEquipment === '' ||
            userEquipment.some((eq: string) => exerciseEquipment.includes(eq.toLowerCase()));
          const hasVideo = ex.videoUrl && ex.videoUrl.trim() !== '';
          return hasEquipment && hasVideo;
        })
        .map(ex => ({
          id: ex.id,
          name: ex.name,
          equipment: ex.equipment || '',
          focusArea: ex.focusArea || '',
        }));

      console.log(`📚 Using ${availableExercises.length} exercises for program generation`);

      const program = await generatePeriodizedProgram({
        goal,
        experience: userProfile?.experience || 'intermediate',
        equipment: userProfile?.equipment || ['dumbbells', 'bodyweight'],
        totalWeeks: parseInt(totalWeeks),
        daysPerWeek: parseInt(daysPerWeek),
        periodizationModel,
        availableExercises,
      });

      setGeneratedProgram(program);
      setStep('preview');
    } catch (error) {
      console.error('Error generating program:', error);
      Toast.show({
        type: 'error',
        text1: 'Generation Failed',
        text2: 'Please try again with different settings',
      });
      setStep('setup');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProgram = async () => {
    if (!generatedProgram) return;

    const uid = auth.currentUser?.uid;
    if (!uid) {
      Toast.show({ type: 'error', text1: 'Not authenticated' });
      return;
    }

    setLoading(true);
    try {
      // Save to aiPrograms collection
      const programRef = await addDoc(collection(db, 'users', uid, 'aiPrograms'), {
        ...generatedProgram,
        createdAt: new Date().toISOString(),
        isActive: false, // User can activate it later
      });

      Toast.show({
        type: 'success',
        text1: 'Program Saved!',
        text2: `${generatedProgram.programName} is ready to use`,
      });

      onProgramGenerated?.(programRef.id);
      onClose();
    } catch (error) {
      console.error('Error saving program:', error);
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep('setup');
    setGeneratedProgram(null);
    setLoading(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>🎯 Generate Training Program</Text>
            <Pressable
              onPress={() => {
                resetModal();
                onClose();
              }}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>

          <ScrollView style={styles.content}>
            {/* SETUP STEP */}
            {step === 'setup' && (
              <View>
                <Text style={styles.sectionTitle}>Program Details</Text>

                {/* Goal Selection */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Primary Goal</Text>
                  <View style={styles.goalButtons}>
                    {['Build Strength', 'Improve VO2 Max', 'Build Muscle', 'Fat Loss'].map(g => (
                      <Pressable
                        key={g}
                        style={[styles.goalButton, goal === g && styles.goalButtonActive]}
                        onPress={() => setGoal(g)}
                      >
                        <Text style={[styles.goalButtonText, goal === g && styles.goalButtonTextActive]}>
                          {g}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Duration */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Program Duration (weeks)</Text>
                  <View style={styles.numberButtons}>
                    {['8', '12', '16'].map(w => (
                      <Pressable
                        key={w}
                        style={[styles.numberButton, totalWeeks === w && styles.numberButtonActive]}
                        onPress={() => setTotalWeeks(w)}
                      >
                        <Text
                          style={[
                            styles.numberButtonText,
                            totalWeeks === w && styles.numberButtonTextActive,
                          ]}
                        >
                          {w}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Days per Week */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Training Days per Week</Text>
                  <View style={styles.numberButtons}>
                    {['3', '4', '5', '6'].map(d => (
                      <Pressable
                        key={d}
                        style={[styles.numberButton, daysPerWeek === d && styles.numberButtonActive]}
                        onPress={() => setDaysPerWeek(d)}
                      >
                        <Text
                          style={[
                            styles.numberButtonText,
                            daysPerWeek === d && styles.numberButtonTextActive,
                          ]}
                        >
                          {d}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Periodization Model */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Periodization Model</Text>
                  <View style={styles.periodizationButtons}>
                    <Pressable
                      style={[
                        styles.periodizationButton,
                        periodizationModel === 'linear' && styles.periodizationButtonActive,
                      ]}
                      onPress={() => setPeriodizationModel('linear')}
                    >
                      <Text
                        style={[
                          styles.periodizationButtonText,
                          periodizationModel === 'linear' && styles.periodizationButtonTextActive,
                        ]}
                      >
                        📈 Linear
                      </Text>
                      <Text style={styles.periodizationSubtext}>Best for Strength</Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.periodizationButton,
                        periodizationModel === 'undulating' && styles.periodizationButtonActive,
                      ]}
                      onPress={() => setPeriodizationModel('undulating')}
                    >
                      <Text
                        style={[
                          styles.periodizationButtonText,
                          periodizationModel === 'undulating' && styles.periodizationButtonTextActive,
                        ]}
                      >
                        🔄 Undulating
                      </Text>
                      <Text style={styles.periodizationSubtext}>Best for Muscle</Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.periodizationButton,
                        periodizationModel === 'block' && styles.periodizationButtonActive,
                      ]}
                      onPress={() => setPeriodizationModel('block')}
                    >
                      <Text
                        style={[
                          styles.periodizationButtonText,
                          periodizationModel === 'block' && styles.periodizationButtonTextActive,
                        ]}
                      >
                        🎯 Block
                      </Text>
                      <Text style={styles.periodizationSubtext}>Best for Endurance</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Info Card */}
                <View style={styles.infoCard}>
                  <Ionicons name="information-circle" size={24} color="#FF3C38" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoTitle}>What is Periodization?</Text>
                    <Text style={styles.infoText}>
                      A structured approach to training that cycles through different phases to maximize
                      results and prevent plateaus. Includes built-in deload weeks for recovery.
                    </Text>
                  </View>
                </View>

                <Pressable style={styles.generateButton} onPress={handleGenerate}>
                  <Ionicons name="flash" size={20} color="#fff" />
                  <Text style={styles.generateButtonText}>Generate Program</Text>
                </Pressable>
              </View>
            )}

            {/* GENERATING STEP */}
            {step === 'generating' && (
              <View style={styles.generatingContainer}>
                <ActivityIndicator size="large" color="#FF3C38" />
                <Text style={styles.generatingTitle}>Creating Your Program...</Text>
                <Text style={styles.generatingSubtext}>
                  This may take 30-60 seconds as we build your complete {totalWeeks}-week program
                </Text>
              </View>
            )}

            {/* PREVIEW STEP */}
            {step === 'preview' && generatedProgram && (
              <View>
                <View style={styles.programHeader}>
                  <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
                  <Text style={styles.programTitle}>{generatedProgram.programName}</Text>
                  <Text style={styles.programSubtitle}>
                    {generatedProgram.totalWeeks} weeks • {generatedProgram.periodizationModel}{' '}
                    periodization
                  </Text>
                </View>

                {/* Phases Overview */}
                <View style={styles.phasesCard}>
                  <Text style={styles.cardTitle}>📊 Program Phases</Text>
                  {generatedProgram.phases.map((phase, idx) => (
                    <View key={idx} style={styles.phaseItem}>
                      <View style={styles.phaseHeader}>
                        <Text style={styles.phaseName}>{phase.phaseName}</Text>
                        <Text style={styles.phaseWeeks}>Weeks {phase.weekRange}</Text>
                      </View>
                      <Text style={styles.phaseFocus}>{phase.focus}</Text>
                      <Text style={styles.phaseDescription}>{phase.description}</Text>
                    </View>
                  ))}
                </View>

                {/* Sample Week */}
                <View style={styles.sampleCard}>
                  <Text style={styles.cardTitle}>📅 Week 1 Sample</Text>
                  {generatedProgram.weeks[0]?.days.slice(0, 2).map((day, idx) => (
                    <View key={idx} style={styles.dayPreview}>
                      <Text style={styles.dayName}>
                        Day {day.dayNumber}: {day.dayName}
                      </Text>
                      <Text style={styles.dayFocus}>{day.focus}</Text>
                      <Text style={styles.exerciseCount}>
                        {day.exercises.length} exercises • {day.estimatedDuration} min
                      </Text>
                    </View>
                  ))}
                  <Text style={styles.moreText}>+ {generatedProgram.weeks[0].days.length - 2} more days</Text>
                </View>

                {/* Progression Plan */}
                <View style={styles.progressionCard}>
                  <Text style={styles.cardTitle}>📈 Progression Strategy</Text>
                  <Text style={styles.progressionText}>{generatedProgram.progressionPlan}</Text>
                </View>

                <View style={styles.buttonRow}>
                  <Pressable
                    style={styles.backButton}
                    onPress={() => {
                      setStep('setup');
                      setGeneratedProgram(null);
                    }}
                  >
                    <Text style={styles.backButtonText}>Edit Settings</Text>
                  </Pressable>

                  <Pressable
                    style={styles.saveButton}
                    onPress={handleSaveProgram}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="save" size={20} color="#fff" />
                        <Text style={styles.saveButtonText}>Save Program</Text>
                      </>
                    )}
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
  overlay: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#aaa',
    marginBottom: 8,
  },
  goalButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#222',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  goalButtonActive: {
    backgroundColor: '#FF3C38',
    borderColor: '#FF3C38',
  },
  goalButtonText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '500',
  },
  goalButtonTextActive: {
    color: '#fff',
  },
  numberButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  numberButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#222',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  numberButtonActive: {
    backgroundColor: '#FF3C38',
    borderColor: '#FF3C38',
  },
  numberButtonText: {
    color: '#aaa',
    fontSize: 16,
    fontWeight: '600',
  },
  numberButtonTextActive: {
    color: '#fff',
  },
  periodizationButtons: {
    gap: 8,
  },
  periodizationButton: {
    padding: 16,
    backgroundColor: '#222',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  periodizationButtonActive: {
    backgroundColor: '#FF3C38',
    borderColor: '#FF3C38',
  },
  periodizationButtonText: {
    color: '#aaa',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  periodizationButtonTextActive: {
    color: '#fff',
  },
  periodizationSubtext: {
    color: '#666',
    fontSize: 12,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#aaa',
    lineHeight: 18,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3C38',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  generatingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  generatingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 20,
    marginBottom: 8,
  },
  generatingSubtext: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  programHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  programTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
    textAlign: 'center',
  },
  programSubtitle: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 4,
  },
  phasesCard: {
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  phaseItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  phaseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3C38',
  },
  phaseWeeks: {
    fontSize: 14,
    color: '#aaa',
  },
  phaseFocus: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  phaseDescription: {
    fontSize: 12,
    color: '#aaa',
    lineHeight: 18,
  },
  sampleCard: {
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  dayPreview: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  dayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  dayFocus: {
    fontSize: 13,
    color: '#FF3C38',
    marginBottom: 4,
  },
  exerciseCount: {
    fontSize: 12,
    color: '#aaa',
  },
  moreText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  progressionCard: {
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  progressionText: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#333',
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PeriodizedProgramModal;
