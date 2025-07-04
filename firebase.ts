// firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDXUvgMMJp7drZFcNQIYpro7oJh3AC24N0',
  authDomain: 'firefighter-wellness-app.firebaseapp.com',
  projectId: 'firefighter-wellness-app',
  storageBucket: 'firefighter-wellness-app.firebasestorage.app',
  messagingSenderId: '825542667540',
  appId: '1:825542667540:android:a661181a090a0a0ec5e601',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app as firebaseApp, auth, db };
