import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const WeighInScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Weigh-In Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 20,
  },
});

export default WeighInScreen;
