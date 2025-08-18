import React from 'react';
import { View, Text, Pressable } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { dashboardStyles } from '../../styles/DashboardScreen.styles';
import { TabParamList, RootStackParamList } from '../../App';

type DashboardNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Dashboard'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface TomorrowInfo {
  day: any;
  weekIdx: number;
  dayIdx: number;
  isRestDay: boolean;
  environment: string;
}

interface ComingUpCardProps {
  tomorrowInfo: TomorrowInfo | null;
  navigation: DashboardNavigationProp;
  getEnvironmentIcon: (environment: string) => string;
  getEnvironmentLabel: (environment: string) => string;
  summarizeMains: (day: any) => string;
  countSets: (day: any) => number;
  estimateTime: (day: any) => number;
}

export const ComingUpCard: React.FC<ComingUpCardProps> = ({
  tomorrowInfo,
  navigation,
  getEnvironmentIcon,
  getEnvironmentLabel,
  summarizeMains,
  countSets,
  estimateTime,
}) => {
  const getTimeUntilTomorrow = () => {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(6, 0, 0, 0); // Assume workouts start at 6 AM

    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getTomorrowPreview = () => {
    const tomorrowData = tomorrowInfo;

    if (!tomorrowData) {
      return (
        <View style={dashboardStyles.noPreviewContainer}>
          <Text style={dashboardStyles.noPreviewText}>📋 Set up your weekly schedule</Text>
          <Text style={dashboardStyles.noPreviewSubtext}>to see tomorrow's workout preview</Text>
        </View>
      );
    }

    if (tomorrowData.isRestDay) {
      return (
        <View style={dashboardStyles.restPreviewNew}>
          <View style={dashboardStyles.restHeaderNew}>
            <Text style={dashboardStyles.restTitleNew}>🛌 Rest Day</Text>
            <View style={dashboardStyles.restBadge}>
              <Text style={dashboardStyles.restBadgeText}>Recovery</Text>
            </View>
          </View>
          <Text style={dashboardStyles.restSubtitleNew}>Focus on recovery and preparation</Text>
          <View style={dashboardStyles.restActivities}>
            <View style={dashboardStyles.restActivity}>
              <Text style={dashboardStyles.restActivityIcon}>🧘‍♂️</Text>
              <Text style={dashboardStyles.restActivityText}>Mobility</Text>
            </View>
            <View style={dashboardStyles.restActivity}>
              <Text style={dashboardStyles.restActivityIcon}>💧</Text>
              <Text style={dashboardStyles.restActivityText}>Hydration</Text>
            </View>
            <View style={dashboardStyles.restActivity}>
              <Text style={dashboardStyles.restActivityIcon}>😴</Text>
              <Text style={dashboardStyles.restActivityText}>Sleep</Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={dashboardStyles.workoutPreviewNew}>
        <View style={dashboardStyles.previewHeaderNew}>
          <View>
            <Text style={dashboardStyles.previewTitleNew}>
              {getEnvironmentIcon(tomorrowData.environment)} {tomorrowData.day?.title || 'Workout'}
            </Text>
            <Text style={dashboardStyles.previewMetaNew}>
              {getEnvironmentLabel(tomorrowData.environment)} • {summarizeMains(tomorrowData.day)}
            </Text>
          </View>
          <View style={dashboardStyles.intensityBadge}>
            <Text style={dashboardStyles.intensityBadgeText}>💪 PUSH</Text>
          </View>
        </View>

        <View style={dashboardStyles.previewStatsNew}>
          <View style={dashboardStyles.previewStatNew}>
            <Text style={dashboardStyles.previewStatIconNew}>🏋️</Text>
            <Text style={dashboardStyles.previewStatNumberNew}>{(tomorrowData.day?.exercises || []).length}</Text>
            <Text style={dashboardStyles.previewStatLabelNew}>exercises</Text>
          </View>
          <View style={dashboardStyles.previewStatNew}>
            <Text style={dashboardStyles.previewStatIconNew}>📊</Text>
            <Text style={dashboardStyles.previewStatNumberNew}>{countSets(tomorrowData.day)}</Text>
            <Text style={dashboardStyles.previewStatLabelNew}>sets</Text>
          </View>
          <View style={dashboardStyles.previewStatNew}>
            <Text style={dashboardStyles.previewStatIconNew}>⏱️</Text>
            <Text style={dashboardStyles.previewStatNumberNew}>{estimateTime(tomorrowData.day)}</Text>
            <Text style={dashboardStyles.previewStatLabelNew}>min</Text>
          </View>
        </View>

        {/* Highlight Exercise Preview */}
        <View style={dashboardStyles.highlightExercise}>
          <Text style={dashboardStyles.highlightTitle}>Featured Exercise</Text>
          <Text style={dashboardStyles.highlightExerciseName}>
            🔥 {tomorrowData.day?.exercises?.[0]?.name || 'Primary Movement'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={dashboardStyles.horizontalCard}>
      <LinearGradient
        colors={['rgba(51, 214, 166, 0.1)', 'rgba(76, 195, 247, 0.05)']}
        style={dashboardStyles.comingUpGradient}
      >
        <View style={dashboardStyles.comingUpHeader}>
          <View style={dashboardStyles.comingUpHeaderLeft}>
            <View style={dashboardStyles.comingUpTitleRow}>
              <Ionicons name="calendar-outline" size={20} color="#33d6a6" />
              <Text style={dashboardStyles.tileHeaderClean}>Coming Up</Text>
            </View>
            <Text style={dashboardStyles.comingUpSubtitle}>
              {getTimeUntilTomorrow()} until next session
            </Text>
          </View>
          <View style={dashboardStyles.dayIndicator}>
            <Text style={dashboardStyles.dayIndicatorText}>
              {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
            </Text>
          </View>
        </View>

        {getTomorrowPreview()}

        <View style={dashboardStyles.comingUpActions}>
          {!tomorrowInfo?.isRestDay && (
            <Pressable
              style={[dashboardStyles.btn, dashboardStyles.btnPreviewSecondary]}
              onPress={() => {
                const tomorrowData = tomorrowInfo;
                if (tomorrowData?.day) {
                  navigation.navigate('WorkoutDetail', {
                    day: tomorrowData.day,
                    weekIdx: tomorrowData.weekIdx,
                    dayIdx: tomorrowData.dayIdx,
                  });
                }
              }}
            >
              <Ionicons name="eye-outline" size={16} color="#33d6a6" />
              <Text style={dashboardStyles.btnPreviewSecondaryText}>Preview</Text>
            </Pressable>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};
