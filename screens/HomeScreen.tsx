import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import {
  CompositeNavigationProp,
  NavigatorScreenParams,
} from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, TabParamList } from '../App';

import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getApp } from 'firebase/app';

type HomeScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<RootStackParamList, 'Main'>,
  BottomTabNavigationProp<TabParamList>
>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [userName, setUserName] = useState('Firefighter');

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const auth = getAuth(getApp());
        const db = getFirestore(getApp());
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const userDoc = await getDoc(doc(db, 'users', uid));
        const data = userDoc.data();
        if (data?.fullName) {
          const firstName = data.fullName.split(' ')[0];
          setUserName(firstName);
        }
      } catch (err) {
        console.error('Failed to fetch user name', err);
      }
    };

    fetchUserName();
  }, []);

  const quote = 'Discipline is choosing between what you want now and what you want most.';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.greeting}>Good morning, {userName}!</Text>
      <Text style={styles.quote}>"{quote}"</Text>

      {/* Meal Plan Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🍽️ Today’s Meal Plan</Text>
        <Text style={styles.cardText}>• Breakfast: Scrambled eggs + avocado</Text>
        <Text style={styles.cardText}>• Lunch: Grilled chicken salad</Text>
        <Text style={styles.cardText}>• Dinner: Salmon + roasted veggies</Text>
        <Pressable onPress={() => navigation.navigate('Main', { screen: 'MealPlan' })}>
          <Text style={styles.link}>View Full Plan →</Text>
        </Pressable>
      </View>

      {/* Workout Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🏋️ Today’s Workout</Text>
        <Text style={styles.cardText}>• 4 rounds:</Text>
        <Text style={styles.cardText}>- Push-ups x15</Text>
        <Text style={styles.cardText}>- Air squats x20</Text>
        <Text style={styles.cardText}>- Mountain climbers x30s</Text>
        <Text style={styles.cardText}>- Rest 1 min</Text>
        <Pressable onPress={() => navigation.navigate('Main', { screen: 'Dashboard' })}>
          <Text style={styles.link}>View Workout Details →</Text>
        </Pressable>
      </View>

      {/* Check In */}
      <Pressable style={styles.actionButton} onPress={() => navigation.navigate('CheckIn')}>
        <Text style={styles.actionText}>Check In</Text>
      </Pressable>

      {/* View Progress */}
      <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('Main', { screen: 'Dashboard' })}>
        <Text style={styles.secondaryText}>View My Progress</Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, // ✅ Ensures ScrollView fills screen even if content is short
    padding: 24,
    backgroundColor: '#121212', // ✅ Match your app background
    justifyContent: 'flex-start',
  },  
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  quote: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#ccc',
    marginBottom: 24,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1e1e1e',
    padding: 18,
    borderRadius: 14,
    marginBottom: 24,
    borderColor: '#2a2a2a',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#d32f2f',
    marginBottom: 10,
  },
  cardText: {
    color: '#eee',
    fontSize: 14,
    marginBottom: 4,
  },
  link: {
    marginTop: 12,
    color: '#d32f2f',
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 18,
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#d32f2f',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#d32f2f',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default HomeScreen;
