
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle2, ShieldCheck, Zap, Globe, Image as ImageIcon, Loader2, RefreshCw, AlertCircle, Timer } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils-app';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function PremiumPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const profileRef = useMemoFirebase(() => user ? doc(db, 'userProfiles', user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showQRIS, setShowQRIS] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const PREMIUM_PRICE = 10000;

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
        
        // Catat transaksi di Firestore
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
    }, 10000);
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

        toast({ title: "PEMBAYARAN BERHASIL", description: "Status Premium Aktif! Watermark telah dihapus." });
        setShowQRIS(false);
      } else if (!isAuto) {
        toast({ title: "Belum Dibayar", description: "Status masih pending. Silakan selesaikan pembayaran." });
      }
    } catch (e) {
      if (!isAuto) toast({ variant: "destructive", title: "Gagal verifikasi" });
    } finally {
      if (!isAuto) setCheckingStatus(false);
    }
  };

  if (profile?.isPremium) {
    return (
      <div className="space-y-8 animate-in pb-20">
        <div className="text-center space-y-4 pt-10">
          <div className="mx-auto w-24 h-24 rounded-[2.5rem] neon-gradient flex items-center justify-center text-background glow-primary shadow-2xl">
            <ShieldCheck size={56} />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase">Linku Premium</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Identity Authenticated</p>
        </div>

        <Card className="glass-card border-none rounded-[2.5rem] p-8 text-center space-y-6">
           <div className="p-6 bg-primary/10 rounded-3xl border border-primary/20 space-y-2">
              <CheckCircle2 size={32} className="text-primary mx-auto" />
              <p className="text-sm font-bold text-white uppercase">Status: Aktif Seumur Hidup</p>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-relaxed">
                Semua fitur premium kini terbuka. Nikmati profil tanpa watermark dan visual neon yang mewah.
              </p>
           </div>
           <Button asChild variant="ghost" className="w-full h-14 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">
             <a href="/dashboard/manage">Mulai Kelola Hub</a>
           </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in pb-20">
      <div className="space-y-1 text-center">
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase">Upgrade Premium</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">Satu Kali Bayar, Eksis Selamanya</p>
      </div>

      <Card className="glass-card border-none rounded-[2.5rem] overflow-hidden relative shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1.5 neon-gradient" />
        <CardContent className="p-8 space-y-8">
          <div className="text-center space-y-2">
             <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Investasi Estetika</p>
             <h2 className="text-6xl font-black text-white tracking-tighter">{formatCurrency(PREMIUM_PRICE)}</h2>
             <p className="text-xs font-bold text-primary uppercase tracking-widest mt-2">Akses Seumur Hidup</p>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            {[
              { t: 'Hapus Watermark Linku', d: 'Branding bersih 100% milik Anda.', i: ImageIcon },
              { t: 'Subdomain Premium', d: 'Akses instan via username.linku.biz.id.', i: Globe },
              { t: 'Prioritas Fitur AI', d: 'Generator tema & konten lebih cerdas.', i: Zap },
            ].map((f, i) => (
              <div key={i} className="flex gap-4 items-start p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><f.i size={20} /></div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase">{f.t}</h3>
                  <p className="text-[10px] font-medium text-white/40 mt-1">{f.d}</p>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={handleUpgradeClick} disabled={isProcessing} className="w-full h-16 neon-gradient text-background font-black rounded-3xl glow-primary shadow-2xl uppercase tracking-widest text-sm">
            {isProcessing ? <Loader2 className="animate-spin" /> : "AKTIFKAN SEKARANG"}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showQRIS} onOpenChange={(o) => !isProcessing && setShowQRIS(o)}>
        <DialogContent className="glass-card border-none rounded-[2.5rem] bg-background/95 backdrop-blur-3xl p-8 shadow-2xl max-w-[95%] sm:max-w-md mx-auto overflow-hidden text-center">
          <div className="absolute top-0 left-0 w-full h-1.5 neon-gradient" />
          <DialogHeader className="mb-4">
             <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-white">Pembayaran QRIS</DialogTitle>
             <p className="text-[9px] font-black text-primary uppercase tracking-widest">Real-time Invoice by Rams API</p>
          </DialogHeader>

          <div className="space-y-6 py-4">
             <div className="bg-white p-4 rounded-[2rem] shadow-2xl inline-block relative overflow-hidden">
                {paymentData?.qrImage ? (
                  <img src={paymentData.qrImage} alt="QRIS" className="w-56 h-56 mx-auto" />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center bg-muted rounded-xl"><Loader2 className="animate-spin" /></div>
                )}
                {checkingStatus && (
                  <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="text-white animate-spin" size={40} />
                  </div>
                )}
             </div>

             <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs font-black text-white/70 uppercase">
                  Total Bayar: <div className="p-1 bg-primary/20 text-primary rounded-md flex items-center gap-1"><RefreshCw size={10} className="animate-spin" /> Auto-check On</div>
                </div>
                <h3 className="text-4xl font-black text-primary tracking-tighter">{formatCurrency(paymentData?.totalAmount || PREMIUM_PRICE)}</h3>
                <p className="text-[9px] font-black text-white/30 uppercase">ID: {paymentData?.depositId}</p>
             </div>

             <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-3 text-left">
                <AlertCircle size={20} className="text-primary shrink-0 mt-0.5" />
                <p className="text-[9px] font-bold text-white/40 uppercase leading-relaxed">
                  Penting: Bayar tepat sesuai nominal (termasuk kode unik) agar sistem mengenali dana Anda secara instan.
                </p>
             </div>

             <Button onClick={() => verifyPayment(paymentData?.depositId)} disabled={checkingStatus} className="w-full h-14 bg-primary/10 hover:bg-primary/20 text-primary font-black rounded-2xl border border-primary/20 uppercase text-[10px] tracking-widest shadow-xl">
                {checkingStatus ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw size={16} className="mr-2" />} CEK STATUS MANUAL
             </Button>
             
             <button onClick={() => setShowQRIS(false)} className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] hover:text-white">Batal / Tutup</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
