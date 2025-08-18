// components/Dashboard/TodaysWorkoutCard.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { dashboardStyles } from '../../styles/DashboardScreen.styles';

interface TodaysWorkoutCardProps {
  programExists: boolean;
  programInfo: {
    daysPerWeek: number;
    hasSchedule: boolean;
    currentDayName: string;
    isRestDay: boolean;
    todayEnvironment: string;
  } | null;
  todayWorkoutSummary: {
    isCompleted: boolean;
    dayTitle: string;
    totalTime: string;
    setsCompleted: number;
    setsPlanned: number;
    completedAt: Date;
    prMessages: string[];
  } | null;
  todayInfo: any;
  navigation: NavigationProp<any>;
  setShowEnvironmentCalendar: (show: boolean) => void;
  getEnvironmentIcon: (environment: string) => string;
  getEnvironmentLabel: (environment: string) => string;
  summarizeMains: (day: any) => string;
  countSets: (day: any) => number;
  estimateTime: (day: any) => number;
}

export default function TodaysWorkoutCard({
  programExists,
  programInfo,
  todayWorkoutSummary,
  todayInfo,
  navigation,
  setShowEnvironmentCalendar,
  getEnvironmentIcon,
  getEnvironmentLabel,
  summarizeMains,
  countSets,
  estimateTime,
}: TodaysWorkoutCardProps) {
  return (
    <View style={dashboardStyles.horizontalCard}>
      <Text style={dashboardStyles.tileHeader}>Today's Workout</Text>
      {programExists && programInfo ? (
        <>
          {!programInfo.hasSchedule ? (
            <>
              <Text style={dashboardStyles.mutedText}>Schedule your weekly training</Text>
              <Text style={dashboardStyles.helperText}>
                Your program requires {programInfo.daysPerWeek} workout days per week.
                Set up your weekly schedule to see today's workout.
              </Text>
              <Pressable
                style={[dashboardStyles.btn, dashboardStyles.btnPrimary]}
                onPress={() => setShowEnvironmentCalendar(true)}
              >
                <Text style={dashboardStyles.btnPrimaryText}>Set Weekly Schedule</Text>
              </Pressable>
            </>
          ) : programInfo.isRestDay ? (
            <>
              <Text style={dashboardStyles.workoutTitle}>🛌 Rest Day</Text>
              <Text style={dashboardStyles.workoutMeta}>Recovery and restoration day</Text>
              <Text style={dashboardStyles.helperText}>
                Take time to rest, stretch, or do light activities. Your next workout is coming up!
              </Text>
              <Pressable
                style={dashboardStyles.linkWrap}
                onPress={() => setShowEnvironmentCalendar(true)}
              >
                <Text style={dashboardStyles.linkText}>Adjust Weekly Schedule</Text>
              </Pressable>
            </>
          ) : todayWorkoutSummary?.isCompleted ? (
            <>
              <Text style={dashboardStyles.workoutTitle}>
                ✅ {todayWorkoutSummary.dayTitle} Complete
              </Text>
              <Text style={dashboardStyles.workoutMeta}>
                Completed at {todayWorkoutSummary.completedAt.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>

              {/* Workout Summary Stats */}
              <View style={dashboardStyles.summaryStats}>
                <View style={dashboardStyles.statBlock}>
                  <Text style={dashboardStyles.statNumber}>{todayWorkoutSummary.totalTime}</Text>
                  <Text style={dashboardStyles.statLabel}>Total Time</Text>
                </View>
                <View style={dashboardStyles.statBlock}>
                  <Text style={dashboardStyles.statNumber}>
                    {todayWorkoutSummary.setsCompleted}/{todayWorkoutSummary.setsPlanned}
                  </Text>
                  <Text style={dashboardStyles.statLabel}>Sets Completed</Text>
                </View>
                <View style={dashboardStyles.statBlock}>
                  <Text style={dashboardStyles.statNumber}>{todayWorkoutSummary.prMessages.length}</Text>
                  <Text style={dashboardStyles.statLabel}>PRs Today</Text>
                </View>
              </View>

              {/* PR Messages */}
              {todayWorkoutSummary.prMessages.length > 0 && (
                <View style={dashboardStyles.prSection}>
                  <Text style={dashboardStyles.prTitle}>🔥 Personal Records Today!</Text>
                  {todayWorkoutSummary.prMessages.map((pr, idx) => (
                    <Text key={idx} style={dashboardStyles.prText}>
                      {pr}
                    </Text>
                  ))}
                </View>
              )}

              <Pressable
                style={dashboardStyles.linkWrap}
                onPress={() =>
                  navigation
                    .getParent<NativeStackNavigationProp<any>>()
                    ?.navigate('WorkoutHistory')
                }
              >
                <Text style={dashboardStyles.linkText}>View History</Text>
              </Pressable>
            </>
          ) : todayInfo && !programInfo.isRestDay ? (
            <>
              <Text style={dashboardStyles.workoutTitle}>
                {getEnvironmentIcon(programInfo.todayEnvironment)} {todayInfo.day.title ?? 'Workout'}
              </Text>
              <Text style={dashboardStyles.workoutMeta}>
                Forecast: {getEnvironmentLabel(programInfo.todayEnvironment)} • {summarizeMains(todayInfo.day)} • {countSets(todayInfo.day)} sets • ~
                {estimateTime(todayInfo.day)} min estimated
              </Text>

              <View style={dashboardStyles.rowButtons}>
                <Pressable
                  style={[dashboardStyles.btn, dashboardStyles.btnPrimary]}
                  onPress={() =>
                    navigation.navigate('WorkoutDetail', {
                      day: todayInfo!.day,
                      weekIdx: todayInfo!.weekIdx,
                      dayIdx: todayInfo!.dayIdx,
                    })
                  }
                >
                  <Text style={dashboardStyles.btnPrimaryText}>Start</Text>
                </Pressable>
                <Pressable
                  style={[dashboardStyles.btn, dashboardStyles.btnSecondary]}
                  onPress={() => navigation.navigate('AdaptWorkout')}
                >
                  <Text style={dashboardStyles.btnSecondaryText}>Adapt</Text>
                </Pressable>
              </View>

              <View style={dashboardStyles.secondaryActions}>
                <Pressable
                  style={[dashboardStyles.btn, dashboardStyles.btnWeeklyPlan]}
                  onPress={() => setShowEnvironmentCalendar(true)}
                >
                  <Ionicons name="calendar-outline" size={16} color="#33d6a6" />
                  <Text style={dashboardStyles.btnWeeklyPlanText}>Weekly Plan</Text>
                </Pressable>
              </View>

              <Pressable
                style={dashboardStyles.linkWrap}
                onPress={() =>
                  navigation
                    .getParent<NativeStackNavigationProp<any>>()
                    ?.navigate('WorkoutHistory')
                }
              >
                <Text style={dashboardStyles.linkText}>View History</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={dashboardStyles.workoutTitle}>No Workout Scheduled</Text>
              <Text style={dashboardStyles.helperText}>
                Check your weekly schedule or browse available workouts.
              </Text>
              <View style={dashboardStyles.rowButtons}>
                <Pressable
                  style={[dashboardStyles.btn, dashboardStyles.btnSecondary]}
                  onPress={() => setShowEnvironmentCalendar(true)}
                >
                  <Text style={dashboardStyles.btnSecondaryText}>Adjust Schedule</Text>
                </Pressable>
                <Pressable
                  style={[dashboardStyles.btn, dashboardStyles.btnSecondary]}
                  onPress={() => navigation.navigate('ProgramList')}
                >
                  <Text style={dashboardStyles.btnSecondaryText}>Browse Programs</Text>
                </Pressable>
              </View>
            </>
          )}
        </>
      ) : (
        <View style={dashboardStyles.noProgramState}>
          <Text style={dashboardStyles.noProgramIcon}>🏋️‍♂️</Text>
          <Text style={dashboardStyles.mutedText}>No Program Active</Text>
          <Text style={dashboardStyles.helperText}>
            Select a workout program to get started with structured training.
          </Text>
          <Pressable
            style={[dashboardStyles.btn, dashboardStyles.btnPrimary]}
            onPress={() => navigation.navigate('ProgramList')}
          >
            <Text style={dashboardStyles.btnPrimaryText}>Choose Program</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
