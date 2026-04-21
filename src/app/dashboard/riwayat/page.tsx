
"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils-app';
import { CheckCircle2, Clock, XCircle, ChevronRight, History, Play } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';

export default function RiwayatPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [selectedBatch, setSelectedBatch] = useState<any>(null);

  // Pastikan query menyertakan filter userId agar sesuai dengan aturan keamanan (isOwner)
  const batchesQuery = useMemoFirebase(() => 
    user ? query(
      collection(db, 'gmailBatches'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(100)
    ) : null,
    [db, user]
  );
  const { data: batches, isLoading } = useCollection(batchesQuery);

  return (
    <div className="space-y-6 animate-in">
      <div className="space-y-2">
        <h1 className="text-2xl font-black tracking-tight">Riwayat Setoran</h1>
        <p className="text-muted-foreground text-sm font-medium">Klik pada batch untuk melihat detail Gmail.</p>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : !batches || batches.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <History size={48} className="mx-auto mb-4" />
            <p className="text-sm font-bold uppercase tracking-widest">Belum ada riwayat setoran</p>
          </div>
        ) : (
          batches.map((batch) => (
            <Card 
              key={batch.id} 
              className="glass-card border-none rounded-[1.5rem] hover:bg-white/10 transition-all cursor-pointer active:scale-95 group"
              onClick={() => setSelectedBatch(batch)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs uppercase tracking-widest text-primary">{batch.id.slice(0, 8)}</span>
                    <Badge variant={batch.status === 'Selesai' ? 'default' : 'secondary'} className="text-[8px] px-1.5 h-4 font-black">
                      {batch.status}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium">{batch.createdAt?.seconds ? formatDate(new Date(batch.createdAt.seconds * 1000).toISOString()) : 'Baru saja'}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-black leading-none">{batch.totalCount}</p>
                    <p className="text-[8px] text-muted-foreground font-black uppercase tracking-tight">Akun</p>
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
              <span className="font-black uppercase tracking-tight">Detail Batch {selectedBatch?.id.slice(0, 8)}</span>
              <Badge className="font-black text-[10px]">{selectedBatch?.status}</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <p className="text-xs text-muted-foreground text-center py-4 italic">Detail item per akun dapat dilihat melalui panel verifikasi admin atau tunggu hingga status berubah menjadi Selesai.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
