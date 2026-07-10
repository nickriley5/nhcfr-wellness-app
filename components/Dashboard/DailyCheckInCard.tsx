import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface Props {
  hasCheckedInToday: boolean;
  onPress: () => void;
}

export const DailyCheckInCard: React.FC<Props> = ({ hasCheckedInToday, onPress }) => {
  if (hasCheckedInToday) {
    return (
      <Pressable style={styles.container} onPress={onPress}>
        <LinearGradient
          colors={['#1f2a22', '#203a26']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle-outline" size={30} color="#4caf50" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>Readiness Check Complete</Text>
              <Text style={styles.subtitle}>Tap to review or update today's answers</Text>
            </View>
            <Ionicons name="create-outline" size={22} color="rgba(255,255,255,0.75)" />
          </View>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <LinearGradient
        colors={['#241617', '#321b1d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="pulse-outline" size={30} color="#ff6b6b" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Complete Readiness Check</Text>
            <Text style={styles.subtitle}>
              Log recovery, stress, and training readiness
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.8)" />
        </View>

        <View style={styles.indicatorRow}>
          <View style={styles.indicator}>
            <Ionicons name="moon" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.indicatorText}>Sleep</Text>
          </View>
          <View style={styles.indicator}>
            <Ionicons name="battery-charging" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.indicatorText}>Energy</Text>
          </View>
          <View style={styles.indicator}>
            <Ionicons name="body" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.indicatorText}>Soreness</Text>
          </View>
          <View style={styles.indicator}>
            <Ionicons name="flame" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.indicatorText}>Readiness</Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
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
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  indicator: {
    alignItems: 'center',
    gap: 4,
  },
  indicatorText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
});
