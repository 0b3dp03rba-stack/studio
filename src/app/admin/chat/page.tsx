
"use client";

import { useApp } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { User, MessageCircle, ChevronRight, Clock } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function AdminChatListPage() {
  const { state } = useApp();

  // Get unique users who have sent messages or we have sent to
  const chatUserIds = Array.from(new Set(
    state.messages.map(m => m.senderId === state.currentUser?.id ? m.receiverId : m.senderId)
  ));

  const usersInChat = state.users.filter(u => chatUserIds.includes(u.id) && u.role === 'User');

  return (
    <div className="space-y-6 animate-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight">Live Support</h1>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest">Daftar percakapan dengan pengguna.</p>
      </div>

      <div className="space-y-3">
        {usersInChat.length === 0 ? (
          <div className="text-center py-20 opacity-20">
            <MessageCircle size={64} className="mx-auto mb-4" />
            <p className="text-lg font-black uppercase tracking-widest">Belum ada chat masuk</p>
          </div>
        ) : (
          usersInChat.map((user) => {
            const userMessages = state.messages.filter(
              m => (m.senderId === user.id && m.receiverId === state.currentUser?.id) ||
                   (m.senderId === state.currentUser?.id && m.receiverId === user.id)
            ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            const lastMsg = userMessages[0];

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
                            <Clock size={10} /> {format(new Date(lastMsg.createdAt), 'HH:mm')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate opacity-70 font-medium">
                        {lastMsg ? lastMsg.text : 'Mulai percakapan...'}
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
