"use client";

import { LogOut, Link2, Check } from 'lucide-react';
import { Button } from './ui/button';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';

export default function Header() {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (!user) return null;
  if (pathname.startsWith('/u/') || (pathname.length > 1 && !pathname.startsWith('/dashboard') && !pathname.startsWith('/login') && !pathname.startsWith('/register'))) return null;

  return (
    <header className="sticky top-0 w-full h-24 bg-black/95 backdrop-blur-3xl px-6 flex items-center justify-between z-40 border-b border-white/5 shadow-2xl">
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center border border-white/10 shadow-xl relative group overflow-hidden">
            <div className="relative flex items-center justify-center">
              <Link2 size={32} className="text-primary" />
              <div className="absolute -bottom-1 -right-1 bg-black rounded-sm flex items-center justify-center p-0.5">
                <Check size={12} className="text-primary" strokeWidth={5} />
              </div>
            </div>
        </div>
        <div className="flex flex-col">
          <span className="font-black text-3xl tracking-tighter text-white leading-none">
            Linku
          </span>
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/70 leading-none mt-1.5 animate-text-fast-pulse">
            PREMIUM HUB
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
