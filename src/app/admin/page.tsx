
"use client";

import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Globe, Settings, DollarSign, Save, Loader2, TrendingUp } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, limit, doc, updateDoc, serverTimestamp, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSavingPrice, setIsSavingPrice] = useState(false);
  const [newPrice, setNewPrice] = useState<number | string>('');

  // Data Profiles for Count
  const usersQuery = useMemoFirebase(() => query(collection(db, 'userProfiles'), limit(1000)), [db]);
  const { data: allUsers, isLoading: isUsersLoading } = useCollection(usersQuery);

  // Global Config
  const globalStatsRef = useMemoFirebase(() => doc(db, 'appConfig', 'globalStats'), [db]);
  const { data: globalStats } = useDoc(globalStatsRef);

  // Revenue Data
  const paymentsQuery = useMemoFirebase(() => query(collection(db, 'payments'), where('status', '==', 'success')), [db]);
  const { data: successfulPayments } = useCollection(paymentsQuery);

  const totalRevenue = useMemo(() => {
    return successfulPayments?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;
  }, [successfulPayments]);

  const handleUpdatePrice = () => {
    if (!newPrice || isNaN(Number(newPrice))) return;
    setIsSavingPrice(true);
    updateDoc(globalStatsRef!, {
      premiumPrice: Number(newPrice),
      updatedAt: serverTimestamp()
    })
    .then(() => {
      toast({ title: "HARGA DIPERBARUI", description: `Harga premium sekarang Rp ${Number(newPrice).toLocaleString()}` });
      setNewPrice('');
    })
    .catch(() => {
      toast({ variant: "destructive", title: "GAGAL", description: "Gagal update harga config." });
    })
    .finally(() => {
      setIsSavingPrice(false);
    });
  };

  const stats = [
    { label: 'Total Pengguna', value: allUsers?.length || 0, icon: Users, color: 'text-primary' },
    { label: 'Total Revenue', value: `Rp ${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-500' },
    { label: 'Total Penjualan', value: successfulPayments?.length || 0, icon: TrendingUp, color: 'text-secondary' },
    { label: 'Views Homepage', value: globalStats?.landingPageViews || 0, icon: Globe, color: 'text-white' },
  ];

  if (isUsersLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-primary/50">Sinkronisasi Analisis...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-black tracking-tighter uppercase text-white">Insight Center</h1>
        <p className="text-primary/60 text-[10px] font-black uppercase tracking-[0.4em]">Real-time Performance Metrics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item, i) => (
          <Card key={i} className="glass-card border-none rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group">
            <CardContent className="p-0 space-y-4 relative z-10 text-left">
              <div className={`w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center ${item.color}`}>
                <item.icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-black tracking-tighter text-white">{item.value}</p>
                <p className="text-[8px] font-black uppercase text-white/30 tracking-[0.2em] mt-1">{item.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="max-w-md">
        <h3 className="font-black text-xs uppercase tracking-widest text-white/50 flex items-center gap-2 px-2 mb-4">
          <Settings size={16} className="text-primary" /> Market Control
        </h3>
        <Card className="glass-card border-none rounded-[2.5rem] p-8 space-y-6">
          <div className="space-y-1.5">
             <label className="text-[10px] font-black uppercase text-white/40 ml-1">Premium License Price</label>
             <p className="text-3xl font-black text-primary tracking-tighter">Rp {(globalStats?.premiumPrice || 10000).toLocaleString()}</p>
          </div>
          <div className="space-y-3 pt-4 border-t border-white/5">
             <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Ubah Harga (IDR)</label>
             <div className="flex gap-2">
                <Input 
                  type="number" 
                  placeholder="Contoh: 15000" 
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="bg-white/5 border-none h-14 rounded-2xl text-xs font-bold"
                />
                <Button onClick={handleUpdatePrice} disabled={isSavingPrice || !newPrice} className="h-14 w-14 rounded-2xl neon-gradient text-background shrink-0 shadow-xl active:scale-95 transition-all">
                   {isSavingPrice ? <Loader2 className="animate-spin" size={18} /> : <Save size={22} />}
                </Button>
             </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
