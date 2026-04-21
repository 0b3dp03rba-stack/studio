"use client";

import { useApp } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils-app';
import { CheckCircle2, Clock, XCircle, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function RiwayatPage() {
  const { state } = useApp();
  const [selectedBatch, setSelectedBatch] = useState<any>(null);

  const userBatches = state.batches.filter(b => b.userId === state.currentUser?.id);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Selesai': return <CheckCircle2 className="text-primary" size={16} />;
      default: return <Clock className="text-muted-foreground" size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Riwayat Setoran</h1>
        <p className="text-muted-foreground text-sm">Klik pada batch untuk melihat detail Gmail.</p>
      </div>

      <div className="space-y-3">
        {userBatches.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <History size={48} className="mx-auto mb-4" />
            <p>Belum ada riwayat setoran.</p>
          </div>
        ) : (
          userBatches.map((batch) => (
            <Card 
              key={batch.id} 
              className="glass-card border-white/5 hover:border-primary/20 transition-all cursor-pointer active:scale-95"
              onClick={() => setSelectedBatch(batch)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm uppercase tracking-wider">{batch.id.slice(0, 8)}</span>
                    <Badge variant={batch.status === 'Selesai' ? 'default' : 'secondary'} className="text-[9px] px-1.5 h-4">
                      {batch.status}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{formatDate(batch.createdAt)}</p>
                  <div className="flex gap-3 text-[10px] mt-1">
                    <span className="flex items-center gap-1 text-primary"><CheckCircle2 size={10} /> {batch.items.filter(i => i.status === 'Disetujui').length}</span>
                    <span className="flex items-center gap-1 text-destructive"><XCircle size={10} /> {batch.items.filter(i => i.status === 'Ditolak').length}</span>
                    <span className="flex items-center gap-1 text-muted-foreground"><Clock size={10} /> {batch.items.filter(i => i.status === 'Pending').length}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm font-bold">{batch.items.length}</p>
                    <p className="text-[9px] text-muted-foreground uppercase">Items</p>
                  </div>
                  <ChevronRight size={20} className="text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!selectedBatch} onOpenChange={() => setSelectedBatch(null)}>
        <DialogContent className="glass-card border-white/10 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center pr-8">
              <span>Detail Batch {selectedBatch?.id.slice(0, 8)}</span>
              <Badge>{selectedBatch?.status}</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {selectedBatch?.items.map((item: any, idx: number) => (
              <div key={item.id} className="p-3 bg-white/5 rounded-xl flex items-center justify-between border border-white/5">
                <div className="space-y-0.5 truncate flex-1 mr-2">
                  <p className="text-xs font-medium truncate">{item.email}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{item.pass}</p>
                </div>
                <div className="flex items-center gap-2">
                  {item.status === 'Pending' && <Badge variant="secondary" className="text-[9px]">Pending</Badge>}
                  {item.status === 'Disetujui' && <Badge className="bg-primary/20 text-primary border-primary/20 text-[9px]">Approved</Badge>}
                  {item.status === 'Ditolak' && <Badge variant="destructive" className="text-[9px]">Rejected</Badge>}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { History } from 'lucide-react';
