"use client";

import { useApp } from '@/lib/store';
import { LayoutDashboard, Send, Wallet, History, User, FileText, Users, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function BottomNav() {
  const { state } = useApp();
  const pathname = usePathname();

  if (!state.currentUser) return null;

  const isAdmin = state.currentUser.role === 'Admin';

  const userNav = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Setor', icon: Send, href: '/setor' },
    { label: 'Withdraw', icon: Wallet, href: '/withdraw' },
    { label: 'Riwayat', icon: History, href: '/riwayat' },
    { label: 'Profil', icon: User, href: '/profil' },
  ];

  const adminNav = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { label: 'Setoran', icon: FileText, href: '/admin/setoran' },
    { label: 'Withdraw', icon: Wallet, href: '/admin/withdraw' },
    { label: 'User', icon: Users, href: '/admin/users' },
    { label: 'Settings', icon: Settings, href: '/admin/settings' },
  ];

  const activeNav = isAdmin ? adminNav : userNav;

  return (
    <nav className="bottom-nav">
      {activeNav.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-300",
              isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-white"
            )}
          >
            <Icon size={20} className={cn(isActive && "glow-primary")} />
            <span className="text-[10px] font-medium">{item.label}</span>
            {isActive && <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary glow-primary" />}
          </Link>
        );
      })}
    </nav>
  );
}
