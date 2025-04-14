import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { signOut } from 'firebase/auth';
import { auth, firestore } from '../firebase';
import { collection, getDocs, query, where, orderBy, DocumentData } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import MoodEnergyChart from '../components/MoodEnergyChart';

interface CheckInEntry extends DocumentData {
  id: string;
  mood: number;
  energy: number;
  timestamp: any;
}

const DashboardScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [view, setView] = useState<'week' | 'month' | 'all'>('week');
  const [moodData, setMoodData] = useState<number[]>([]);
  const [energyData, setEnergyData] = useState<number[]>([]);

  useEffect(() => {
    const fetchCheckIns = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const checkInRef = collection(firestore, 'checkins');
        const q = query(
          checkInRef,
          where('uid', '==', user.uid),
          orderBy('timestamp', 'desc')
        );

        const snapshot = await getDocs(q);
        let checkIns: CheckInEntry[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            mood: data.mood ?? 0,
            energy: data.energy ?? 0,
            timestamp: data.timestamp?.toDate() || new Date(0)
          };
        });

        if (view === 'week') checkIns = checkIns.slice(0, 7);
        else if (view === 'month') checkIns = checkIns.slice(0, 30);
        // else 'all' shows everything

        checkIns.reverse();
        setMoodData(checkIns.map(entry => entry.mood));
        setEnergyData(checkIns.map(entry => entry.energy));
      } catch (error) {
        console.error('Error fetching check-ins:', error);
      }
    };

    fetchCheckIns();
  }, [view]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <LinearGradient colors={['#0f0f0f', '#1c1c1c', '#121212']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.card}>
        <Text style={styles.header}>Firefighter Wellness App</Text>
        <Text style={styles.subtext}>Train for duty. Fuel for life. 🔥</Text>

        {/* Toggle buttons */}
        <View style={styles.toggleContainer}>
          <Pressable
            style={[styles.toggleButton, view === 'week' && styles.toggleActive]}
            onPress={() => setView('week')}
          >
            <Text style={styles.toggleText}>Week</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleButton, view === 'month' && styles.toggleActive]}
            onPress={() => setView('month')}
          >
            <Text style={styles.toggleText}>Month</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleButton, view === 'all' && styles.toggleActive]}
            onPress={() => setView('all')}
          >
            <Text style={styles.toggleText}>All</Text>
          </Pressable>
        </View>

        <MoodEnergyChart moodData={moodData} energyData={energyData} />

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
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  toggleButton: {
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  toggleActive: {
    backgroundColor: '#d32f2f',
  },
  toggleText: {
    color: '#fff',
    fontSize: 14,
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
