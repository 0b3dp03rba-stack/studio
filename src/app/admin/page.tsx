"use client";

import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Eye, Link as LinkIcon, Globe, Clock, ArrowUpRight, Settings, DollarSign, Save, Loader2, ArrowLeft, LogOut } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, limit, doc, collectionGroup, updateDoc, serverTimestamp, where } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function AdminDashboard() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSavingPrice, setIsSavingPrice] = useState(false);
  const [newPrice, setNewPrice] = useState<number | string>('');

  // 1. Data User Profiles
  const usersQuery = useMemoFirebase(() => query(collection(db, 'userProfiles'), limit(1000)), [db]);
  const { data: allUsers, isLoading: isUsersLoading } = useCollection(usersQuery);

  // 2. Data Global Stats & Config
  const globalStatsRef = useMemoFirebase(() => doc(db, 'appConfig', 'globalStats'), [db]);
  const { data: globalStats } = useDoc(globalStatsRef);

  // 3. Data Transaksi (Success Only for Revenue)
  const paymentsQuery = useMemoFirebase(() => query(collection(db, 'payments'), where('status', '==', 'success')), [db]);
  const { data: successfulPayments } = useCollection(paymentsQuery);

  // 4. Data Link Global
  const linksQuery = useMemoFirebase(() => query(collectionGroup(db, 'links'), limit(50)), [db]);
  const { data: rawLinks } = useCollection(linksQuery);

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

  const recentLinks = useMemo(() => {
    if (!rawLinks) return [];
    return [...rawLinks].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 5);
  }, [rawLinks]);

  const stats = [
    { label: 'Total Pengguna', value: allUsers?.length || 0, icon: Users, color: 'text-primary' },
    { label: 'Total Revenue', value: `Rp ${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-500' },
    { label: 'Total Penjualan', value: successfulPayments?.length || 0, icon: Clock, color: 'text-secondary' },
    { label: 'Views Homepage', value: globalStats?.landingPageViews || 0, icon: Globe, color: 'text-white' },
  ];

  if (isUsersLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-primary/50">Membuka Vault Admin...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in pb-24">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter uppercase text-white">Master Panel</h1>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Platform Command Center</p>
        </div>
        <Button asChild variant="ghost" className="h-12 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 font-black uppercase text-[10px] tracking-widest">
           <Link href="/dashboard"><LogOut size={16} className="mr-2" /> Keluar Panel</Link>
        </Button>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
           <div className="space-y-4">
              <h3 className="font-black text-xs uppercase tracking-widest text-white/50 flex items-center gap-2 px-2">
                <DollarSign size={16} className="text-primary" /> Premium Settings
              </h3>
              <Card className="glass-card border-none rounded-[2rem] p-6 space-y-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase text-white/40 ml-1">Harga Premium Saat Ini</label>
                   <p className="text-2xl font-black text-primary tracking-tighter">Rp {(globalStats?.premiumPrice || 10000).toLocaleString()}</p>
                </div>
                <div className="space-y-3 pt-2">
                   <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Ubah Harga (IDR)</label>
                   <div className="flex gap-2">
                      <Input 
                        type="number" 
                        placeholder="Contoh: 15000" 
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="bg-white/5 border-none h-12 rounded-xl text-xs font-bold"
                      />
                      <Button onClick={handleUpdatePrice} disabled={isSavingPrice || !newPrice} className="h-12 w-12 rounded-xl neon-gradient text-background shrink-0 shadow-xl">
                         {isSavingPrice ? <Loader2 className="animate-spin" size={16} /> : <Save size={18} />}
                      </Button>
                   </div>
                </div>
              </Card>
           </div>

           <div className="space-y-4">
              <h3 className="font-black text-xs uppercase tracking-widest text-white/50 flex items-center gap-2 px-2">
                <Settings size={16} className="text-primary" /> Operations
              </h3>
              <Link href="/admin/users">
                <Card className="glass-card border-none rounded-[2rem] p-6 hover:bg-white/[0.08] transition-all group shadow-xl flex items-center gap-4 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:neon-gradient group-hover:text-background transition-all shadow-lg">
                    <Users size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black uppercase tracking-tight text-white">Database Pengguna</p>
                    <p className="text-[8px] font-bold text-white/30 uppercase">Kelola & Moderasi User</p>
                  </div>
                  <ArrowUpRight size={14} className="text-white/20 group-hover:text-primary transition-colors" />
                </Card>
              </Link>
           </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
             <h3 className="font-black text-xs uppercase tracking-widest text-white/50 flex items-center gap-2">
               <Clock size={16} className="text-primary" /> Activity Feed
             </h3>
             <Badge variant="outline" className="text-[8px] font-black uppercase border-white/10 text-white/40">LIVE DATA</Badge>
          </div>
          
          <div className="space-y-3">
            {recentLinks.map((link) => (
              <Card key={link.id} className="glass-card border-none rounded-[2rem] p-5 flex items-center gap-4 group hover:bg-white/[0.05] transition-colors text-left">
                 <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/5 shrink-0 shadow-inner">
                    {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" /> : <LinkIcon size={20} className="text-primary/50" />}
                 </div>
                 <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-sm truncate uppercase tracking-tight">{link.title}</h4>
                    <p className="text-[9px] text-white/20 truncate uppercase font-mono mt-0.5">{link.url}</p>
                 </div>
                 <div className="text-right shrink-0">
                    <p className="text-lg font-black text-primary tabular-nums">{link.clicks || 0}</p>
                    <p className="text-[8px] font-black text-white/20 uppercase">CLICKS</p>
                 </div>
              </Card>
            ))}
            {recentLinks.length === 0 && (
              <div className="py-20 text-center opacity-10 font-black uppercase text-[10px] tracking-widest border border-dashed border-white/10 rounded-[2rem]">Belum ada feed aktivitas.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
