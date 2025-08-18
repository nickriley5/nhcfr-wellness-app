import React from 'react';
import { View, Text } from 'react-native';
import { dashboardStyles } from '../../styles/DashboardScreen.styles';

interface ConsistencyData {
  workoutStreak: number;
  workoutsCompleted: number;
  workoutsPlanned: number;
  mealsLogged: number;
  hydrationDays: number;
  recentPRs: string[];
}

interface DedicationCardProps {
  consistencyData: ConsistencyData;
}

export const DedicationCard: React.FC<DedicationCardProps> = ({
  consistencyData,
}) => {
  return (
    <View style={dashboardStyles.horizontalCard}>
      <View style={dashboardStyles.streakHeader}>
        <Text style={dashboardStyles.tileHeader}>🔥 Dedication</Text>
        <View style={dashboardStyles.streakBadge}>
          <Text style={dashboardStyles.streakNumber}>{consistencyData.workoutStreak}</Text>
          <Text style={dashboardStyles.streakLabel}>day streak</Text>
        </View>
      </View>

      {/* Consistency Metrics */}
      <View style={dashboardStyles.consistencyGrid}>
        <View style={dashboardStyles.consistencyItem}>
          <Text style={dashboardStyles.consistencyEmoji}>💪</Text>
          <Text style={dashboardStyles.consistencyValue}>
            {consistencyData.workoutsCompleted}/{consistencyData.workoutsPlanned}
          </Text>
          <Text style={dashboardStyles.consistencyLabel}>Workouts</Text>
        </View>
        <View style={dashboardStyles.consistencyItem}>
          <Text style={dashboardStyles.consistencyEmoji}>🍎</Text>
          <Text style={dashboardStyles.consistencyValue}>{consistencyData.mealsLogged}/7</Text>
          <Text style={dashboardStyles.consistencyLabel}>Meals</Text>
        </View>
        <View style={dashboardStyles.consistencyItem}>
          <Text style={dashboardStyles.consistencyEmoji}>💧</Text>
          <Text style={dashboardStyles.consistencyValue}>{consistencyData.hydrationDays}/7</Text>
          <Text style={dashboardStyles.consistencyLabel}>Hydration</Text>
        </View>
      </View>

      {/* Recent PRs */}
      <View style={dashboardStyles.prSection}>
        <Text style={dashboardStyles.prHeader}>🏆 Recent PRs</Text>
        {consistencyData.recentPRs.length > 0 ? (
          consistencyData.recentPRs.map((pr, idx) => (
            <Text key={idx} style={dashboardStyles.prItem}>• {pr}</Text>
          ))
        ) : (
          <Text style={dashboardStyles.prItem}>• No recent PRs - time to push!</Text>
        )}
      </View>
    </View>
  );
};
