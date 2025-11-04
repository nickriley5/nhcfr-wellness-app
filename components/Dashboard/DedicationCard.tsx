import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
  onPRPress?: () => void;
}

export const DedicationCard: React.FC<DedicationCardProps> = ({
  consistencyData,
  onPRPress,
}) => {
  return (
    <View style={dashboardStyles.horizontalCard}>
      <View style={dashboardStyles.streakHeader}>
        <View style={dashboardStyles.headerWithIcon}>
          <Ionicons name="flame-outline" size={18} color="#ff6b47" />
          <Text style={dashboardStyles.tileHeader}>Dedication</Text>
        </View>
        <View style={dashboardStyles.streakBadge}>
          <Text style={dashboardStyles.streakNumber}>{consistencyData.workoutStreak}</Text>
          <Text style={dashboardStyles.streakLabel}>day streak</Text>
        </View>
      </View>

      {/* Consistency Metrics */}
      <View style={dashboardStyles.consistencyGrid}>
        <View style={dashboardStyles.consistencyItem}>
          <Ionicons name="barbell-outline" size={20} color="#33d6a6" />
          <Text style={dashboardStyles.consistencyValue}>
            {consistencyData.workoutsCompleted}/{consistencyData.workoutsPlanned}
          </Text>
          <Text style={dashboardStyles.consistencyLabel}>Workouts</Text>
        </View>
        <View style={dashboardStyles.consistencyItem}>
          <Ionicons name="restaurant-outline" size={20} color="#ffa726" />
          <Text style={dashboardStyles.consistencyValue}>{consistencyData.mealsLogged}/7</Text>
          <Text style={dashboardStyles.consistencyLabel}>Meals</Text>
        </View>
        <View style={dashboardStyles.consistencyItem}>
          <Ionicons name="water-outline" size={20} color="#4fc3f7" />
          <Text style={dashboardStyles.consistencyValue}>{consistencyData.hydrationDays}/7</Text>
          <Text style={dashboardStyles.consistencyLabel}>Hydration</Text>
        </View>
      </View>

      {/* Recent PRs */}
      <Pressable 
        style={dashboardStyles.prSection}
        onPress={onPRPress}
      >
        <View style={dashboardStyles.prHeaderContainer}>
          <Ionicons name="trophy-outline" size={16} color="#ffd700" />
          <Text style={dashboardStyles.prHeader}>Recent PRs</Text>
          {onPRPress && <Ionicons name="chevron-forward" size={16} color="#999" style={{ marginLeft: 4 }} />}
        </View>
        {consistencyData.recentPRs.length > 0 ? (
          consistencyData.recentPRs.map((pr, idx) => (
            <Text key={idx} style={dashboardStyles.prItem}>• {pr}</Text>
          ))
        ) : (
          <Text style={dashboardStyles.prItem}>• No recent PRs - time to push!</Text>
        )}
      </Pressable>
    </View>
  );
};
