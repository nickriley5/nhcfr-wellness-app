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
  const [userName, setUserName] = useState<string>('');
  const [hasCheckedInToday, setHasCheckedInToday] = useState<boolean>(true);

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

        const today = new Date();
        const latestCheckIn = checkIns[0]?.timestamp;
        if (!latestCheckIn || latestCheckIn.toDateString() !== today.toDateString()) {
          setHasCheckedInToday(false);
        }

        if (view === 'week') checkIns = checkIns.slice(0, 7);
        else if (view === 'month') checkIns = checkIns.slice(0, 30);

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
        <Text style={styles.header}>Your Dashboard</Text>
        <Text style={styles.subtext}>Train for duty. Fuel for life. 🔥</Text>

        {!hasCheckedInToday && (
          <View style={styles.reminderCard}>
            <Text style={styles.reminderText}>Don't forget to check in today!</Text>
          </View>
        )}

        {/* Toggle buttons now below the section title */}
        <Text style={styles.sectionHeader}>Mood & Energy Trends</Text>

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

        {/* Coming soon card */}
        <View style={styles.comingSoonCard}>
          <Text style={styles.sectionHeader}>💡 AI Coach</Text>
          <Text style={styles.sectionText}>Personalized fitness & recovery tips coming soon.</Text>
        </View>

        <Pressable style={styles.button} onPress={() => navigation.navigate('MealPlan')}>
          <Text style={styles.buttonText}>Generate Meal Plan</Text>
        </Pressable>

        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Generate Workout</Text>
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
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 16,
  },
  reminderCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  reminderText: {
    color: '#ffd54f',
    fontSize: 14,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: -20,
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
  comingSoonCard: {
    backgroundColor: '#292929',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    width: '100%',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 8,
    textAlign: 'center'
  },
  sectionText: {
    fontSize: 14,
    color: '#ccc',
  },
});

export default DashboardScreen;
