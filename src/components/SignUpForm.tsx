"use client";
import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useRouter } from 'next/navigation';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [snackbar, setSnackbar] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSnackbar(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setSnackbar({ message: 'Account created! Redirecting...', type: 'success' });
      setSnackbarVisible(true);
      setTimeout(() => router.push('/dashboard'), 800);
    } catch (err: any) {
      setSnackbar({ message: err.message, type: 'error' });
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto mt-8 bg-white rounded-xl shadow-lg p-6 transition-all duration-300">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">Sign Up</h2>
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
        <Alert variant={snackbar?.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{snackbar?.message || ''}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
        {loading ? 'Signing up...' : 'Sign Up'}
      </Button>
    </form>
  );
} 