
"use client";

import { LayoutDashboard, User, Palette, FolderKanban, Sparkles, BarChart3, Clock, Users, LogOut, History } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

export default function BottomNav() {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (!user) return null;
  
  const isAdminPath = pathname.startsWith('/admin');
  
  // Sembunyikan di profil publik /u/ atau /unified/
  const isPublicProfile = pathname.startsWith('/u/') || pathname.startsWith('/unified/') || (pathname.length > 1 && !pathname.startsWith('/dashboard') && !isAdminPath && !pathname.startsWith('/editor'));
  if (isPublicProfile) return null;

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/'); // FIX PRIORITAS 5: Redirect to home instead of login
  };

  const userItems = [
    { label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Hub', icon: FolderKanban, href: '/dashboard/manage' },
    { label: 'Visual', icon: Palette, href: '/dashboard/theme' },
    { label: 'Riwayat', icon: History, href: '/dashboard/riwayat' },
    { label: 'ID Set', icon: User, href: '/dashboard/profil' },
  ];

  const adminItems = [
    { label: 'Analisis', icon: BarChart3, href: '/admin' },
    { label: 'Database', icon: Users, href: '/admin/users' },
    { label: 'Activity', icon: Clock, href: '/admin/activity' },
    { label: 'Exit', icon: LogOut, href: '#', onClick: handleLogout },
  ];

  const navItems = isAdminPath ? adminItems : userItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-24 bg-black/90 backdrop-blur-3xl border-t border-white/5 flex items-center justify-around px-4 z-50 rounded-t-[2.5rem]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        
        if (item.onClick) {
          return (
            <button key={item.label} onClick={item.onClick} className="flex flex-col items-center justify-center gap-1 flex-1 text-white/20">
               <div className="p-3 rounded-2xl"><Icon size={20} /></div>
               <span className="text-[7px] font-black uppercase tracking-widest">LOGOUT</span>
            </button>
          );
        }

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
