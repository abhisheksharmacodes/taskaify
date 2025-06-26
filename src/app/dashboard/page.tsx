"use client";
import { AuthProvider, useAuth } from '../../components/AuthProvider';
import SignOutButton from '../../components/SignOutButton';
import TaskDashboard from '../../components/TaskDashboard';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

function DashboardContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-3xl w-full mx-auto p-6 bg-white rounded-xl shadow-lg">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-2/3 mx-auto mb-8" />
          <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto mb-6" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
            <div className="h-4 bg-gray-200 rounded w-3/6" />
            <div className="h-4 bg-gray-200 rounded w-2/6" />
          </div>
        </div>
      </div>
    </div>
  );
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 flex items-center flex-col bg-white rounded-xl shadow-lg mt-8">
        <h1 className="text-3xl font-bold text-center mb-4">Welcome, {user.email}</h1>
        <SignOutButton />
        <TaskDashboard />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
} 