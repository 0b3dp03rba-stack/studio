
"use client";

import { LayoutDashboard, User, Palette, FolderKanban } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

export default function BottomNav() {
  const { user } = useUser();
  const pathname = usePathname();

  if (!user) return null;
  
  if (pathname.startsWith('/u/') || (pathname.length > 1 && !pathname.startsWith('/dashboard'))) return null;

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Manage', icon: FolderKanban, href: '/dashboard/manage' },
    { label: 'Theme', icon: Palette, href: '/dashboard/theme' },
    { label: 'Profil', icon: User, href: '/dashboard/profil' },
  ];

  return (
    <nav className="bottom-nav h-24">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-all duration-500",
              isActive ? "text-primary scale-110" : "text-white/20 hover:text-white"
            )}
          >
            <div className={cn(
              "p-3 rounded-2xl transition-all duration-500",
              isActive && "bg-primary/20 glow-primary shadow-[0_0_20px_rgba(255,0,0,0.4)]"
            )}>
              <Icon size={22} strokeWidth={isActive ? 3 : 2} />
            </div>
            <span className={cn(
              "text-[8px] font-black uppercase tracking-widest transition-all duration-500",
              isActive ? "opacity-100 mt-1" : "opacity-0 scale-75 -mt-2"
            )}>{item.label}</span>
            {isActive && (
              <div className="absolute -bottom-1 w-10 h-1.5 rounded-full neon-gradient" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
