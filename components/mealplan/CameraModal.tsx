import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { MealMacroResult } from '../../utils/nutritionService';

interface CameraModalProps {
  visible: boolean;
  onClose: () => void;
  imageUri: string | null;
  onMealLogged?: (meal: MealMacroResult) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({
  visible,
  onClose,
  imageUri,
  onMealLogged,
}) => {
  const [analyzing, setAnalyzing] = useState(false);

  // 🎯 Process the photo and guide user to describe their food
  const handleContinueWithPhoto = async () => {
    if (!imageUri) {
      return;
    }

    setAnalyzing(true);

    try {
      // Simulate a brief "processing" period for good UX
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert(
        '📸 Photo Captured!',
        'To get the most accurate nutrition data, please describe what you see in this photo. For example: "half pint halo top vanilla ice cream"',
        [
          {
            text: '✏️ Describe This Food',
            onPress: () => {
              // Close this modal and open describe modal
              onClose();
              setTimeout(() => {
                if (onMealLogged) {
                  onMealLogged({
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fat: 0,
                    source: 'OPEN_DESCRIBE_MODAL',
                    photoUri: imageUri, // 🔥 NEW: Pass photo to be saved with meal
                  });
                }
              }, 300);
            },
          },
          {
            text: '📸 Take New Photo',
            onPress: () => {
              setAnalyzing(false);
              // Stay in modal to take new photo
            },
            style: 'cancel',
          },
        ]
      );

    } catch (error) {
      console.error('❌ Processing failed:', error);
      Alert.alert(
        "Let's Describe Your Food",
        "For the most accurate nutrition data, please describe what's in your photo.",
        [
          {
            text: '✏️ Describe Food',
            onPress: () => {
              onClose();
              setTimeout(() => {
                if (onMealLogged) {
                  onMealLogged({
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fat: 0,
                    source: 'OPEN_DESCRIBE_MODAL',
                    photoUri: imageUri, // 🔥 NEW: Pass photo to be saved with meal
                  });
                }
              }, 300);
            },
          },
        ]
      );
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.headerRow}>
              <Text style={styles.modalTitle}>📸 Your Meal Photo</Text>
              <Pressable onPress={onClose}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>

            {/* Image Preview */}
            {imageUri && (
              <View style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.mealImage} />
              </View>
            )}

            {/* Continue Button */}
            {!analyzing && (
              <Pressable style={styles.continueButton} onPress={handleContinueWithPhoto}>
                <Text style={styles.continueButtonText}>🔍 Continue with This Photo</Text>
              </Pressable>
            )}

            {/* Loading State */}
            {analyzing && (
              <View style={styles.analyzingContainer}>
                <ActivityIndicator size="large" color="#4FC3F7" />
                <Text style={styles.analyzingText}>Processing your photo...</Text>
                <Text style={styles.analyzingSubtext}>Preparing to help you log this meal</Text>
              </View>
            )}

            {/* Info Text */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                💡 After continuing, you'll be able to describe your food for the most accurate nutrition tracking
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default CameraModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '95%',
    maxHeight: '80%',
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
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mealImage: {
    width: 280,
    height: 220,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  continueButton: {
    backgroundColor: '#4FC3F7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  continueButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },
  analyzingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  analyzingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  analyzingSubtext: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoText: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
