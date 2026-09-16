import React from 'react';
import { Dimensions, ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface Props {
  recommendation: 'train' | 'light' | 'rest';
  severity: 'none' | 'minor' | 'moderate' | 'severe';
  coachMessage: string;
  onTakeRestDay: () => void;
  onTrainAnyway: () => void;
  onDismiss: () => void;
}

export const CoachRecommendationBanner: React.FC<Props> = ({
  recommendation,
  severity: _severity,
  coachMessage,
  onTakeRestDay,
  onTrainAnyway,
  onDismiss,
}) => {
  // Color schemes based on recommendation
  const getColors = () => {
    if (recommendation === 'rest') {
      return {
        gradient: ['#d32f2f', '#c62828'],
        icon: 'bed-outline' as const,
        iconBg: '#b71c1c',
      };
    } else if (recommendation === 'light') {
      return {
        gradient: ['#f57c00', '#ef6c00'],
        icon: 'warning-outline' as const,
        iconBg: '#e65100',
      };
    }
    return {
      gradient: ['#388e3c', '#2e7d32'],
      icon: 'checkmark-circle-outline' as const,
      iconBg: '#1b5e20',
    };
  };

  const colors = getColors();
  const title =
    recommendation === 'rest'
      ? 'Rest Day Recommended'
      : recommendation === 'light'
        ? 'Light Training Advised'
        : 'Ready to Train';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.inner}>
          {/* Dismiss button */}
          <Pressable style={styles.dismissButton} onPress={onDismiss}>
            <Ionicons name="close-circle" size={24} color="rgba(255,255,255,0.8)" />
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.iconBg }]}>
              <Ionicons name={colors.icon} size={28} color="#fff" />
            </View>
            <Text style={styles.title} numberOfLines={2}>{title}</Text>
          </View>

          {/* Coach Message */}
          <ScrollView
            style={styles.messageScroll}
            contentContainerStyle={styles.messageContent}
            nestedScrollEnabled
            showsVerticalScrollIndicator
          >
            <Text style={styles.message}>{coachMessage}</Text>
          </ScrollView>

          {/* Action Buttons */}
          {recommendation === 'rest' && (
            <View style={styles.actions}>
              <Pressable
                style={[styles.button, styles.primaryButton]}
                onPress={onTakeRestDay}
              >
                <Ionicons name="bed" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Take Rest Day</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.secondaryButton]}
                onPress={onTrainAnyway}
              >
                <Ionicons name="fitness" size={20} color="#fff" />
                <Text style={styles.secondaryButtonText}>Train Anyway</Text>
              </Pressable>
            </View>
          )}

          {recommendation === 'light' && (
            <View style={styles.actions}>
              <Pressable
                style={[styles.button, styles.primaryButton]}
                onPress={onTrainAnyway} // Will show adjusted workout
              >
                <Ionicons name="fitness-outline" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>View Light Workout</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.secondaryButton]}
                onPress={onTakeRestDay}
              >
                <Ionicons name="bed-outline" size={20} color="#fff" />
                <Text style={styles.secondaryButtonText}>Rest Instead</Text>
              </Pressable>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = Math.min(screenWidth - 48, 540);

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    alignSelf: 'center',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  gradient: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  inner: {
    minHeight: 392,
    paddingHorizontal: 28,
    paddingTop: 22,
    paddingBottom: 24,
  },
  dismissButton: {
    position: 'absolute',
    top: 12,
    right: 14,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingRight: 34,
    minHeight: 56,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
    color: '#fff',
  },
  messageScroll: {
    height: 126,
    marginBottom: 16,
  },
  messageContent: {
    paddingRight: 24,
    paddingBottom: 12,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: '#fff',
    opacity: 0.95,
    flexShrink: 1,
  },
  actions: {
    alignItems: 'stretch',
    gap: 10,
    flexShrink: 0,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    paddingVertical: 0,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  secondaryButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  primaryButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    flexShrink: 1,
  },
  secondaryButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: '#fff',
    opacity: 0.95,
    textAlign: 'center',
  },
});
