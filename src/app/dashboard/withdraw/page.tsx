"use client";

import { useState } from 'react';
import { useApp, WithdrawalRequest } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils-app';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WithdrawPage() {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const router = useRouter();
  
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<string>('');

  const adminFee = state.settings.adminFee;
  const totalDeduction = amount + adminFee;
  const presets = [10000, 20000, 50000, 100000, 200000, 500000];

  const handleWithdraw = () => {
    if (!method) {
      toast({ variant: "destructive", title: "Pilih Metode", description: "Silakan pilih metode pembayaran." });
      return;
    }
    if (amount < state.settings.minWithdraw) {
      toast({ variant: "destructive", title: "Gagal", description: `Minimum withdraw adalah ${formatCurrency(state.settings.minWithdraw)}.` });
      return;
    }
    if (amount % 1000 !== 0) {
      toast({ variant: "destructive", title: "Gagal", description: "Jumlah withdraw harus kelipatan 1000." });
      return;
    }
    if ((state.currentUser?.balance || 0) < totalDeduction) {
      toast({ variant: "destructive", title: "Gagal", description: "Saldo Anda tidak mencukupi (termasuk biaya admin)." });
      return;
    }

    const newRequest: WithdrawalRequest = {
      id: `wd-${Date.now()}`,
      userId: state.currentUser!.id,
      amount,
      fee: adminFee,
      totalDeduction,
      method,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'CREATE_WITHDRAWAL', payload: newRequest });
    toast({ title: "Berhasil", description: "Permintaan penarikan sedang diproses oleh admin." });
    router.push('/dashboard');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Tarik Saldo</h1>
        <p className="text-muted-foreground text-sm">Pilih jumlah dan metode penarikan Anda.</p>
      </div>

      <Card className="glass-card border-none neon-gradient text-background glow-primary overflow-hidden relative">
        <CardContent className="p-6">
          <p className="text-[10px] uppercase font-black opacity-60 tracking-widest">Saldo Anda</p>
          <h2 className="text-3xl font-black">{formatCurrency(state.currentUser?.balance || 0)}</h2>
          <div className="mt-4 pt-4 border-t border-background/10 text-xs font-medium flex justify-between">
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
              className={amount === p ? 'neon-gradient text-background border-none' : 'bg-white/5 border-white/10'}
              onClick={() => setAmount(p)}
            >
              {p / 1000}k
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-muted-foreground">Jumlah Custom</label>
          <Input 
            type="number" 
            placeholder="Min 10.000 (Kelipatan 1.000)"
            className="bg-white/5 border-white/10 h-12"
            value={amount || ''}
            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-muted-foreground">Metode Pembayaran</label>
          <Select onValueChange={setMethod} value={method}>
            <SelectTrigger className="bg-white/5 border-white/10 h-12">
              <SelectValue placeholder="Pilih Metode" />
            </SelectTrigger>
            <SelectContent className="glass-card border-white/10">
              {state.settings.paymentMethods.filter(m => m.enabled).map(m => (
                <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {amount > 0 && (
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Jumlah Penarikan</span>
              <span className="font-bold">{formatCurrency(amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Biaya Admin</span>
              <span className="font-bold">{formatCurrency(adminFee)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-white/5">
              <span className="text-primary font-bold">Total Pengurangan Saldo</span>
              <span className="text-primary font-bold">{formatCurrency(totalDeduction)}</span>
            </div>
          </div>
        )}

        <Button 
          className="w-full h-12 neon-gradient text-background font-bold glow-primary"
          onClick={handleWithdraw}
        >
          <Wallet size={18} className="mr-2" />
          Tarik Sekarang
        </Button>

        <div className="flex gap-2 p-3 bg-secondary/10 border border-secondary/20 rounded-xl">
          <Info size={16} className="text-secondary shrink-0 mt-0.5" />
          <p className="text-[10px] text-secondary/80 leading-relaxed">Penarikan akan diproses secara manual oleh admin dalam waktu maksimal 24 jam.</p>
        </div>
      </div>
    </div>
  );
}
