import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigatorScreenParams } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import MainTabs from '../App';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Meal Plan flow screens
import GoalSettingsScreen from '../screens/GoalSettingsScreen';
import DietStyleSelectionScreen from '../screens/DietStyleSelectionScreen';
import MealPlanScreen from '../screens/MealPlanScreen';

// ----- Stack for Meal Plan flow -----
export type MealPlanStackParamList = {
  GoalSettings: undefined;
  DietStyleSelection: undefined;
  MealPlan: undefined;
};
const MealPlanStack = createNativeStackNavigator<MealPlanStackParamList>();

// ----- Bottom Tabs -----
export type TabParamList = {
  Dashboard: undefined;
  MealPlan: NavigatorScreenParams<MealPlanStackParamList>;
  Workout: undefined;
};
const Tab = createBottomTabNavigator<TabParamList>();



const TabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets(); // ← this gets the bottom padding

  return (
    <View style={{ flex: 1, paddingBottom: insets.bottom }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#1e1e1e',
            borderTopWidth: 0,
            paddingVertical: 10,
            height: 25+ insets.bottom, // make room for gesture nav
            paddingBottom: insets.bottom,
          },
          tabBarActiveTintColor: '#d32f2f',
          tabBarInactiveTintColor: '#888',
          tabBarLabelStyle: { fontFamily: 'Inter-Medium', fontSize: 12 },
          tabBarIcon: ({ color, size }) => {
            const iconMap: Record<string, string> = {
              Dashboard: 'activity',
              MealPlan: 'silverware-fork-knife',
              Workout: 'target',

            };
            const IconComponent = route.name === 'MealPlan'
              ? MaterialCommunityIcons
              : Feather;
            return <IconComponent name={iconMap[route.name] || 'circle'} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="MealPlan" options={{ title: 'Meal Plan' }}>
          {() => (
            <MealPlanStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="GoalSettings">
              <MealPlanStack.Screen name="GoalSettings" component={GoalSettingsScreen} />
              <MealPlanStack.Screen name="DietStyleSelection" component={DietStyleSelectionScreen} />
              <MealPlanStack.Screen name="MealPlan" component={MealPlanScreen} />
            </MealPlanStack.Navigator>
          )}
        </Tab.Screen>
        <Tab.Screen name="Workout" component={WorkoutScreen} />
      </Tab.Navigator>
    </View>
  );
};


// ----- Drawer -----
export type RootDrawerParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  Profile: undefined;
  Settings: undefined;
};
const Drawer = createDrawerNavigator<RootDrawerParamList>();

// Custom drawer content
export function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { navigation } = props;
  const [userName, setUserName] = useState('Firefighter');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const auth = getAuth();
      const firestore = getFirestore();
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      try {
        const snap = await getDoc(doc(firestore, 'users', uid));
        const data = snap.data();
        if (data?.fullName) setUserName(data.fullName.split(' ')[0]);
        if (data?.profilePicture) setProfilePicture(data.profilePicture);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleLogout = async () => {
    try {
      await signOut(getAuth());
      navigation.navigate('Profile');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'space-between' }}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContainer}>
        <View style={styles.profileSection}>
          <Image
            source={{ uri: profilePicture || 'https://via.placeholder.com/100' }}
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>{`${getGreeting()}, ${userName}!`}</Text>
        </View>
        <DrawerItem
          label="Profile"
          labelStyle={{ color: '#fff' }}
          icon={({ color, size }) => <Feather name="user" color={color} size={size} />}
          onPress={() => navigation.navigate('Profile')}
        />
        <DrawerItem
          label="Settings"
          labelStyle={{ color: '#fff' }}
          icon={({ color, size }) => <Feather name="settings" color={color} size={size} />}
          onPress={() => navigation.navigate('Settings')}
        />
      </DrawerContentScrollView>
      <View style={styles.logoutSection}>
        <DrawerItem
          label="Logout"
          labelStyle={{ color: '#fff' }}
          icon={({ color, size }) => <Feather name="log-out" color={color} size={size} />}
          onPress={handleLogout}
        />
      </View>
    </View>
  );
}

// Drawer navigator component
const DrawerNavigation: React.FC = () => (
  <Drawer.Navigator
    initialRouteName="MainTabs"
    drawerContent={(props) => <CustomDrawerContent {...props} />}
    screenOptions={{
  headerShown: true,
  headerStyle: { backgroundColor: '#1e1e1e' },
  headerTintColor: '#fff',
  drawerStyle: { backgroundColor: '#1c1c1c' },
  drawerLabelStyle: { color: '#fff' },
}}
  >
    <Drawer.Screen
  name="MainTabs"
  options={{
    drawerItemStyle: { height: 0 },
    title: '', // ← hides label text if anything sneaks through
    drawerLabel: () => null, // ← fully removes the label rendering
  }}
>
  {() => <TabNavigator />}
</Drawer.Screen>
    <Drawer.Screen name="Profile" component={ProfileScreen} />
    <Drawer.Screen name="Settings" component={SettingsScreen} />
  </Drawer.Navigator>
);

export default DrawerNavigation;

const styles = StyleSheet.create({
  drawerContainer: { flex: 1, backgroundColor: '#1c1c1c' },
  profileSection: { alignItems: 'center', marginBottom: 24, paddingTop: 48 },
  profileImage: { width: 80, height: 80, borderRadius: 40, marginBottom: 12, borderWidth: 1.5, borderColor: '#444' },
  profileName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  logoutSection: { borderTopWidth: 1, borderTopColor: '#333', paddingVertical: 10, backgroundColor: '#1c1c1c' },
});
