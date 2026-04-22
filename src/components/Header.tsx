"use client";

import { LogOut, Mail, Check, Store } from 'lucide-react';
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
    <header className="sticky top-0 w-full h-20 bg-black/90 backdrop-blur-3xl px-6 flex items-center justify-between z-40 border-b border-white/5 shadow-2xl">
      <div className="flex items-center gap-4">
        <div className="logo-box relative overflow-visible">
          {isSuperAdmin ? (
            <Store size={22} className="text-primary" />
          ) : (
            <div className="relative">
              <Mail size={22} className="text-primary" />
              {/* The "cutout" effect: Check icon cutting into the Mail icon */}
              <div className="absolute -bottom-2 -right-2 bg-black w-5 h-5 flex items-center justify-center rounded-sm">
                <Check size={14} className="text-primary" strokeWidth={4} />
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-black text-2xl tracking-tighter neon-text-pulse uppercase">
            {isSuperAdmin ? 'Obed Store' : 'GmailKu'}
          </span>
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/50 leading-none mt-1">
            {isSuperAdmin ? 'SUPER ADMIN PANEL' : 'PREMIUM GMAIL NETWORK'}
          </span>
        </div>
      </div>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleLogout}
        className="text-white/40 hover:text-primary transition-all rounded-2xl hover:bg-white/5 h-12 w-12"
      >
        <LogOut size={22} />
      </Button>
    </header>
  );
}
