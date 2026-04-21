
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';

export default function UserChatPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get Admin ID (assume first admin role for now or a generic 'admin' ID)
  // In a real system, you'd fetch the active support admin ID
  const adminId = 'admin-system'; 

  const messagesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, 'messages'),
      where('senderId', 'in', [user.uid, adminId]),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
  }, [db, user]);

  const { data: rawMessages } = useCollection(messagesQuery);
  
  // Filter messages manually to ensure it's only between this user and support
  const chatMessages = (rawMessages || []).filter(m => 
    (m.senderId === user?.uid && m.receiverId === adminId) ||
    (m.senderId === adminId && m.receiverId === user?.uid)
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;

    addDoc(collection(db, 'messages'), {
      senderId: user.uid,
      receiverId: adminId,
      text: text.trim(),
      createdAt: serverTimestamp(),
    });
    
    setText('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] animate-in">
      <div className="mb-4 flex items-center gap-3 glass-card p-4 rounded-2xl border-primary/20">
        <div className="w-10 h-10 rounded-full neon-gradient flex items-center justify-center glow-primary">
          <ShieldCheck size={20} className="text-background" />
        </div>
        <div>
          <h1 className="text-sm font-black uppercase tracking-widest">Live Chat Admin</h1>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Online</p>
          </div>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 px-1 pb-4 scrollbar-hide"
      >
        {chatMessages.length === 0 ? (
          <div className="text-center py-20 opacity-20 space-y-2">
            <Send size={48} className="mx-auto" />
            <p className="text-sm font-bold uppercase tracking-widest">Belum ada percakapan</p>
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isMe = msg.senderId === user?.uid;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] space-y-1`}>
                  <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-lg ${
                    isMe 
                    ? 'neon-gradient text-background rounded-tr-none' 
                    : 'glass-card text-foreground rounded-tl-none border-white/5'
                  }`}>
                    {msg.text}
                  </div>
                  <p className={`text-[8px] font-bold text-muted-foreground uppercase px-1 ${isMe ? 'text-right' : 'text-left'}`}>
                    {msg.createdAt?.seconds ? format(new Date(msg.createdAt.seconds * 1000), 'HH:mm') : '...'}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSendMessage} className="mt-4 flex gap-2 glass-card p-2 rounded-2xl">
        <Input 
          placeholder="Tulis pesan..." 
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
