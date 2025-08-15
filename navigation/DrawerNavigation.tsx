import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigatorScreenParams } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useSafeAreaInsets} from 'react-native-safe-area-context';

// Screens
import DashboardScreen from '../screens/DashboardScreen_NEW';
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

  useEffect(() => {
    (async () => {
      const auth = getAuth();
      const firestore = getFirestore();
      const uid = auth.currentUser?.uid;
      if (!uid) {return;}
      try {
        const snap = await getDoc(doc(firestore, 'users', uid));
        const data = snap.data();
        if (data?.fullName) {setUserName(data.fullName.split(' ')[0]);}
        if (data?.profilePicture) {setProfilePicture(data.profilePicture);}
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) {return 'Good morning';}
    if (hr < 18) {return 'Good afternoon';}
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
    <View style={styles.drawerRoot}>
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
      <View style={styles.logoutSection}>
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
  flex1: { flex: 1 },
  drawerRoot: { flex: 1, justifyContent: 'space-between' },
  drawerContainer: { flex: 1, backgroundColor: '#1c1c1c' },
  profileSection: { alignItems: 'center', marginBottom: 24, paddingTop: 48 },
  profileImage: { width: 80, height: 80, borderRadius: 40, marginBottom: 12, borderWidth: 1.5, borderColor: '#444' },
  profileName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  logoutSection: { borderTopWidth: 1, borderTopColor: '#333', paddingVertical: 10, backgroundColor: '#1c1c1c' },
  drawerLabel: { color: '#fff' },
});
