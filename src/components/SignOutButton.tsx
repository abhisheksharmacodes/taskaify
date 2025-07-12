"use client";
import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';

export default function SignOutButton() {
  const router = useRouter();
  const handleSignOut = async () => {
    router.push('/signin');
    await signOut(auth);
  };
  return (
    <Button onClick={handleSignOut} className='cursor-pointer' variant="outline">
      Sign Out
    </Button>
  );
} 