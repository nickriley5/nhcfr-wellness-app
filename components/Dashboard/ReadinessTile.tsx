// components/dashboard/ReadinessTile.tsx
import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

export type ReadinessPoint = {
  mood: number;
  energy: number;
  readiness: number; // 0–5
  dateLabel: string;
};

type Props = {
  today?: ReadinessPoint;
  last7: ReadinessPoint[];
  onCheckInPress: () => void;
};

export default memo(function ReadinessTile({ today, last7, onCheckInPress }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.readinessTitle}>Readiness</Text>

      {today ? (
        <>
          <Text style={styles.readinessValue}>
            {today.readiness.toFixed(1)} / 5
            <Text style={styles.readinessSubText}>
              {'  '} (Mood {today.mood} • Energy {today.energy})
            </Text>
          </Text>

          {/* 7-day mini trend */}
          <View style={styles.miniTrendContainer}>
            <Text style={styles.last7DaysLabel}>Last 7 days</Text>
            <View style={styles.trendRow}>
              {last7.map((d, i) => {
                const level = Math.max(1, Math.min(6, Math.round(d.readiness))); // 1–6
                const glyphs = ['▁', '▂', '▃', '▄', '▅', '▆', '▇'];
                return (
                  <Text key={i} style={styles.trendGlyph}>
                    {glyphs[level]}
                  </Text>
                );
              })}
            </View>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.noCheckInsText}>No check-ins yet.</Text>
          <Text style={styles.checkInInfoText}>
            Record a mood & energy check-in to populate your readiness.
          </Text>
          <View style={styles.checkInRow}>
            <Pressable
              onPress={onCheckInPress}
              style={styles.checkInButton}>
              <Text style={styles.checkInButtonText}>Check-In</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121822',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  readinessTitle: {
    color: '#e6edf3',
    fontWeight: '600',
    marginBottom: 6,
  },
  readinessValue: {
    color: '#c2cfdd',
  },
  readinessSubText: {
    color: '#8ea0b6',
  },
  miniTrendContainer: {
    marginTop: 8,
  },
  last7DaysLabel: {
    color: '#8ea0b6',
    fontSize: 12,
    marginBottom: 4,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  trendGlyph: {
    color: '#c2cfdd',
    fontSize: 16,
    marginRight: 4,
  },
  noCheckInsText: {
    color: '#8ea0b6',
  },
  checkInInfoText: {
    color: '#c2cfdd',
    marginTop: 4,
  },
  checkInRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  checkInButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#33d6a6',
  },
  checkInButtonText: {
    color: '#0b0f14',
    fontWeight: '700',
  },
});
