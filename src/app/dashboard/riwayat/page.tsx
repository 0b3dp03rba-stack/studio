
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

  // Kita hapus orderBy dari query Firestore untuk menghindari error Permission/Index.
  // Pengurutan akan dilakukan secara manual di memori (useMemo).
  const batchesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(db, 'gmailBatches'), 
      where('userId', '==', user.uid),
      limit(100)
    );
  }, [db, user?.uid]);

  const { data: rawBatches, isLoading } = useCollection(batchesQuery);

  // Urutkan data berdasarkan waktu terbaru di sisi klien
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
        <h1 className="text-2xl font-black tracking-tight">Riwayat Setoran</h1>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest opacity-70 text-[10px]">Klik pada batch untuk melihat detail.</p>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-lg shadow-primary/20"></div>
          </div>
        ) : sortedBatches.length === 0 ? (
          <div className="text-center py-20 opacity-20 group">
            <History size={64} className="mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <p className="text-lg font-black uppercase tracking-widest">Belum ada riwayat</p>
          </div>
        ) : (
          sortedBatches.map((batch) => (
            <Card 
              key={batch.id} 
              className="glass-card border-none rounded-[1.5rem] hover:bg-white/10 transition-all cursor-pointer active:scale-95 group"
              onClick={() => setSelectedBatch(batch)}
            >
              <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[10px] uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-md">#{batch.id.slice(0, 6)}</span>
                    <Badge variant={batch.status === 'Selesai' ? 'default' : 'secondary'} className="text-[8px] px-2 h-4 font-black uppercase">
                      {batch.status}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                    {batch.createdAt?.seconds ? formatDate(new Date(batch.createdAt.seconds * 1000).toISOString()) : 'Baru saja'}
                  </p>
                </div>
                <div className="flex items-center gap-5">
                  <div className="text-right">
                    <p className="text-xl font-black leading-none">{batch.totalCount}</p>
                    <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest">Akun</p>
                  </div>
                  <ChevronRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!selectedBatch} onOpenChange={() => setSelectedBatch(null)}>
        <DialogContent className="glass-card border-white/10 max-h-[80vh] overflow-y-auto rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center pr-8">
              <span className="font-black uppercase tracking-tight text-lg">Batch Detail</span>
              <Badge className="font-black text-[10px] h-6 px-3">{selectedBatch?.status}</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">ID Batch</p>
                <p className="text-xs font-black">{selectedBatch?.id}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Total Akun</p>
                <p className="text-xs font-black">{selectedBatch?.totalCount} Akun</p>
              </div>
            </div>
            <div className="p-6 bg-primary/5 border border-primary/10 rounded-2xl text-center space-y-2">
              <p className="text-xs font-bold text-muted-foreground">Detail verifikasi tiap akun diproses secara manual oleh tim admin kami.</p>
              <p className="text-[10px] font-black uppercase text-primary tracking-widest">Estimasi Selesai: 1-24 Jam</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
