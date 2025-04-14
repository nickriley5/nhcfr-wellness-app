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
        <Text style={styles.title}>Mood & Energy Trends</Text>
        <Text style={styles.placeholder}>No check-in data available yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mood & Energy Trends</Text>
      <LineChart
        data={{
          labels: moodData.map((_, index) => `D${index + 1}`),
          datasets: [
            {
              data: moodData,
              color: () => '#d32f2f',
              strokeWidth: 2,
            },
            {
              data: energyData,
              color: () => '#f57c00',
              strokeWidth: 2,
            },
          ],
          legend: ['Mood', 'Energy'],
        }}
        width={screenWidth - 32}
        height={220}
        chartConfig={{
          backgroundGradientFrom: '#1e1e1e',
          backgroundGradientTo: '#121212',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          labelColor: () => '#ccc',
          propsForDots: {
            r: '4',
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
    marginTop: 24,
    paddingHorizontal: 16,
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    color: '#d32f2f',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  placeholder: {
    color: '#999',
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 20,
  },
  chart: {
    borderRadius: 12,
  },
});

export default MoodEnergyChart;
