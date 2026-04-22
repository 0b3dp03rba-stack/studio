
"use client";

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { User, MessageCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function AdminChatListPage() {
  const db = useFirestore();

  // Ambil daftar user untuk ditampilkan di list chat
  const usersQuery = useMemoFirebase(() => 
    query(collection(db, 'userProfiles'), where('role', '==', 'User'), limit(100)), 
    [db]
  );
  const { data: users, isLoading } = useCollection(usersQuery);

  if (isLoading) return <div className="p-20 text-center animate-pulse font-black uppercase text-[10px] tracking-widest text-primary">Memuat Daftar Chat...</div>;

  return (
    <div className="space-y-6 animate-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tighter">Pusat Pesan</h1>
        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">Kelola konsultasi dan bantuan user.</p>
      </div>

      <div className="space-y-3">
        {!users || users.length === 0 ? (
          <div className="text-center py-20 opacity-20">
            <MessageCircle size={64} className="mx-auto mb-4" />
            <p className="text-lg font-black uppercase tracking-widest">Belum ada user aktif</p>
          </div>
        ) : (
          users.map((user) => (
            <Link key={user.id} href={`/admin/chat/${user.id}`}>
              <Card className="glass-card border-none rounded-2xl hover:bg-white/10 transition-all group mb-3 shadow-xl">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover:neon-gradient group-hover:text-background transition-all shadow-xl">
                    <User size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black truncate uppercase tracking-tight">{user.email.split('@')[0]}</p>
                    <div className="flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                       <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">Siap membalas...</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
