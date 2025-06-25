"use client";
import SignInForm from '../../components/SignInForm';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <SignInForm />
      <p className="mt-4 text-sm text-gray-800">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-blue-700 hover:underline transition-colors duration-200">Sign Up</Link>
      </p>
    </div>
  );
} 