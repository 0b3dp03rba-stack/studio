
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, CheckCircle2, ShieldCheck, Zap, Globe, Image as ImageIcon, Loader2, RefreshCw, AlertCircle, ShieldAlert, Copy, ExternalLink, Save } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, getPublicUrl } from '@/lib/utils-app';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function PremiumPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const profileRef = useMemoFirebase(() => user ? doc(db, 'userProfiles', user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const globalStatsRef = useMemoFirebase(() => doc(db, 'appConfig', 'globalStats'), [db]);
  const { data: globalStats } = useDoc(globalStatsRef);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showQRIS, setShowQRIS] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [customDomain, setCustomDomain] = useState('');
  const [isSavingDomain, setIsSavingDomain] = useState(false);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const PREMIUM_PRICE = globalStats?.premiumPrice || 10000;

  useEffect(() => {
    if (profile?.customDomain) {
      setCustomDomain(profile.customDomain);
    }
  }, [profile]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleUpgradeClick = async () => {
    if (!user || isProcessing) return;
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
        
        await addDoc(collection(db, 'payments'), {
          userId: user.uid,
          depositId: data.depositId,
          amount: data.amount,
          totalAmount: data.totalAmount,
          status: 'pending',
          createdAt: serverTimestamp(),
        });

        setPaymentData(data);
        setShowQRIS(true);
        startStatusPolling(data.depositId);
      } else {
        toast({ variant: "destructive", title: "Gagal", description: result.error || "Gagal membuat QRIS." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Terjadi kesalahan sistem." });
    } finally {
      setIsProcessing(false);
    }
  };

  const startStatusPolling = (id: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      await verifyPayment(id, true);
    }, 8000);
  };

  const verifyPayment = async (id: string, isAuto = false) => {
    if (!user || !profileRef) return;
    if (!isAuto) setCheckingStatus(true);

    try {
      const res = await fetch(`/api/deposit/${id}`);
      const result = await res.json();
      
      if (result.status && result.data?.status === 'success') {
        if (pollingRef.current) clearInterval(pollingRef.current);
        
        await updateDoc(profileRef, {
          isPremium: true,
          updatedAt: serverTimestamp()
        });

        toast({ title: "UPGRADE BERHASIL", description: "Status Premium Anda telah aktif selamanya!" });
        setShowQRIS(false);
      } else if (!isAuto && result.data?.status === 'pending') {
        toast({ title: "Belum Terbayar", description: "Selesaikan scan QRIS sesuai nominal unik." });
      }
    } catch (e) {
      if (!isAuto) toast({ variant: "destructive", title: "Gagal verifikasi" });
    } finally {
      if (!isAuto) setCheckingStatus(false);
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
                
                {profile?.customDomain && (
                  <div className="pt-2 flex items-center justify-between px-1">
                     <div className="text-left">
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Active Pointing</p>
                        <p className="text-[11px] font-black text-primary uppercase flex items-center gap-1.5">
                           <Globe size={10} /> {profile.customDomain}
                        </p>
                     </div>
                     <Button variant="ghost" asChild className="h-10 px-4 text-[9px] font-black uppercase bg-white/5 hover:bg-white/10 text-white rounded-xl">
                        <a href={`https://${profile.customDomain}`} target="_blank" rel="noreferrer">Kunjungi <ExternalLink size={10} className="ml-1.5" /></a>
                     </Button>
                  </div>
                )}
             </div>
          </Card>

          <Card className="glass-card border-none rounded-[2.5rem] p-8 text-center space-y-6">
             <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5 space-y-2">
                <CheckCircle2 size={32} className="text-green-500 mx-auto" />
                <p className="text-sm font-bold text-white uppercase tracking-tight">Lisensi Seumur Hidup Aktif</p>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest leading-relaxed mt-2 px-4">
                  Terima kasih telah mendukung Linku Engine. Semua fitur premium, visual neon mewah, dan branding bersih kini milik Anda sepenuhnya.
                </p>
             </div>
             {profile?.role === 'Admin' && (
               <Button asChild className="w-full h-14 bg-primary/10 hover:bg-primary/20 text-primary rounded-2xl border border-primary/20 font-black uppercase text-[10px] tracking-widest shadow-xl">
                  <a href="/admin"><ShieldAlert size={16} className="mr-2" /> MASUK PANEL ADMIN</a>
               </Button>
             )}
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

      <Card className="glass-card border-none rounded-[2.5rem] overflow-hidden relative shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1.5 neon-gradient" />
        <CardContent className="p-8 space-y-8 text-center">
          <div className="space-y-2">
             <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Investasi Identitas</p>
             <h2 className="text-6xl font-black text-white tracking-tighter">{formatCurrency(PREMIUM_PRICE)}</h2>
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full mt-3">
                <Sparkles size={12} className="text-primary" />
                <span className="text-[9px] font-black uppercase tracking-widest text-primary">Limited Lifetime Access</span>
             </div>
          </div>

          <div className="space-y-4 pt-6 text-left border-t border-white/5">
            {[
              { t: 'Custom Domain', d: 'Hubungkan domain pribadi Anda (budi.com).', i: Globe },
              { t: 'Branding Bersih', d: 'Hapus watermark "Powering with Linku".', i: ShieldCheck },
              { t: 'Prioritas AI', d: 'Akses generator visual & konten tercanggih.', i: Zap },
            ].map((f, i) => (
              <div key={i} className="flex gap-4 items-center p-4 bg-white/[0.02] rounded-2xl border border-white/5 transition-colors hover:bg-white/[0.05]">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-lg"><f.i size={20} /></div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-tight">{f.t}</h3>
                  <p className="text-[10px] font-medium text-white/40 mt-0.5 leading-relaxed">{f.d}</p>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={handleUpgradeClick} disabled={isProcessing} className="w-full h-16 neon-gradient text-background font-black rounded-3xl glow-primary shadow-2xl uppercase tracking-[0.2em] text-sm active:scale-95 transition-all">
            {isProcessing ? <Loader2 className="animate-spin" /> : "AKTIFKAN SEKARANG"}
          </Button>
          
          <p className="text-[8px] font-black uppercase text-white/10 tracking-widest">Secure transaction powered by Rams API</p>
        </CardContent>
      </Card>

      <Dialog open={showQRIS} onOpenChange={(o) => !isProcessing && setShowQRIS(o)}>
        <DialogContent className="glass-card border-none rounded-[2.5rem] bg-background/95 backdrop-blur-3xl p-8 shadow-2xl max-w-[95%] sm:max-w-md mx-auto overflow-hidden text-center">
          <div className="absolute top-0 left-0 w-full h-1.5 neon-gradient" />
          <DialogHeader className="mb-4">
             <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-white">Pembayaran QRIS</DialogTitle>
             <p className="text-[9px] font-black text-primary uppercase tracking-widest">Identity Authentication Invoice</p>
          </DialogHeader>

          <div className="space-y-6 py-4">
             <div className="bg-white p-5 rounded-[2.5rem] shadow-2xl inline-block relative overflow-hidden">
                {paymentData?.qrImage ? (
                  <img src={paymentData.qrImage} alt="QRIS" className="w-60 h-60 mx-auto" />
                ) : (
                  <div className="w-60 h-60 flex items-center justify-center bg-muted rounded-2xl"><Loader2 className="animate-spin text-primary" /></div>
                )}
                {checkingStatus && (
                  <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                    <Loader2 className="text-primary animate-spin" size={48} />
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Verifikasi...</p>
                  </div>
                )}
             </div>

             <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs font-black text-white/70 uppercase">
                  Total Bayar: <div className="p-1 bg-primary/20 text-primary rounded-md flex items-center gap-1.5 text-[9px] px-2"><RefreshCw size={10} className="animate-spin" /> Auto-check active</div>
                </div>
                <h3 className="text-5xl font-black text-primary tracking-tighter leading-none">{formatCurrency(paymentData?.totalAmount || PREMIUM_PRICE)}</h3>
                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mt-2">ID: {paymentData?.depositId}</p>
             </div>

             <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-left">
                <p className="text-[9px] font-bold text-white/40 uppercase leading-relaxed text-center">
                  Mohon transfer sesuai nominal <span className="text-primary">Eksak</span> hingga kode unik terakhir agar sistem dapat memproses secara instan.
                </p>
             </div>

             <div className="flex flex-col gap-3">
                <Button onClick={() => verifyPayment(paymentData?.depositId)} disabled={checkingStatus} className="w-full h-14 bg-primary/10 hover:bg-primary/20 text-primary font-black rounded-2xl border border-primary/20 uppercase text-[10px] tracking-widest shadow-xl">
                   {checkingStatus ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw size={16} className="mr-2" />} CEK PEMBAYARAN MANUAL
                </Button>
                <button onClick={() => setShowQRIS(false)} className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] hover:text-white transition-colors py-2">Batal / Tutup Invoice</button>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
