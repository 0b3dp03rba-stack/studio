
"use client";

import { LayoutDashboard, User, Link as LinkIcon, Share2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

export default function BottomNav() {
  const { user } = useUser();
  const pathname = usePathname();

  if (!user) return null;
  
  // Sembunyikan Nav jika sedang di halaman publik profile (u/[userId])
  if (pathname.startsWith('/u/')) return null;

  const navItems = [
    { label: 'Dash', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Profil', icon: User, href: '/dashboard/profil' },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
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
