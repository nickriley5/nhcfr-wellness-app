// components/Dashboard/AnalyticsSection.tsx
import React from 'react';
import {
  Text,
  StyleSheet,
  View,
  Pressable,
} from 'react-native';

interface AnalyticsSectionProps {
  moodData: number[]; // Raw array of numbers
  energyData: number[]; // Raw array of numbers
  readinessScore: number;
  navigation: any;
}

export default function AnalyticsSection({
  moodData,
  energyData,
  readinessScore,
  navigation,
}: AnalyticsSectionProps) {
  const getRecentTrend = (data: number[]): string => {
    if (data.length < 2) {return 'Insufficient data';}

    const recent = data.slice(-3);
    const isIncreasing = recent.every((item, index) =>
      index === 0 || item >= recent[index - 1]
    );
    const isDecreasing = recent.every((item, index) =>
      index === 0 || item <= recent[index - 1]
    );

    if (isIncreasing) {return '📈 Trending Up';}
    if (isDecreasing) {return '📉 Trending Down';}
    return '📊 Stable';
  };

  const getAverageScore = (data: number[]): number => {
    if (data.length === 0) {return 0;}
    const sum = data.reduce((acc, item) => acc + item, 0);
    return sum / data.length;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>📊 Analytics</Text>

      {/* Wellness Trends */}
      <View style={styles.tile}>
        <Text style={styles.tileHeader}>Wellness Trends</Text>

        <View style={styles.trendRow}>
          <Text style={styles.trendLabel}>Mood (7-day avg)</Text>
          <Text style={styles.trendValue}>
            {getAverageScore(moodData.slice(-7)).toFixed(1)}/5
          </Text>
          <Text style={styles.trendIndicator}>
            {getRecentTrend(moodData)}
          </Text>
        </View>

        <View style={styles.trendRow}>
          <Text style={styles.trendLabel}>Energy (7-day avg)</Text>
          <Text style={styles.trendValue}>
            {getAverageScore(energyData.slice(-7)).toFixed(1)}/5
          </Text>
          <Text style={styles.trendIndicator}>
            {getRecentTrend(energyData)}
          </Text>
        </View>

        {readinessScore > 0 && (
          <View style={styles.trendRow}>
            <Text style={styles.trendLabel}>Today's Readiness</Text>
            <Text style={styles.trendValue}>
              {readinessScore.toFixed(1)}/5
            </Text>
            <Text style={styles.trendIndicator}>
              {readinessScore >= 4 ? '🔥' : readinessScore >= 3 ? '👍' : '⚠️'}
            </Text>
          </View>
        )}
      </View>

      {/* Progress Summary */}
      <View style={styles.tile}>
        <Text style={styles.tileHeader}>Progress Summary</Text>
        <Text style={styles.summaryText}>
          You've logged {moodData.length} mood entries and {energyData.length} energy entries.
        </Text>
        <Text style={styles.summaryText}>
          Keep tracking to unlock more insights! 🎯
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.tile}>
        <Text style={styles.tileHeader}>View Details</Text>
        <View style={styles.quickActions}>
          <Pressable
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('ProgressChart')}
          >
            <Text style={styles.quickActionText}>📈 Charts</Text>
          </Pressable>
          <Pressable
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('Goals')}
          >
            <Text style={styles.quickActionText}>🎯 Goals</Text>
          </Pressable>
        </View>
      </View>

      {/* Insights */}
      <View style={styles.tile}>
        <Text style={styles.tileHeader}>Insights</Text>
        <Text style={styles.insightText}>
          💡 Your best performance days are when both mood and energy are above 4.0
        </Text>
        <Text style={styles.insightText}>
          ⏰ Morning check-ins show 15% higher energy scores
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 320,
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
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  trendLabel: {
    color: '#cccccc',
    fontSize: 14,
    flex: 1,
  },
  trendValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  trendIndicator: {
    fontSize: 12,
    minWidth: 80,
    textAlign: 'right',
    color: '#33d6a6',
  },
  summaryText: {
    color: '#cccccc',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  insightText: {
    color: '#cccccc',
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
