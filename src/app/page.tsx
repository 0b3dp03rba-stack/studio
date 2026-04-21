
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

export default function Home() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const profileRef = useMemoFirebase(() => 
    user ? doc(db, 'userProfiles', user.uid) : null, 
    [db, user]
  );
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  useEffect(() => {
    if (isUserLoading || (user && isProfileLoading)) return;

    if (!user) {
      router.push('/login');
    } else if (profile) {
      router.push(profile.role === 'Admin' ? '/admin' : '/dashboard');
    }
  }, [user, isUserLoading, profile, isProfileLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(34,197,94,0.3)]"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/50 animate-pulse">Memuat Sesi...</p>
      </div>
    </div>
  );
}
