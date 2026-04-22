
"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import FloatingButton from '@/components/FloatingButton';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function UserLayout({ children }: { children: React.ReactNode }) {
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
      return;
    }

    if (profile?.role === 'Admin') {
      router.push('/admin');
    }
  }, [user, isUserLoading, profile, isProfileLoading, router]);

  // Tampilan loading yang lebih cerdas agar tidak stuck
  if (isUserLoading || (user && isProfileLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary/50">Sinkronisasi Sesi...</p>
        </div>
      </div>
    );
  }

  if (!user || profile?.role === 'Admin') return null;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 pb-24 max-w-md mx-auto w-full animate-in">
        {children}
      </main>
      <FloatingButton />
      <BottomNav />
    </div>
  );
}
