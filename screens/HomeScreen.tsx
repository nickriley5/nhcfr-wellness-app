import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  useColorScheme,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const HomeScreen = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const mealPlanScale = useRef(new Animated.Value(1)).current;
  const workoutScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (anim: Animated.Value) => {
    Animated.spring(anim, { toValue: 0.96, useNativeDriver: true }).start();
  };

  const handlePressOut = (anim: Animated.Value) => {
    Animated.spring(anim, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={['#0f2027', '#203a43', '#2c5364']}
        style={styles.container}
      >
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />

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
          <Text style={styles.title}>🚒 Firefighter Wellness App</Text>
          <Text style={styles.subtitle}>Train for duty. Fuel for life. 🔥</Text>

          <Animated.View style={{ transform: [{ scale: mealPlanScale }], width: '100%' }}>
            <Pressable
              onPressIn={() => handlePressIn(mealPlanScale)}
              onPressOut={() => handlePressOut(mealPlanScale)}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Generate Meal Plan</Text>
            </Pressable>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: workoutScale }], width: '100%' }}>
            <Pressable
              onPressIn={() => handlePressIn(workoutScale)}
              onPressOut={() => handlePressOut(workoutScale)}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Generate Workout</Text>
            </Pressable>
          </Animated.View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#d32f2f',
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
    textAlign: 'center',
    color: '#ccc',
    fontFamily: 'Inter-Regular',
  },
  button: {
    backgroundColor: '#d32f2f',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Medium',
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
});

export default HomeScreen;
