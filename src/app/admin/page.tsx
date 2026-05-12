
"use client";

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Eye, Link as LinkIcon, Globe, Clock, ArrowUpRight, MousePointer2, Settings, MessageCircle, Wallet, Inbox } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, limit, doc, collectionGroup } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function AdminDashboard() {
  const db = useFirestore();

  // 1. Data User Profiles
  const usersQuery = useMemoFirebase(() => query(collection(db, 'userProfiles'), limit(1000)), [db]);
  const { data: allUsers, isLoading: isUsersLoading } = useCollection(usersQuery);

  // 2. Data Global Stats
  const globalStatsRef = useMemoFirebase(() => doc(db, 'appConfig', 'globalStats'), [db]);
  const { data: globalStats } = useDoc(globalStatsRef);

  // 3. Data Link Global (Tanpa OrderBy untuk menghindari error index COLLECTION_GROUP_DESC)
  const linksQuery = useMemoFirebase(() => query(collectionGroup(db, 'links'), limit(50)), [db]);
  const { data: rawLinks } = useCollection(linksQuery);

  // Sorting manual di memory untuk menghindari kebutuhan Index di Firestore Console
  const recentLinks = useMemo(() => {
    if (!rawLinks) return [];
    return [...rawLinks].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 10);
  }, [rawLinks]);

  // Perhitungan Statistik
  const totalUsers = allUsers?.length || 0;
  const totalPublicViews = useMemo(() => {
    return allUsers?.reduce((acc, user) => acc + (user.views || 0), 0) || 0;
  }, [allUsers]);

  const stats = [
    { label: 'Total Users', value: totalUsers, icon: Users, color: 'text-primary' },
    { label: 'Public Profile Views', value: totalPublicViews, icon: Eye, color: 'text-secondary' },
    { label: 'Homepage Visitors', value: globalStats?.landingPageViews || 0, icon: Globe, color: 'text-white' },
    { label: 'Links Found', value: rawLinks?.length || 0, icon: LinkIcon, color: 'text-primary' },
  ];

  const adminMenus = [
    { label: 'Manajemen User', icon: Users, href: '/admin/users', desc: 'Kelola data & hapus user' },
    { label: 'Setoran Gmail', icon: Inbox, href: '/admin/setoran', desc: 'Validasi Gmail masuk' },
    { label: 'Penarikan WD', icon: Wallet, href: '/admin/withdraw', desc: 'Proses penarikan dana' },
    { label: 'Pusat Pesan', icon: MessageCircle, href: '/admin/chat', desc: 'Support & Konsultasi' },
    { label: 'Sistem Global', icon: Settings, href: '/admin/settings', desc: 'Konfigurasi platform' },
  ];

  if (isUsersLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-primary/50">Membangun Admin Feed...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full mb-2">
           <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
           <span className="text-[9px] font-black uppercase tracking-widest text-primary">System Online</span>
        </div>
        <h1 className="text-4xl font-black tracking-tighter uppercase text-white">Linku Control Panel</h1>
        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">ADMINISTRATOR: CREEPPERMOMENT@GMAIL.COM</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item, i) => (
          <Card key={i} className="glass-card border-none rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-primary/10 transition-colors`} />
            <CardContent className="p-0 space-y-4 relative z-10">
              <div className={`w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center ${item.color}`}>
                <item.icon size={20} />
              </div>
              <div>
                <p className="text-3xl font-black tracking-tighter text-white">{item.value.toLocaleString()}</p>
                <p className="text-[8px] font-black uppercase text-white/30 tracking-[0.2em] mt-1">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Navigation & Control */}
        <div className="space-y-6">
           <h3 className="font-black text-xs uppercase tracking-widest text-white/50 flex items-center gap-2 px-2">
             <Settings size={16} className="text-primary" /> Management Console
           </h3>
           <div className="grid gap-3">
              {adminMenus.map((menu, i) => (
                <Link key={i} href={menu.href}>
                  <Card className="glass-card border-none rounded-2xl p-4 hover:bg-white/[0.08] transition-all group shadow-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:neon-gradient group-hover:text-background transition-all">
                        <menu.icon size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black uppercase tracking-tight text-white">{menu.label}</p>
                        <p className="text-[8px] font-bold text-white/30 uppercase">{menu.desc}</p>
                      </div>
                      <ArrowUpRight size={14} className="text-white/20 group-hover:text-primary transition-colors" />
                    </div>
                  </Card>
                </Link>
              ))}
           </div>
        </div>

        {/* Recent Links Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
             <h3 className="font-black text-xs uppercase tracking-widest text-white/50 flex items-center gap-2">
               <Clock size={16} className="text-primary" /> Global Activity Feed
             </h3>
             <Badge variant="outline" className="text-[8px] font-black uppercase border-white/10 text-white/40">LATEST UPDATES</Badge>
          </div>
          
          <div className="space-y-3">
            {recentLinks.map((link) => (
              <Card key={link.id} className="glass-card border-none rounded-2xl p-4 flex items-center gap-4 group hover:bg-white/[0.05] transition-colors">
                 <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/5 shrink-0">
                    {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" /> : <LinkIcon size={20} className="text-primary/50" />}
                 </div>
                 <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-sm truncate uppercase tracking-tight">{link.title}</h4>
                    <p className="text-[9px] text-white/20 truncate uppercase font-mono mt-0.5">{link.url}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-primary uppercase">{link.clicks || 0} CLICKS</p>
                    <p className="text-[7px] text-white/10 uppercase mt-1">ID: {link.id.slice(0, 8)}</p>
                 </div>
                 <a href={link.url} target="_blank" className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight size={16} className="text-white/40 hover:text-white" />
                 </a>
              </Card>
            ))}
            {recentLinks.length === 0 && (
              <div className="py-20 text-center opacity-10 font-black uppercase text-[10px] tracking-widest border border-dashed border-white/10 rounded-[2rem]">No Global Activity Yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
