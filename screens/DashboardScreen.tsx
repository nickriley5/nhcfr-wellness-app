// screens/DashboardScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  useNavigation,
  CompositeNavigationProp,
} from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { signOut } from 'firebase/auth';
import { auth, firestore } from '../firebase';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  DocumentData,
} from 'firebase/firestore';
import { TabParamList, RootStackParamList } from '../App';
import MoodEnergyChart from '../components/MoodEnergyChart';

interface CheckInEntry extends DocumentData {
  id: string;
  mood: number;
  energy: number;
  timestamp: Date;
}

// Composite prop to navigate tabs and stack
type DashboardNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Dashboard'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardNavProp>();
  const [view, setView] = useState<'week' | 'month' | 'all'>('week');
  const [moodData, setMoodData] = useState<number[]>([]);
  const [energyData, setEnergyData] = useState<number[]>([]);
  const [hasCheckedInToday, setHasCheckedInToday] = useState<boolean>(true);

  useEffect(() => {
    const fetchCheckIns = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
          collection(firestore, 'checkins'),
          where('uid', '==', user.uid),
          orderBy('timestamp', 'desc')
        );
        const snapshot = await getDocs(q);

        let entries: CheckInEntry[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            mood: data.mood ?? 0,
            energy: data.energy ?? 0,
            timestamp: data.timestamp?.toDate() || new Date(0),
          };
        });

        const today = new Date();
        if (
          !entries[0] ||
          entries[0].timestamp.toDateString() !== today.toDateString()
        ) {
          setHasCheckedInToday(false);
        }

        if (view === 'week') entries = entries.slice(0, 7);
        else if (view === 'month') entries = entries.slice(0, 30);

        entries.reverse();
        setMoodData(entries.map(e => e.mood));
        setEnergyData(entries.map(e => e.energy));
      } catch (err) {
        console.error(err);
      }
    };

    fetchCheckIns();
  }, [view]);

  const QuickViews = () => (
    <View style={styles.quickContainer}>
      <View style={styles.quickCard}>
        <Text style={styles.quickTitle}>🍽️ Next Meal</Text>
        <Text style={styles.quickDetail}>Grilled chicken, rice, broccoli</Text>
      </View>
      {/* ✅ FIXED: Corrected navigation call to WorkoutDetail (not nested incorrectly) */}
      <Pressable
        style={styles.quickCard}
        onPress={() => navigation.navigate('WorkoutDetail')}
      >
        <Text style={styles.quickTitle}>🏋️ Today's Workout</Text>
        <Text style={styles.quickDetail}>Kettlebell circuit & mobility</Text>
        <Text style={styles.quickHint}>Tap to view full workout</Text>
      </Pressable>
    </View>
  );

  return (
    <LinearGradient
      colors={['#0f0f0f', '#1c1c1c', '#121212']}
      style={styles.screen}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Your Dashboard</Text>
        <Text style={styles.subheader}>Train for duty. Fuel for life. 🔥</Text>

        {!hasCheckedInToday && (
          <View style={styles.reminderCard}>
            <Text style={styles.reminderText}>
              Don't forget to check in today!
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mood & Energy Trends</Text>
          <View style={styles.toggleGroup}>
            {(['week', 'month', 'all'] as const).map(key => (
              <Pressable
                key={key}
                style={[
                  styles.toggleButton,
                  view === key && styles.toggleActive,
                ]}
                onPress={() => setView(key)}
              >
                <Text style={styles.toggleText}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
          <MoodEnergyChart moodData={moodData} energyData={energyData} />
        </View>

        {!hasCheckedInToday && (
          <Pressable
            style={[styles.actionButton, styles.checkInButton]}
            onPress={() => navigation.navigate('CheckIn')}
          >
            <Text style={styles.actionText}>Check In Now</Text>
          </Pressable>
        )}

        <QuickViews />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 AI Coach</Text>
          <Text style={styles.sectionText}>
            Personalized fitness & recovery tips coming soon.
          </Text>
        </View>

        <Pressable
          style={styles.actionButton}
          onPress={() => navigation.navigate('MealPlan')}
        >
          <Text style={styles.actionText}>Generate Meal Plan</Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => navigation.navigate('WorkoutDetail')}
        >
          <Text style={styles.actionText}>Generate Workout</Text>
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 24, alignItems: 'center' },

  header: { fontSize: 26, fontWeight: '700', color: '#d32f2f', marginBottom: 4 },
  subheader: { fontSize: 16, color: '#ccc', marginBottom: 16 },

  reminderCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 20,
  },
  reminderText: { color: '#ffd54f', textAlign: 'center' },

  section: { width: '100%', marginBottom: 24 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#d32f2f',
    marginBottom: 12,
    textAlign: 'center',
  },
  sectionText: { fontSize: 14, color: '#ccc' },

  toggleGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleButton: {
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  toggleActive: { backgroundColor: '#d32f2f' },
  toggleText: { color: '#fff', fontSize: 14 },

  quickContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  quickCard: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d32f2f',
    marginBottom: 4,
  },
  quickDetail: { fontSize: 14, color: '#ccc' },
  quickHint: { fontSize: 12, color: '#aaa', marginTop: 6 },

  actionButton: {
    width: '100%',
    backgroundColor: '#d32f2f',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  actionText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  checkInButton: { backgroundColor: '#388e3c' },
});

export default DashboardScreen;
