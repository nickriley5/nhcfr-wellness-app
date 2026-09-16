import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth, type Persistence } from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { getReactNativePersistence } = require('@firebase/auth') as {
  getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
};

const firebaseConfig = {
  apiKey: 'AIzaSyDXUvgMMJp7drZFcNQIYpro7oJh3AC24N0',
  authDomain: 'firefighter-wellness-app.firebaseapp.com',
  projectId: 'firefighter-wellness-app',
  storageBucket: 'firefighter-wellness-app.firebasestorage.app',
  messagingSenderId: '825542667540',
  appId: '1:825542667540:android:a661181a090a0a0ec5e601',
};

console.log('🔥 Initializing Firebase...');
const app = initializeApp(firebaseConfig);
console.log('✅ Firebase app initialized');

let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  console.log('✅ Firebase Auth initialized with React Native persistence');
} catch (error: any) {
  if (error?.code !== 'auth/already-initialized') {
    throw error;
  }
  auth = getAuth(app);
  console.log('✅ Firebase Auth already initialized');
}

const db = getFirestore(app);
console.log('✅ Firestore initialized');
console.log('🔥 Firestore instance:', db);
console.log('🔥 Project ID:', firebaseConfig.projectId);

const storage = getStorage(app);
console.log('✅ Firebase Storage initialized');

// ✅ Suppress Firestore debug/info/warning logs globally (after initialization)
setLogLevel('error');

export { app as firebaseApp, auth, db, storage };
