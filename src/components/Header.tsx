
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

  // Branding: Obed Store untuk akun super admin
  const isSuperAdmin = user.email?.toLowerCase() === 'creeppermoment@gmail.com';

  return (
    <header className="sticky top-0 w-full h-16 glass-card px-4 flex items-center justify-between z-40 border-b border-white/5 shadow-xl">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl neon-gradient flex items-center justify-center glow-primary shadow-lg border border-white/10">
          {isSuperAdmin ? <Store size={20} className="text-background" /> : <Mail size={20} className="text-background" />}
        </div>
        <div className="flex flex-col">
          <span className="font-black text-lg tracking-tighter neon-text leading-none">
            {isSuperAdmin ? 'Obed Store' : 'GmailKu'}
          </span>
          <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-primary/60 leading-none mt-0.5">Premium Network</span>
        </div>
      </div>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleLogout}
        className="text-muted-foreground hover:text-primary transition-all rounded-xl hover:bg-primary/5"
      >
        <LogOut size={20} />
      </Button>
    </header>
  );
}
