// components/Dashboard/TrainingSection.tsx
import React from 'react';
import {
  Text,
  StyleSheet,
  View,
  Pressable,
} from 'react-native';

interface TrainingSectionProps {
  programExists: boolean;
  programInfo: any;
  todayInfo: any;
  readinessScore: number;
  navigation: any;
}

export default function TrainingSection({
  programExists,
  programInfo,
  todayInfo,
  readinessScore,
  navigation,
}: TrainingSectionProps) {
  const getTrainingRecommendation = (score: number): string => {
    if (score >= 4) {
      return 'Perfect day for intense training! 💪';
    }
    if (score >= 3) {
      return 'Good to go with your planned workout 👍';
    }
    if (score >= 2) {
      return 'Consider lighter training today ⚡';
    }
    return 'Focus on recovery - rest day recommended 😴';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>💪 Training</Text>

      {/* Training Recommendation based on Readiness */}
      {readinessScore > 0 && (
        <View style={styles.tile}>
          <Text style={styles.tileHeader}>Today's Recommendation</Text>
          <Text style={styles.recommendationText}>
            {getTrainingRecommendation(readinessScore)}
          </Text>
        </View>
      )}

      {/* Today's Workout */}
      <View style={styles.tile}>
        <Text style={styles.tileHeader}>Today's Workout</Text>
        {programExists && programInfo && todayInfo ? (
          <>
            <Text style={styles.workoutTitle}>
              {todayInfo.day.title ?? 'Workout'}
            </Text>
            <Text style={styles.workoutMeta}>
              {/* Add workout details here */}
              Scheduled Training Session
            </Text>
            <View style={styles.rowButtons}>
              <Pressable
                style={[styles.btn, styles.btnPrimary]}
                onPress={() => {
                  navigation.navigate('WorkoutDetail', {
                    day: todayInfo.day,
                    weekIdx: todayInfo.weekIdx,
                    dayIdx: todayInfo.dayIdx,
                  });
                }}
              >
                <Text style={styles.btnPrimaryText}>Start</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.btnSecondary]}
                onPress={() => navigation.navigate('AdaptWorkout')}
              >
                <Text style={styles.btnSecondaryText}>Adapt</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.mutedText}>No workout scheduled</Text>
            <Text style={styles.helperText}>
              Set up your training program to get started.
            </Text>
            <Pressable
              style={[styles.btn, styles.btnSecondary]}
              onPress={() => navigation.navigate('ProgramList')}
            >
              <Text style={styles.btnSecondaryText}>Browse Programs</Text>
            </Pressable>
          </>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.tile}>
        <Text style={styles.tileHeader}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <Pressable
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('WorkoutHistory')}
          >
            <Text style={styles.quickActionText}>📊 History</Text>
          </Pressable>
          <Pressable
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('PRTracker')}
          >
            <Text style={styles.quickActionText}>🏆 PRs</Text>
          </Pressable>
        </View>
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
  recommendationText: {
    fontSize: 16,
    color: '#33d6a6',
    fontWeight: '600',
  },
  workoutTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  workoutMeta: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 16,
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
  rowButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
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
  btnSecondary: {
    borderColor: '#444',
    borderWidth: 1,
  },
  btnSecondaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
});
