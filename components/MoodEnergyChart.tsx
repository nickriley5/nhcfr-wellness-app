import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const MoodEnergyChart = ({ moodData, energyData }: {
  moodData: number[];
  energyData: number[];
}) => {
  if (moodData.length === 0 || energyData.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.placeholder}>
          No check-in data available yet.{'\n'}
          Start logging your daily mood and energy levels to see trends.
        </Text>
      </View>
    );
  }
  // Generate date labels for the x-axis based on the number of data points
  // Assuming each data point represents a consecutive day, ending today
  const getDateLabels = (numDays: number) => {
    const labels: string[] = [];
    const today = new Date();
    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      // Format as M/D (e.g., 6/10)
      labels.push(`${date.getMonth() + 1}/${date.getDate()}`);
    }
    return labels;
  };

  const labels = getDateLabels(moodData.length);
  return (
    <View style={styles.container}>
      <LineChart
        data={{
          labels: labels,
          datasets: [
            {
              data: moodData,
              color: () => '#4FC3F7', // Blue for mood
              strokeWidth: 3,
            },
            {
              data: energyData,
              color: () => '#81C784', // Green for energy
              strokeWidth: 3,
            },
          ],
          legend: ['Mood', 'Energy'],
        }}
        width={screenWidth - 64}
        height={200}
        chartConfig={{
          backgroundGradientFrom: '#1f1f1f',
          backgroundGradientTo: '#1f1f1f',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          labelColor: () => '#aaa',
          propsForDots: {
            r: '5',
            strokeWidth: '2',
            stroke: '#fff',
          },
        }}
        bezier
        style={styles.chart}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent', // Let MoodEnergySection handle the container
    paddingVertical: 8,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholder: {
    color: '#aaa',
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 40,
    lineHeight: 20,
  },
  chart: {
    borderRadius: 12,
    marginVertical: 8,
  },
});

export default MoodEnergyChart;
