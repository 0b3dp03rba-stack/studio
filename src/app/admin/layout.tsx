
"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const profileRef = useMemoFirebase(() => 
    user ? doc(db, 'userProfiles', user.uid) : null, 
    [db, user?.uid]
  );
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  useEffect(() => {
    if (isUserLoading || isProfileLoading) return;

    if (!user) {
      router.push('/login');
    } else if (profile && profile.role !== 'Admin') {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, profile, isProfileLoading, router]);

  // JANGAN RENDERING CHILDREN (PAGE) SEBELUM ROLE TERKONFIRMASI
  // Ini mencegah query ilegal dijalankan oleh user yang bukan admin
  if (isUserLoading || isProfileLoading || !user || !profile || profile.role !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-primary/50">Memvalidasi Akses Admin...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 pb-24 max-w-md mx-auto w-full animate-in">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
