// providers/AuthProvider.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../firebase';          // shared instances
import { doc, getDoc } from 'firebase/firestore';

/* ------------------------------------------------------------------ */
/* 1️⃣  Define the shape of a user profile                             */
/* ------------------------------------------------------------------ */
export interface UserProfile {
  fullName?: string;
  age?: number;
  sex?: 'male' | 'female';
  height?: number;   // cm
  weight?: number;   // kg
  bodyFat?: number;  // %
  // add any other fields you store under users/{uid}
}

/* ------------------------------------------------------------------ */
/* 2️⃣  Context type                                                   */
/* ------------------------------------------------------------------ */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  userProfile: UserProfile | null;
}

/* ------------------------------------------------------------------ */
/* 3️⃣  Create context with sensible defaults                          */
/* ------------------------------------------------------------------ */
const AuthContext = createContext<AuthContextType>({
  user        : null,
  loading     : true,
  userProfile : null,
});

/* ------------------------------------------------------------------ */
/* 4️⃣  Provider component                                             */
/* ------------------------------------------------------------------ */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser]                 = useState<User | null>(null);
  const [userProfile, setUserProfile]   = useState<UserProfile | null>(null);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    /* Listen for auth state changes */
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          /* 🔥 Pull profile from Firestore */
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          setUserProfile(snap.exists() ? (snap.data() as UserProfile) : null);
        } catch (err) {
          console.error('Failed to fetch user profile:', err);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe; // cleanup on unmount
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, userProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

/* ------------------------------------------------------------------ */
/* 5️⃣  Helper hook                                                    */
/* ------------------------------------------------------------------ */
export const useAuth = () => useContext(AuthContext);
