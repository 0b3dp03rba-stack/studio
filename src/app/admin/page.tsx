"use client";

import { useApp } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils-app';
import { Mail, Wallet, Users, Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function AdminDashboard() {
  const { state } = useApp();
  
  const totalGmails = state.batches.flatMap(b => b.items).length;
  const pendingGmails = state.batches.flatMap(b => b.items).filter(i => i.status === 'Pending').length;
  const approvedGmails = state.batches.flatMap(b => b.items).filter(i => i.status === 'Disetujui').length;
  
  const pendingWithdrawals = state.withdrawals.filter(w => w.status === 'Pending').length;
  const totalUsers = state.users.length;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground text-sm">Monitor seluruh aktivitas platform.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card border-white/5 border-l-4 border-l-primary">
          <CardContent className="p-4 space-y-2">
            <Mail size={18} className="text-primary" />
            <div className="text-2xl font-bold">{totalGmails}</div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold">Total Setoran</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/5 border-l-4 border-l-secondary">
          <CardContent className="p-4 space-y-2">
            <Clock size={18} className="text-secondary" />
            <div className="text-2xl font-bold">{pendingGmails}</div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold">Gmail Pending</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/5 border-l-4 border-l-primary">
          <CardContent className="p-4 space-y-2">
            <Wallet size={18} className="text-primary" />
            <div className="text-2xl font-bold">{pendingWithdrawals}</div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold">Withdrawal Pending</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/5 border-l-4 border-l-secondary">
          <CardContent className="p-4 space-y-2">
            <Users size={18} className="text-secondary" />
            <div className="text-2xl font-bold">{totalUsers}</div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold">Total User</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold">Informasi Akun Admin</h3>
        <Card className="glass-card border-white/5">
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Admin Rate</span>
              <span className="font-bold text-primary">{formatCurrency(state.settings.gmailRate)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Min. WD</span>
              <span className="font-bold">{formatCurrency(state.settings.minWithdraw)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Biaya Admin</span>
              <span className="font-bold">{formatCurrency(state.settings.adminFee)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary font-bold">
          <CheckCircle2 size={18} />
          <span>Quick Actions</span>
        </div>
        <p className="text-xs text-primary/80">Silakan buka menu Setoran atau Withdraw untuk memproses permintaan user yang tertunda.</p>
      </div>
    </div>
  );
}
