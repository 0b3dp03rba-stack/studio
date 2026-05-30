
"use client";

import { LayoutDashboard, User, Palette, FolderKanban, Zap, Users, Activity, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * @fileOverview Bottom Navigation Linku Engine v90.0
 * Dual Mode: 
 * - Admin Mode (3 Menu): Dashboard, Database, Activity.
 * - User Mode (5 Menu): Dash, Manage, Premium, Visual Lab, User Set.
 */

export default function BottomNav() {
  const { user } = useUser();
  const db = useFirestore();
  const pathname = usePathname();

  const profileRef = useMemoFirebase(() => 
    user ? doc(db, 'userProfiles', user.uid) : null, 
    [db, user?.uid]
  );
  const { data: profile } = useDoc(profileRef);

  if (!user) return null;
  
  const isAdminPath = pathname.startsWith('/admin');
  const isAdmin = profile?.role === 'Admin' || user?.email === 'creeppermoment@gmail.com';
  
  // Sembunyikan di profil publik
  const isPublicProfile = pathname.startsWith('/u/') || pathname.startsWith('/unified/') || (pathname.length > 1 && !pathname.startsWith('/dashboard') && !isAdminPath && !pathname.startsWith('/verify-email') && !pathname.startsWith('/auth'));
  if (isPublicProfile) return null;

  // MENU ADMIN (3 ITEM)
  const adminNavItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { label: 'Database', icon: Users, href: '/admin/users' },
    { label: 'Activity', icon: Activity, href: '/admin/activity' },
  ];

  // MENU USER (5 ITEM)
  const userNavItems = [
    { label: 'Dash', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Manage', icon: FolderKanban, href: '/dashboard/manage' },
    { label: 'Premium', icon: Zap, href: '/dashboard/premium' },
    { label: 'Visual Lab', icon: Palette, href: '/dashboard/theme' },
    { label: 'User Set', icon: User, href: '/dashboard/profil' },
  ];

  // Gunakan menu admin hanya jika di path admin DAN user adalah admin
  const activeItems = (isAdminPath && isAdmin) ? adminNavItems : userNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-24 bg-black/95 backdrop-blur-3xl border-t border-white/5 flex items-center justify-around px-4 z-50 rounded-t-[2.5rem]">
      {activeItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-500",
              isActive ? "text-primary scale-110" : "text-white/20 hover:text-white"
            )}
          >
            <div className={cn(
              "p-3 rounded-2xl transition-all",
              isActive && "bg-primary/20 glow-primary"
            )}>
              <Icon size={20} strokeWidth={isActive ? 3 : 2} />
            </div>
            <span className={cn(
              "text-[7px] font-black uppercase tracking-widest transition-all",
              isActive ? "opacity-100" : "opacity-0 scale-75"
            )}>{item.label}</span>
            {isActive && <div className="absolute -bottom-1 w-8 h-1 rounded-full neon-gradient" />}
          </Link>
        );
      })}
    </nav>
  );
}
