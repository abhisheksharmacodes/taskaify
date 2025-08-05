"use client";
import SignUpForm from '../../components/SignUpForm';
import Link from 'next/link';
import Image from 'next/image'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="absolute top-10 flex items-center gap-2">
        <Image src="logo.svg" width="40" height="42" alt="logo"></Image>
        <span className="text-2xl font-bold text-gray-900 select-none">Taskaify</span>
      </div>
      <SignUpForm />
      <p className="mt-4 text-sm text-gray-800">
        Already have an account?{' '}
        <Link href="/signin" className="text-blue-700 hover:underline transition-colors duration-200">Sign In</Link>
      </p>
    </div>
  );
} 