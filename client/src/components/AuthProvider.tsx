"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, getIdToken } from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, token: null });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        try {
          const t = await getIdToken(firebaseUser, true);
          setToken(t);
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', t);
          }
        } catch (error) {
          console.error('Error getting token:', error);
          setToken(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
          }
        }
      } else {
        setToken(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);