
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

export default function Home() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      router.push('/login');
    } else {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(255,0,0,0.3)]"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/50 animate-pulse">Menyiapkan Ruang Anda...</p>
      </div>
    </div>
  );
}
