
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Clock, TrendingUp, Bell, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/utils-app';
import { useUser, useDoc, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, limit } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export default function UserDashboard() {
  const { user } = useUser();
  const db = useFirestore();
  
  const profileRef = useMemoFirebase(() => user ? doc(db, 'userProfiles', user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const configRef = useMemoFirebase(() => doc(db, 'appConfig', 'singletonConfig'), [db]);
  const { data: config } = useDoc(configRef);

  // Query sederhana untuk mendapatkan status batch tanpa filter berat
  const submissionsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, 'gmailBatches'), 
      where('userId', '==', user.uid),
      limit(50)
    );
  }, [db, user?.uid]);

  const { data: batches } = useCollection(submissionsQuery);

  const pendingCount = (batches || []).filter(b => b.status === 'Pending').length;
  const balance = profile?.balance || 0;

  return (
    <div className="space-y-6 animate-in">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tighter">Halo, {user?.email?.split('@')[0]} 👋</h1>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest opacity-70 text-[10px]">Selamat datang di dashboard GmailKu.</p>
      </div>

      <Card className="neon-gradient border-none overflow-hidden relative glow-primary rounded-[2rem] group">
        <CardContent className="p-8 text-white relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
              <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em]">Saldo Tersedia</p>
              <h2 className="text-4xl font-black">{formatCurrency(balance)}</h2>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="flex gap-6 mt-10 pt-6 border-t border-white/10">
            <div className="flex-1">
              <p className="text-[10px] uppercase font-black text-white/50 tracking-widest mb-1">Rate Gmail</p>
              <p className="text-xl font-black">{formatCurrency(config?.gmailRate || 0)}<span className="text-[10px] font-medium opacity-70 ml-1 uppercase">/ akun</span></p>
            </div>
          </div>
        </CardContent>
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
      </Card>

      <div className="space-y-4">
        <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 px-1">
          <Bell size={14} className="text-secondary" /> Pengumuman
        </h3>
        {config?.announcements && config.announcements.length > 0 ? (
          <div className="space-y-3">
            {config.announcements.map((ann: string, i: number) => (
              <div key={i} className="flex gap-4 glass-card p-5 rounded-[1.5rem] items-start hover:bg-white/10 transition-all border-none">
                <div className="mt-1 p-2 bg-secondary/10 rounded-xl text-secondary">
                  <AlertCircle size={18} />
                </div>
                <p className="text-sm leading-relaxed font-medium">{ann}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center glass-card rounded-[1.5rem] border-none opacity-50">
             <p className="text-[10px] font-black uppercase tracking-widest">Tidak ada pengumuman</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card border-none rounded-[1.5rem] hover:bg-white/10 transition-all">
          <CardContent className="p-5 space-y-3">
            <div className="w-10 h-10 bg-yellow-500/10 text-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/5">
              <Clock size={20} />
            </div>
            <div>
              <div className="text-2xl font-black">{pendingCount}</div>
              <div className="text-[9px] text-muted-foreground font-black uppercase tracking-wider">Batch Pending</div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-none rounded-[1.5rem] hover:bg-white/10 transition-all">
          <CardContent className="p-5 space-y-3">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/5">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="text-2xl font-black">{(batches || []).length}</div>
              <div className="text-[9px] text-muted-foreground font-black uppercase tracking-wider">Total Batch</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 px-1">
          <ShieldCheck size={14} className="text-primary" /> Peraturan Platform
        </h3>
        <Card className="glass-card border-none rounded-[1.5rem]">
          <CardContent className="p-6">
            <ul className="space-y-4">
              {config?.rules && config.rules.length > 0 ? (
                config.rules.map((rule: string, i: number) => (
                  <li key={i} className="flex gap-4 text-sm text-muted-foreground font-medium leading-relaxed group">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0 shadow-[0_0_8px_hsl(var(--primary))] group-hover:scale-125 transition-transform" />
                    <span>{rule}</span>
                  </li>
                ))
              ) : (
                <li className="text-[10px] font-black uppercase opacity-30 text-center py-4">Memuat aturan...</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
