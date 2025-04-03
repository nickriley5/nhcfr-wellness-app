import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Feather from 'react-native-vector-icons/Feather';
import { Text, View, ActivityIndicator } from 'react-native';

// Screens
import DashboardScreen from './screens/DashboardScreen';
import HomeScreen from './screens/HomeScreen';
import SettingsScreen from './screens/SettingsScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

// Auth Context
import { AuthProvider, useAuth } from './providers/AuthProvider';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tabs shown when logged in
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

// App inner navigation with auth check
const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // 🔄 Show loading spinner while checking auth state
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // ✅ Show main app if logged in
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        // 🚪 Show auth flow if not logged in
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

// Final App wrapped with AuthProvider
const App = () => (
  <AuthProvider>
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  </AuthProvider>
);

export default App;
