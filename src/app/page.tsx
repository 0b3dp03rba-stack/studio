"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';

export default function Home() {
  const router = useRouter();
  const { state } = useApp();

  useEffect(() => {
    if (!state.currentUser) {
      router.push('/login');
    } else {
      router.push(state.currentUser.role === 'Admin' ? '/admin' : '/dashboard');
    }
  }, [state.currentUser, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
