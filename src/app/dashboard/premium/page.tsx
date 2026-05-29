
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle2, ShieldCheck, Zap, Globe, Image as ImageIcon, Loader2, QrCode, ArrowRight, ReceiptText } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
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
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);

  const PREMIUM_PRICE = 10000;

  const handleUpgradeClick = async () => {
    if (!user || isProcessing) return;
    setIsProcessing(true);

    try {
      // 1. Create Payment Log in Firestore
      const paymentRef = await addDoc(collection(db, 'payments'), {
        userId: user.uid,
        amount: PREMIUM_PRICE,
        status: 'pending',
        method: 'QRIS',
        createdAt: serverTimestamp(),
      });

      setCurrentPaymentId(paymentRef.id);
      setShowQRIS(true);
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal memproses", description: "Coba beberapa saat lagi." });
    } finally {
      setIsProcessing(false);
    }
  };

  const simulatePaymentSuccess = async () => {
    if (!user || !currentPaymentId || !profileRef) return;
    setIsProcessing(true);

    try {
      // 2. Update Payment Status
      await updateDoc(doc(db, 'payments', currentPaymentId), {
        status: 'success',
        updatedAt: serverTimestamp()
      });

      // 3. Activate Premium for User
      await updateDoc(profileRef, {
        isPremium: true,
        updatedAt: serverTimestamp()
      });

      toast({ title: "PEMBAYARAN BERHASIL", description: "Status Premium Anda telah aktif! Selamat menikmati fitur eksklusif." });
      setShowQRIS(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal aktivasi" });
    } finally {
      setIsProcessing(false);
    }
  };

  const premiumFeatures = [
    { title: 'Hapus Watermark Linku', desc: 'Tampilan bersih tanpa embel-embel branding.', icon: ImageIcon },
    { title: 'Custom Domain (Coming Soon)', desc: 'Gunakan domain pribadi Anda (misal: namakamu.com).', icon: Globe },
    { title: 'Prioritas Support AI', desc: 'Akses lebih cepat ke generator tema & konten.', icon: Zap },
    { title: 'Statistik Mendalam', desc: 'Lihat trafik pengunjung lebih detail.', icon: Zap },
  ];

  if (profile?.isPremium) {
    return (
      <div className="space-y-8 animate-in pb-20">
        <div className="text-center space-y-4 pt-10">
          <div className="mx-auto w-24 h-24 rounded-[2.5rem] neon-gradient flex items-center justify-center text-background glow-primary shadow-2xl">
            <ShieldCheck size={56} />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase">Linku Premium User</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Identity Authenticated</p>
        </div>

        <Card className="glass-card border-none rounded-[2.5rem] p-8 text-center space-y-6">
           <div className="p-6 bg-primary/10 rounded-3xl border border-primary/20 space-y-2">
              <CheckCircle2 size={32} className="text-primary mx-auto" />
              <p className="text-sm font-bold text-white uppercase">Status: Aktif Selamanya</p>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-relaxed">
                Terima kasih telah mendukung pengembangan Linku Engine. Semua fitur premium kini terbuka untuk Anda.
              </p>
           </div>
           
           <Button asChild variant="ghost" className="w-full h-14 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest border border-white/5">
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
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">Tingkatkan Estetika Identitas Anda</p>
      </div>

      <Card className="glass-card border-none rounded-[2.5rem] overflow-hidden relative shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1.5 neon-gradient" />
        <CardContent className="p-8 space-y-8">
          <div className="text-center space-y-2">
             <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Investasi Sekali Bayar</p>
             <h2 className="text-6xl font-black text-white tracking-tighter">{formatCurrency(PREMIUM_PRICE)}</h2>
             <p className="text-xs font-bold text-primary uppercase tracking-widest mt-2">Akses Seumur Hidup</p>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            {premiumFeatures.map((f, i) => (
              <div key={i} className="flex gap-4 items-start p-4 bg-white/[0.02] rounded-2xl border border-white/5 group hover:bg-white/5 transition-all">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <f.icon size={20} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-tight">{f.title}</h3>
                  <p className="text-[10px] font-medium text-white/40 mt-1 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Button 
            onClick={handleUpgradeClick}
            disabled={isProcessing}
            className="w-full h-16 neon-gradient text-background font-black rounded-3xl glow-primary shadow-2xl uppercase tracking-widest text-sm active:scale-95 transition-all"
          >
            {isProcessing ? <Loader2 className="animate-spin" /> : "AKTIFKAN SEKARANG"}
          </Button>

          <p className="text-[8px] font-black text-center text-white/20 uppercase tracking-[0.4em]">Aman & Terenkripsi oleh Linku Engine</p>
        </CardContent>
      </Card>

      <Dialog open={showQRIS} onOpenChange={(o) => !isProcessing && setShowQRIS(o)}>
        <DialogContent className="glass-card border-none rounded-[2.5rem] bg-background/95 backdrop-blur-3xl p-8 shadow-2xl max-w-[95%] sm:max-w-md mx-auto overflow-hidden text-center">
          <div className="absolute top-0 left-0 w-full h-1.5 neon-gradient" />
          
          <DialogHeader className="mb-4">
             <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-white">Pembayaran QRIS</DialogTitle>
             <p className="text-[9px] font-black text-primary uppercase tracking-widest">Scan & Bayar Secara Otomatis</p>
          </DialogHeader>

          <div className="space-y-6 py-4">
             <div className="bg-white p-4 rounded-[2rem] shadow-2xl inline-block relative group">
                <div className="absolute inset-0 bg-primary/5 rounded-[2rem] blur-xl group-hover:bg-primary/10 transition-colors" />
                {/* Real-time QR Code Generator using Public API */}
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=LINKU_PAY_${currentPaymentId}_${PREMIUM_PRICE}`} 
                  alt="QRIS" 
                  className="w-56 h-56 relative z-10 mx-auto"
                />
             </div>

             <div className="space-y-2">
                <p className="text-xs font-black text-white/70 uppercase">Total Tagihan:</p>
                <h3 className="text-3xl font-black text-primary tracking-tighter">{formatCurrency(PREMIUM_PRICE)}</h3>
             </div>

             <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-3 text-left">
                <ReceiptText size={20} className="text-primary shrink-0" />
                <p className="text-[9px] font-bold text-white/40 uppercase leading-relaxed">
                  Gunakan aplikasi e-wallet atau m-banking favorit Anda. Pembayaran akan terverifikasi secara otomatis setelah dana diterima.
                </p>
             </div>

             <Button 
               onClick={simulatePaymentSuccess} 
               disabled={isProcessing}
               className="w-full h-14 bg-primary/10 hover:bg-primary/20 text-primary font-black rounded-2xl border border-primary/20 uppercase text-[10px] tracking-widest shadow-xl"
             >
                {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <Sparkles size={16} className="mr-2" />}
                KONFIRMASI PEMBAYARAN
             </Button>
             
             <button 
               onClick={() => setShowQRIS(false)} 
               className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] hover:text-white transition-colors"
             >
               Batal / Tutup
             </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
