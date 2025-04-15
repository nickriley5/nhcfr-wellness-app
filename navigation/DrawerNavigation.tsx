import React from 'react';
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

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

const CustomDrawerContent = (props: any) => {
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContainer}>
      <View style={styles.profileSection}>
        <Image
          source={require('../assets/profile-placeholder.png')}
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>Welcome, Firefighter</Text>
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
            return <Feather name={iconMap[route.name] || 'circle'} size={size} color={color} />;
          },
        })}
        drawerContent={(props) => <CustomDrawerContent {...props} />}
      >
        <Drawer.Screen name="MainTabs" component={TabNavigator} options={{ title: 'Home' }} />
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
  },
  profileName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DrawerNavigation;
