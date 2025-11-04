import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigatorScreenParams, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useSafeAreaInsets} from 'react-native-safe-area-context';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Meal Plan flow screens
import MealPlanScreen from '../screens/MealPlanScreen';


// ----- Bottom Tabs -----
export type TabParamList = {
  Dashboard: undefined;
  MealPlan: undefined;
  Workout: undefined;
};
const Tab = createBottomTabNavigator<TabParamList>();



const iconMap: Record<string, string> = {
  Dashboard: 'activity',
  MealPlan: 'silverware-fork-knife',
  Workout: 'target',
};

function getTabBarIcon(routeName: string) {
  return ({ color, size }: { color: string; size: number }) => {
    const IconComponent = routeName === 'MealPlan'
      ? MaterialCommunityIcons
      : Feather;
    return <IconComponent name={iconMap[routeName] || 'circle'} size={size} color={color} />;
  };
}

const TabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets(); // ← this gets the bottom padding

  return (
    <View style={[styles.flex1, { paddingBottom: insets.bottom }]}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#1e1e1e',
            borderTopWidth: 0,
            paddingVertical: 10,
            height: 25 + insets.bottom, // make room for gesture nav
            paddingBottom: insets.bottom,
          },
          tabBarActiveTintColor: '#d32f2f',
          tabBarInactiveTintColor: '#888',
          tabBarLabelStyle: { fontFamily: 'Inter-Medium', fontSize: 12 },
          tabBarIcon: getTabBarIcon(route.name),
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen
  name="MealPlan"
  component={MealPlanScreen}
  options={{ title: 'Meal Plan' }}
/>

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
// Icon renderers moved outside the component to avoid defining components during render
const renderProfileIcon = ({ color, size }: { color: string; size: number }) => (
  <Feather name="user" color={color} size={size} />
);
const renderSettingsIcon = ({ color, size }: { color: string; size: number }) => (
  <Feather name="settings" color={color} size={size} />
);
const renderLogoutIcon = ({ color, size }: { color: string; size: number }) => (
  <Feather name="log-out" color={color} size={size} />
);

export function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { navigation } = props;
  const [userName, setUserName] = useState('Firefighter');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const loadUserData = async () => {
    const auth = getAuth();
    const firestore = getFirestore();
    const uid = auth.currentUser?.uid;
    
    // Early return if no user - clear data and don't fetch
    if (!uid) {
      setUserName('Firefighter');
      setProfilePicture(null);
      return;
    }
    
    try {
      const snap = await getDoc(doc(firestore, 'users', uid));
      
      // Double-check auth after async operation
      if (!auth.currentUser) {
        return;
      }
      
      const data = snap.data();
      console.log('Drawer - Loading user data:', data);
      if (data?.fullName) {setUserName(data.fullName.split(' ')[0]);}
      if (data?.profilePicture) {
        console.log('Drawer - Setting profile picture:', data.profilePicture);
        setProfilePicture(data.profilePicture);
      }
    } catch (err) {
      // Only log error if user is still authenticated (not a logout race)
      if (auth.currentUser) {
        console.error('Drawer - Error loading user data:', err);
      }
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // Listen for navigation focus to refresh profile data
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Drawer focused - reloading user data');
      loadUserData();
    }, [])
  );

  // Listen for drawer state changes using props
  useEffect(() => {
    console.log('🔄 Drawer mounted - loading user data');
    loadUserData();
  }, [props.state]);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) {return 'Good morning';}
    if (hr < 18) {return 'Good afternoon';}
    return 'Good evening';
  };

  const handleLogout = async () => {
    try {
      // Clear local state before signing out
      setUserName('Firefighter');
      setProfilePicture(null);
      
      // Sign out from Firebase
      await signOut(getAuth());
      
      // Navigation will automatically redirect to login via AuthProvider
      console.log('🔒 User signed out successfully');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <View style={styles.drawerRoot}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContainer}>
        <View style={styles.profileSection}>
          <Image
            source={{ uri: profilePicture || 'https://via.placeholder.com/100' }}
            style={styles.profileImage}
            key={profilePicture || 'placeholder'} // Force re-render when URL changes
          />
          <Text style={styles.profileName}>{`${getGreeting()}, ${userName}!`}</Text>
        </View>
        <DrawerItem
          label="Profile"
          labelStyle={styles.drawerLabel}
          icon={renderProfileIcon}
          onPress={() => navigation.navigate('Profile')}
        />
        <DrawerItem
          label="Settings"
          labelStyle={styles.drawerLabel}
          icon={renderSettingsIcon}
          onPress={() => navigation.navigate('Settings')}
        />
      </DrawerContentScrollView>
      <View style={[styles.logoutSection, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <DrawerItem
          label="Logout"
          labelStyle={styles.drawerLabel}
          icon={renderLogoutIcon}
          onPress={handleLogout}
        />
      </View>
    </View>
  );
}

// Drawer navigator component
// Move this function outside the DrawerNavigation component
const renderCustomDrawerContent = (props: DrawerContentComponentProps) => <CustomDrawerContent {...props} />;

const DrawerNavigation: React.FC = () => (
  <Drawer.Navigator
    initialRouteName="MainTabs"
    drawerContent={renderCustomDrawerContent}
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
  flex1: { flex: 1, backgroundColor: '#0f0f0f' },
  drawerRoot: { flex: 1, justifyContent: 'space-between' },
  drawerContainer: { flex: 1, backgroundColor: '#1c1c1c' },
  profileSection: { alignItems: 'center', marginBottom: 24, paddingTop: 48 },
  profileImage: { width: 80, height: 80, borderRadius: 40, marginBottom: 12, borderWidth: 1.5, borderColor: '#444' },
  profileName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  logoutSection: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingVertical: 10,
    backgroundColor: '#1c1c1c',
    marginBottom: 10, // Add margin to keep it away from bottom
  },
  drawerLabel: { color: '#fff' },
});
