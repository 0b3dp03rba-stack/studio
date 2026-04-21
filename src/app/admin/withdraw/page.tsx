"use client";

import { useApp, WithdrawStatus } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate, formatCurrency } from '@/lib/utils-app';
import { Check, X, Wallet, Clock, User } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function AdminWithdrawPage() {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  const allRequests = [...state.withdrawals].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const pendingRequests = allRequests.filter(r => r.status === 'Pending');
  const filteredRequests = activeTab === 'pending' ? pendingRequests : allRequests;

  const handleAction = (withdrawalId: string, status: WithdrawStatus) => {
    dispatch({ type: 'PROCESS_WITHDRAWAL', payload: { withdrawalId, status } });
    toast({ title: "Berhasil", description: `Withdrawal ${status === 'Disetujui' ? 'disetujui' : 'ditolak'}.` });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Manajemen Penarikan</h1>
        <p className="text-muted-foreground text-sm">Setujui atau tolak permintaan penarikan dana.</p>
      </div>

      <div className="flex bg-white/5 p-1 rounded-xl">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'pending' ? 'neon-gradient text-background glow-primary' : 'text-muted-foreground'}`}
        >
          PENDING ({pendingRequests.length})
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'history' ? 'neon-gradient text-background glow-primary' : 'text-muted-foreground'}`}
        >
          RIWAYAT
        </button>
      </div>

      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <Wallet size={48} className="mx-auto mb-4" />
            <p>Tidak ada data penarikan.</p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const user = state.users.find(u => u.id === req.userId);
            return (
              <Card key={req.id} className="glass-card border-white/5">
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                        <User size={20} className="text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-bold truncate w-32">{user?.email.split('@')[0]}</p>
                        <p className="text-[10px] text-muted-foreground">{formatDate(req.createdAt)}</p>
                      </div>
                    </div>
                    <Badge variant={req.status === 'Disetujui' ? 'default' : req.status === 'Ditolak' ? 'destructive' : 'secondary'} className="text-[10px]">
                      {req.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-2 border-y border-white/5">
                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground">Jumlah Tarik</p>
                      <p className="text-sm font-bold text-primary">{formatCurrency(req.amount)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground">Metode</p>
                      <p className="text-sm font-bold">{req.method}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-[10px] text-muted-foreground">
                      Total Potong: <span className="font-bold">{formatCurrency(req.totalDeduction)}</span>
                    </div>
                    {req.status === 'Pending' && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          className="h-8 px-3 text-[10px]"
                          onClick={() => handleAction(req.id, 'Ditolak')}
                        >
                          <X size={12} className="mr-1" /> Tolak
                        </Button>
                        <Button 
                          size="sm" 
                          className="h-8 px-3 text-[10px] neon-gradient text-background"
                          onClick={() => handleAction(req.id, 'Disetujui')}
                        >
                          <Check size={12} className="mr-1" /> Setujui
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
