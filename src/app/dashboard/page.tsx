"use client";

import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Clock, TrendingUp, Bell, ShieldCheck, Power } from 'lucide-react';
import { formatCurrency } from '@/lib/utils-app';
import { useUser, useDoc, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, limit } from 'firebase/firestore';

export default function UserDashboard() {
  const { user } = useUser();
  const db = useFirestore();
  
  const profileRef = useMemoFirebase(() => user ? doc(db, 'userProfiles', user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const configRef = useMemoFirebase(() => doc(db, 'appConfig', 'singletonConfig'), [db]);
  const { data: config } = useDoc(configRef);

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
        <h1 className="text-3xl font-black tracking-tighter neon-text uppercase">Halo, {user?.email?.split('@')[0]}</h1>
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Selamat datang di Obed Store Dashboard.</p>
      </div>

      <Card className="neon-gradient border-none overflow-hidden relative glow-primary rounded-[2.5rem] group shadow-2xl">
        <CardContent className="p-8 text-white relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-2">
              <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em]">Total Saldo Dompet</p>
              <h2 className="text-5xl font-black tracking-tighter">{formatCurrency(balance)}</h2>
            </div>
            <div className="bg-white/10 p-4 rounded-[1.5rem] backdrop-blur-xl border border-white/20 group-hover:scale-110 transition-transform shadow-xl">
              <TrendingUp size={28} />
            </div>
          </div>
          <div className="flex gap-6 mt-10 pt-6 border-t border-white/10 items-center justify-between">
            <div className="flex-1">
              <p className="text-[10px] uppercase font-black text-white/50 tracking-widest mb-1">Status Layanan</p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${config?.isPlatformOpen ? 'bg-white' : 'bg-red-900'}`} />
                <span className="text-xs font-black uppercase tracking-widest">{config?.isPlatformOpen ? 'OPEN' : 'CLOSED'}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-black text-white/50 tracking-widest mb-1">Rate Gmail</p>
              <p className="text-lg font-black">{formatCurrency(config?.gmailRate || 0)}<span className="text-[10px] opacity-60 ml-1 font-bold">/ACC</span></p>
            </div>
          </div>
        </CardContent>
        <div className="absolute -bottom-12 -right-12 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
      </Card>

      <div className="space-y-4">
        <h3 className="font-black text-[10px] uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2 px-1">
          <Bell size={14} className="text-primary" /> Pengumuman Obed Store
        </h3>
        {config?.announcements && config.announcements.length > 0 ? (
          <div className="space-y-3">
            {config.announcements.map((ann: string, i: number) => (
              <div key={i} className="flex gap-4 glass-card p-5 rounded-[1.8rem] items-start hover:bg-white/5 transition-all border-none shadow-xl">
                <div className="mt-1 p-2 bg-primary/10 rounded-xl text-primary">
                  <AlertCircle size={18} />
                </div>
                <p className="text-xs leading-relaxed font-medium opacity-90">{ann}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center glass-card rounded-[1.8rem] border-none opacity-40">
             <p className="text-[10px] font-black uppercase tracking-widest">Belum ada pengumuman terbaru</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card border-none rounded-[1.8rem] hover:bg-white/5 transition-all shadow-xl group">
          <CardContent className="p-6 space-y-3">
            <div className="w-12 h-12 bg-white/5 text-primary rounded-2xl flex items-center justify-center shadow-lg group-hover:glow-primary transition-all">
              <Clock size={24} />
            </div>
            <div>
              <div className="text-3xl font-black tracking-tighter">{pendingCount}</div>
              <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Pending Batch</div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-none rounded-[1.8rem] hover:bg-white/5 transition-all shadow-xl group">
          <CardContent className="p-6 space-y-3">
            <div className="w-12 h-12 bg-white/5 text-primary rounded-2xl flex items-center justify-center shadow-lg group-hover:glow-primary transition-all">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="text-3xl font-black tracking-tighter">{(batches || []).length}</div>
              <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Total Batch</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="font-black text-[10px] uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2 px-1">
          <ShieldCheck size={14} className="text-primary" /> Peraturan Platform
        </h3>
        <Card className="glass-card border-none rounded-[2rem] shadow-2xl">
          <CardContent className="p-7">
            <ul className="space-y-5">
              {config?.rules && config.rules.length > 0 ? (
                config.rules.map((rule: string, i: number) => (
                  <li key={i} className="flex gap-4 text-xs text-muted-foreground font-medium leading-relaxed group">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0 shadow-[0_0_10px_hsl(var(--primary))] group-hover:scale-125 transition-transform" />
                    <span className="opacity-90">{rule}</span>
                  </li>
                ))
              ) : (
                <li className="text-[10px] font-black uppercase opacity-20 text-center py-4 tracking-widest">Memuat peraturan...</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}