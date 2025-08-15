import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { auth } from '../../firebase';
import { shouldPromptWeighIn, adjustMacroPlansIfNeeded } from '../../utils/adaptiveNutrition';

interface WeighInReminderProps {
  visible?: boolean;
  onClose?: () => void;
}

const WeighInReminder: React.FC<WeighInReminderProps> = ({ visible, onClose }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showReminder, setShowReminder] = useState(false);
  const [checkingAutoAdjust, setCheckingAutoAdjust] = useState(false);

  useEffect(() => {
    if (visible !== undefined) {
      setShowReminder(visible);
      return;
    }

    // Auto-check if we should show reminder
    checkWeighInReminder();
  }, [visible]);

  const checkWeighInReminder = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      return;
    }

    try {
      const shouldShow = await shouldPromptWeighIn(uid);
      setShowReminder(shouldShow);
    } catch (error) {
      console.error('Error checking weigh-in reminder:', error);
    }
  };

  const handleWeighInNow = () => {
    setShowReminder(false);
    onClose?.();
    navigation.navigate('WeighIn');
  };

  const handleRemindLater = () => {
    setShowReminder(false);
    onClose?.();
  };

  const handleAutoAdjustCheck = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      return;
    }

    try {
      setCheckingAutoAdjust(true);
      const adjusted = await adjustMacroPlansIfNeeded(uid);

      if (adjusted) {
        Alert.alert(
          'Nutrition Plan Updated! 🎯',
          'Your macro targets have been automatically adjusted based on your recent progress. Check your meal plan for the new targets.',
          [{ text: 'Got it!' }]
        );
      }
    } catch (error) {
      console.error('Error checking auto-adjust:', error);
    } finally {
      setCheckingAutoAdjust(false);
    }
  };

  if (!showReminder) {
    return null;
  }

  return (
    <Modal
      visible={showReminder}
      transparent
      animationType="fade"
      onRequestClose={handleRemindLater}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="scale" size={40} color="#33d6a6" />
          </View>

          <Text style={styles.title}>Weekly Check-In Time! ⚖️</Text>

          <Text style={styles.description}>
            It's been a week since your last weigh-in. Regular tracking helps us provide
            personalized nutrition guidance and adjust your plan as needed.
          </Text>

          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={16} color="#33d6a6" />
              <Text style={styles.benefitText}>Track progress toward your goals</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={16} color="#33d6a6" />
              <Text style={styles.benefitText}>Get personalized nutrition insights</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={16} color="#33d6a6" />
              <Text style={styles.benefitText}>Auto-adjust macro targets if needed</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Pressable
              style={styles.primaryButton}
              onPress={handleWeighInNow}
            >
              <Text style={styles.primaryButtonText}>Weigh In Now</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={handleRemindLater}
            >
              <Text style={styles.secondaryButtonText}>Remind Me Later</Text>
            </Pressable>
          </View>

          {/* Auto-adjust check button */}
          <Pressable
            style={styles.autoAdjustButton}
            onPress={handleAutoAdjustCheck}
            disabled={checkingAutoAdjust}
          >
            <Ionicons
              name="settings"
              size={16}
              color="#aaa"
              style={styles.autoAdjustIcon}
            />
            <Text style={styles.autoAdjustText}>
              {checkingAutoAdjust ? 'Checking for adjustments...' : 'Check for plan adjustments'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1f1f1f',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  benefitsList: {
    width: '100%',
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 15,
    color: '#fff',
    marginLeft: 8,
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#33d6a6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#0b0f14',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a3a52',
  },
  secondaryButtonText: {
    color: '#aaa',
    fontSize: 16,
    fontWeight: '600',
  },
  autoAdjustButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  autoAdjustIcon: {
    marginRight: 6,
  },
  autoAdjustText: {
    fontSize: 14,
    color: '#aaa',
  },
});

export default WeighInReminder;
