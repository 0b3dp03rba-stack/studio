"use client";

import { LayoutDashboard, Send, Wallet, History, User, FileText, Settings, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function BottomNav() {
  const { user } = useUser();
  const db = useFirestore();
  const pathname = usePathname();

  const profileRef = useMemoFirebase(() => user ? doc(db, 'userProfiles', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(profileRef);

  if (!user) return null;

  const isAdmin = profile?.role === 'Admin';

  const userNav = [
    { label: 'Dash', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Setor', icon: Send, href: '/dashboard/setor' },
    { label: 'Tarik', icon: Wallet, href: '/dashboard/withdraw' },
    { label: 'History', icon: History, href: '/dashboard/riwayat' },
    { label: 'Profil', icon: User, href: '/dashboard/profil' },
  ];

  const adminNav = [
    { label: 'Panel', icon: LayoutDashboard, href: '/admin' },
    { label: 'Setoran', icon: FileText, href: '/admin/setoran' },
    { label: 'Chat', icon: MessageCircle, href: '/admin/chat' },
    { label: 'WD', icon: Wallet, href: '/admin/withdraw' },
    { label: 'Sistem', icon: Settings, href: '/admin/settings' },
  ];

  const activeNav = isAdmin ? adminNav : userNav;

  return (
    <nav className="bottom-nav">
      {activeNav.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-all duration-500",
              isActive ? "text-primary scale-110" : "text-white/30 hover:text-white"
            )}
          >
            <div className={cn(
              "p-2.5 rounded-2xl transition-all duration-500",
              isActive && "bg-primary/20 glow-primary shadow-[0_0_15px_rgba(255,0,0,0.3)]"
            )}>
              <Icon size={24} strokeWidth={isActive ? 3 : 2} />
            </div>
            <span className={cn(
              "text-[9px] font-black uppercase tracking-tighter transition-all duration-500",
              isActive ? "opacity-100 mt-1" : "opacity-0 scale-75 -mt-2"
            )}>{item.label}</span>
            {isActive && (
              <div className="absolute -bottom-1 w-8 h-1 rounded-full neon-gradient shadow-[0_0_10px_red]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
