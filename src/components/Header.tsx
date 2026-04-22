
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

  // Branding: Obed Store untuk admin khusus
  const isSuperAdmin = user.email?.toLowerCase() === 'creeppermoment@gmail.com';

  return (
    <header className="sticky top-0 w-full h-16 glass-card px-4 flex items-center justify-between z-40 border-b border-white/5">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg neon-gradient flex items-center justify-center glow-primary">
          {isSuperAdmin ? <Store size={18} className="text-background" /> : <Mail size={18} className="text-background" />}
        </div>
        <span className="font-bold text-lg tracking-tight neon-text">
          {isSuperAdmin ? 'Obed Store' : 'GmailKu'}
        </span>
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
