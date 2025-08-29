import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  View,
  SafeAreaView,
  Animated,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import Toast from 'react-native-toast-message';
import Ionicons from 'react-native-vector-icons/Ionicons';


const LoginScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const logoOpacity = useRef(new Animated.Value(0)).current;
const logoTranslateY = useRef(new Animated.Value(20)).current;

useEffect(() => {
  Animated.parallel([
    Animated.timing(logoOpacity, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }),
    Animated.timing(logoTranslateY, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }),
  ]).start();
}, [logoOpacity, logoTranslateY]);


  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: 'error',
        text1: 'Missing Info',
        text2: 'Please enter both email and password',
      });
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Toast.show({
        type: 'success',
        text1: 'Welcome! 🎉',
        text2: 'Login successful',
      });
    } catch (error: any) {
      let errorText = 'Login failed.';
      switch (error.code) {
        case 'auth/invalid-email':
          errorText = 'Invalid email format.';
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorText = 'Incorrect email or password.';
          break;
      }
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: errorText,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      <Toast />
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.wrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 30}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
  style={[
    styles.logoContainer,
    {
      opacity: logoOpacity,
      transform: [{ translateY: logoTranslateY }],
    },
  ]}
>
  <Text style={styles.logo}>NHCFR</Text>
  <Text style={styles.tagline}>TRAIN FOR DUTY. FUEL FOR LIFE.</Text>
</Animated.View>

          <View style={styles.card}>
            <Text style={styles.title}>Welcome Back</Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
              autoComplete="email"
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                textContentType="password"
                autoComplete="password"
                passwordRules="required: lower; required: upper; required: digit; max-consecutive: 2; minlength: 8;"
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#999"
                />
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </Pressable>
              <Text>
            <Text style={styles.registerText}>
  Don’t have an account?{' '}</Text>
  <Text style={styles.registerText}>
  Don’t have an account?{' '}
  <Text
    style={styles.link}
    onPress={() => navigation.navigate('Register')}
  >
    Register
  </Text>
</Text>

</Text>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 4,
    color: '#fff',
    fontFamily: 'Inter-Black',
  },
  tagline: {
    fontSize: 14,
    color: '#d32f2f',
    fontWeight: '600',
    marginTop: 4,
    fontFamily: 'Inter-SemiBold',
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'Inter-Bold',
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    padding: 14,
    marginBottom: 16,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
    fontFamily: 'Inter-Regular',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    color: '#fff',
    padding: 14,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  eyeButton: {
    padding: 14,
  },
  button: {
    backgroundColor: '#d32f2f',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  registerText: {
    color: '#aaa',
    marginTop: 24,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  link: {
    color: '#d32f2f',
    fontWeight: '600',
  },
  });

export default LoginScreen;
