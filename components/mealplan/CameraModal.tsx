import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
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
      Toast.show({
        type: 'error',
        text1: 'No Photo',
        text2: 'Please take a photo first',
        position: 'bottom',
      });
      return;
    }

    setAnalyzing(true);

    try {
      // Simulate a brief "processing" period for good UX
      await new Promise(resolve => setTimeout(resolve, 1500));

      // ✅ Show success toast instead of Alert
      Toast.show({
        type: 'success',
        text1: '📸 Photo Captured!',
        text2: 'Ready to describe your meal for accurate nutrition data',
        position: 'bottom',
        visibilityTime: 3000,
      });

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
            photoUri: imageUri, // 🔥 Pass photo to be saved with meal
            confidence: 1, // Default confidence value
          });
        }
      }, 300);

    } catch (error) {
      console.error('❌ Processing failed:', error);

      // ✅ Show error toast instead of Alert
      Toast.show({
        type: 'error',
        text1: 'Processing Failed',
        text2: 'Let\'s describe your food instead',
        position: 'bottom',
      });

      // Still proceed to describe modal
      onClose();
      setTimeout(() => {
        if (onMealLogged) {
          onMealLogged({
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            source: 'OPEN_DESCRIBE_MODAL',
            photoUri: imageUri, // 🔥 Pass photo to be saved with meal
            confidence: 1, // Default confidence value
          });
        }
      }, 300);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRetakePhoto = () => {
    Toast.show({
      type: 'info',
      text1: 'Photo Discarded',
      text2: 'Take a new photo when ready',
      position: 'bottom',
    });
    onClose();
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
                <View style={styles.imageOverlay}>
                  <Ionicons name="checkmark-circle" size={32} color="#4FC3F7" />
                </View>
              </View>
            )}

            {/* Action Buttons */}
            {!analyzing && (
              <View style={styles.actionButtonsContainer}>
                <Pressable style={styles.continueButton} onPress={handleContinueWithPhoto}>
                  <Ionicons name="arrow-forward" size={20} color="#000" />
                  <Text style={styles.continueButtonText}>Continue with This Photo</Text>
                </Pressable>

                <Pressable style={styles.retakeButton} onPress={handleRetakePhoto}>
                  <Ionicons name="camera" size={18} color="#4FC3F7" />
                  <Text style={styles.retakeButtonText}>Take New Photo</Text>
                </Pressable>
              </View>
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

            {/* Quality Tips */}
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>📋 Photo Tips for Best Results:</Text>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>Capture the entire meal in good lighting</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>Include reference objects (utensils, plate size)</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>Avoid shadows and reflections</Text>
              </View>
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
    maxHeight: '85%',
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
    position: 'relative',
  },
  mealImage: {
    width: 280,
    height: 220,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    padding: 6,
  },
  actionButtonsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  continueButton: {
    backgroundColor: '#4FC3F7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  retakeButton: {
    backgroundColor: '#333',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4FC3F7',
  },
  retakeButtonText: {
    color: '#4FC3F7',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 6,
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
    marginBottom: 16,
  },
  infoText: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  tipsContainer: {
    backgroundColor: '#1e3a4a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#4FC3F7',
  },
  tipsTitle: {
    color: '#4FC3F7',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipBullet: {
    color: '#4FC3F7',
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    color: '#aaa',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});
