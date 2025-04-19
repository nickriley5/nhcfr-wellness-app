// screens/WorkoutScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useProgram } from '../src/hooks/useProgram';
import { RootStackParamList } from '../App';

const WorkoutScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { program, loading, error, generateProgram } = useProgram();

  const [showFilters, setShowFilters] = useState(false);
  const [selectedTime, setSelectedTime] = useState('20');
  const [selectedEquipment, setSelectedEquipment] = useState('None');
  const [selectedIntensity, setSelectedIntensity] = useState('Medium');

  // Show any hook errors
  useEffect(() => {
    if (error) Alert.alert('Error', error);
  }, [error]);

  const onQuickGenerate = () => {
    Alert.alert(
      'Workout Generated',
      `Duration: ${selectedTime} min\nEquipment: ${selectedEquipment}\nIntensity: ${selectedIntensity}`
    );
  };

  const onGenerateProgram = async () => {
    try {
      await generateProgram();
      navigation.navigate('Main', {
        screen: 'MainTabs',
        params: { screen: 'Workout' },
      });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </LinearGradient>
    );
  }

  const hasProgram = !!program;

  return (
    <LinearGradient colors={['#0f0f0f', '#1c1c1c']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🏋️‍♂️ Workout Hub</Text>
        <Text style={styles.subtitle}>Train smart. Recover better. Perform longer.</Text>

        <View style={styles.divider} />

        {/* Quick‑Workout Generator */}
        <Pressable
          style={styles.dropdownToggle}
          onPress={() => setShowFilters(v => !v)}
        >
          <Ionicons
            name={showFilters ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#fff"
          />
          <Text style={styles.dropdownText}>Quick Workout Generator</Text>
        </Pressable>

        {showFilters && (
          <View style={styles.filterBox}>
            <Text style={styles.filterHeader}>Duration</Text>
            <View style={styles.buttonGroup}>
              {['10', '20', '30'].map(time => (
                <Pressable
                  key={time}
                  style={[
                    styles.filterButton,
                    selectedTime === time && styles.filterButtonSelected,
                  ]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Text style={styles.filterButtonText}>{time} min</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.filterHeader}>Equipment</Text>
            <View style={styles.buttonGroup}>
              {['None', 'Kettlebell', 'Bands'].map(eq => (
                <Pressable
                  key={eq}
                  style={[
                    styles.filterButton,
                    selectedEquipment === eq && styles.filterButtonSelected,
                  ]}
                  onPress={() => setSelectedEquipment(eq)}
                >
                  <Text style={styles.filterButtonText}>{eq}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.filterHeader}>Intensity</Text>
            <View style={styles.buttonGroup}>
              {['Low', 'Medium', 'High'].map(level => (
                <Pressable
                  key={level}
                  style={[
                    styles.filterButton,
                    selectedIntensity === level && styles.filterButtonSelected,
                  ]}
                  onPress={() => setSelectedIntensity(level)}
                >
                  <Text style={styles.filterButtonText}>{level}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.generateButton} onPress={onQuickGenerate}>
              <Ionicons name="flash-outline" size={20} color="#fff" style={styles.icon} />
              <Text style={styles.buttonText}>Generate Quick Workout</Text>
            </Pressable>
          </View>
        )}

        {/* Main Program Card */}
        {hasProgram ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Current Program</Text>
            <Text style={styles.cardText}>
              Day {program!.currentDay}: {program!.days[program!.currentDay - 1].title}
            </Text>
            <Pressable
              style={styles.primaryButton}
              onPress={() => navigation.navigate('WorkoutDetail')}
            >
              <Text style={styles.buttonText}>View Today's Workout</Text>
            </Pressable>
            <Pressable
              style={styles.primaryButton}
              onPress={() => navigation.navigate('AdaptWorkout')}
            >
              <Text style={styles.buttonText}>Adapt Today’s Workout</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.primaryButton} onPress={onGenerateProgram}>
            <Ionicons name="flash" size={20} color="#fff" style={styles.icon} />
            <Text style={styles.buttonText}>Generate Program</Text>
          </Pressable>
        )}

        {/* Utility Buttons */}
        <Pressable
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('ExerciseLibrary')}
        >
          <Ionicons name="book" size={20} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Exercise Library</Text>
        </Pressable>
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
    marginVertical: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 16,
    textAlign: 'center',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#333',
    marginVertical: 12,
  },
  dropdownToggle: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#d32f2f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  dropdownText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  filterBox: {
    width: '100%',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  filterHeader: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 12,
  },
  filterButton: {
    backgroundColor: '#444',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    margin: 4,
  },
  filterButtonSelected: {
    backgroundColor: '#d32f2f',
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d32f2f',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'center',
  },
  icon: {
    marginRight: 8,
  },
  card: {
    width: '100%',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#d32f2f',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 12,
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#d32f2f',
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  secondaryButton: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#d32f2f',
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

export default WorkoutScreen;
