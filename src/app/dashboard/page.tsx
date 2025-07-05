"use client";
import { AuthProvider, useAuth } from '../../components/AuthProvider';
import SignOutButton from '../../components/SignOutButton';
import TaskDashboard from '../../components/TaskDashboard';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'

function DashboardHeader({ userName, userNameLoading, user }: { userName: string | null, userNameLoading: boolean, user: { email: string | null } }) {
  return (
    <header className="w-full flex items-center justify-between py-6 px-8 bg-white shadow-sm mb-8">
      {/* Logo and App Name */}
      <div className="flex items-center gap-2">
        <Image src="logo.svg" width="40" height="42" alt="logo"></Image>
        <span className="text-2xl font-bold text-gray-900 select-none">Taskaify</span>
      </div>
      {/* Username and Sign Out */}
      <div className="flex items-center gap-4">
        <span className="text-lg font-medium text-gray-700 min-w-[100px] block">
          {userNameLoading ? (
            <span className="inline-block h-6 w-24 bg-gray-200 rounded animate-pulse">&nbsp;</span>
          ) : (
            userName || user.email
          )}
        </span>
        <SignOutButton />
      </div>
    </header>
  );
}

function DashboardContent() {
  const { user, loading, token } = useAuth();
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [userNameLoading, setUserNameLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (token && user) {
      setUserNameLoading(true);
      fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user && data.user.name) {
          setUserName(data.user.name);
        }
      })
      .catch(err => {
        console.error('Failed to fetch user data:', err);
      })
      .finally(() => setUserNameLoading(false));
    }
  }, [token, user]);

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
      <DashboardHeader userName={userName} userNameLoading={userNameLoading} user={user} />
      <div className="max-w-4xl mx-auto p-6 flex items-center flex-col bg-white rounded-xl shadow-lg mt-8">
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