// firebase.ts
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// ✅ Config extracted from your google-services.json
const firebaseConfig = {
  apiKey: 'AIzaSyDXUvgMMJp7drZFcNQIYpro7oJh3AC24N0',
  authDomain: 'firefighter-wellness-app.firebaseapp.com',
  projectId: 'firefighter-wellness-app',
  storageBucket: 'firefighter-wellness-app.appspot.com',
  messagingSenderId: '825542667540',
  appId: '1:825542667540:android:a661181a090a0a0ec5e601',
};

// ✅ Ensure we only initialize the app once
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// ✅ Export initialized Firestore and Auth (modular API)
export const db = getFirestore(app);
export const auth = getAuth(app);
const firestore = getFirestore(app);

export { firestore };
