// components/Dashboard/WellnessSection.tsx
import React from 'react';
import {
  Text,
  StyleSheet,
  View,
  Pressable,
} from 'react-native';

import MoodEnergySection from './MoodEnergySection';

interface WellnessSectionProps {
  hasCheckedInToday: boolean;
  readinessScore: number;
  getReadinessColor: (score: number) => string;
  getReadinessLevel: (score: number) => string;
  getReadinessMessage: (score: number) => string;
  view: 'week' | 'month' | 'all';
  moodData: number[]; // Raw array of numbers
  energyData: number[]; // Raw array of numbers
  onViewChange: (view: 'week' | 'month' | 'all') => void;
  onCheckInPress: () => void;
  _hydrationToday: { currentOz: number; goalOz: number };
  _sleepLastNight: { hours: number; quality: number };
  _onHydrationUpdate: (hydration: { currentOz: number; goalOz: number }) => void;
  _onSleepUpdate: (sleep: { hours: number; quality: number }) => void;
}

export default function WellnessSection({
  hasCheckedInToday,
  readinessScore,
  getReadinessColor,
  getReadinessLevel,
  getReadinessMessage,
  view,
  moodData,
  energyData,
  onViewChange,
  onCheckInPress,
  _hydrationToday,
  _sleepLastNight,
  _onHydrationUpdate,
  _onSleepUpdate,
}: WellnessSectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>🔥 Wellness & Readiness</Text>

      {/* Mood & Energy Trends */}
      <MoodEnergySection
        view={view}
        moodData={moodData}
        energyData={energyData}
        onViewChange={onViewChange}
      />

      {/* Readiness */}
      <View style={styles.tile}>
        <Text style={styles.tileHeader}>Readiness</Text>
        {hasCheckedInToday ? (
          <>
            {readinessScore > 0 ? (
              <>
                <View style={styles.readinessDisplay}>
                  <Text style={[styles.readinessScore, { color: getReadinessColor(readinessScore) }]}>
                    {readinessScore.toFixed(1)}/5.0
                  </Text>
                  <Text style={[styles.readinessLevel, { color: getReadinessColor(readinessScore) }]}>
                    {getReadinessLevel(readinessScore)}
                  </Text>
                </View>
                <Text style={styles.readinessMessage}>
                  {getReadinessMessage(readinessScore)}
                </Text>
              </>
            ) : (
              <Text style={styles.mutedText}>
                Ready to roll. Keep the streak going.
              </Text>
            )}
          </>
        ) : (
          <>
            <Text style={styles.mutedText}>No check-in today.</Text>
            <Text style={styles.helperText}>
              Log mood & energy to populate readiness.
            </Text>
            <Pressable
              style={[styles.btn, styles.btnPrimary]}
              onPress={onCheckInPress}
            >
              <Text style={styles.btnPrimaryText}>Check-In</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 320, // Fixed width for horizontal scroll
    paddingRight: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  tile: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  tileHeader: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  readinessDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  readinessScore: {
    fontSize: 24,
    fontWeight: '700',
    marginRight: 12,
  },
  readinessLevel: {
    fontSize: 16,
    fontWeight: '600',
  },
  readinessMessage: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20,
  },
  mutedText: {
    color: '#aaa',
    fontSize: 16,
    marginBottom: 8,
  },
  helperText: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 12,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  btnPrimary: {
    backgroundColor: '#33d6a6',
  },
  btnPrimaryText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
