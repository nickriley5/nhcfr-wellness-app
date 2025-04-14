// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { NavigatorScreenParams } from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';


// Screens
import DashboardScreen from './screens/DashboardScreen';
import HomeScreen from './screens/HomeScreen';
import SettingsScreen from './screens/SettingsScreen';
import LoginScreen from './screens/LoginScreen';
import ProfileSetupScreen from './screens/ProfileSetupScreen';
import RegisterScreen from './screens/RegisterScreen';
import MealPlanScreen from './screens/MealPlanScreen';
import CheckInScreen from './screens/CheckInScreen'; // ✅ Add this


// Auth context
import { AuthProvider, useAuth } from './providers/AuthProvider';

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: NavigatorScreenParams<TabParamList> | undefined;
  ProfileSetup: undefined;
  MealPlan: undefined;
  CheckIn: undefined;
};

export type TabParamList = {
  Home: undefined;
  Dashboard: undefined;
  MealPlan: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const MainTabs = () => (
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
      tabBarIcon: ({ color }) => {
        if (route.name === 'MealPlan') {
          return (
            <MaterialCommunityIcons
              name="silverware-fork-knife"
              size={22}
              color={color}
            />
          );
        }

        const iconMap: { [key: string]: string } = {
          Home: 'home',
          Dashboard: 'activity',
          Settings: 'settings',
        };

        const iconName = iconMap[route.name] || 'circle';
        return <Feather name={iconName} size={20} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="MealPlan" component={MealPlanScreen} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const { user, loading } = useAuth();
  const [profileComplete, setProfileComplete] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const fetchProfileStatus = async () => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          const data = userSnap.data();
          setProfileComplete(data?.profileComplete === true);
        } catch (error) {
          console.error('Error fetching profileComplete:', error);
          setProfileComplete(false);
        }
      }
    };

    fetchProfileStatus();
  }, [user]);

  if (loading || (user && profileComplete === null)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        profileComplete ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="CheckIn" component={CheckInScreen} />
          </>
        ) : (
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        )
      ) : (
        <>
          <Stack.Screen name="Login">
            {() => (
              <View style={styles.splashWrapper}>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>NHCFR</Text>
                  <Text style={styles.tagline}>TRAIN FOR DUTY. FUEL FOR LIFE.</Text>
                </View>
                <View style={styles.loginCardWrapper}>
                  <LoginScreen />
                </View>
              </View>
            )}
          </Stack.Screen>
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

const App = () => (
  <AuthProvider>
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  </AuthProvider>
);

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashWrapper: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 4,
    fontFamily: 'sans-serif-condensed',
  },
  tagline: {
    fontSize: 14,
    color: '#d32f2f',
    fontWeight: '600',
    marginTop: 4,
  },
  loginCardWrapper: {
    flex: 1,
    justifyContent: 'flex-start',
    width: '100%',
  },
});

export default App;
