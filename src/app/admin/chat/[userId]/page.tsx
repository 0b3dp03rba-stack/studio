
"use client";

import { useState, useRef, useEffect, use } from 'react';
import { useApp, Message } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, User, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminChatDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const { state, dispatch } = useApp();
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const user = state.users.find(u => u.id === userId);
  const chatMessages = state.messages.filter(
    m => (m.senderId === state.currentUser?.id && m.receiverId === userId) ||
         (m.senderId === userId && m.receiverId === state.currentUser?.id)
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user || !state.currentUser) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: state.currentUser.id,
      receiverId: user.id,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'SEND_MESSAGE', payload: newMessage });
    setText('');
  };

  if (!user) return <div>User not found</div>;

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
          <h1 className="text-sm font-black uppercase tracking-widest">{user.email.split('@')[0]}</h1>
          <p className="text-[10px] font-bold text-primary uppercase">User Platform</p>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 px-1 pb-4 scrollbar-hide"
      >
        {chatMessages.map((msg) => {
          const isMe = msg.senderId === state.currentUser?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] space-y-1`}>
                <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-lg ${
                  isMe 
                  ? 'bg-primary text-background rounded-tr-none' 
                  : 'glass-card text-foreground rounded-tl-none border-white/5'
                }`}>
                  {msg.text}
                </div>
                <p className={`text-[8px] font-bold text-muted-foreground uppercase px-1 ${isMe ? 'text-right' : 'text-left'}`}>
                  {format(new Date(msg.createdAt), 'HH:mm')}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSendMessage} className="mt-4 flex gap-2 glass-card p-2 rounded-2xl">
        <Input 
          placeholder="Tulis balasan..." 
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
