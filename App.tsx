import React from 'react';
import { NavigationContainer, NavigatorScreenParams } from '@react-navigation/native';
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
import RegisterScreen from './screens/RegisterScreen';
import MealPlanScreen from './screens/MealPlanScreen';
import CheckInScreen from './screens/CheckInScreen';
import DrawerNavigation from './navigation/DrawerNavigation';
import WorkoutDetailScreen from './screens/WorkoutDetailScreen';
import WorkoutHistoryScreen from './screens/WorkoutHistoryScreen';
import ProgressChartScreen from './screens/ProgressChartScreen';
import PRTrackerScreen from './screens/PRTrackerScreen';
import AdaptWorkoutScreen from './screens/AdaptWorkoutScreen';
import GoalsScreen from './screens/GoalsScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import ProgramPreviewScreen from './screens/ProgramPreviewScreen';

// Auth context
import { AuthProvider, useAuth } from './providers/AuthProvider';

// ----- Navigation Types -----
// Tab navigator (inside MainTabs)
export type TabParamList = {
  Home: undefined;
  Dashboard: undefined;
  MealPlan: undefined;
  Workout: undefined;
  Settings: undefined;
};

// Drawer navigator (inside Main stack)
export type RootDrawerParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>; // 🚀 allows nesting bottom tabs
  Profile: undefined;
  Settings: undefined;
};

// Root stack navigator
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: NavigatorScreenParams<RootDrawerParamList>;
  CheckIn: undefined;
  WorkoutDetail: { adapt?: boolean; from?: string } | undefined;
  AdaptWorkout: undefined;
  ExerciseLibrary: undefined;
  ExerciseDetail: { exerciseId: string };
  WorkoutHistory: undefined;
  ProgressChart: { exerciseName: string };
  PRTracker: undefined;
  Profile: undefined;
  Goals: undefined;
  EditProfile: undefined;
  ProgramPreview: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// ----- Bottom Tab Navigator -----
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
          return <MaterialCommunityIcons name="silverware-fork-knife" size={22} color={color} />;
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

// ----- App Navigator (Handles Auth & Flow) -----
const AppNavigator = () => {
  const { user, loading } = useAuth();
  const [profileComplete, setProfileComplete] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const fetchProfileStatus = async () => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          setProfileComplete(userSnap.data()?.profileComplete === true);
        } catch {
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
  <>
    <Stack.Screen name="Main" component={DrawerNavigation} />
    <Stack.Screen name="CheckIn" component={CheckInScreen} />
    <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
    <Stack.Screen name="ExerciseLibrary" component={require('./screens/ExerciseLibraryScreen').default} />
    <Stack.Screen name="ExerciseDetail" component={require('./screens/ExerciseDetailScreen').default} />
    <Stack.Screen name="WorkoutHistory" component={WorkoutHistoryScreen} />
    <Stack.Screen name="ProgressChart" component={ProgressChartScreen} />
    <Stack.Screen name="PRTracker" component={PRTrackerScreen} options={{ headerShown: false }} />
    <Stack.Screen name="AdaptWorkout" component={AdaptWorkoutScreen} />
    <Stack.Screen name="Goals" component={GoalsScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="ProgramPreview" component={ProgramPreviewScreen} />
  </>
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


// ----- App Entry Point -----
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
