"use client";

import { LogOut, Check, ShieldAlert, LayoutDashboard } from 'lucide-react';
import { Button } from './ui/button';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const HorizontalLinkIcon = ({ size = 32, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3" />
    <path d="M9 17H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

export default function Header() {
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const [isSystemDomain, setIsSystemDomain] = useState(true);

  useEffect(() => {
    const host = window.location.hostname;
    const mainDomain = 'linku.biz.id';
    const isLocal = host.includes('localhost');
    const isMain = host === mainDomain || host === `www.${mainDomain}` || (isLocal && (host.includes('localhost') || host.includes('127.0.0.1')));
    setIsSystemDomain(isMain);
  }, []);

  const profileRef = useMemoFirebase(() => user ? doc(db, 'userProfiles', user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const isAdmin = profile?.role === 'Admin' || user?.email === 'creeppermoment@gmail.com';

  if (!user || !isSystemDomain) return null;
  
  const isSystemPath = pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname.startsWith('/verify-email');
  if (!isSystemPath) return null;

  const isAdminPage = pathname.startsWith('/admin');

  return (
    <header className="fixed top-0 left-0 right-0 h-24 bg-black/95 backdrop-blur-3xl px-6 flex items-center justify-center z-[100] border-b border-white/5">
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link href="/dashboard" className="flex items-center gap-5 group">
            <div className="logo-box relative overflow-hidden transition-transform group-active:scale-95">
                <div className="relative flex items-center justify-center">
                  <HorizontalLinkIcon size={24} className="text-primary" />
                  <div className="absolute -bottom-1 -right-1 bg-black rounded-sm flex items-center justify-center p-0.5">
                    <Check size={8} className="text-primary" strokeWidth={5} />
                  </div>
                </div>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-3xl tracking-tighter text-white leading-none">Linku</span>
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/70 leading-none mt-1.5 animate-pulse">
                {isAdminPage ? 'MASTER PANEL' : (isAdmin ? 'ADMIN CONTROL' : 'PREMIUM HUB')}
              </span>
            </div>
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          {isAdmin && !isAdminPage && (
            <Button variant="ghost" size="icon" asChild className="h-12 w-12 rounded-2xl text-white/40 hover:text-primary hover:bg-primary/10 transition-all">
              <Link href="/admin"><ShieldAlert size={22} /></Link>
            </Button>
          )}

          {isAdminPage && (
            <Button variant="ghost" size="icon" asChild className="h-12 w-12 rounded-2xl text-white/40 hover:text-primary hover:bg-primary/10 transition-all">
              <Link href="/dashboard"><LayoutDashboard size={22} /></Link>
            </Button>
          )}
          
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white/40 hover:text-destructive transition-all rounded-2xl hover:bg-white/5 h-12 w-12">
            <LogOut size={22} />
          </Button>
        </div>
      </div>
    </header>
  );
}
