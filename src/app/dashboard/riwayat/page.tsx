
"use client";

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { ReceiptText, CheckCircle2, Clock, XCircle, ChevronRight, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '@/lib/utils-app';
import { format } from 'date-fns';
import Link from 'next/link';

export default function RiwayatPage() {
  const { user } = useUser();
  const db = useFirestore();

  const historyQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'payments'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(50));
  }, [db, user?.uid]);
  const { data: payments, isLoading } = useCollection(historyQuery);

  if (isLoading) return <div className="p-24 text-center animate-pulse font-black uppercase text-[10px] text-primary">Sinkronisasi Riwayat...</div>;

  return (
    <div className="space-y-8 animate-in pb-32 pt-24">
      <div className="space-y-1">
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase leading-none">Transactions</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">Riwayat Lisensi & Top-up</p>
      </div>

      <div className="space-y-3">
        {(!payments || payments.length === 0) ? (
          <div className="py-20 text-center opacity-10 font-black uppercase text-[10px] tracking-widest border border-dashed border-white/20 rounded-[3rem]">Belum ada transaksi tercatat.</div>
        ) : payments.map((p) => (
          <Card key={p.id} className="glass-card border-none rounded-[2rem] p-5 shadow-xl">
             <CardContent className="p-0 flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                  p.status === 'success' ? "bg-green-500/10 text-green-500" : (p.status === 'pending' ? "bg-yellow-500/10 text-yellow-500" : "bg-red-500/10 text-red-500")
                )}>
                  {p.status === 'success' ? <CheckCircle2 size={24} /> : (p.status === 'pending' ? <Clock size={24} /> : <XCircle size={24} />)}
                </div>
                <div className="flex-1 min-w-0 text-left">
                   <p className="text-sm font-black text-white uppercase tracking-tight">{p.status === 'success' ? 'Pro License Active' : 'Upgrade Tagihan'}</p>
                   <p className="text-[8px] text-white/30 uppercase font-bold tracking-widest">{p.createdAt?.seconds ? format(new Date(p.createdAt.seconds * 1000), 'dd MMM yyyy, HH:mm') : 'Baru saja'}</p>
                </div>
                <div className="text-right">
                   <p className="text-sm font-black text-white tabular-nums">{formatCurrency(p.totalAmount || p.amount)}</p>
                   <p className={cn("text-[7px] font-black uppercase tracking-widest", p.status === 'success' ? "text-green-500" : "text-white/20")}>{p.status}</p>
                </div>
             </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
