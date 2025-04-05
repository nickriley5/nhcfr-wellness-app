import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Feather from 'react-native-vector-icons/Feather';
import { View, ActivityIndicator, Image, StyleSheet } from 'react-native';

// Screens
import DashboardScreen from './screens/DashboardScreen';
import HomeScreen from './screens/HomeScreen';
import SettingsScreen from './screens/SettingsScreen';
import LoginScreen from './screens/LoginScreen';
import ProfileSetupScreen from './screens/ProfileSetupScreen';

// Auth context
import { AuthProvider, useAuth } from './providers/AuthProvider';

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  ProfileSetup: undefined;
  LoadingProfile: undefined;
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
        let iconName = '';
        if (route.name === 'Home') iconName = 'home';
        else if (route.name === 'Settings') iconName = 'settings';
        else if (route.name === 'Dashboard') iconName = 'activity';
        return <Feather name={iconName} size={20} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
);

// 📲 App navigation logic with splash logo above login screen
const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
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
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
        </>
      ) : (
        <>
          {/* 🚀 Splash with centered logo and login screen */}
          <Stack.Screen
            name="Login"
            component={() => (
              <View style={styles.splashWrapper}>
                <View style={styles.logoContainer}>
                  <Image source={require('./assets/logo.png')} style={styles.logo} />
                </View>
                <View style={styles.loginCardWrapper}>
                  <LoginScreen />
                </View>
              </View>
            )}
          />
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
  // 🎯 Splash screen layout styles
  splashWrapper: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 10,
  },
  loginCardWrapper: {
    flex: 1,
    justifyContent: 'flex-start',
    width: '100%',
  },
  logo: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
  },
});

export default App;
