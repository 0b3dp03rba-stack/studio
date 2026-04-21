
"use client";

import { useState, useRef, useEffect } from 'react';
import { useApp, Message } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Send, User, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

export default function UserChatPage() {
  const { state, dispatch } = useApp();
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const admin = state.users.find(u => u.role === 'Admin');
  const chatMessages = state.messages.filter(
    m => (m.senderId === state.currentUser?.id && m.receiverId === admin?.id) ||
         (m.senderId === admin?.id && m.receiverId === state.currentUser?.id)
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !admin || !state.currentUser) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: state.currentUser.id,
      receiverId: admin.id,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'SEND_MESSAGE', payload: newMessage });
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
            const isMe = msg.senderId === state.currentUser?.id;
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
                    {format(new Date(msg.createdAt), 'HH:mm')}
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
