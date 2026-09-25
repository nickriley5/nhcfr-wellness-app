import { getApp, getApps, initializeApp } from 'firebase/app';
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

const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let auth: Auth;
try {
  auth = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error: any) {
  if (error?.code !== 'auth/already-initialized') {
    throw error;
  }
  auth = getAuth(firebaseApp);
}

const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);
setLogLevel('error');

export { auth, db, firebaseApp, storage };
