
"use client";

import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { User, MessageCircle, ChevronRight, Clock } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function AdminChatListPage() {
  const db = useFirestore();
  const { user: currentUser } = useUser();

  // Ambil daftar user untuk ditampilkan di list chat
  const usersQuery = useMemoFirebase(() => 
    query(collection(db, 'userProfiles'), where('role', '==', 'User'), limit(100)), 
    [db]
  );
  const { data: users, isLoading } = useCollection(usersQuery);

  // Ambil semua pesan terakhir untuk indikator (opsional, untuk MVP kita list user saja)
  const messagesQuery = useMemoFirebase(() => 
    query(collection(db, 'messages'), orderBy('createdAt', 'desc'), limit(100)), 
    [db]
  );
  const { data: messages } = useCollection(messagesQuery);

  if (isLoading) return <div className="p-20 text-center animate-pulse font-black uppercase">Memuat Chat...</div>;

  return (
    <div className="space-y-6 animate-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight">Live Support</h1>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest">Pusat bantuan pengguna.</p>
      </div>

      <div className="space-y-3">
        {!users || users.length === 0 ? (
          <div className="text-center py-20 opacity-20">
            <MessageCircle size={64} className="mx-auto mb-4" />
            <p className="text-lg font-black uppercase tracking-widest">Belum ada pengguna</p>
          </div>
        ) : (
          users.map((user) => {
            const lastMsg = (messages || []).find(m => m.senderId === user.id || m.receiverId === user.id);

            return (
              <Link key={user.id} href={`/admin/chat/${user.id}`}>
                <Card className="glass-card border-none rounded-2xl hover:bg-white/10 transition-all group mb-3">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover:neon-gradient group-hover:text-background transition-all shadow-xl">
                      <User size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <p className="text-sm font-black truncate">{user.email.split('@')[0]}</p>
                        {lastMsg && (
                          <span className="text-[9px] font-bold text-muted-foreground flex items-center gap-1 uppercase">
                            <Clock size={10} /> {lastMsg.createdAt?.seconds ? format(new Date(lastMsg.createdAt.seconds * 1000), 'HH:mm') : 'Baru'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate opacity-70 font-medium">
                        {lastMsg ? lastMsg.text : 'Klik untuk mulai chat...'}
                      </p>
                    </div>
                    <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
