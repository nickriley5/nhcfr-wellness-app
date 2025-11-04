// firebase.ts - Temporarily using Web Firebase SDK only
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';

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

const auth = getAuth(app);
console.log('✅ Firebase Auth initialized');

const db = getFirestore(app);
console.log('✅ Firestore initialized');
console.log('🔥 Firestore instance:', db);
console.log('🔥 Project ID:', firebaseConfig.projectId);

// ✅ Suppress Firestore debug/info/warning logs globally (after initialization)
setLogLevel('error');

export { app as firebaseApp, auth, db };
