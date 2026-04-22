
"use client";

import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, MessageCircle, ChevronRight, User } from 'lucide-react';
import Link from 'next/link';

export default function UserChatListPage() {
  const db = useFirestore();
  const { user: currentUser } = useUser();

  // Ambil daftar user dengan role Admin agar user bisa memilih admin mana yang diajak chat
  const adminsQuery = useMemoFirebase(() => 
    query(collection(db, 'userProfiles'), where('role', '==', 'Admin'), limit(50)), 
    [db]
  );
  const { data: admins, isLoading } = useCollection(adminsQuery);

  // Ambil semua pesan yang belum dibaca untuk user ini
  const unreadQuery = useMemoFirebase(() => 
    currentUser ? query(
      collection(db, 'messages'), 
      where('receiverId', '==', currentUser.uid),
      where('read', '==', false)
    ) : null,
    [db, currentUser]
  );
  const { data: unreadMessages } = useCollection(unreadQuery);

  if (isLoading) return <div className="p-20 text-center animate-pulse font-black uppercase text-[10px] tracking-widest text-primary">Mencari Admin Online...</div>;

  return (
    <div className="space-y-6 animate-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tighter">Bantuan Live</h1>
        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">Pilih Admin untuk mulai konsultasi.</p>
      </div>

      <div className="space-y-3">
        {!admins || admins.length === 0 ? (
          <div className="text-center py-20 opacity-20">
            <ShieldCheck size={64} className="mx-auto mb-4" />
            <p className="text-lg font-black uppercase tracking-widest">Admin Sedang Offline</p>
          </div>
        ) : (
          admins.map((admin) => {
            const unreadCount = unreadMessages?.filter(m => m.senderId === admin.id).length || 0;
            const adminLabel = admin.email ? admin.email.split('@')[0] : 'Admin';

            return (
              <Link key={admin.id} href={`/dashboard/chat/${admin.id}`}>
                <Card className={`glass-card border-none rounded-2xl hover:bg-white/10 transition-all group mb-3 shadow-xl ${unreadCount > 0 ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl neon-gradient flex items-center justify-center text-background glow-primary transition-all shadow-xl group-hover:scale-105">
                      <User size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black uppercase tracking-tight">Admin {adminLabel}</p>
                      <div className="flex items-center gap-1.5">
                         <div className={`w-1.5 h-1.5 rounded-full ${unreadCount > 0 ? 'bg-primary animate-pulse' : 'bg-primary'}`} />
                         <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">
                           {unreadCount > 0 ? `${unreadCount} PESAN BARU` : 'TERSEDIA UNTUK CHAT'}
                         </p>
                      </div>
                    </div>
                    {unreadCount > 0 && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-black text-background">
                        {unreadCount}
                      </div>
                    )}
                    <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>
      
      <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 mt-10">
         <p className="text-[9px] font-black uppercase text-center text-muted-foreground leading-relaxed">Peringatan: Admin tidak akan pernah meminta kata sandi akun Anda. Harap berhati-hati saat bertukar informasi sensitif.</p>
      </div>
    </div>
  );
}
