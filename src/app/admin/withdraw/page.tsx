
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { formatDate, formatCurrency } from '@/lib/utils-app';
import { Check, X, Wallet, User, Clock } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

export default function AdminWithdrawPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  const profileRef = useMemoFirebase(() => user ? doc(db, 'userProfiles', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(profileRef);
  const isAdmin = profile?.role === 'Admin';

  const withdrawalsQuery = useMemoFirebase(() => {
    if (!isAdmin) return null;
    return query(collection(db, 'withdrawalRequests'), orderBy('createdAt', 'desc'), limit(100));
  }, [db, isAdmin]);

  const { data: withdrawals, isLoading } = useCollection(withdrawalsQuery);
  const { data: allUsers } = useCollection(useMemoFirebase(() => isAdmin ? query(collection(db, 'userProfiles'), limit(500)) : null, [db, isAdmin]));

  const filteredRequests = (withdrawals || []).filter(r => 
    activeTab === 'pending' ? r.status === 'Pending' : true
  );

  const handleAction = async (requestId: string, userId: string, amount: number, fee: number, status: 'Disetujui' | 'Ditolak') => {
    try {
      const requestRef = doc(db, 'withdrawalRequests', requestId);
      const userRef = doc(db, 'userProfiles', userId);

      if (status === 'Disetujui') {
        // Potong saldo user (amount + fee)
        await updateDoc(userRef, {
          balance: increment(-(amount + fee)),
          updatedAt: serverTimestamp()
        });
      }

      await updateDoc(requestRef, { 
        status,
        processedAt: serverTimestamp()
      });

      toast({ title: "Berhasil", description: `Permintaan WD telah ${status}.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat memproses data." });
    }
  };

  if (isLoading) return <div className="p-20 text-center animate-pulse font-black uppercase tracking-widest">Memuat Data WD...</div>;
  if (!isAdmin) return <div className="p-20 text-center opacity-20 font-black uppercase">Akses Ditolak</div>;

  return (
    <div className="space-y-6 animate-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight">Manajemen WD</h1>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest">Validasi penarikan dana pengguna.</p>
      </div>

      <div className="flex glass-card p-1.5 rounded-2xl">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${activeTab === 'pending' ? 'neon-gradient text-white glow-primary' : 'text-muted-foreground'}`}
        >
          PENDING
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${activeTab === 'history' ? 'neon-gradient text-white glow-primary' : 'text-muted-foreground'}`}
        >
          RIWAYAT
        </button>
      </div>

      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-20 opacity-20">
            <Wallet size={64} className="mx-auto mb-4" />
            <p className="text-lg font-black uppercase">Tidak ada permintaan</p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const reqUser = allUsers?.find(u => u.id === req.userId);
            return (
              <Card key={req.id} className="glass-card border-none rounded-[1.5rem] overflow-hidden group">
                <CardContent className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black">{reqUser?.email.split('@')[0] || 'User'}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">{req.createdAt?.seconds ? formatDate(new Date(req.createdAt.seconds * 1000).toISOString()) : 'Baru saja'}</p>
                      </div>
                    </div>
                    <Badge variant={req.status === 'Disetujui' ? 'default' : req.status === 'Ditolak' ? 'destructive' : 'secondary'} className="h-6 px-3 rounded-lg text-[10px] font-black uppercase">
                      {req.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-3 border-y border-white/5">
                    <div>
                      <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Jumlah</p>
                      <p className="text-sm font-black text-primary">{formatCurrency(req.amount)}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Metode</p>
                      <p className="text-sm font-black">{req.method}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase">
                      Potongan: <span className="text-foreground">{formatCurrency(req.fee)}</span>
                    </div>
                    {req.status === 'Pending' && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="h-9 px-4 text-[10px] font-black text-destructive rounded-xl hover:bg-destructive/10"
                          onClick={() => handleAction(req.id, req.userId, req.amount, req.fee, 'Ditolak')}
                        >
                          TOLAK
                        </Button>
                        <Button 
                          size="sm" 
                          className="h-9 px-4 text-[10px] font-black neon-gradient text-background rounded-xl glow-primary"
                          onClick={() => handleAction(req.id, req.userId, req.amount, req.fee, 'Disetujui')}
                        >
                          SETUJUI
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
