"use client";
import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useRouter } from 'next/navigation';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import Snackbar from "./Snackbar";

export default function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [snackbar, setSnackbar] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Add friendly error mapping
  const getFriendlyError = (err: any) => {
    if (err.code === 'auth/invalid-credential' || err.message?.includes('auth/invalid-credential')) {
      return 'Invalid email or password';
    }
    if (err.code === 'auth/user-not-found' || err.message?.includes('auth/user-not-found')) {
      return 'No account found with this email.';
    }
    if (err.code === 'auth/wrong-password' || err.message?.includes('auth/wrong-password')) {
      return 'Invalid email or password';
    }
    if (err.code === 'auth/invalid-email' || err.message?.includes('auth/invalid-email')) {
      return 'Please enter a valid email address.';
    }
    return 'Sign in failed. Please try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSnackbar(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSnackbar({ message: 'Signed in successfully!', type: 'success' });
      setSnackbarVisible(true);
      setTimeout(() => router.push('/dashboard'), 800);
    } catch (err: any) {
      setSnackbar({ message: getFriendlyError(err), type: 'error' });
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto mt-8 bg-white rounded-xl shadow-lg p-6 transition-all duration-300">
      
      <h2 className="text-2xl font-bold mb-4 text-gray-900 text-center">Sign In</h2>
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      {snackbarVisible && (
        <Snackbar
          message={snackbar?.message || ''}
          type={snackbar?.type}
          isVisible={snackbarVisible}
          onClose={() => setSnackbarVisible(false)}
        />
      )}
      <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
} 