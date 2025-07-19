// providers/AuthProvider.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

/* ------------------------------------------------------------------ */
/* 1️⃣  Firestore doc type – matches all possible fields in Firestore  */
/* ------------------------------------------------------------------ */
interface FirestoreUserDoc {
  name?: string;
  fullName?: string;
  age?: number;
  sex?: 'male' | 'female';
  height?: number;
  weight?: number;
  bodyFat?: number;
  // any other fields you save under users/{uid}
}

/* ------------------------------------------------------------------ */
/* 2️⃣  Full merged UserProfile                                        */
/* ------------------------------------------------------------------ */
export interface UserProfile extends FirestoreUserDoc {
  uid: string;                // ✅ always from Firebase Auth
  email?: string | null;      // ✅ always from Firebase Auth
}

/* ------------------------------------------------------------------ */
/* 3️⃣  Context type                                                   */
/* ------------------------------------------------------------------ */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  userProfile: UserProfile | null;
}

/* ------------------------------------------------------------------ */
/* 4️⃣  Create Context with sensible defaults                          */
/* ------------------------------------------------------------------ */
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userProfile: null,
});

/* ------------------------------------------------------------------ */
/* 5️⃣  Provider component                                             */
/* ------------------------------------------------------------------ */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          // 🔥 Fetch Firestore profile document
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));

          // ✅ Type-safe data cast (no more as any)
          const firestoreData: FirestoreUserDoc = snap.exists()
            ? (snap.data() as FirestoreUserDoc)
            : {};

          // ✅ Merge Auth + Firestore fields
          const mergedProfile: UserProfile = {
            uid: firebaseUser.uid,          // always present
            email: firebaseUser.email,      // always present
            name: firestoreData.name ??
                  firestoreData.fullName ??
                  'Firefighter',            // fallback name
            ...firestoreData,               // spreads weight, height, bodyFat, etc.
          };

          setUserProfile(mergedProfile);
        } catch (err) {
          console.error('Failed to fetch user profile:', err);

          // Fallback: only auth info
          setUserProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
          });
        }
      } else {
        // Not logged in → reset profile
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, userProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

/* ------------------------------------------------------------------ */
/* 6️⃣  Helper hook                                                    */
/* ------------------------------------------------------------------ */
export const useAuth = () => useContext(AuthContext);
