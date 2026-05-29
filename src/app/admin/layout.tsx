"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/Header';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import Link from 'next/link';
import { LayoutDashboard, Users, Clock, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  const profileRef = useMemoFirebase(() => 
    user ? doc(db, 'userProfiles', user.uid) : null, 
    [db, user?.uid]
  );
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  useEffect(() => {
    if (isUserLoading || isProfileLoading) return;

    if (!user) {
      router.push('/login');
    } else {
      const isAdmin = profile?.role === 'Admin' || user?.email === 'creeppermoment@gmail.com';
      if (!isAdmin) {
        router.push('/dashboard');
      }
    }
  }, [user, isUserLoading, profile, isProfileLoading, router]);

  if (isUserLoading || (user && isProfileLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-primary/50">Memvalidasi Admin...</p>
      </div>
    );
  }

  const isAdmin = profile?.role === 'Admin' || user?.email === 'creeppermoment@gmail.com';
  if (!user || !isAdmin) return null;

  const navItems = [
    { label: 'Analisis', href: '/admin', icon: LayoutDashboard },
    { label: 'Database User', href: '/admin/users', icon: Users },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <div className="fixed top-24 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
           <div className="flex items-center gap-2">
             {navItems.map((item) => {
               const isActive = pathname === item.href;
               return (
                 <Link 
                   key={item.href} 
                   href={item.href}
                   className={cn(
                     "px-4 h-10 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
                     isActive ? "bg-primary text-background shadow-xl" : "text-white/40 hover:bg-white/5 hover:text-white"
                   )}
                 >
                   <item.icon size={14} />
                   <span className="hidden sm:inline">{item.label}</span>
                 </Link>
               );
             })}
           </div>
           <Link href="/dashboard" className="text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-primary transition-colors flex items-center gap-2">
             <ArrowLeft size={12} /> Dashboard User
           </Link>
        </div>
      </div>
      <main className="flex-1 pt-44 p-6 pb-24 max-w-4xl mx-auto w-full animate-in">
        {children}
      </main>
    </div>
  );
}
