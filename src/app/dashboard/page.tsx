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

  if (loading) return <div className="text-center mt-8">Loading...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user.email}</h1>
      <SignOutButton />
      <TaskDashboard />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-white text-gray-900">
        <DashboardContent />
      </div>
    </AuthProvider>
  );
} 