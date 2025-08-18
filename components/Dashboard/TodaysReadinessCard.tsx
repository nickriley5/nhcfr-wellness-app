// components/Dashboard/TodaysReadinessCard.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import MoodEnergySection from './MoodEnergySection';
import { dashboardStyles } from '../../styles/DashboardScreen.styles';

interface TodaysReadinessCardProps {
  hasCheckedInToday: boolean;
  readinessScore: number;
  moodData: number[];
  energyData: number[];
  view: 'week' | 'month' | 'all';
  onViewChange: (view: 'week' | 'month' | 'all') => void;
  navigation: NavigationProp<any>;
  getReadinessColor: (score: number) => string;
  getReadinessLevel: (score: number) => string;
  getReadinessMessage: (score: number) => string;
}

export default function TodaysReadinessCard({
  hasCheckedInToday,
  readinessScore,
  moodData,
  energyData,
  view,
  onViewChange,
  navigation,
  getReadinessColor,
  getReadinessLevel,
  getReadinessMessage,
}: TodaysReadinessCardProps) {
  return (
    <View style={dashboardStyles.tile}>
      <View style={dashboardStyles.headerRow}>
        <Text style={dashboardStyles.tileHeader}>Today's Readiness</Text>
        {hasCheckedInToday && (
          <Pressable
            style={dashboardStyles.checkInButton}
            onPress={() => navigation.navigate('CheckIn')}
          >
            <Text style={dashboardStyles.checkInButtonText}>Update</Text>
          </Pressable>
        )}
      </View>

      {hasCheckedInToday ? (
        <>
          {/* Readiness Score Row */}
          <View style={dashboardStyles.readinessRow}>
            <View style={dashboardStyles.readinessMain}>
              <Text style={[dashboardStyles.readinessScore, { color: getReadinessColor(readinessScore) }]}>
                {readinessScore.toFixed(1)}/5.0
              </Text>
              <Text style={[dashboardStyles.readinessLevel, { color: getReadinessColor(readinessScore) }]}>
                {getReadinessLevel(readinessScore)}
              </Text>
            </View>

            {/* Current Stats */}
            <View style={dashboardStyles.currentStats}>
              <View style={dashboardStyles.statItem}>
                <Text style={dashboardStyles.statValue}>{moodData[moodData.length - 1] || '–'}</Text>
                <Text style={dashboardStyles.readinessStatLabel}>Mood</Text>
              </View>
              <View style={dashboardStyles.statItem}>
                <Text style={dashboardStyles.statValue}>{energyData[energyData.length - 1] || '–'}</Text>
                <Text style={dashboardStyles.readinessStatLabel}>Energy</Text>
              </View>
            </View>
          </View>

          <View style={[dashboardStyles.readinessMessageCard, { backgroundColor: getReadinessColor(readinessScore) + '20', borderColor: getReadinessColor(readinessScore) }]}>
            <Text style={[dashboardStyles.readinessMessage, { color: getReadinessColor(readinessScore) }]}>
              {getReadinessMessage(readinessScore)}
            </Text>
          </View>

          {/* Embedded Trends Chart */}
          <View style={dashboardStyles.embeddedChart}>
            <MoodEnergySection
              view={view}
              moodData={moodData}
              energyData={energyData}
              onViewChange={onViewChange}
            />
          </View>
        </>
      ) : (
        <View style={dashboardStyles.noCheckInState}>
          <Text style={dashboardStyles.noCheckInIcon}>📊</Text>
          <Text style={dashboardStyles.mutedText}>No check-in today</Text>
          <Text style={dashboardStyles.helperText}>
            Track your mood & energy to get your daily readiness score
          </Text>
          <Pressable
            style={[dashboardStyles.btn, dashboardStyles.btnPrimary]}
            onPress={() => navigation.navigate('CheckIn')}
          >
            <Text style={dashboardStyles.btnPrimaryText}>Check-In Now</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
