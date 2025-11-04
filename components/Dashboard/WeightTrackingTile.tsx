import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import { auth, db } from '../../firebase';
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { dashboardStyles } from '../../styles/DashboardScreen.styles';
import WeightTrackingCard, { WeightTrackingCardRef } from './WeightTrackingCard';

interface WeightEntry {
  id: string;
  weight: number;
  date: Date;
  notes?: string;
}

interface WeightTrackingTileProps {
  onWeightUpdated?: () => void;
}

export const WeightTrackingTile: React.FC<WeightTrackingTileProps> = ({ onWeightUpdated }) => {
  const [weeklyAverage, setWeeklyAverage] = useState<number | null>(null);
  const [weeklyChange, setWeeklyChange] = useState<number>(0);
  const [hasPreviousWeekData, setHasPreviousWeekData] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const weightTrackingRef = useRef<WeightTrackingCardRef>(null);

  const loadWeightStats = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }

    try {
      const now = new Date();

      // Get last 14 days of data to calculate weekly averages
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(now.getDate() - 14);

      const weightsQuery = query(
        collection(db, 'users', uid, 'weightEntries'),
        where('date', '>=', Timestamp.fromDate(twoWeeksAgo)),
        orderBy('date', 'desc'),
        limit(20)
      );

      const querySnapshot = await getDocs(weightsQuery);
      const entries: WeightEntry[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        entries.push({
          id: docSnapshot.id,
          weight: data.weight,
          date: data.date.toDate(),
          notes: data.notes,
        });
      });

      if (entries.length === 0) {
        setWeeklyAverage(null);
        setWeeklyChange(0);
        setLoading(false);
        return;
      }

      // Calculate current week average (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);

      const currentWeekEntries = entries.filter(entry => entry.date >= oneWeekAgo);
      const previousWeekEntries = entries.filter(entry =>
        entry.date < oneWeekAgo && entry.date >= twoWeeksAgo
      );

      if (currentWeekEntries.length > 0) {
        const currentAvg = currentWeekEntries.reduce((sum, entry) => sum + entry.weight, 0) / currentWeekEntries.length;
        setWeeklyAverage(currentAvg);

        // Calculate change from previous week
        if (previousWeekEntries.length > 0) {
          const previousAvg = previousWeekEntries.reduce((sum, entry) => sum + entry.weight, 0) / previousWeekEntries.length;
          setWeeklyChange(currentAvg - previousAvg);
          setHasPreviousWeekData(true);
        } else {
          setWeeklyChange(0);
          setHasPreviousWeekData(false);
        }
      } else {
        setWeeklyAverage(null);
        setWeeklyChange(0);
        setHasPreviousWeekData(false);
      }
    } catch (error) {
      console.error('Error loading weight stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeightStats();
  }, []);

  const handleWeightUpdated = () => {
    loadWeightStats(); // Refresh stats when weight is updated
    onWeightUpdated?.(); // Call parent callback if provided
  };

  const formatWeightChange = (change: number, hasPrevious: boolean): string => {
    if (!hasPrevious) {
      return '📊 Track for a week to see trends';
    }
    if (change === 0) {
      return '➡️ No change from last week';
    }
    const direction = change > 0 ? '↗️' : '↘️';
    const changeWord = change > 0 ? 'Up' : 'Down';
    return `${direction} ${changeWord} ${Math.abs(change).toFixed(1)} lbs from last week`;
  };

  return (
    <View style={dashboardStyles.horizontalCard}>
      <WeightTrackingCard
        ref={weightTrackingRef}
        onWeightUpdated={handleWeightUpdated}
      />

      {/* Enhanced Footer Section */}
      <View style={dashboardStyles.weightTrackingFooter}>
        <Pressable
          style={[dashboardStyles.btn, dashboardStyles.btnWeightLog]}
          onPress={() => {
            weightTrackingRef.current?.openWeightModal();
          }}
        >
          <Text style={dashboardStyles.btnWeightLogText}>Log Weight</Text>
        </Pressable>

        <View style={dashboardStyles.weeklyAverageContainer}>
          <Text style={dashboardStyles.weeklyAverageLabel}>7-Day Average</Text>
          {loading ? (
            <Text style={dashboardStyles.weeklyAverageValue}>Loading...</Text>
          ) : weeklyAverage ? (
            <>
              <Text style={dashboardStyles.weeklyAverageValue}>
                {weeklyAverage.toFixed(1)} lbs
              </Text>
              <Text style={dashboardStyles.weeklyAverageChange}>
                {formatWeightChange(weeklyChange, hasPreviousWeekData)}
              </Text>
            </>
          ) : (
            <>
              <Text style={dashboardStyles.weeklyAverageValue}>-- lbs</Text>
              <Text style={dashboardStyles.weeklyAverageChange}>
                No data yet
              </Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
};
