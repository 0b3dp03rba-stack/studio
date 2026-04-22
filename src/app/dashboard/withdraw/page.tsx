
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils-app';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, Info, ArrowUpRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';

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

  const hasBankAccount = profile?.bankAccount && profile?.bankName && profile?.bankAccountName;

  // Set default method if user has only one bank set
  useEffect(() => {
    if (profile?.bankName) {
      setMethod(profile.bankName);
    }
  }, [profile]);

  const handleWithdraw = async () => {
    if (!user || !profile) return;
    if (!method) {
      toast({ variant: "destructive", title: "Pilih Metode", description: "Silakan pilih metode penarikan." });
      return;
    }
    if (!hasBankAccount) {
      toast({ variant: "destructive", title: "Rekening Kosong", description: "Lengkapi data rekening di menu Profil terlebih dahulu." });
      router.push('/dashboard/profil');
      return;
    }
    if (amount < minWithdraw) {
      toast({ variant: "destructive", title: "Gagal", description: `Minimum withdraw adalah ${formatCurrency(minWithdraw)}.` });
      return;
    }
    if (amount % 1000 !== 0) {
      toast({ variant: "destructive", title: "Gagal", description: "Jumlah harus kelipatan 1000." });
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
        method: profile.bankName, // Use the actual bank name from profile
        bankAccount: profile.bankAccount,
        bankAccountName: profile.bankAccountName,
        status: 'Pending',
        createdAt: serverTimestamp(),
      });

      toast({ title: "Berhasil", description: "Permintaan WD Anda sedang dikirim ke Admin." });
      router.push('/dashboard/riwayat');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tighter">Withdraw</h1>
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest opacity-70">Tarik saldo hasil kerja keras Anda.</p>
      </div>

      {!hasBankAccount ? (
        <Card className="glass-card border-none rounded-[2rem] p-8 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary glow-primary">
            <AlertCircle size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black uppercase tracking-tighter text-white">Rekening Belum Diatur</h2>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed px-4">Anda harus mengatur nomor rekening di profil sebelum melakukan penarikan.</p>
          </div>
          <Button asChild className="w-full h-14 rounded-2xl neon-gradient text-background font-black uppercase text-[10px] tracking-widest shadow-xl">
            <Link href="/dashboard/profil">Atur Rekening Sekarang</Link>
          </Button>
        </Card>
      ) : (
        <>
          <Card className="neon-gradient text-background border-none glow-primary overflow-hidden relative rounded-[2rem] group shadow-2xl">
            <CardContent className="p-8 relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[10px] uppercase font-black opacity-60 tracking-widest mb-1">Saldo Anda</p>
                  <h2 className="text-5xl font-black tracking-tighter">{formatCurrency(profile?.balance || 0)}</h2>
                </div>
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/20 shadow-xl group-hover:rotate-12 transition-transform">
                  <ArrowUpRight size={28} />
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-background/10 text-[10px] font-black flex justify-between uppercase tracking-[0.2em]">
                <span className="opacity-60">Biaya Admin Platform</span>
                <span>{formatCurrency(adminFee)}</span>
              </div>
            </CardContent>
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
          </Card>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Pilih Nominal Cepat</h3>
            <div className="grid grid-cols-3 gap-2.5">
              {presets.map(p => (
                <Button 
                  key={p} 
                  variant={amount === p ? 'default' : 'outline'}
                  className={`h-14 rounded-2xl font-black text-xs transition-all active:scale-95 ${amount === p ? 'neon-gradient text-background border-none glow-primary shadow-lg shadow-primary/20' : 'glass-card border-none hover:bg-white/10'}`}
                  onClick={() => setAmount(p)}
                >
                  {p >= 1000000 ? `${p/1000000} Juta` : `${p / 1000}K`}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nominal Custom</label>
              <Input 
                type="number" 
                placeholder={`Min ${minWithdraw.toLocaleString()}`}
                className="bg-white/5 border-white/5 h-16 rounded-[1.5rem] px-6 text-sm font-black focus-visible:ring-primary/30 shadow-inner"
                value={amount === 0 ? '' : amount}
                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Konfirmasi Rekening</label>
              <div className="p-4 glass-card rounded-2xl border-white/10 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase text-muted-foreground">Metode</span>
                  <span className="text-[10px] font-black uppercase text-primary">{profile.bankName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase text-muted-foreground">Nomor</span>
                  <span className="text-[10px] font-black font-mono">{profile.bankAccount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase text-muted-foreground">Penerima</span>
                  <span className="text-[10px] font-black uppercase">{profile.bankAccountName}</span>
                </div>
              </div>
              <p className="text-[8px] text-muted-foreground italic px-1 mt-1">*Ubah data rekening di menu Profil jika tidak sesuai.</p>
            </div>

            {amount > 0 && (
              <Card className="glass-card border-none rounded-[1.5rem] p-6 space-y-4 animate-in">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-muted-foreground">Jumlah WD</span>
                  <span className="text-foreground">{formatCurrency(amount)}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-muted-foreground">Potongan Admin</span>
                  <span className="text-destructive font-black">-{formatCurrency(adminFee)}</span>
                </div>
                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Total Potong Saldo</span>
                  <span className="text-xl font-black text-primary tracking-tighter">{formatCurrency(totalDeduction)}</span>
                </div>
              </Card>
            )}

            <Button 
              className="w-full h-16 neon-gradient text-background font-black glow-primary rounded-[1.5rem] text-lg mt-4 group active:scale-95 transition-all"
              onClick={handleWithdraw}
              disabled={isSubmitting || amount <= 0}
            >
              <Wallet size={24} className="mr-3 group-hover:scale-110 transition-transform" />
              {isSubmitting ? "PROCESSING..." : "TARIK SALDO"}
            </Button>

            <div className="flex gap-4 p-5 bg-secondary/10 border border-secondary/20 rounded-[1.5rem] shadow-inner">
              <ShieldCheck size={24} className="text-secondary shrink-0" />
              <p className="text-[10px] text-secondary/80 leading-relaxed font-black uppercase tracking-tight">Setiap penarikan dana diproteksi oleh sistem keamanan kami. Admin akan memproses WD dalam waktu maksimal 24 jam kerja.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
