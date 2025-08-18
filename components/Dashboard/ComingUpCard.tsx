import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { dashboardStyles } from '../../styles/DashboardScreen.styles';
import { TabParamList, RootStackParamList } from '../../App';
import { TomorrowPreviewModal } from '../Modals/TomorrowPreviewModal';

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
  _navigation: DashboardNavigationProp;
  getEnvironmentIcon: (environment: string) => string;
  getEnvironmentLabel: (environment: string) => string;
  summarizeMains: (day: any) => string;
  countSets: (day: any) => number;
  estimateTime: (day: any) => number;
}

export const ComingUpCard: React.FC<ComingUpCardProps> = ({
  tomorrowInfo,
  _navigation,
  getEnvironmentIcon,
  getEnvironmentLabel,
  summarizeMains,
  countSets,
  estimateTime,
}) => {
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  // Removed countdown timer function

  const getTomorrowPreview = () => {
    const tomorrowData = tomorrowInfo;

    if (!tomorrowData) {
      return (
        <View style={dashboardStyles.noPreviewContainer}>
          <Ionicons name="calendar-outline" size={24} color="#666" />
          <Text style={dashboardStyles.noPreviewText}>Set up your weekly schedule</Text>
          <Text style={dashboardStyles.noPreviewSubtext}>to see tomorrow's workout preview</Text>
        </View>
      );
    }

    if (tomorrowData.isRestDay) {
      return (
        <View style={dashboardStyles.restPreviewNew}>
          <View style={dashboardStyles.restHeaderNew}>
            <Ionicons name="bed-outline" size={20} color="#ffa726" />
            <Text style={dashboardStyles.restTitleNew}>Rest Day</Text>
            <View style={dashboardStyles.restBadge}>
              <Text style={dashboardStyles.restBadgeText}>Recovery</Text>
            </View>
          </View>
          <Text style={dashboardStyles.restSubtitleNew}>Focus on recovery and preparation</Text>
          <View style={dashboardStyles.restActivities}>
            <View style={dashboardStyles.restActivity}>
              <Ionicons name="body-outline" size={16} color="#33d6a6" />
              <Text style={dashboardStyles.restActivityText}>Mobility</Text>
            </View>
            <View style={dashboardStyles.restActivity}>
              <Ionicons name="water-outline" size={16} color="#33d6a6" />
              <Text style={dashboardStyles.restActivityText}>Hydration</Text>
            </View>
            <View style={dashboardStyles.restActivity}>
              <Ionicons name="moon-outline" size={16} color="#33d6a6" />
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
        </View>

        <View style={dashboardStyles.previewStatsNew}>
          <View style={dashboardStyles.previewStatNew}>
            <Ionicons name="barbell-outline" size={16} color="#33d6a6" />
            <Text style={dashboardStyles.previewStatNumberNew}>{(tomorrowData.day?.exercises || []).length}</Text>
            <Text style={dashboardStyles.previewStatLabelNew}>exercises</Text>
          </View>
          <View style={dashboardStyles.previewStatNew}>
            <Ionicons name="stats-chart-outline" size={16} color="#33d6a6" />
            <Text style={dashboardStyles.previewStatNumberNew}>{countSets(tomorrowData.day)}</Text>
            <Text style={dashboardStyles.previewStatLabelNew}>sets</Text>
          </View>
          <View style={dashboardStyles.previewStatNew}>
            <Ionicons name="time-outline" size={16} color="#33d6a6" />
            <Text style={dashboardStyles.previewStatNumberNew}>{estimateTime(tomorrowData.day)}</Text>
            <Text style={dashboardStyles.previewStatLabelNew}>min</Text>
          </View>
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
              Tomorrow's session
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
          <Pressable
            style={[dashboardStyles.btn, dashboardStyles.btnPreviewSecondary]}
            onPress={() => setShowPreviewModal(true)}
          >
            <Ionicons name="eye-outline" size={16} color="#33d6a6" />
            <Text style={dashboardStyles.btnPreviewSecondaryText}>
              {tomorrowInfo?.isRestDay ? 'Rest Day Tips' : 'Preview'}
            </Text>
          </Pressable>
        </View>
      </LinearGradient>

      <TomorrowPreviewModal
        visible={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        tomorrowInfo={tomorrowInfo}
        getEnvironmentIcon={getEnvironmentIcon}
        getEnvironmentLabel={getEnvironmentLabel}
        _summarizeMains={summarizeMains}
        countSets={countSets}
        estimateTime={estimateTime}
      />
    </View>
  );
};
