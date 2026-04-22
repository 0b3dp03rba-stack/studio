
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils-app';
import { ChevronRight, History } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';

export default function RiwayatPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [selectedBatch, setSelectedBatch] = useState<any>(null);

  // Query simpel untuk menghindari masalah Index/Permission
  const batchesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, 'gmailBatches'), 
      where('userId', '==', user.uid),
      limit(100)
    );
  }, [db, user?.uid]);

  const { data: rawBatches, isLoading } = useCollection(batchesQuery);

  // Sorting dilakukan di memori aplikasi untuk menjamin kestabilan 100% tanpa perlu indeks manual
  const sortedBatches = useMemo(() => {
    if (!rawBatches) return [];
    return [...rawBatches].sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  }, [rawBatches]);

  return (
    <div className="space-y-6 animate-in">
      <div className="space-y-2">
        <h1 className="text-2xl font-black tracking-tight text-white uppercase">Riwayat Setoran</h1>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest opacity-70 text-[10px]">Lacak status setoran Gmail Anda secara real-time.</p>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase text-primary/50 tracking-widest">Sinkronisasi Data...</p>
          </div>
        ) : sortedBatches.length === 0 ? (
          <div className="text-center py-24 glass-card rounded-[2.5rem] border-none opacity-20 group">
            <History size={80} className="mx-auto mb-6 group-hover:scale-110 transition-transform text-muted-foreground" />
            <p className="text-lg font-black uppercase tracking-[0.2em]">Belum ada riwayat</p>
            <p className="text-[10px] font-bold mt-2 uppercase">Mulailah menyetor di menu Setor</p>
          </div>
        ) : (
          sortedBatches.map((batch) => (
            <Card 
              key={batch.id} 
              className="glass-card border-none rounded-[1.5rem] hover:bg-white/10 transition-all cursor-pointer group active:scale-[0.98]"
              onClick={() => setSelectedBatch(batch)}
            >
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[10px] uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/10">#{batch.id.slice(0, 6)}</span>
                    <Badge variant={batch.status === 'Selesai' ? 'default' : batch.status === 'Proses' ? 'secondary' : 'outline'} className="text-[8px] px-2 h-5 font-black uppercase tracking-tight">
                      {batch.status}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight pl-0.5">
                    {batch.createdAt?.seconds ? formatDate(new Date(batch.createdAt.seconds * 1000).toISOString()) : 'Baru saja'}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-2xl font-black leading-none text-white tracking-tighter">{batch.totalCount}</p>
                    <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">Akun</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-all shadow-inner">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!selectedBatch} onOpenChange={() => setSelectedBatch(null)}>
        <DialogContent className="glass-card border-none rounded-[2.5rem] bg-background/95 backdrop-blur-2xl shadow-2xl p-0 overflow-hidden max-w-[90%] mx-auto">
          <div className="neon-gradient h-1.5 w-full" />
          <div className="p-8">
            <DialogHeader className="mb-8">
              <DialogTitle className="flex justify-between items-center text-white">
                <span className="font-black uppercase tracking-tighter text-2xl">Batch Detail</span>
                <Badge className="font-black text-[10px] h-7 px-4 rounded-xl uppercase tracking-widest">{selectedBatch?.status}</Badge>
              </DialogTitle>
            </DialogHeader>
            
            {selectedBatch && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 glass-card rounded-2xl border-white/5 shadow-inner">
                    <p className="text-[9px] font-black text-muted-foreground uppercase mb-2 tracking-widest">ID Batch</p>
                    <p className="text-xs font-black text-white font-mono">{selectedBatch.id.slice(0, 12)}...</p>
                  </div>
                  <div className="p-5 glass-card rounded-2xl border-white/5 shadow-inner">
                    <p className="text-[9px] font-black text-muted-foreground uppercase mb-2 tracking-widest">Volume</p>
                    <p className="text-xl font-black text-primary tracking-tighter">{selectedBatch.totalCount} <span className="text-[10px] font-medium opacity-50 uppercase ml-1">Akun</span></p>
                  </div>
                </div>
                <div className="p-5 glass-card rounded-2xl border-white/5 shadow-inner">
                  <p className="text-[9px] font-black text-muted-foreground uppercase mb-2 tracking-widest">Waktu Setoran</p>
                  <p className="text-sm font-black text-white">{selectedBatch.createdAt?.seconds ? formatDate(new Date(selectedBatch.createdAt.seconds * 1000).toISOString()) : '-'}</p>
                </div>
                
                <div className="mt-8 p-4 bg-secondary/10 border border-secondary/20 rounded-2xl">
                   <p className="text-[9px] text-secondary font-black uppercase text-center leading-relaxed">Admin akan memverifikasi data Anda dalam waktu 1x24 jam. Saldo akan otomatis bertambah setelah status menjadi SELESAI.</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
