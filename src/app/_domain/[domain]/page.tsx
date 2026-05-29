
"use client";

import { use, useEffect, useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import ProfileClient from '@/app/[username]/ProfileClient';
import { Ghost, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

/**
 * @fileOverview Internal route to handle Custom Domain Resolution
 * Rute ini tidak terlihat oleh user, tapi dipetakan oleh middleware.
 */
export default function CustomDomainResolver({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = use(params);
  const db = useFirestore();
  const [username, setResolvedUsername] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(true);

  // Cari user yang memiliki customDomain ini
  const usersQuery = useMemoFirebase(() => 
    query(collection(db, 'userProfiles'), where('customDomain', '==', domain), limit(1)),
    [db, domain]
  );
  
  const { data: users, isLoading } = useCollection(usersQuery);

  useEffect(() => {
    if (!isLoading) {
      if (users && users.length > 0) {
        setResolvedUsername(users[0].username);
      }
      setIsSearching(false);
    }
  }, [users, isLoading]);

  if (isLoading || isSearching) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-primary/50">Mengarahkan Domain...</p>
      </div>
    );
  }

  // Jika domain terdaftar, render profilnya secara transparan
  if (username) {
    return <ProfileClient username={username} />;
  }

  // Jika domain tidak dikenal di sistem kita
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center space-y-8">
      <div className="w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary glow-primary animate-bounce">
        <Ghost size={48} />
      </div>
      <div className="space-y-4">
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Domain Tidak Terhubung</h1>
        <p className="text-sm font-medium text-white/40 max-w-xs mx-auto uppercase tracking-widest">Domain {domain} belum dikonfigurasi di panel Linku.</p>
      </div>
      <Button asChild className="h-14 px-10 neon-gradient text-background font-black rounded-2xl uppercase text-[10px] tracking-[0.2em] shadow-2xl">
        <Link href="https://linku.biz.id"><Home size={16} className="mr-2" /> Hubungkan Sekarang</Link>
      </Button>
    </div>
  );
}
