"use client";
import SignUpForm from '../../components/SignUpForm';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <SignUpForm />
      <p className="mt-4 text-sm text-gray-800">
        Already have an account?{' '}
        <Link href="/signin" className="text-blue-700 hover:underline transition-colors duration-200">Sign In</Link>
      </p>
    </div>
  );
} 