"use client";

import { LogOut, Mail, Store } from 'lucide-react';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';

export default function Header() {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (!user) return null;

  const isSuperAdmin = user.email?.toLowerCase() === 'creeppermoment@gmail.com';

  return (
    <header className="sticky top-0 w-full h-16 bg-black/80 backdrop-blur-2xl px-4 flex items-center justify-between z-40 border-b border-white/5 shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl neon-gradient flex items-center justify-center glow-primary shadow-xl border border-white/10">
          {isSuperAdmin ? <Store size={22} className="text-white" /> : <Mail size={22} className="text-white" />}
        </div>
        <div className="flex flex-col">
          <span className="font-black text-xl tracking-tighter neon-text leading-none uppercase">
            Obed Store
          </span>
          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary leading-none mt-1 opacity-80">
            {isSuperAdmin ? 'SUPER ADMIN PANEL' : 'PREMIUM GMAIL NETWORK'}
          </span>
        </div>
      </div>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleLogout}
        className="text-muted-foreground hover:text-primary transition-all rounded-2xl hover:bg-white/5 h-10 w-10"
      >
        <LogOut size={20} />
      </Button>
    </header>
  );
}