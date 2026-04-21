
"use client";

import { useApp } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Clock, XCircle, TrendingUp, Send, Bell, ShieldCheck, Play } from 'lucide-react';
import { formatCurrency } from '@/lib/utils-app';

export default function UserDashboard() {
  const { state } = useApp();
  const userBatches = state.batches.filter(b => b.userId === state.currentUser?.id);
  const userItems = userBatches.flatMap(b => b.items);

  const stats = {
    total: userItems.length,
    pending: userItems.filter(i => i.status === 'Pending').length,
    processing: userItems.filter(i => i.status === 'Proses').length,
    approved: userItems.filter(i => i.status === 'Disetujui').length,
    rejected: userItems.filter(i => i.status === 'Ditolak').length,
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tighter">Halo, {state.currentUser?.email.split('@')[0]} 👋</h1>
        <p className="text-muted-foreground text-sm font-medium">Berikut ringkasan akun Anda hari ini.</p>
      </div>

      {/* Balance Card - High End Design */}
      <Card className="neon-gradient border-none overflow-hidden relative glow-primary rounded-[2rem]">
        <CardContent className="p-8 text-white">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
              <p className="text-white/70 text-xs font-bold uppercase tracking-[0.2em]">Saldo Tersedia</p>
              <h2 className="text-4xl font-black">{formatCurrency(state.currentUser?.balance || 0)}</h2>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/20">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="flex gap-6 mt-10 pt-6 border-t border-white/10">
            <div className="flex-1">
              <p className="text-[10px] uppercase font-black text-white/50 tracking-widest">Rate Gmail</p>
              <p className="text-xl font-black">{formatCurrency(state.settings.gmailRate)}<span className="text-xs font-medium opacity-70"> / akun</span></p>
            </div>
          </div>
        </CardContent>
        {/* Abstract Shapes for Gacor Look */}
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
      </Card>

      {/* Announcements */}
      <div className="space-y-4">
        <h3 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          <Bell size={14} className="text-secondary" /> Pengumuman
        </h3>
        {state.settings.announcements.length > 0 ? (
          <div className="space-y-3">
            {state.settings.announcements.map((ann, i) => (
              <div key={i} className="flex gap-4 glass-card p-5 rounded-[1.5rem] items-start hover:bg-white/10 transition-all group">
                <div className="mt-1 p-2 bg-secondary/20 rounded-xl text-secondary group-hover:scale-110 transition-transform">
                  <AlertCircle size={18} />
                </div>
                <p className="text-sm leading-relaxed font-medium">{ann}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic px-2">Tidak ada pengumuman hari ini.</p>
        )}
      </div>

      {/* Stats Grid - Smooth Rounded */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Pending', val: stats.pending, icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
          { label: 'Proses', val: stats.processing, icon: Play, color: 'text-secondary', bg: 'bg-secondary/10' },
          { label: 'Approved', val: stats.approved, icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Rejected', val: stats.rejected, icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
        ].map((s, i) => (
          <Card key={i} className="glass-card border-none rounded-[1.5rem] hover:scale-[1.02] transition-all">
            <CardContent className="p-5 space-y-3">
              <div className={`w-8 h-8 ${s.bg} ${s.color} rounded-xl flex items-center justify-center`}>
                <s.icon size={18} />
              </div>
              <div>
                <div className="text-2xl font-black">{s.val}</div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rules Section */}
      <div className="space-y-4">
        <h3 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          <ShieldCheck size={14} className="text-primary" /> Peraturan
        </h3>
        <Card className="glass-card border-none rounded-[1.5rem]">
          <CardContent className="p-6">
            <ul className="space-y-4">
              {state.settings.rules.map((rule, i) => (
                <li key={i} className="flex gap-4 text-sm text-muted-foreground font-medium leading-relaxed">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0 shadow-[0_0_8px_hsl(var(--primary))]" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
