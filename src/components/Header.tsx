
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
        <div className="logo-box bg-black relative flex items-center justify-center">
          {isSuperAdmin ? (
            <Store size={22} className="text-primary" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Mail size={22} className="text-primary" />
              {/* "Cutout" effect using absolute positioning and black background padding */}
              <div className="absolute -bottom-1.5 -right-1.5 bg-black p-0.5 rounded-sm flex items-center justify-center">
                <Check size={14} className="text-primary" strokeWidth={5} />
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-black text-2xl tracking-tighter neon-text-pulse uppercase leading-none">
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
