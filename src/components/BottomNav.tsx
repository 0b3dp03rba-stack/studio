
"use client";

import { useApp } from '@/lib/store';
import { LayoutDashboard, Send, Wallet, History, User, FileText, Users, Settings, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function BottomNav() {
  const { state } = useApp();
  const pathname = usePathname();

  if (!state.currentUser) return null;

  const isAdmin = state.currentUser.role === 'Admin';

  const userNav = [
    { label: 'Home', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Setor', icon: Send, href: '/dashboard/setor' },
    { label: 'Withdraw', icon: Wallet, href: '/dashboard/withdraw' },
    { label: 'History', icon: History, href: '/dashboard/riwayat' },
    { label: 'Profil', icon: User, href: '/dashboard/profil' },
  ];

  const adminNav = [
    { label: 'Panel', icon: LayoutDashboard, href: '/admin' },
    { label: 'Setoran', icon: FileText, href: '/admin/setoran' },
    { label: 'Chat', icon: MessageCircle, href: '/admin/chat' },
    { label: 'Withdraw', icon: Wallet, href: '/admin/withdraw' },
    { label: 'System', icon: Settings, href: '/admin/settings' },
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
              isActive ? "text-primary scale-110" : "text-muted-foreground/60 hover:text-white"
            )}
          >
            <div className={cn(
              "p-2 rounded-2xl transition-all duration-500",
              isActive && "bg-primary/10 glow-primary"
            )}>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={cn(
              "text-[10px] font-black uppercase tracking-tighter transition-all duration-500",
              isActive ? "opacity-100" : "opacity-0 scale-75"
            )}>{item.label}</span>
            {isActive && (
              <div className="absolute -bottom-1 w-6 h-1 rounded-full bg-primary glow-primary animate-in" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
