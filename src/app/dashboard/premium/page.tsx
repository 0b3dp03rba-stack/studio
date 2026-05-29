"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, CheckCircle2, ShieldCheck, Zap, Globe, Loader2, Save, ExternalLink, AlertCircle, ArrowRight, ReceiptText, Clock, Info } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, serverTimestamp, collection, setDoc, query, where, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils-app';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isBefore, parseISO } from 'date-fns';

export default function PremiumPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const profileRef = useMemoFirebase(() => user ? doc(db, 'userProfiles', user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const globalStatsRef = useMemoFirebase(() => doc(db, 'appConfig', 'globalStats'), [db]);
  const { data: globalStats } = useDoc(globalStatsRef);

  // Cari invoice pending - Hanya ambil yang benar-benar 'pending'
  const pendingPaymentsQuery = useMemoFirebase(() => 
    user ? query(
      collection(db, 'payments'),
      where('userId', '==', user.uid),
      where('status', '==', 'pending'),
      limit(5) // Ambil beberapa untuk pengecekan expiry
    ) : null,
    [db, user?.uid]
  );
  const { data: pendingPayments, isLoading: isPaymentsLoading } = useCollection(pendingPaymentsQuery);

  const [isProcessing, setIsProcessing] = useState(false);
  const [customDomain, setCustomDomain] = useState('');
  const [isSavingDomain, setIsSavingDomain] = useState(false);
  
  const PREMIUM_PRICE = globalStats?.premiumPrice || 10000;

  useEffect(() => {
    if (profile?.customDomain) {
      setCustomDomain(profile.customDomain);
    }
  }, [profile]);

  // LOGIKA VALIDASI INVOICE AKTIF: Abaikan yang sudah kedaluwarsa secara waktu
  const activeInvoice = pendingPayments?.find(p => {
    if (!p.expiredAt) return true;
    try {
      return !isBefore(parseISO(p.expiredAt), new Date());
    } catch (e) {
      return true;
    }
  });

  const handleCreateInvoice = async () => {
    if (!user || isProcessing) return;

    // Jika sudah ada invoice pending yang masih valid, arahkan ke sana
    if (activeInvoice) {
      router.push(`/dashboard/premium/pay/${activeInvoice.id}`);
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: PREMIUM_PRICE })
      });
      
      const result = await res.json();
      
      if (result.success && result.data) {
        const data = result.data;
        
        // Simpan dengan depositId sebagai ID Dokumen
        const newPaymentRef = doc(db, 'payments', data.depositId);
        await setDoc(newPaymentRef, {
          id: data.depositId,
          userId: user.uid,
          depositId: data.depositId,
          amount: data.amount,
          totalAmount: data.totalAmount,
          qrImage: data.qrImage,
          expiredAt: data.expiredAt,
          status: 'pending',
          createdAt: serverTimestamp(),
        });

        router.push(`/dashboard/premium/pay/${data.depositId}`);
      } else {
        toast({ variant: "destructive", title: "Gagal", description: result.error || "Gagal membuat invoice." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Terjadi kesalahan saat menghubungi server." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveDomain = async () => {
    if (!profileRef) return;
    setIsSavingDomain(true);
    try {
      await updateDoc(profileRef, {
        customDomain: customDomain.trim().toLowerCase(),
        updatedAt: serverTimestamp()
      });
      toast({ title: "DOMAIN TERHUBUNG", description: "Tautan profil kini memprioritaskan domain pribadi Anda." });
    } catch (e) {
      toast({ variant: "destructive", title: "GAGAL", description: "Gagal menyimpan konfigurasi domain." });
    } finally {
      setIsSavingDomain(false);
    }
  };

  const isActuallyPremium = profile?.isPremium || profile?.role === 'Admin';

  if (isActuallyPremium) {
    return (
      <div className="space-y-8 animate-in pb-24">
        <div className="text-center space-y-4 pt-6">
          <div className="mx-auto w-24 h-24 rounded-[2.5rem] neon-gradient flex items-center justify-center text-background glow-primary shadow-2xl relative">
            <ShieldCheck size={56} />
            <div className="absolute -bottom-2 bg-black border border-white/10 px-3 py-1 rounded-full text-[8px] font-black text-primary uppercase tracking-widest">Premium Active</div>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase">Linku Gold</h1>
        </div>

        <div className="grid gap-6">
          <Card className="glass-card border-none rounded-[2.5rem] p-8 space-y-6">
             <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Globe size={20} /></div>
                <h3 className="font-black text-sm uppercase tracking-widest text-white">Custom Domain Setup</h3>
             </div>
             
             <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-4 items-start">
                   <AlertCircle size={20} className="text-primary shrink-0 mt-0.5" />
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-primary tracking-widest">Petunjuk Pointing DNS:</p>
                      <p className="text-[9px] font-bold text-white/40 leading-relaxed uppercase">
                        Arahkan domain Anda ke CNAME: <span className="text-white font-mono bg-white/5 px-1.5 py-0.5 rounded ml-1">cname.vercel-dns.com</span>
                      </p>
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Domain Anda</label>
                   <div className="flex gap-2">
                      <Input 
                        placeholder="contoh: budi.com" 
                        value={customDomain} 
                        onChange={(e) => setCustomDomain(e.target.value)}
                        className="bg-white/5 border-none h-14 rounded-2xl font-bold text-sm"
                      />
                      <Button onClick={handleSaveDomain} disabled={isSavingDomain} className="h-14 w-14 rounded-2xl neon-gradient text-background shrink-0 shadow-xl active:scale-95 transition-all">
                        {isSavingDomain ? <Loader2 className="animate-spin" size={20} /> : <Save size={24} />}
                      </Button>
                   </div>
                </div>
             </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in pb-24">
      <div className="space-y-1 text-center">
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase">Go Premium</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">Single Payment. Eternal Legacy.</p>
      </div>

      <div className="grid gap-6">
        <Card className="glass-card border-none rounded-[2.5rem] overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1.5 neon-gradient" />
          <CardContent className="p-8 space-y-8">
            <div className="text-center space-y-2">
               <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Investasi Identitas</p>
               <h2 className="text-6xl font-black text-white tracking-tighter">{formatCurrency(PREMIUM_PRICE)}</h2>
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full mt-3">
                  <Sparkles size={12} className="text-primary" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary">Limited Lifetime Access</span>
               </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-white/5">
               <p className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Ringkasan Fitur:</p>
              {[
                { t: 'Custom Domain', d: 'Gunakan domain pribadi Anda sendiri.', i: Globe },
                { t: 'Branding Bersih', d: 'Hapus watermark Linku seumur hidup.', i: ShieldCheck },
                { t: 'Prioritas AI', d: 'Akses generator visual paling cerdas.', i: Zap },
              ].map((f, i) => (
                <div key={i} className="flex gap-4 items-center p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><f.i size={20} /></div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase">{f.t}</h3>
                    <p className="text-[10px] text-white/40">{f.d}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 bg-white/5 rounded-3xl border border-white/10 space-y-3">
               <div className="flex items-center gap-2 text-primary">
                 <Info size={16} />
                 <p className="text-[10px] font-black uppercase tracking-widest">Sistem Verifikasi:</p>
               </div>
               <p className="text-[9px] font-bold text-white/40 leading-relaxed uppercase">
                 Sistem akan menambahkan <span className="text-white">kode unik (1-500 IDR)</span> pada nominal akhir untuk verifikasi otomatis. Pastikan membayar nominal yang <span className="text-primary">persis sama</span>.
               </p>
            </div>

            <Button 
              onClick={handleCreateInvoice} 
              disabled={isProcessing || isPaymentsLoading} 
              className="w-full h-16 neon-gradient text-background font-black rounded-3xl glow-primary shadow-2xl uppercase tracking-[0.2em] text-sm active:scale-95 transition-all"
            >
              {isProcessing ? <Loader2 className="animate-spin" /> : (activeInvoice ? "LANJUTKAN PEMBAYARAN" : "AKTIFKAN SEKARANG")}
            </Button>
            
            <p className="text-[8px] font-black uppercase text-white/10 text-center tracking-widest">Powered by Rams API Secure Payment</p>
          </CardContent>
        </Card>

        {activeInvoice && (
          <Link href={`/dashboard/premium/pay/${activeInvoice.id}`}>
            <Card className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex items-center justify-between group active:scale-95 transition-all shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <ReceiptText size={24} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-white uppercase">Invoice Masih Aktif</p>
                  <p className="text-[8px] font-bold text-primary uppercase">ID: {activeInvoice.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-[9px] font-black text-primary uppercase tracking-widest">LANJUTKAN</span>
                 <ArrowRight size={16} className="text-primary group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}
