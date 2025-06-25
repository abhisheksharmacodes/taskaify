"use client";
import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const router = useRouter();
  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/signin');
  };
  return (
    <button
      onClick={handleSignOut}
      className="bg-gray-100 px-4 py-2 rounded hover:bg-gray-200 text-gray-800 border border-gray-300 shadow-sm transition-all duration-200"
    >
      Sign Out
    </button>
  );
} 