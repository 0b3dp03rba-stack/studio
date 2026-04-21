
"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils-app';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function WithdrawPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const profileRef = useMemoFirebase(() => user ? doc(db, 'userProfiles', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(profileRef);

  const configRef = useMemoFirebase(() => doc(db, 'appConfig', 'singletonConfig'), [db]);
  const { data: config } = useDoc(configRef);

  const adminFee = config?.adminFee || 500;
  const minWithdraw = config?.minWithdraw || 10000;
  const totalDeduction = amount + adminFee;
  const presets = [10000, 20000, 50000, 100000, 200000, 500000];

  const handleWithdraw = async () => {
    if (!user || !profile) return;
    if (!method) {
      toast({ variant: "destructive", title: "Pilih Metode", description: "Silakan pilih metode pembayaran." });
      return;
    }
    if (amount < minWithdraw) {
      toast({ variant: "destructive", title: "Gagal", description: `Minimum withdraw adalah ${formatCurrency(minWithdraw)}.` });
      return;
    }
    if (amount % 1000 !== 0) {
      toast({ variant: "destructive", title: "Gagal", description: "Jumlah withdraw harus kelipatan 1000." });
      return;
    }
    if ((profile.balance || 0) < totalDeduction) {
      toast({ variant: "destructive", title: "Gagal", description: "Saldo Anda tidak mencukupi (termasuk biaya admin)." });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'withdrawalRequests'), {
        userId: user.uid,
        amount,
        fee: adminFee,
        totalDeduction,
        method,
        status: 'Pending',
        createdAt: serverTimestamp(),
      });

      toast({ title: "Berhasil", description: "Permintaan penarikan sedang diproses oleh admin." });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight">Tarik Saldo</h1>
        <p className="text-muted-foreground text-sm font-medium">Pilih jumlah dan metode penarikan Anda.</p>
      </div>

      <Card className="neon-gradient text-background border-none glow-primary overflow-hidden relative rounded-[2rem]">
        <CardContent className="p-8">
          <p className="text-[10px] uppercase font-black opacity-60 tracking-widest">Saldo Anda</p>
          <h2 className="text-4xl font-black">{formatCurrency(profile?.balance || 0)}</h2>
          <div className="mt-6 pt-6 border-t border-background/10 text-xs font-bold flex justify-between uppercase tracking-widest">
            <span>Biaya Admin</span>
            <span>{formatCurrency(adminFee)}</span>
          </div>
        </CardContent>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </Card>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {presets.map(p => (
            <Button 
              key={p} 
              variant={amount === p ? 'default' : 'outline'}
              className={`h-12 rounded-xl font-black ${amount === p ? 'neon-gradient text-background border-none glow-primary' : 'bg-white/5 border-white/10'}`}
              onClick={() => setAmount(p)}
            >
              {p / 1000}k
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Jumlah Custom</label>
          <Input 
            type="number" 
            placeholder="Min 10.000 (Kelipatan 1.000)"
            className="bg-white/5 border-white/5 h-14 rounded-2xl px-5 text-sm font-bold focus-visible:ring-primary/30"
            value={amount === 0 ? '' : amount}
            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Metode Pembayaran</label>
          <Select onValueChange={setMethod} value={method}>
            <SelectTrigger className="bg-white/5 border-white/5 h-14 rounded-2xl px-5 text-sm font-bold focus:ring-primary/30">
              <SelectValue placeholder="Pilih Metode" />
            </SelectTrigger>
            <SelectContent className="glass-card border-white/10 rounded-2xl">
              {(config?.paymentMethods || []).filter((m: any) => m.enabled).map((m: any) => (
                <SelectItem key={m.name} value={m.name} className="font-bold text-xs">{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {amount > 0 && (
          <div className="p-5 glass-card border-none rounded-[1.5rem] space-y-3 animate-in">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-bold uppercase tracking-tight">Jumlah Penarikan</span>
              <span className="font-black">{formatCurrency(amount)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-bold uppercase tracking-tight">Biaya Admin</span>
              <span className="font-black">{formatCurrency(adminFee)}</span>
            </div>
            <div className="flex justify-between text-sm pt-3 border-t border-white/5">
              <span className="text-primary font-black uppercase tracking-widest">Total Potong Saldo</span>
              <span className="text-primary font-black">{formatCurrency(totalDeduction)}</span>
            </div>
          </div>
        )}

        <Button 
          className="w-full h-14 neon-gradient text-background font-black glow-primary rounded-[1.25rem] text-md"
          onClick={handleWithdraw}
          disabled={isSubmitting || amount <= 0}
        >
          <Wallet size={20} className="mr-2" />
          {isSubmitting ? "Memproses..." : "Tarik Sekarang"}
        </Button>

        <div className="flex gap-3 p-4 bg-secondary/10 border border-secondary/20 rounded-2xl">
          <Info size={18} className="text-secondary shrink-0" />
          <p className="text-[10px] text-secondary/80 leading-relaxed font-bold uppercase tracking-tight">Penarikan akan diproses secara manual oleh admin dalam waktu maksimal 24 jam.</p>
        </div>
      </div>
    </div>
  );
}
