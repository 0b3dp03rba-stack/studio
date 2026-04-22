
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate, formatCurrency } from '@/lib/utils-app';
import { ChevronRight, History, Wallet, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';

export default function RiwayatPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [activeTab, setActiveTab] = useState<'setoran' | 'withdrawal'>('setoran');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Query Setoran
  const batchesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, 'gmailBatches'), 
      where('userId', '==', user.uid),
      limit(100)
    );
  }, [db, user?.uid]);

  const { data: rawBatches, isLoading: isBatchesLoading } = useCollection(batchesQuery);

  // Query Withdrawal
  const wdQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, 'withdrawalRequests'),
      where('userId', '==', user.uid),
      limit(100)
    );
  }, [db, user?.uid]);

  const { data: rawWds, isLoading: isWdsLoading } = useCollection(wdQuery);

  // Sorting Setoran
  const sortedBatches = useMemo(() => {
    if (!rawBatches) return [];
    return [...rawBatches].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [rawBatches]);

  // Sorting WD
  const sortedWds = useMemo(() => {
    if (!rawWds) return [];
    return [...rawWds].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [rawWds]);

  const isLoading = activeTab === 'setoran' ? isBatchesLoading : isWdsLoading;
  const currentData = activeTab === 'setoran' ? sortedBatches : sortedWds;

  return (
    <div className="space-y-6 animate-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tighter text-white uppercase">Pusat Riwayat</h1>
        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">Kelola jejak aktivitas keuangan Anda.</p>
      </div>

      <div className="flex glass-card p-1.5 rounded-2xl shadow-inner">
        <button 
          onClick={() => setActiveTab('setoran')}
          className={`flex-1 py-3.5 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'setoran' ? 'neon-gradient text-white glow-primary shadow-lg' : 'text-muted-foreground hover:bg-white/5'}`}
        >
          <Send size={14} /> SETORAN
        </button>
        <button 
          onClick={() => setActiveTab('withdrawal')}
          className={`flex-1 py-3.5 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'withdrawal' ? 'neon-gradient text-white glow-primary shadow-lg' : 'text-muted-foreground hover:bg-white/5'}`}
        >
          <Wallet size={14} /> PENARIKAN
        </button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase text-primary/50 tracking-widest">Sinkronisasi...</p>
          </div>
        ) : currentData.length === 0 ? (
          <div className="text-center py-24 glass-card rounded-[2.5rem] border-none opacity-20 group">
            {activeTab === 'setoran' ? <History size={80} className="mx-auto mb-6" /> : <Wallet size={80} className="mx-auto mb-6" />}
            <p className="text-lg font-black uppercase tracking-[0.2em]">Belum ada data</p>
          </div>
        ) : (
          currentData.map((item) => (
            <Card 
              key={item.id} 
              className="glass-card border-none rounded-[1.5rem] hover:bg-white/10 transition-all cursor-pointer group shadow-xl active:scale-[0.98]"
              onClick={() => setSelectedItem(item)}
            >
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-[10px] uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/10">#{item.id.slice(0, 6)}</span>
                    <Badge variant={item.status === 'Selesai' || item.status === 'Disetujui' ? 'default' : item.status === 'Proses' ? 'secondary' : 'outline'} className="text-[8px] px-2 h-5 font-black uppercase tracking-tight">
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                    {item.createdAt?.seconds ? formatDate(new Date(item.createdAt.seconds * 1000).toISOString()) : 'Baru saja'}
                  </p>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <p className="text-2xl font-black leading-none text-white tracking-tighter">
                      {activeTab === 'setoran' ? item.totalCount : formatCurrency(item.amount)}
                    </p>
                    <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">
                      {activeTab === 'setoran' ? 'Akun' : 'Nominal'}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-all shadow-inner">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="glass-card border-none rounded-[2.5rem] bg-background/95 backdrop-blur-2xl shadow-2xl p-0 overflow-hidden max-w-[90%] mx-auto">
          <div className="neon-gradient h-1.5 w-full" />
          <div className="p-8">
            <DialogHeader className="mb-8">
              <DialogTitle className="flex justify-between items-center text-white">
                <span className="font-black uppercase tracking-tighter text-2xl">{activeTab === 'setoran' ? 'Batch Detail' : 'WD Detail'}</span>
                <Badge className="font-black text-[10px] h-7 px-4 rounded-xl uppercase tracking-widest">{selectedItem?.status}</Badge>
              </DialogTitle>
            </DialogHeader>
            
            {selectedItem && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 glass-card rounded-2xl border-white/5 shadow-inner">
                    <p className="text-[9px] font-black text-muted-foreground uppercase mb-2 tracking-widest">ID Transaksi</p>
                    <p className="text-xs font-black text-white font-mono">{selectedItem.id.slice(0, 12)}...</p>
                  </div>
                  <div className="p-5 glass-card rounded-2xl border-white/5 shadow-inner">
                    <p className="text-[9px] font-black text-muted-foreground uppercase mb-2 tracking-widest">{activeTab === 'setoran' ? 'Volume' : 'Jumlah WD'}</p>
                    <p className="text-xl font-black text-primary tracking-tighter">
                      {activeTab === 'setoran' ? `${selectedItem.totalCount} Akun` : formatCurrency(selectedItem.amount)}
                    </p>
                  </div>
                </div>
                {activeTab === 'withdrawal' && (
                  <div className="p-5 glass-card rounded-2xl border-white/5 shadow-inner space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Metode</p>
                      <p className="text-xs font-black uppercase">{selectedItem.method}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Admin Fee</p>
                      <p className="text-xs font-black text-destructive">{formatCurrency(selectedItem.fee)}</p>
                    </div>
                    <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest">Total Potongan</p>
                      <p className="text-sm font-black text-primary">{formatCurrency(selectedItem.totalDeduction)}</p>
                    </div>
                  </div>
                )}
                <div className="p-5 glass-card rounded-2xl border-white/5 shadow-inner">
                  <p className="text-[9px] font-black text-muted-foreground uppercase mb-2 tracking-widest">Waktu Kejadian</p>
                  <p className="text-sm font-black text-white">{selectedItem.createdAt?.seconds ? formatDate(new Date(selectedItem.createdAt.seconds * 1000).toISOString()) : '-'}</p>
                </div>
                
                <div className="mt-8 p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                   <p className="text-[9px] text-primary/70 font-black uppercase text-center leading-relaxed">
                     {selectedItem.status === 'Pending' 
                       ? "Permintaan Anda sedang dalam antrean verifikasi admin. Harap tunggu maksimal 24 jam." 
                       : "Status transaksi ini sudah bersifat final dan telah diperbarui di saldo Anda."}
                   </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
