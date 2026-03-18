/**
 * Periodized Program Generator Modal
 * Allows users to create complete multi-week training programs with AI
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { generatePeriodizedProgram, PeriodizedProgram } from '../../utils/ai/aiService';
import { getCuratedExerciseList } from '../../utils/exerciseMatching';
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

type TrainingAccess = 'bodyweight' | 'weighted' | 'mixed';

const WEIGHTED_EQUIPMENT = ['dumbbells', 'kettlebells', 'barbell', 'pullup bar', 'full gym'];

const getInitialTrainingAccess = (equipment: string[] = []): TrainingAccess => {
  const normalized = equipment.map(item => item.toLowerCase());
  const hasBodyweight = normalized.includes('bodyweight');
  const hasWeighted = normalized.some(item => WEIGHTED_EQUIPMENT.includes(item));

  if (hasBodyweight && hasWeighted) return 'mixed';
  if (hasWeighted) return 'weighted';
  return 'bodyweight';
};

const getEquipmentFromAccess = (trainingAccess: TrainingAccess): string[] => {
  switch (trainingAccess) {
    case 'weighted':
      return WEIGHTED_EQUIPMENT;
    case 'mixed':
      return ['bodyweight', ...WEIGHTED_EQUIPMENT];
    case 'bodyweight':
    default:
      return ['bodyweight'];
  }
};

const getAutoPeriodizationModel = (
  goal: string,
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced'
): 'linear' | 'undulating' | 'block' => {
  if (goal === 'Improve VO2 Max') return 'block';
  if (fitnessLevel === 'advanced') return 'undulating';
  return 'linear';
};

const PeriodizedProgramModal: React.FC<Props> = ({
  visible,
  onClose,
  onProgramGenerated,
  userProfile,
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'setup' | 'generating' | 'preview'>('setup');
  const [generatedProgram, setGeneratedProgram] = useState<PeriodizedProgram | null>(null);
  const [progressPhase, setProgressPhase] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // Form state
  const [goal, setGoal] = useState(userProfile?.goals?.[0] || 'Build Strength');
  const [fitnessLevel, setFitnessLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(
    (userProfile?.experience?.toLowerCase() as 'beginner' | 'intermediate' | 'advanced') || 'intermediate'
  );
  const [trainingAccess, setTrainingAccess] = useState<TrainingAccess>(
    getInitialTrainingAccess(userProfile?.equipment || [])
  );
  const [daysPerWeek, setDaysPerWeek] = useState('4');
  const [includeCardio, setIncludeCardio] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setStep('generating');

    try {
      const selectedEquipment = getEquipmentFromAccess(trainingAccess);
      const periodizationModel = getAutoPeriodizationModel(goal, fitnessLevel);

      // Use curated exercise list filtered by user's equipment
      const curatedExercises = getCuratedExerciseList(selectedEquipment);
      
      // Map to expected format
      const availableExercises = curatedExercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        equipment: ex.equipment || '',
        focusArea: ex.focusArea || '',
      }));

      console.log(`📋 Using ${availableExercises.length} curated exercises for AI`);
      console.log('🏃 Include Cardio:', includeCardio);

      const program = await generatePeriodizedProgram(
        {
          goal,
          experience: fitnessLevel,
          equipment: selectedEquipment,
          totalWeeks: 4,
          daysPerWeek: parseInt(daysPerWeek),
          periodizationModel,
          availableExercises,
          includeCardio,
          allowTwoADays: false,
        },
        (phase, percent) => {
          setProgressPhase(phase);
          setProgressPercent(percent);
        }
      );

      setGeneratedProgram(program);
      setStep('preview');
    } catch (error: any) {
      console.error('Error generating program:', error);
      
      // Extract user-friendly error message
      let errorMsg = 'Unknown error occurred';
      
      if (error?.message) {
        errorMsg = error.message;
      } else if (error?.response?.data?.error?.message) {
        errorMsg = error.response.data.error.message;
      } else if (error?.response?.status === 503) {
        errorMsg = '🚫 AI service temporarily unavailable. Please try again in a few minutes.';
      } else if (error?.response?.status === 429) {
        errorMsg = '⏱️ Too many requests. Please wait a moment and try again.';
      }
      
      Toast.show({
        type: 'error',
        text1: 'Generation Failed',
        text2: errorMsg.substring(0, 150),
        visibilityTime: 5000,
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
        isArchived: false, // Not archived initially
      });

      Toast.show({
        type: 'success',
        text1: 'Program Saved!',
        text2: `${generatedProgram.programName} is ready to use`,
      });

      onProgramGenerated?.(programRef.id);
      onClose();
    } catch (error) {
      // console.error('Error saving program:', error);
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

  useEffect(() => {
    if (visible) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [visible]);

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

          <ScrollView
            ref={scrollRef}
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* SETUP STEP */}
            {step === 'setup' && (
              <View style={styles.setupContainer}>
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

                {/* Fitness Level */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Fitness Level</Text>
                  <View style={styles.fitnessLevelButtons}>
                    <Pressable
                      style={[
                        styles.fitnessLevelButton,
                        fitnessLevel === 'beginner' && styles.fitnessLevelButtonActive,
                      ]}
                      onPress={() => setFitnessLevel('beginner')}
                    >
                      <Text
                        style={[
                          styles.fitnessLevelButtonText,
                          fitnessLevel === 'beginner' && styles.fitnessLevelButtonTextActive,
                        ]}
                      >
                        Beginner
                      </Text>
                      <Text
                        style={[
                          styles.fitnessLevelSubtext,
                          fitnessLevel === 'beginner' && styles.fitnessLevelSubtextActive,
                        ]}
                      >
                        {'< 6 months'}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.fitnessLevelButton,
                        fitnessLevel === 'intermediate' && styles.fitnessLevelButtonActive,
                      ]}
                      onPress={() => setFitnessLevel('intermediate')}
                    >
                      <Text
                        style={[
                          styles.fitnessLevelButtonText,
                          fitnessLevel === 'intermediate' && styles.fitnessLevelButtonTextActive,
                        ]}
                      >
                        Intermediate
                      </Text>
                      <Text
                        style={[
                          styles.fitnessLevelSubtext,
                          fitnessLevel === 'intermediate' && styles.fitnessLevelSubtextActive,
                        ]}
                      >
                        6 mo - 2 yrs
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.fitnessLevelButton,
                        fitnessLevel === 'advanced' && styles.fitnessLevelButtonActive,
                      ]}
                      onPress={() => setFitnessLevel('advanced')}
                    >
                      <Text
                        style={[
                          styles.fitnessLevelButtonText,
                          fitnessLevel === 'advanced' && styles.fitnessLevelButtonTextActive,
                        ]}
                      >
                        Advanced
                      </Text>
                      <Text
                        style={[
                          styles.fitnessLevelSubtext,
                          fitnessLevel === 'advanced' && styles.fitnessLevelSubtextActive,
                        ]}
                      >
                        2+ years
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Equipment Selection */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Training Access</Text>
                  <Text style={styles.helperText}>Pick what you have right now</Text>
                  <View style={styles.accessButtons}>
                    {[
                      { id: 'bodyweight', label: 'Bodyweight Only' },
                      { id: 'weighted', label: 'Weighted Equipment' },
                      { id: 'mixed', label: 'Both / Adaptable' },
                    ].map(option => (
                      <Pressable
                        key={option.id}
                        style={[
                          styles.accessButton,
                          trainingAccess === option.id && styles.accessButtonActive,
                        ]}
                        onPress={() => setTrainingAccess(option.id as TrainingAccess)}
                      >
                        <Text
                          style={[
                            styles.accessButtonText,
                            trainingAccess === option.id && styles.accessButtonTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={styles.helperText}>
                    You can still swap exercises later with Adapt if your equipment changes mid-shift.
                  </Text>
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

                {/* Cardio Days Toggle */}
                <View style={styles.inputGroup}>
                  <View style={styles.toggleRow}>
                    <View style={styles.toggleLeft}>
                      <Text style={styles.toggleLabel}>Include Cardio Days</Text>
                      <Text style={styles.toggleSubtext}>
                        Add dedicated cardio/conditioning sessions
                      </Text>
                    </View>
                    <Switch
                      value={includeCardio}
                      onValueChange={setIncludeCardio}
                      trackColor={{ false: '#333', true: '#FF3C38' }}
                      thumbColor={includeCardio ? '#fff' : '#aaa'}
                      ios_backgroundColor="#333"
                    />
                  </View>
                </View>

                {/* Info Card */}
                <View style={styles.infoCard}>
                  <Ionicons name="information-circle" size={24} color="#FF3C38" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoTitle}>What is Periodization?</Text>
                    <Text style={styles.infoText}>
                      We auto-select progression style based on your goal and level. Programs are
                      generated in focused 4-week blocks to keep quality and progression tight.
                    </Text>
                  </View>
                </View>

              </View>
            )}

            {/* GENERATING STEP */}
            {step === 'generating' && (
              <View style={styles.generatingContainer}>
                <ActivityIndicator size="large" color="#FF3C38" />
                <Text style={styles.generatingTitle}>Creating Your First 4 Weeks...</Text>
                
                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                </View>
                
                {/* Progress Phase Text */}
                <Text style={styles.progressPhaseText}>{progressPhase || 'Initializing...'}</Text>
                
                <Text style={styles.generatingSubtext}>
                  We'll generate the next block when you complete these weeks
                </Text>
                <Text style={styles.generatingHint}>
                  AI generation can take 45-90 seconds. Please keep this screen open.
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
                  <Text style={styles.cardTitle}>📅 Week 1 Overview</Text>
                  {generatedProgram.weeks[0]?.days.map((day, idx) => (
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
                
                {/* Bottom spacing for safe area */}
                <View style={{ height: 40 }} />
              </View>
            )}
          </ScrollView>

          {step === 'setup' && (
            <View style={styles.footer}>
              <Pressable style={styles.generateButton} onPress={handleGenerate}>
                <Ionicons name="flash" size={20} color="#fff" />
                <Text style={styles.generateButtonText}>Generate Program</Text>
              </Pressable>
            </View>
          )}

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
    height: '90%',
    position: 'relative',
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
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  setupContainer: {
    paddingBottom: 24,
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
  helperText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    marginTop: -4,
  },
  fitnessLevelButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  fitnessLevelButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#222',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  fitnessLevelButtonActive: {
    backgroundColor: '#FF3C38',
    borderColor: '#FF3C38',
  },
  fitnessLevelButtonText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  fitnessLevelButtonTextActive: {
    color: '#fff',
  },
  fitnessLevelSubtext: {
    color: '#666',
    fontSize: 11,
  },
  fitnessLevelSubtextActive: {
    color: '#fff',
  },
  accessButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  accessButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#222',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  accessButtonActive: {
    backgroundColor: '#FF3C38',
    borderColor: '#FF3C38',
  },
  accessButtonText: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '600',
  },
  accessButtonTextActive: {
    color: '#fff',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  toggleLeft: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  toggleSubtext: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
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
  generatingHint: {
    fontSize: 12,
    color: '#7f8790',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 28,
  },
  progressBarContainer: {
    width: '80%',
    height: 8,
    backgroundColor: '#222',
    borderRadius: 4,
    marginTop: 24,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF3C38',
    borderRadius: 4,
  },
  progressPhaseText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF3C38',
    marginBottom: 12,
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
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#1a1a1a',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default PeriodizedProgramModal;
