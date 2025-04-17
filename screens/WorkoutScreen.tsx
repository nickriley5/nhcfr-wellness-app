// /screens/WorkoutScreen.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import Ionicons from 'react-native-vector-icons/Ionicons';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const WorkoutScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();

  return (
    <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Workout Hub</Text>
        <Text style={styles.subtitle}>Train smart. Recover better. Perform longer.</Text>

        {/* Generate Workout Placeholder */}
        <Pressable style={styles.button} onPress={() => {}}>
          <Ionicons name="flash" size={20} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Generate AI Workout</Text>
        </Pressable>

        {/* Go to Exercise Library */}
        <Pressable
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate('ExerciseLibrary')}
        >
          <Ionicons name="book" size={20} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Explore Exercise Library</Text>
        </Pressable>

        {/* Motivational / AI Coach Placeholder */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔥 AI Coach</Text>
          <Text style={styles.cardText}>
            Workout insights and personalized guidance coming soon.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#d32f2f',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#d32f2f',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginBottom: 16,
    width: '100%',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: '#444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  icon: {
    marginRight: 8,
  },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginTop: 16,
  },
  cardTitle: {
    fontSize: 18,
    color: '#d32f2f',
    fontWeight: '600',
    marginBottom: 6,
  },
  cardText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default WorkoutScreen;
