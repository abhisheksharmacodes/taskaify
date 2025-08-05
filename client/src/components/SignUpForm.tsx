"use client";
import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useRouter } from 'next/navigation';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import Snackbar from "./Snackbar";

export default function SignUpForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [snackbar, setSnackbar] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const getFriendlyError = (err: any) => {
    if (err.code === 'auth/email-already-in-use' || err.message?.includes('auth/email-already-in-use')) {
      return 'An account with this email already exists.';
    }
    if (err.code === 'auth/invalid-email' || err.message?.includes('auth/invalid-email')) {
      return 'Please enter a valid email address.';
    }
    if (err.code === 'auth/weak-password' || err.message?.includes('auth/weak-password')) {
      return 'Password should be at least 6 characters.';
    }
    return 'Sign up failed. Please try again.';
  };

  const validatePassword = (pw: string) => {
    
    if (pw.length < 6) return 'Password should be at least 6 characters.';
    if (!/[0-9]/.test(pw)) return 'Password should contain at least one number.';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pw)) return 'Password should contain at least one special character.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSnackbar(null);
    
    if (!name.trim()) {
      setSnackbar({ message: 'Please enter your name.', type: 'error' });
      setSnackbarVisible(true);
      setLoading(false);
      return;
    }
    
    const pwError = validatePassword(password);
    if (pwError) {
      setSnackbar({ message: pwError, type: 'error' });
      setSnackbarVisible(true);
      setLoading(false);
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      localStorage.setItem('userName', name.trim());
      setSnackbar({ message: 'Account created! Redirecting...', type: 'success' });
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
      <h2 className="text-2xl font-bold mb-4 text-gray-900 text-center">Sign Up</h2>
      <Input
        type="text"
        placeholder="Full Name"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />
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
        {loading ? 'Signing up...' : 'Sign Up'}
      </Button>
    </form>
  );
} 