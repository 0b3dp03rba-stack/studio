"use client";

import { useApp } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Clock, XCircle, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils-app';

export default function UserDashboard() {
  const { state } = useApp();
  const userBatches = state.batches.filter(b => b.userId === state.currentUser?.id);
  const userItems = userBatches.flatMap(b => b.items);

  const stats = {
    total: userItems.length,
    pending: userItems.filter(i => i.status === 'Pending').length,
    approved: userItems.filter(i => i.status === 'Disetujui').length,
    rejected: userItems.filter(i => i.status === 'Ditolak').length,
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Halo, {state.currentUser?.email.split('@')[0]}</h1>
        <p className="text-muted-foreground text-sm">Berikut ringkasan akun Anda hari ini.</p>
      </div>

      {/* Balance Card */}
      <Card className="neon-gradient text-background border-none overflow-hidden relative glow-primary">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-background/80 text-sm font-medium uppercase tracking-wider">Saldo Tersedia</p>
              <h2 className="text-4xl font-black mt-1">{formatCurrency(state.currentUser?.balance || 0)}</h2>
            </div>
            <div className="bg-background/20 p-2 rounded-full backdrop-blur-md">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="flex gap-4 mt-8 pt-4 border-t border-background/10">
            <div className="flex-1">
              <p className="text-[10px] uppercase font-bold text-background/60">Rate Saat Ini</p>
              <p className="text-lg font-bold">{formatCurrency(state.settings.gmailRate)}/Mail</p>
            </div>
          </div>
        </CardContent>
        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </Card>

      {/* Announcements */}
      <div className="space-y-3">
        {state.settings.announcements.map((ann, i) => (
          <div key={i} className="flex gap-3 bg-white/5 border border-white/10 p-4 rounded-2xl items-start">
            <div className="mt-1">
              <AlertCircle size={18} className="text-secondary" />
            </div>
            <p className="text-sm leading-relaxed">{ann}</p>
          </div>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card border-white/5">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-center text-muted-foreground">
              <Clock size={16} />
              <span className="text-[10px] font-bold uppercase">Pending</span>
            </div>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <div className="text-[10px] text-muted-foreground">Gmails</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/5">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-center text-primary">
              <CheckCircle2 size={16} />
              <span className="text-[10px] font-bold uppercase">Approved</span>
            </div>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <div className="text-[10px] text-muted-foreground">Gmails</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/5">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-center text-destructive">
              <XCircle size={16} />
              <span className="text-[10px] font-bold uppercase">Rejected</span>
            </div>
            <div className="text-2xl font-bold">{stats.rejected}</div>
            <div className="text-[10px] text-muted-foreground">Gmails</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/5">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-center text-secondary">
              <Send size={16} />
              <span className="text-[10px] font-bold uppercase">Total</span>
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-[10px] text-muted-foreground">Gmails</div>
          </CardContent>
        </Card>
      </div>

      {/* Rules */}
      <div className="space-y-3">
        <h3 className="font-bold text-lg">Peraturan Platform</h3>
        <ul className="space-y-2">
          {state.settings.rules.map((rule, i) => (
            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
              <span className="text-primary font-bold">•</span>
              {rule}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
