import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import auth from '@react-native-firebase/auth';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
      console.error(error);
      alert('Login failed. Check your credentials.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.wrapper}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back</Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#ccc"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#ccc"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <Pressable style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkText}>Create an Account</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#1e1e1e',
    padding: 24,
    borderRadius: 12,
    borderColor: '#333',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10, // for Android
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#444',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#d32f2f',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  linkText: {
    color: '#d32f2f',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default LoginScreen;
