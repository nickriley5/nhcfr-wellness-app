import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { dashboardStyles } from '../../styles/DashboardScreen.styles';

interface CardioSession {
  dayOfWeek: string;
  type: string;
  duration: number;
  intensity: string;
  notes?: string;
  targetHeartRate?: string;
}

interface CardioScheduleInfo {
  frequency: number;
  currentWeek: number;
  sessions: CardioSession[];
  completedSessionKeys: string[];
  completedThisWeek: number;
  todaySession?: CardioSession;
  todaySessionKey?: string;
  todayIsCompleted?: boolean;
}

interface CardioSummary {
  isCompleted: boolean;
  dayTitle: string;
  totalTime: string;
  completedAt: Date;
  type?: string;
  distance?: number | null;
  pace?: string | null;
  calories?: number | null;
  avgHeartRate?: number | null;
  maxHeartRate?: number | null;
}

interface TodaysCardioCardProps {
  cardioScheduleInfo: CardioScheduleInfo | null;
  todayCardioSummary: CardioSummary | null;
  navigation: NavigationProp<any>;
}

export default function TodaysCardioCard({
  cardioScheduleInfo,
  todayCardioSummary,
  navigation,
}: TodaysCardioCardProps) {
  const weeklyProgressText = cardioScheduleInfo
    ? `${cardioScheduleInfo.completedThisWeek}/${cardioScheduleInfo.frequency} sessions this week`
    : null;

  const todaySession = cardioScheduleInfo?.todaySession;

  return (
    <View style={dashboardStyles.horizontalCard}>
      <Text style={dashboardStyles.tileHeader}>Today's Cardio</Text>

      {todayCardioSummary?.isCompleted ? (
        <>
          <Text style={dashboardStyles.workoutTitle}>
            ✅ {todayCardioSummary.dayTitle} Complete
          </Text>
          <Text style={dashboardStyles.workoutMeta}>
            Completed at {todayCardioSummary.completedAt.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>

          <View style={dashboardStyles.summaryStats}>
            <View style={dashboardStyles.statBlock}>
              <Text style={dashboardStyles.statNumber}>{todayCardioSummary.totalTime}</Text>
              <Text style={dashboardStyles.statLabel}>Duration</Text>
            </View>
            <View style={dashboardStyles.statBlock}>
              <Text style={dashboardStyles.statNumber}>
                {todayCardioSummary.distance ? `${todayCardioSummary.distance} mi` : '--'}
              </Text>
              <Text style={dashboardStyles.statLabel}>Distance</Text>
            </View>
            <View style={dashboardStyles.statBlock}>
              <Text style={dashboardStyles.statNumber}>
                {todayCardioSummary.calories ? todayCardioSummary.calories : '--'}
              </Text>
              <Text style={dashboardStyles.statLabel}>Calories</Text>
            </View>
          </View>

          {weeklyProgressText && (
            <Text style={dashboardStyles.helperText}>{weeklyProgressText}</Text>
          )}

          <Pressable
            style={dashboardStyles.linkWrap}
            onPress={() =>
              navigation
                .getParent()
                ?.navigate('WorkoutHistory')
            }
          >
            <Text style={dashboardStyles.linkText}>View History</Text>
          </Pressable>
        </>
      ) : todaySession ? (
        <>
          <Text style={dashboardStyles.workoutTitle}>
            <Ionicons name="fitness-outline" size={18} color="#FF6B35" /> {todaySession.type}
          </Text>
          <Text style={dashboardStyles.workoutMeta}>
            {todaySession.duration} min • {todaySession.intensity}
          </Text>
          {todaySession.notes && (
            <Text style={dashboardStyles.helperText}>{todaySession.notes}</Text>
          )}
          {weeklyProgressText && (
            <Text style={dashboardStyles.helperText}>{weeklyProgressText}</Text>
          )}
          <Pressable
            style={[dashboardStyles.btn, dashboardStyles.btnPrimary, { width: '100%' }]}
            onPress={() =>
              navigation.navigate('CardioWorkout', {
                session: todaySession,
                weekNumber: cardioScheduleInfo?.currentWeek || 1,
              })
            }
          >
            <Text style={dashboardStyles.btnPrimaryText}>Start Cardio</Text>
          </Pressable>
        </>
      ) : cardioScheduleInfo ? (
        <>
          <Text style={dashboardStyles.workoutTitle}>No Cardio Scheduled Today</Text>
          {weeklyProgressText && (
            <Text style={dashboardStyles.workoutMeta}>{weeklyProgressText}</Text>
          )}
          <Pressable
            style={dashboardStyles.linkWrap}
            onPress={() =>
              navigation
                .getParent()
                ?.navigate('WorkoutHistory')
            }
          >
            <Text style={dashboardStyles.linkText}>View History</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={dashboardStyles.workoutTitle}>No Cardio Plan</Text>
          <Text style={dashboardStyles.helperText}>
            Add cardio sessions to track weekly progress.
          </Text>
        </>
      )}
    </View>
  );
}
