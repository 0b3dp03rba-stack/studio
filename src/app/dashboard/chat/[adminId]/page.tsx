
"use client";

import { useState, useRef, useEffect, use, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, limit, addDoc, serverTimestamp, doc, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, User, ChevronLeft, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function UserChatDetailPage({ params }: { params: Promise<{ adminId: string }> }) {
  const { adminId } = use(params);
  const { user } = useUser();
  const db = useFirestore();
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: targetAdmin } = useDoc(useMemoFirebase(() => doc(db, 'userProfiles', adminId), [db, adminId]));

  const messagesQuery = useMemoFirebase(() => 
    query(collection(db, 'messages'), limit(300)), [db]
  );
  
  const { data: allMessages, isLoading } = useCollection(messagesQuery);

  const chatMessages = useMemo(() => {
    if (!allMessages || !user || !adminId) return [];
    return allMessages
      .filter(msg => (msg.senderId === user.uid && msg.receiverId === adminId) || (msg.senderId === adminId && msg.receiverId === user.uid))
      .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
  }, [allMessages, user, adminId]);

  // Efek untuk menandai pesan sebagai terbaca saat user membuka chat
  useEffect(() => {
    if (!chatMessages.length || !user) return;

    const unreadMessages = chatMessages.filter(
      msg => msg.receiverId === user.uid && msg.read === false
    );

    if (unreadMessages.length > 0) {
      const batch = writeBatch(db);
      unreadMessages.forEach(msg => {
        batch.update(doc(db, 'messages', msg.id), { read: true });
      });
      batch.commit().catch(e => console.error("Gagal menandai pesan terbaca:", e));
    }
  }, [chatMessages, user, db]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user || !adminId) return;

    const messageText = text.trim();
    setText('');

    addDoc(collection(db, 'messages'), {
      senderId: user.uid,
      receiverId: adminId,
      text: messageText,
      read: false,
      createdAt: serverTimestamp(),
    });
  };

  if (!targetAdmin) return <div className="p-20 text-center animate-pulse uppercase font-black text-[10px] text-primary">Menghubungkan ke Admin...</div>;

  const adminName = targetAdmin.email ? targetAdmin.email.split('@')[0] : 'Admin';

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] animate-in">
      <div className="mb-4 flex items-center gap-3 glass-card p-4 rounded-2xl border-white/10 shadow-2xl">
        <Button variant="ghost" size="icon" asChild className="h-10 w-10 rounded-xl mr-1 hover:bg-white/10">
          <Link href="/dashboard/chat"><ChevronLeft size={20} /></Link>
        </Button>
        <div className="w-10 h-10 rounded-xl neon-gradient flex items-center justify-center text-background shadow-inner glow-primary">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h1 className="text-sm font-black uppercase tracking-widest">Admin {adminName}</h1>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <p className="text-[10px] font-bold text-primary uppercase">Online Support</p>
          </div>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 px-1 pb-4 scrollbar-hide"
      >
        {isLoading ? (
          <div className="text-center py-20 font-black uppercase text-[10px] text-muted-foreground/50">Memuat Pesan...</div>
        ) : chatMessages.length === 0 ? (
          <div className="text-center py-20 opacity-20 font-black uppercase text-[10px] tracking-widest">Kirim pesan pertama Anda...</div>
        ) : chatMessages.map((msg) => {
          const isMe = msg.senderId === user?.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] space-y-1`}>
                <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-lg ${
                  isMe 
                  ? 'neon-gradient text-background rounded-tr-none' 
                  : 'glass-card text-foreground rounded-tl-none border-white/5'
                }`}>
                  {msg.text}
                </div>
                <p className={`text-[8px] font-bold text-muted-foreground uppercase px-1 ${isMe ? 'text-right' : 'text-left'}`}>
                  {msg.createdAt?.seconds ? format(new Date(msg.createdAt.seconds * 1000), 'HH:mm') : 'Baru saja'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSendMessage} className="mt-4 flex gap-2 glass-card p-2 rounded-2xl border-white/5">
        <Input 
          placeholder="Tulis pesan bantuan..." 
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="bg-transparent border-none focus-visible:ring-0 text-sm font-medium"
        />
        <Button size="icon" type="submit" className="neon-gradient text-background glow-primary rounded-xl shrink-0 active:scale-95 transition-transform">
          <Send size={18} />
        </Button>
      </form>
    </div>
  );
}
