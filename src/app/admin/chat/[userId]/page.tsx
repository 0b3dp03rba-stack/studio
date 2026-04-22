
"use client";

import { useState, useRef, useEffect, use } from 'react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, addDoc, serverTimestamp, doc, or } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, User, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function AdminChatDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const { user: adminUser } = useUser();
  const db = useFirestore();
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: targetUser } = useDoc(useMemoFirebase(() => doc(db, 'userProfiles', userId), [db, userId]));

  // Query pesan antara admin dan user spesifik
  const messagesQuery = useMemoFirebase(() => 
    query(
      collection(db, 'messages'),
      or(
        where('senderId', '==', userId),
        where('receiverId', '==', userId)
      ),
      orderBy('createdAt', 'asc'),
      limit(200)
    ), [db, userId]
  );
  
  const { data: chatMessages, isLoading } = useCollection(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !adminUser || !userId) return;

    const messageText = text.trim();
    setText('');

    addDoc(collection(db, 'messages'), {
      senderId: adminUser.uid,
      receiverId: userId,
      text: messageText,
      createdAt: serverTimestamp(),
    });
  };

  if (!targetUser) return <div className="p-20 text-center animate-pulse uppercase font-black text-xs">Memuat Profil...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] animate-in">
      <div className="mb-4 flex items-center gap-3 glass-card p-4 rounded-2xl border-white/10">
        <Button variant="ghost" size="icon" asChild className="h-10 w-10 rounded-xl mr-1">
          <Link href="/admin/chat"><ChevronLeft size={20} /></Link>
        </Button>
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary shadow-inner">
          <User size={20} />
        </div>
        <div>
          <h1 className="text-sm font-black uppercase tracking-widest">{targetUser.email.split('@')[0]}</h1>
          <p className="text-[10px] font-bold text-primary uppercase">User Platform</p>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 px-1 pb-4 scrollbar-hide"
      >
        {isLoading ? (
          <div className="text-center py-20 font-black uppercase text-[10px]">Memuat Percakapan...</div>
        ) : chatMessages?.map((msg) => {
          const isFromAdmin = msg.senderId === adminUser?.uid;
          return (
            <div key={msg.id} className={`flex ${isFromAdmin ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] space-y-1`}>
                <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-lg ${
                  isFromAdmin 
                  ? 'bg-primary text-background rounded-tr-none' 
                  : 'glass-card text-foreground rounded-tl-none border-white/5'
                }`}>
                  {msg.text}
                </div>
                <p className={`text-[8px] font-bold text-muted-foreground uppercase px-1 ${isFromAdmin ? 'text-right' : 'text-left'}`}>
                  {msg.createdAt?.seconds ? format(new Date(msg.createdAt.seconds * 1000), 'HH:mm') : 'Baru saja'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSendMessage} className="mt-4 flex gap-2 glass-card p-2 rounded-2xl">
        <Input 
          placeholder="Balas pesan user..." 
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="bg-transparent border-none focus-visible:ring-0 text-sm font-medium"
        />
        <Button size="icon" type="submit" className="neon-gradient text-background glow-primary rounded-xl shrink-0">
          <Send size={18} />
        </Button>
      </form>
    </div>
  );
}
