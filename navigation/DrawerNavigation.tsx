import React, { useEffect, useState } from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, Image, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import DashboardScreen from '../screens/DashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MealPlanScreen from '../screens/MealPlanScreen';
import WorkoutScreen from '../screens/WorkoutScreen';

import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

const CustomDrawerContent = (props: any) => {
  const [userName, setUserName] = useState('Firefighter');
const [profilePicture, setProfilePicture] = useState<string | null>(null);

  useEffect(() => {
    const fetchName = async () => {
      try {
        const auth = getAuth();
        const firestore = getFirestore();
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const userDoc = await getDoc(doc(firestore, 'users', uid));
        const data = userDoc.data();
        if (data?.fullName) {
          const firstName = data.fullName.split(' ')[0];
          setUserName(firstName);
        }
        if (data?.profilePicture) {
          setProfilePicture(data.profilePicture);
        }
      } catch (err) {
        console.error('Failed to load name:', err);
      }
    };

    fetchName();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
    } catch (err) {
      console.error('Logout failed:', err);
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
          onPress={() => props.navigation.navigate('Profile')}
        />
        <DrawerItem
          label="Settings"
          labelStyle={{ color: '#fff' }}
          icon={({ color, size }) => <Feather name="settings" color={color} size={size} />}
          onPress={() => props.navigation.navigate('Settings')}
        />
      </DrawerContentScrollView>

      {/* 👇 Logout section pinned to the bottom */}
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
};


const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#1e1e1e',
        borderTopWidth: 0,
        paddingBottom: 10,
        paddingTop: 10,
        height: 60,
      },
      tabBarActiveTintColor: '#d32f2f',
      tabBarInactiveTintColor: '#888',
      tabBarLabelStyle: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
      },
      tabBarIcon: ({ color, size }) => {
        const iconMap: { [key: string]: string } = {
          Dashboard: 'activity',
          MealPlan: 'silverware-fork-knife',
          Workout: 'weight-lifter',
        };

        const IconComponent = route.name === 'MealPlan' || route.name === 'Workout' ? MaterialCommunityIcons : Feather;
        const iconName = iconMap[route.name] || 'circle';

        return <IconComponent name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="MealPlan" component={MealPlanScreen} />
    <Tab.Screen name="Workout" component={WorkoutScreen} />
  </Tab.Navigator>
);

const DrawerNavigation = () => {
  return (
      <Drawer.Navigator
        initialRouteName="MainTabs"
        screenOptions={({ route }) => ({
          drawerStyle: { backgroundColor: '#1c1c1c' },
          drawerLabelStyle: { color: '#fff' },
          headerTintColor: '#fff',
          headerStyle: { backgroundColor: '#0f0f0f' },
          drawerIcon: ({ color, size }) => {
            const iconMap: { [key: string]: string } = {
              Profile: 'user',
              Settings: 'settings',
            };
            return iconMap[route.name] ? (
              <Feather name={iconMap[route.name]} size={size} color={color} />
            ) : null;
          },
        })}
        drawerContent={(props) => <CustomDrawerContent {...props} />}
      >
        <Drawer.Screen name="MainTabs" component={TabNavigator} options={{ drawerItemStyle: { height: 0 } }} />
        <Drawer.Screen name="Profile" component={ProfileScreen} />
        <Drawer.Screen name="Settings" component={SettingsScreen} />
      </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#1c1c1c',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 48,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#444',
  },
  profileName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutSection: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingVertical: 10,
    backgroundColor: '#1c1c1c',
  },  
});

export default DrawerNavigation;
