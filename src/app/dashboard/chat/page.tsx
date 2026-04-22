
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ShieldCheck, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, addDoc, serverTimestamp, or } from 'firebase/firestore';

export default function UserChatPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Query pesan yang melibatkan user ini secara eksplisit
  const messagesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, 'messages'),
      or(
        where('senderId', '==', user.uid),
        where('receiverId', '==', user.uid)
      ),
      orderBy('createdAt', 'asc'),
      limit(200)
    );
  }, [db, user?.uid]);

  const { data: chatMessages, isLoading } = useCollection(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;

    const messageText = text.trim();
    setText('');

    addDoc(collection(db, 'messages'), {
      senderId: user.uid,
      receiverId: 'admin-system',
      text: messageText,
      createdAt: serverTimestamp(),
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] animate-in">
      <div className="mb-4 flex items-center gap-3 glass-card p-4 rounded-2xl border-primary/20">
        <div className="w-10 h-10 rounded-full neon-gradient flex items-center justify-center glow-primary">
          <ShieldCheck size={20} className="text-background" />
        </div>
        <div>
          <h1 className="text-sm font-black uppercase tracking-widest">Support Center</h1>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Live Support Online</p>
          </div>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 px-1 pb-4 scrollbar-hide"
      >
        {isLoading ? (
          <div className="text-center py-20 animate-pulse font-black uppercase text-[10px] tracking-widest">Menghubungkan...</div>
        ) : !chatMessages || chatMessages.length === 0 ? (
          <div className="text-center py-20 opacity-20 space-y-4">
            <MessageCircle size={64} className="mx-auto" />
            <p className="text-xs font-bold uppercase tracking-widest">Kirim pesan untuk mulai chat</p>
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isMe = msg.senderId === user?.uid;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] space-y-1`}>
                  <div className={`p-3 rounded-2xl text-xs font-medium shadow-lg leading-relaxed ${
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
          })
        )}
      </div>

      <form onSubmit={handleSendMessage} className="mt-4 flex gap-2 glass-card p-2 rounded-2xl">
        <Input 
          placeholder="Tulis pesan ke admin..." 
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
