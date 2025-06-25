"use client";
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useRouter } from 'next/navigation';
import Snackbar, { SnackbarType } from './Snackbar';

export default function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [snackbar, setSnackbar] = useState<{ message: string; type: SnackbarType } | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      setSnackbar({ message: err.message, type: 'error' });
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto mt-8 bg-white rounded-xl shadow-lg p-6 transition-all duration-300">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">Sign In</h2>
      <input
        type="email"
        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 bg-gray-50 text-gray-900"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 bg-gray-50 text-gray-900"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      <Snackbar
        message={snackbar?.message || ''}
        type={snackbar?.type || 'success'}
        isVisible={snackbarVisible}
        onClose={() => setSnackbarVisible(false)}
      />
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded shadow-md hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
} 