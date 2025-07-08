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

const SettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@firefighterwellnessapp.com');
  };

  const handleResetWorkoutPlan = () => {
    Alert.alert('Reset Workout Plan', 'This will remove your current workout program. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes, Reset', onPress: () => console.log('Reset workout logic here') },
    ]);
  };

  const handleResetMealPlan = () => {
    Alert.alert('Reset Meal Plan', 'This will remove your current meal plan. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes, Reset', onPress: () => console.log('Reset meal plan logic here') },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>⚙️ Settings</Text>

      {/* GOALS & PLANS */}
      <Section title="Goals & Plans">
        <SettingsButton
          icon="trending-up"
          label="Update Fitness & Diet Goals"
          onPress={() => navigation.navigate('Goals')}
        />
        <SettingsButton icon="refresh" label="Reset Workout Plan" onPress={handleResetWorkoutPlan} />
        <SettingsButton icon="nutrition" label="Reset Meal Plan" onPress={handleResetMealPlan} />
      </Section>

      {/* PREFERENCES */}
      <Section title="Preferences">
        <SettingsButton icon="moon" label="Dark Mode (Auto)" onPress={() => {}} />
        <SettingsButton icon="swap-horizontal" label="Units: Imperial" onPress={() => {}} />
      </Section>

      {/* SUPPORT */}
      <Section title="Support & Feedback">
        <SettingsButton icon="mail" label="Contact Support" onPress={handleContactSupport} />
        <SettingsButton icon="document-text" label="Privacy Policy" onPress={() => console.log('Open privacy policy')} />
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
    paddingBottom: 80,
    backgroundColor: '#121212',
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
