import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';

// ✅ Use the correct type namespace from the Firebase package
import { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Define the shape of the context
type AuthContextType = {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export the hook for using the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// AuthProvider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

  const auth = getAuth(getApp());

  useEffect(() => {
    // ✅ Explicitly type the callback parameter as FirebaseAuthTypes.User | null
    const unsubscribe = onAuthStateChanged(auth, (authUser: FirebaseAuthTypes.User | null) => {
      setUser(authUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
