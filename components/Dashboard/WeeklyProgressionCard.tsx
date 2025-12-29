import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface WeightChange {
  exercise: string;
  dayNumber: number;
  change: 'increase' | 'maintain' | 'decrease';
  oldWeight?: number;
  newWeight?: number;
  oldReps?: string;
  newReps?: string;
  reason: string;
}

interface Props {
  weekNumber: number;
  coachMessage: string;
  summary: string; // e.g., "3 exercises increased, 2 maintained, 0 decreased"
  changes: WeightChange[];
  onViewDetails: () => void;
  onDismiss: () => void;
}

export const WeeklyProgressionCard: React.FC<Props> = ({
  weekNumber,
  coachMessage,
  summary,
  changes,
  onViewDetails,
  onDismiss,
}) => {
  const increaseCount = changes.filter(c => c.change === 'increase').length;
  const decreaseCount = changes.filter(c => c.change === 'decrease').length;
  const maintainCount = changes.filter(c => c.change === 'maintain').length;

  // Determine card theme based on overall changes
  const getTheme = () => {
    if (increaseCount > decreaseCount) {
      return {
        gradient: ['#2e7d32', '#1b5e20'],
        icon: 'trending-up' as const,
        iconBg: '#1b5e20',
        emoji: '💪',
      };
    } else if (decreaseCount > 0) {
      return {
        gradient: ['#f57c00', '#ef6c00'],
        icon: 'trending-down' as const,
        iconBg: '#e65100',
        emoji: '🔄',
      };
    }
    return {
      gradient: ['#1976d2', '#1565c0'],
      icon: 'checkmark-circle' as const,
      iconBg: '#0d47a1',
      emoji: '✅',
    };
  };

  const theme = getTheme();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Dismiss button */}
        <Pressable style={styles.dismissButton} onPress={onDismiss}>
          <Ionicons name="close-circle" size={24} color="rgba(255,255,255,0.8)" />
        </Pressable>

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: theme.iconBg }]}>
            <Ionicons name={theme.icon} size={28} color="#fff" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>
              {theme.emoji} Week {weekNumber} Complete!
            </Text>
            <Text style={styles.subtitle}>{summary}</Text>
          </View>
        </View>

        {/* Coach Message */}
        <Text style={styles.message}>{coachMessage}</Text>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          {increaseCount > 0 && (
            <View style={styles.stat}>
              <Ionicons name="arrow-up-circle" size={20} color="#4caf50" />
              <Text style={styles.statText}>{increaseCount} Increased</Text>
            </View>
          )}
          {maintainCount > 0 && (
            <View style={styles.stat}>
              <Ionicons name="remove-circle" size={20} color="#2196f3" />
              <Text style={styles.statText}>{maintainCount} Maintained</Text>
            </View>
          )}
          {decreaseCount > 0 && (
            <View style={styles.stat}>
              <Ionicons name="arrow-down-circle" size={20} color="#ff9800" />
              <Text style={styles.statText}>{decreaseCount} Adjusted</Text>
            </View>
          )}
        </View>

        {/* View Details Button */}
        <Pressable style={styles.detailsButton} onPress={onViewDetails}>
          <Text style={styles.detailsButtonText}>View Updated Program</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </Pressable>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
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
    padding: 20,
    position: 'relative',
  },
  dismissButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
    paddingRight: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: '#fff',
    marginBottom: 16,
    opacity: 0.95,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  detailsButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
