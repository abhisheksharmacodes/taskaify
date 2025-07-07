"use client";
import { AuthProvider, useAuth } from '../../components/AuthProvider';
import SignOutButton from '../../components/SignOutButton';
import TaskDashboard from '../../components/TaskDashboard';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'

function DashboardHeader({ userName, userNameLoading, user }: { userName: string | null, userNameLoading: boolean, user: { email: string | null } }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="w-full bg-white shadow-sm mb-8 relative overflow-hidden">
      <div className="flex items-center justify-between py-4 px-4 md:px-8">
        {/* Logo and App Name */}
        <div className="flex items-center gap-2">
          <Image src="logo.svg" width="40" height="42" alt="logo" />
          <span className="text-2xl font-bold text-gray-700 select-none">Taskaify</span>
        </div>
        {/* Desktop Username and Sign Out */}
        <div className="hidden md:flex items-center gap-4">
          <span className="text-lg font-medium text-gray-700 min-w-[100px] block">
            {userNameLoading ? (
              <span className="inline-block h-6 w-24 bg-gray-200 rounded animate-pulse">&nbsp;</span>
            ) : (
              userName || user.email
            )}
          </span>
          <SignOutButton />
        </div>
        {/* Hamburger for mobile */}
        <button
          className="md:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {/* Hamburger icon (SVG) */}
          {menuOpen ? (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>
      </div>
      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t bg-white shadow-lg px-4 py-4 flex flex-col gap-4 animate-fade-in">
          <span className="text-lg font-medium text-gray-700 min-w-[100px] block">
            {userNameLoading ? (
              <span className="inline-block h-6 w-24 bg-gray-200 rounded animate-pulse">&nbsp;</span>
            ) : (
              userName || user.email
            )}
          </span>
          <SignOutButton />
        </div>
      )}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease;
        }
      `}</style>
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
      .catch(() => {
        // Error fetching user data
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
      <TaskDashboard />
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