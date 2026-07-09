// components/Dashboard/TodaysWorkoutCard.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { dashboardStyles } from '../../styles/DashboardScreen.styles';
import { auth, db } from '../../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import Toast from 'react-native-toast-message';
import { ProgramDay } from '../../types/Exercise';

interface TodaysWorkoutCardProps {
  programExists: boolean;
  programInfo: {
    daysPerWeek: number;
    hasSchedule: boolean;
    currentDayName: string;
    isRestDay: boolean;
    todayEnvironment: string;
    todayOverride?: {
      type: 'rest';
      reason?: string;
    };
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
  aiWorkoutInfo: {
    day: ProgramDay;
    workoutId: string;
    createdAt: Date;
  } | null;
  navigation: NavigationProp<any>;
  setShowEnvironmentCalendar: (show: boolean) => void;
  getEnvironmentIcon: (environment: string) => React.JSX.Element;
  getEnvironmentLabel: (environment: string) => string;
  summarizeMains: (day: any) => string;
  countSets: (day: any) => number;
  estimateTime: (day: any) => number;
  onRefresh: () => void;
}

export default function TodaysWorkoutCard({
  programExists,
  programInfo,
  todayWorkoutSummary,
  todayInfo,
  aiWorkoutInfo,
  navigation,
  setShowEnvironmentCalendar,
  getEnvironmentIcon,
  getEnvironmentLabel,
  summarizeMains,
  countSets,
  estimateTime,
  onRefresh,
}: TodaysWorkoutCardProps) {
  const [dismissingAI, setDismissingAI] = useState(false);

  const handleDismissAIWorkout = async () => {
    if (!aiWorkoutInfo) return;

    Alert.alert(
      'Return to Original Workout?',
      'This will remove the AI-generated workout and return to your scheduled workout.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Return',
          style: 'destructive',
          onPress: async () => {
            try {
              setDismissingAI(true);
              const uid = auth.currentUser?.uid;
              if (!uid) return;

              await deleteDoc(doc(db, 'users', uid, 'aiWorkouts', aiWorkoutInfo.workoutId));

              Toast.show({
                type: 'success',
                text1: 'Returned to Scheduled Workout',
                text2: 'AI workout dismissed',
              });

              // Small delay to ensure Firestore propagates the change
              setTimeout(() => {
                onRefresh();
              }, 500);
            } catch (error) {
              console.error('Error dismissing AI workout:', error);
              Toast.show({
                type: 'error',
                text1: 'Failed to dismiss',
                text2: 'Please try again',
              });
            } finally {
              setDismissingAI(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={dashboardStyles.horizontalCard}>
      <Text style={dashboardStyles.tileHeader}>Today's Workout</Text>
      
      {/* Show AI Workout if available */}
      {aiWorkoutInfo ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="sparkles" size={20} color="#a855f7" />
            <Text style={[dashboardStyles.workoutTitle, { marginLeft: 8, marginBottom: 0 }]}>
              AI Generated Workout
            </Text>
          </View>
          
          <Text style={dashboardStyles.workoutMeta}>
            {summarizeMains(aiWorkoutInfo.day)} • {countSets(aiWorkoutInfo.day)} sets • ~{estimateTime(aiWorkoutInfo.day)} min
          </Text>
          
          <Text style={[dashboardStyles.helperText, { marginTop: 8, marginBottom: 12 }]}>
            Custom workout generated just for you. Includes warm-up and cool-down exercises.
          </Text>

          <View style={dashboardStyles.rowButtons}>
            <Pressable
              style={[dashboardStyles.btn, dashboardStyles.btnPrimary]}
              onPress={() =>
                navigation.navigate('WorkoutDetail', {
                  day: aiWorkoutInfo.day,
                  weekIdx: 0,
                  dayIdx: 0,
                  sourceType: 'ai',
                  workoutId: aiWorkoutInfo.workoutId,
                })
              }
            >
              <Text style={dashboardStyles.btnPrimaryText}>Start AI Workout</Text>
            </Pressable>
            <Pressable
              style={[dashboardStyles.btn, dashboardStyles.btnSecondary]}
              onPress={() =>
                navigation.navigate('AdaptWorkout', {
                  day: aiWorkoutInfo.day,
                  weekIdx: 0,
                  dayIdx: 0,
                  sourceType: 'ai',
                  workoutId: aiWorkoutInfo.workoutId,
                })
              }
            >
              <Text style={dashboardStyles.btnSecondaryText}>Adapt</Text>
            </Pressable>
          </View>

          <Pressable
            style={[dashboardStyles.linkWrap, { marginTop: 12 }]}
            onPress={handleDismissAIWorkout}
            disabled={dismissingAI}
          >
            <Text style={dashboardStyles.linkText}>
              {dismissingAI ? 'Dismissing...' : 'Return to Scheduled Workout'}
            </Text>
          </Pressable>
        </>
      ) : programExists && programInfo ? (
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
                <Text style={dashboardStyles.btnPrimaryText}>Set My Weekly Schedule</Text>
              </Pressable>
            </>
          ) : programInfo.isRestDay ? (
            <>
              <Text style={dashboardStyles.workoutTitle}>
                <Ionicons name="bed-outline" size={20} color="#d32f2f" /> Rest Day
              </Text>
              <Text style={dashboardStyles.workoutMeta}>
                {programInfo.todayOverride?.type === 'rest'
                  ? 'AI coach recovery override'
                  : 'Recovery and restoration day'}
              </Text>
              <Text style={dashboardStyles.helperText}>
                {programInfo.todayOverride?.type === 'rest'
                  ? 'Your scheduled workout is paused for today. Your weekly schedule is unchanged.'
                  : 'Take time to rest, stretch, or do light activities. Your next workout is coming up!'}
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
                      sourceType: todayInfo!.sourceType || 'program',
                      workoutId: todayInfo!.workoutId,
                      weekNumber: todayInfo!.weekNumber,
                    })
                  }
                >
                  <Text style={dashboardStyles.btnPrimaryText}>Start</Text>
                </Pressable>
                <Pressable
                  style={[dashboardStyles.btn, dashboardStyles.btnSecondary]}
                  onPress={() => {
                    console.log('Adapt button pressed');
                    try {
                      navigation.navigate('AdaptWorkout', {
                        day: todayInfo!.day,
                        weekIdx: todayInfo!.weekIdx,
                        dayIdx: todayInfo!.dayIdx,
                        sourceType: todayInfo!.sourceType || 'program',
                        workoutId: todayInfo!.workoutId,
                        weekNumber: todayInfo!.weekNumber,
                      });
                    } catch (error) {
                      console.error('Navigation error:', error);
                    }
                  }}
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
                Check your weekly schedule or open the Workout tab to generate a program.
              </Text>
              <View style={dashboardStyles.rowButtons}>
                <Pressable
                  style={[dashboardStyles.btn, dashboardStyles.btnSecondary]}
                  onPress={() => setShowEnvironmentCalendar(true)}
                >
                  <Text style={dashboardStyles.btnSecondaryText}>Adjust Schedule</Text>
                </Pressable>
              </View>
            </>
          )}
        </>
      ) : (
        <View style={dashboardStyles.noProgramState}>
          <Ionicons name="fitness-outline" size={48} color="#666" style={dashboardStyles.noProgramIcon} />
          <Text style={dashboardStyles.mutedText}>No Program Active</Text>
          <Text style={dashboardStyles.helperText}>
            Select a workout program to get started with structured training.
          </Text>
          <Pressable
            style={[dashboardStyles.btn, dashboardStyles.btnPrimary]}
            onPress={() => navigation.navigate('Workout')}
          >
            <Text style={dashboardStyles.btnPrimaryText}>Choose Program</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
