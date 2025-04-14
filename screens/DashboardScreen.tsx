import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { signOut } from 'firebase/auth';
import { auth, firestore } from '../firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

const DashboardScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [recentCheckIns, setRecentCheckIns] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecentCheckIns = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const checkInRef = collection(firestore, 'checkins');
        const q = query(
          checkInRef,
          where('uid', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(3)
        );

        const snapshot = await getDocs(q);
        const checkIns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecentCheckIns(checkIns);
      } catch (error) {
        console.error('Error fetching check-ins:', error);
      }
    };

    fetchRecentCheckIns();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <LinearGradient
      colors={['#0f0f0f', '#1c1c1c', '#121212']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.card}>
        <Text style={styles.header}>Firefighter Wellness App</Text>
        <Text style={styles.subtext}>Train for duty. Fuel for life. 🔥</Text>

        {recentCheckIns.length > 0 && (
          <View style={styles.checkInCard}>
            <Text style={styles.sectionTitle}>Recent Check-ins</Text>
            {recentCheckIns.map((checkIn, index) => (
              <Text key={index} style={styles.checkInText}>
                • Mood: {checkIn.mood} | Energy: {checkIn.energy}
              </Text>
            ))}
          </View>
        )}

        <Pressable style={styles.button} onPress={() => navigation.navigate('MealPlan')}>
          <Text style={styles.buttonText}>Generate Meal Plan</Text>
        </Pressable>

        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Generate Workout</Text>
        </Pressable>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#121212',
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  checkInCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    width: '100%',
  },
  checkInText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 6,
  },
  button: {
    backgroundColor: '#d32f2f',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 20,
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default DashboardScreen;
