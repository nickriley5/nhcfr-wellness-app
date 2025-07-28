import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { format } from 'date-fns';

interface MealType {
  id: string;
  label: string;
  emoji: string;
  defaultTime: string;
}

interface LoggingMethod {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  primary?: boolean;
}

// Enhanced meal context interface
export interface MealContext {
  mealType: MealType | null;
  date: string;
  time: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onOpenDescribeModal: (mealContext: MealContext) => void;
  onOpenQuickAdd: (mealContext: MealContext) => void;
  onOpenBarcodeScanner: (mealContext: MealContext) => void;
}

const MealLoggingModal: React.FC<Props> = ({
  visible,
  onClose,
  onOpenDescribeModal,
  onOpenQuickAdd,
  onOpenBarcodeScanner,
}) => {
  const [currentStep, setCurrentStep] = useState<'mealType' | 'datetime' | 'method'>('mealType');
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState(format(new Date(), 'HH:mm'));

  const mealTypes: MealType[] = [
    { id: 'breakfast', label: 'Breakfast', emoji: '🍳', defaultTime: '07:00' },
    { id: 'snack1', label: 'Morning Snack', emoji: '🍎', defaultTime: '10:00' },
    { id: 'lunch', label: 'Lunch', emoji: '🥗', defaultTime: '12:30' },
    { id: 'snack2', label: 'Afternoon Snack', emoji: '🥜', defaultTime: '15:00' },
    { id: 'dinner', label: 'Dinner', emoji: '🍽️', defaultTime: '18:30' },
    { id: 'dessert', label: 'Dessert', emoji: '🍰', defaultTime: '20:00' },
  ];

  const methods: LoggingMethod[] = [
    {
      id: 'photo-describe',
      title: 'Photo + Describe',
      subtitle: '96% accuracy with smart nutrition analysis',
      icon: 'camera',
      primary: true,
    },
    {
      id: 'quick-add',
      title: 'Quick Add',
      subtitle: 'Instant logging from favorites & recent meals',
      icon: 'flash',
    },
    {
      id: 'barcode-scan',
      title: 'Scan Barcode',
      subtitle: 'Perfect for packaged foods with precise portions',
      icon: 'barcode',
    },
  ];

  const handleMealTypeSelect = (mealType: MealType) => {
    console.log('🍽️ Selected meal type:', mealType.label);
    setSelectedMealType(mealType);
    setSelectedTime(mealType.defaultTime);
    setCurrentStep('datetime');
  };

  const handleMethodSelect = (methodId: string) => {
    console.log('⚡ Selected method:', methodId);
    // Create meal context to pass to the next modal
    const mealContext: MealContext = {
      mealType: selectedMealType,
      date: selectedDate,
      time: selectedTime,
    };

    // Close this modal first
    onClose();

    // Small delay to ensure smooth transition
    setTimeout(() => {
      switch (methodId) {
        case 'photo-describe':
          onOpenDescribeModal(mealContext);
          break;
        case 'quick-add':
          onOpenQuickAdd(mealContext);
          break;
        case 'barcode-scan':
          onOpenBarcodeScanner(mealContext);
          break;
      }
    }, 300);
  };

  const resetModal = () => {
    setCurrentStep('mealType');
    setSelectedMealType(null);
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    setSelectedTime(format(new Date(), 'HH:mm'));
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // ✅ DEBUG: Simplified step rendering
  const renderCurrentStep = () => {
    console.log('🔍 Rendering step:', currentStep);

    if (currentStep === 'mealType') {
      return (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>🔍 DEBUG: MEAL TYPE STEP</Text>
          <Text style={styles.stepTitle}>What type of meal?</Text>
          <Text style={styles.stepSubtitle}>Choose the meal category</Text>

          {mealTypes.map((meal) => (
            <Pressable
              key={meal.id}
              style={styles.debugMealCard}
              onPress={() => handleMealTypeSelect(meal)}
            >
              <Text style={styles.debugMealText}>
                {meal.emoji} {meal.label} - {meal.defaultTime}
              </Text>
            </Pressable>
          ))}
        </View>
      );
    }

    if (currentStep === 'datetime') {
      return (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>🔍 DEBUG: DATE/TIME STEP</Text>
          <Text style={styles.stepTitle}>When did you eat?</Text>
          <Text style={styles.stepSubtitle}>Selected: {selectedDate} at {selectedTime}</Text>

          <Pressable
            style={styles.debugButton}
            onPress={() => setCurrentStep('method')}
          >
            <Text style={styles.debugButtonText}>Continue to Methods</Text>
          </Pressable>
        </View>
      );
    }

    if (currentStep === 'method') {
      return (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>🔍 DEBUG: METHOD STEP</Text>
          <Text style={styles.stepTitle}>How do you want to log this?</Text>

          {methods.map((method) => (
            <Pressable
              key={method.id}
              style={styles.debugMethodCard}
              onPress={() => handleMethodSelect(method.id)}
            >
              <Text style={styles.debugMealText}>
                {method.title} - {method.subtitle}
              </Text>
            </Pressable>
          ))}
        </View>
      );
    }

    return (
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>❌ ERROR: Unknown step: {currentStep}</Text>
      </View>
    );
  };

  const getStepProgress = () => {
    const steps = ['mealType', 'datetime', 'method'];
    return steps.indexOf(currentStep) + 1;
  };

  console.log('🎯 Modal rendering. Visible:', visible, 'Step:', currentStep);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.modalTitle}>Log Food - DEBUG MODE</Text>
            <Pressable onPress={handleClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </Pressable>
          </View>

          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <Text style={styles.debugText}>Step: {currentStep} ({getStepProgress()}/3)</Text>
            {[1, 2, 3].map((step) => (
              <View
                key={step}
                style={[
                  styles.progressDot,
                  getStepProgress() >= step && styles.progressDotActive,
                ]}
              />
            ))}
          </View>

          {/* ✅ SIMPLIFIED: Direct content rendering */}
          <View style={styles.contentContainer}>
            {renderCurrentStep()}
          </View>

          {/* Back button for steps 2 and 3 */}
          {currentStep !== 'mealType' && (
            <Pressable
              style={styles.backButton}
              onPress={() => {
                console.log('⬅️ Going back from:', currentStep);
                setCurrentStep(currentStep === 'datetime' ? 'mealType' : 'datetime');
              }}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default MealLoggingModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '95%',
    height: '80%', // ✅ FIXED: Set explicit height
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#444',
  },
  progressDotActive: {
    backgroundColor: '#4FC3F7',
  },
  // ✅ SIMPLIFIED: Basic content container
  contentContainer: {
    flex: 1,
    backgroundColor: '#2a2a2a', // ✅ DEBUG: Visible background
    borderRadius: 8,
    padding: 16,
  },
  // ✅ DEBUG: Visible styles for debugging
  debugContainer: {
    flex: 1,
    backgroundColor: '#333', // Dark gray background
    borderRadius: 8,
    padding: 16,
  },
  debugTitle: {
    color: '#4FC3F7',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  debugText: {
    color: '#4FC3F7',
    fontSize: 12,
    marginRight: 8,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 24,
  },
  debugMealCard: {
    backgroundColor: '#4FC3F7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  debugMealText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  debugMethodCard: {
    backgroundColor: '#81C784',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  debugButton: {
    backgroundColor: '#F44336',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#333',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
