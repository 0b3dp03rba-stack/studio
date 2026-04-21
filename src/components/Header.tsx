"use client";

import { useApp } from '@/lib/store';
import { LogOut, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { state, dispatch } = useApp();
  const router = useRouter();

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    router.push('/login');
  };

  if (!state.currentUser) return null;

  return (
    <header className="sticky top-0 w-full h-16 glass-card px-4 flex items-center justify-between z-40 border-b border-white/5">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg neon-gradient flex items-center justify-center glow-primary">
          <Mail size={18} className="text-background" />
        </div>
        <span className="font-bold text-lg tracking-tight neon-text">GmailKu</span>
      </div>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleLogout}
        className="text-muted-foreground hover:text-primary transition-colors"
      >
        <LogOut size={20} />
      </Button>
    </header>
  );
}
