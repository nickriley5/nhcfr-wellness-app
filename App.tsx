import React from 'react';
import { NavigationContainer, NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { ProgramDay } from './types/Exercise';
import Toast from 'react-native-toast-message';




// Screens
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
import ProgramListScreen from './screens/ProgramListScreen';
import ProgramPreviewScreen from './screens/ProgramPreviewScreen';
import MacroCalculatorScreen from './screens/MacroCalculatorScreen';
import GoalSettingsScreen from './screens/GoalSettingsScreen';
import MacroPlanOverviewScreen from './screens/MacroPlanOverviewScreen';


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
  MainTabs: NavigatorScreenParams<TabParamList>;
  Login: undefined;
  Register: undefined;
  AppDrawer: NavigatorScreenParams<RootDrawerParamList>;
  CheckIn: undefined;
  WorkoutDetail: {
    day: ProgramDay;
    weekIdx: number;
    dayIdx: number;
    adapt?: boolean;
  };
  AdaptWorkout: undefined;
  ExerciseLibrary: undefined;
  ExerciseDetail: { exerciseId: string };
  WorkoutHistory: undefined;
  ProgressChart: { exerciseName: string };
  PRTracker: undefined;
  Profile: undefined;
  Goals: undefined;
  EditProfile: undefined;
  ProgramList: undefined;
  ProgramSelection: undefined;
  ProgramPreview: { programId: string };
  MacroCalculator: undefined;
  MealPlan: undefined;
  MealGoalSettings: undefined;
  DietStyleSelection: undefined;
  GoalSettings: undefined;
  MacroPlanOverview: {
  calorieTarget: number;
  proteinGrams: number;
  fatGrams: number;
  carbGrams: number;
  zoneBlocks: {
    protein: number;
    carbs: number;
    fats: number;
  };
  dietMethod: 'standard' | 'zone';
  goalType: 'maintain' | 'fatloss' | 'muscle';
  name: string;
};
};


const Stack = createNativeStackNavigator<RootStackParamList>();

// ----- Bottom Tab Navigator -----




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
    <Stack.Screen name="AppDrawer" component={DrawerNavigation} />
    <Stack.Screen name="CheckIn" component={CheckInScreen} />
    <Stack.Screen name="MacroCalculator" component={MacroCalculatorScreen} />
    <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} />
    <Stack.Screen name="ExerciseLibrary" component={require('./screens/ExerciseLibraryScreen').default} />
    <Stack.Screen name="ExerciseDetail" component={require('./screens/ExerciseDetailScreen').default} />
    <Stack.Screen name="WorkoutHistory" component={WorkoutHistoryScreen} />
    <Stack.Screen name="ProgressChart" component={ProgressChartScreen} />
    <Stack.Screen name="PRTracker" component={PRTrackerScreen} options={{ headerShown: false }} />
    <Stack.Screen name="AdaptWorkout" component={AdaptWorkoutScreen} />
    <Stack.Screen name="Goals" component={GoalsScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="ProgramList" component={ProgramListScreen} />
    <Stack.Screen name="ProgramPreview" component={ProgramPreviewScreen} />
    <Stack.Screen name="MealPlan" component={MealPlanScreen} />
    <Stack.Screen name="MealGoalSettings" component={require('./screens/GoalSettingsScreen').default} />
    <Stack.Screen name="GoalSettings" component={GoalSettingsScreen} />
    <Stack.Screen name="MacroPlanOverview" component={MacroPlanOverviewScreen} />
  </>
) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />

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
      <Toast/>
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
