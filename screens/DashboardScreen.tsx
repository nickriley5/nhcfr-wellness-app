import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const DashboardScreen = () => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <LinearGradient
      colors={['#0f2027', '#203a43', '#2c5364']}
      style={styles.container}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDarkMode ? '#1a1a1aee' : '#ffffff',
            borderWidth: 1,
            borderColor: isDarkMode ? '#333' : '#eee',
          },
        ]}
      >
        <Text style={styles.title}>📊 Dashboard</Text>
        <Text style={styles.description}>
          Overview of your fitness and nutrition progress.
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
  },
  card: {
    padding: 24,
    borderRadius: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#d32f2f',
    fontFamily: 'Poppins-Bold',
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
});

export default DashboardScreen;