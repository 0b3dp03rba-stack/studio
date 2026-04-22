
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Clock, TrendingUp, Bell, ShieldCheck } from 'lucide-react';
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
    <div className="space-y-8 animate-in pb-10">
      <div className="space-y-1">
        <h1 className="text-4xl font-black tracking-tighter neon-text-pulse uppercase">Halo, {user?.email?.split('@')[0]}</h1>
        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">Dashboard Operasional Utama.</p>
      </div>

      <Card className="neon-gradient border-none overflow-hidden relative rounded-[2rem] group shadow-2xl">
        <CardContent className="p-8 text-white relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-3">
              <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.4em]">Total Saldo Tersedia</p>
              <h2 className="text-6xl font-black tracking-tighter drop-shadow-lg">{formatCurrency(balance)}</h2>
            </div>
            <div className="bg-black/30 p-5 rounded-[2rem] backdrop-blur-xl border border-white/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-2xl">
              <TrendingUp size={32} className="text-white" />
            </div>
          </div>
          <div className="flex gap-8 mt-12 pt-8 border-t border-white/20 items-center justify-between">
            <div className="flex-1">
              <p className="text-[10px] uppercase font-black text-white/60 tracking-[0.2em] mb-2">Layanan Platform</p>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${config?.isPlatformOpen ? 'bg-white shadow-[0_0_10px_white]' : 'bg-red-500 shadow-[0_0_10px_red]'}`} />
                <span className="text-sm font-black uppercase tracking-widest">{config?.isPlatformOpen ? 'BUKA / ONLINE' : 'TUTUP / OFFLINE'}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-black text-white/60 tracking-[0.2em] mb-2">Estimasi Rate</p>
              <p className="text-xl font-black">{formatCurrency(config?.gmailRate || 0)}<span className="text-[10px] opacity-60 ml-1 font-bold">/ACC</span></p>
            </div>
          </div>
        </CardContent>
        {/* Decorative Neon Blurs */}
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-yellow-400/20 rounded-full blur-[100px]" />
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-red-600/30 rounded-full blur-[80px]" />
      </Card>

      <div className="space-y-4">
        <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-white/50 flex items-center gap-2 px-1">
          <Bell size={16} className="text-primary" /> Pengumuman Terbaru
        </h3>
        {config?.announcements && config.announcements.length > 0 ? (
          <div className="space-y-4">
            {config.announcements.map((ann: string, i: number) => (
              <div key={i} className="flex gap-4 glass-card p-6 rounded-[2rem] items-start hover:bg-white/5 transition-all shadow-xl group border-none">
                <div className="mt-1 p-2.5 bg-primary/10 rounded-xl text-primary group-hover:neon-gradient group-hover:text-white transition-all">
                  <AlertCircle size={20} />
                </div>
                <p className="text-sm leading-relaxed font-medium text-white/90">{ann}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center glass-card rounded-[2rem] opacity-30 border-none">
             <p className="text-[11px] font-black uppercase tracking-widest">Belum ada pembaruan sistem</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-5">
        <Card className="glass-card border-none rounded-[2rem] hover:bg-white/10 transition-all shadow-xl group cursor-pointer active:scale-95">
          <CardContent className="p-7 space-y-4">
            <div className="w-14 h-14 bg-white/5 text-primary rounded-[1.5rem] flex items-center justify-center shadow-lg group-hover:neon-gradient group-hover:text-white transition-all duration-500">
              <Clock size={28} />
            </div>
            <div>
              <div className="text-4xl font-black tracking-tighter text-white">{pendingCount}</div>
              <div className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-1">Pending</div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-none rounded-[2rem] hover:bg-white/10 transition-all shadow-xl group cursor-pointer active:scale-95">
          <CardContent className="p-7 space-y-4">
            <div className="w-14 h-14 bg-white/5 text-primary rounded-[1.5rem] flex items-center justify-center shadow-lg group-hover:neon-gradient group-hover:text-white transition-all duration-500">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <div className="text-4xl font-black tracking-tighter text-white">{(batches || []).length}</div>
              <div className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-1">Selesai</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-white/50 flex items-center gap-2 px-1">
          <ShieldCheck size={16} className="text-primary" /> Aturan Utama Platform
        </h3>
        <Card className="glass-card border-none rounded-[2rem] shadow-2xl relative overflow-hidden">
          <CardContent className="p-8">
            <ul className="space-y-6">
              {config?.rules && config.rules.length > 0 ? (
                config.rules.map((rule: string, i: number) => (
                  <li key={i} className="flex gap-4 text-sm text-white/80 font-medium leading-relaxed group">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0 shadow-[0_0_12px_red] group-hover:scale-125 transition-transform" />
                    <span className="text-white">{rule}</span>
                  </li>
                ))
              ) : (
                <li className="text-[11px] font-black uppercase opacity-20 text-center py-6 tracking-widest">Sinkronisasi data...</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
