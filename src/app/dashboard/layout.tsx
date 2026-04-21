"use client";

import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import FloatingButton from '@/components/FloatingButton';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!state.currentUser) {
      router.push('/login');
    } else if (state.currentUser.role === 'Admin') {
      router.push('/admin');
    }
  }, [state.currentUser, router]);

  if (!state.currentUser) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 pb-24 max-w-md mx-auto w-full">
        {children}
      </main>
      <FloatingButton />
      <BottomNav />
    </div>
  );
}
