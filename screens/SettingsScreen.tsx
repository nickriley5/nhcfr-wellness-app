import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { auth, db } from '../firebase';
import { doc, deleteDoc } from 'firebase/firestore';

const SettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const goToDashboard = () => {
    navigation.navigate('AppDrawer', {
      screen: 'MainTabs',
      params: { screen: 'Dashboard' },
    });
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@firefighterwellnessapp.com');
  };

  const handleResetWorkoutPlan = () => {
    Alert.alert(
      'Manage Programs', 
      'What would you like to do with your workout programs?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive Programs',
          onPress: async () => {
            try {
              const uid = auth.currentUser?.uid;
              if (!uid) {
                Alert.alert('Error', 'Please log in again');
                return;
              }

              const { collection, getDocs, updateDoc, Timestamp } = await import('firebase/firestore');
              const aiProgramsRef = collection(db, 'users', uid, 'aiPrograms');
              const snapshot = await getDocs(aiProgramsRef);
              
              const archivePromises = snapshot.docs.map(docSnap => 
                updateDoc(docSnap.ref, {
                  isActive: false,
                  isArchived: true,
                  archivedAt: Timestamp.now(),
                })
              );
              await Promise.all(archivePromises);
              
              Alert.alert('Success', `Archived ${snapshot.size} program(s). You can resume them anytime from the Workout screen.`);
            } catch (error) {
              console.error('Error archiving programs:', error);
              Alert.alert('Error', 'Failed to archive programs. Please try again.');
            }
          },
        },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            Alert.alert(
              'Confirm Delete',
              'This will PERMANENTLY delete all programs. This cannot be undone. Continue?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete All',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const uid = auth.currentUser?.uid;
                      if (!uid) {
                        Alert.alert('Error', 'Please log in again');
                        return;
                      }

                      // Delete legacy active program
                      try {
                        await deleteDoc(doc(db, 'users', uid, 'program', 'active'));
                      } catch (err) {
                        // Ignore if doesn't exist
                      }
                      
                      // Delete all AI programs
                      const { collection, getDocs } = await import('firebase/firestore');
                      const aiProgramsRef = collection(db, 'users', uid, 'aiPrograms');
                      const snapshot = await getDocs(aiProgramsRef);
                      
                      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
                      await Promise.all(deletePromises);
                      
                      Alert.alert('Success', `Permanently deleted ${snapshot.size} program(s).`);
                    } catch (error) {
                      console.error('Error deleting programs:', error);
                      Alert.alert('Error', 'Failed to delete programs. Please try again.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleResetMealPlan = () => {
    Alert.alert('Reset Meal Plan', 'This will remove your current meal plan. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, Reset',
        style: 'destructive',
        onPress: async () => {
          try {
            const uid = auth.currentUser?.uid;
            if (!uid) {
              Alert.alert('Error', 'Please log in again');
              return;
            }

            await deleteDoc(doc(db, 'users', uid, 'mealPlan', 'active'));
            Alert.alert(
              'Success',
              'Meal plan has been reset. You can now create a new meal plan from the Goals screen.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    // Navigate back to dashboard to trigger refresh
                    navigation.goBack();
                  },
                },
              ]
            );
          } catch (error) {
            console.error('Error resetting meal plan:', error);
            Alert.alert('Error', 'Failed to reset meal plan. Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable style={styles.backButton} onPress={goToDashboard}>
        <Ionicons name="arrow-back" size={22} color="#fff" />
        <Text style={styles.backText}>Dashboard</Text>
      </Pressable>

      <Text style={styles.title}>⚙️ Settings</Text>

      {/* GOALS & PLANS */}
      <Section title="Goals & Plans">
        <SettingsButton icon="refresh" label="Reset Workout Plan" onPress={handleResetWorkoutPlan} />
        <SettingsButton icon="refresh" label="Reset Meal Plan" onPress={handleResetMealPlan} />
      </Section>

      {/* SUPPORT */}
      <Section title="Support & Feedback">
        <SettingsButton icon="mail" label="Contact Support" onPress={handleContactSupport} />
      </Section>

      {/* APP INFO */}
      <Section title="App Info">
        <SettingsButton icon="information-circle" label="Version 1.0.0" disabled />
      </Section>
    </ScrollView>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const SettingsButton = ({
  icon,
  label,
  onPress,
  disabled = false,
}: {
  icon: string;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}) => (
  <Pressable
    style={[styles.button, disabled && styles.buttonDisabled]}
    onPress={onPress}
    disabled={disabled}
  >
    <Ionicons name={icon} size={20} color="#4fc3f7" style={styles.icon} />
    <Text style={styles.buttonText}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 250, // Restored proper bottom padding
    backgroundColor: '#121212',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  backText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
    alignSelf: 'center',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#aaa',
    fontWeight: '600',
    marginBottom: 12,
    paddingLeft: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderColor: '#4fc3f7',
    borderWidth: 1,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  icon: {
    marginRight: 10,
  },
});

export default SettingsScreen;
