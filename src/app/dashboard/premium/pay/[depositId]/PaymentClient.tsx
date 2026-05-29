"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, Clock, ShieldCheck, ChevronLeft, Download } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp, collection, query, where, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils-app';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { differenceInSeconds, parseISO } from 'date-fns';

export default function PaymentClient({ depositId }: { depositId: string }) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [checkingStatus, setCheckingStatus] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // FIX: Tambahkan filter userId agar sesuai dengan Security Rules (Rules are not filters)
  const paymentsQuery = useMemoFirebase(() => 
    user ? query(
      collection(db, 'payments'), 
      where('depositId', '==', depositId),
      where('userId', '==', user.uid), // Wajib ada agar diizinkan Security Rules
      limit(1)
    ) : null,
    [db, user?.uid, depositId]
  );
  
  const { data: payments, isLoading: isPaymentsLoading } = useCollection(paymentsQuery);
  const payment = payments?.[0];

  useEffect(() => {
    if (!payment || isExpired) return;

    const timer = setInterval(() => {
      const now = new Date();
      const end = parseISO(payment.expiredAt);
      const seconds = differenceInSeconds(end, now);

      if (seconds <= 0) {
        setIsExpired(true);
        setTimeLeft('ED');
        clearInterval(timer);
      } else {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        setTimeLeft(`${m}:${s < 10 ? '0' : ''}${s}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [payment, isExpired]);

  useEffect(() => {
    if (payment && payment.status === 'pending' && !isExpired) {
      startStatusPolling();
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [payment, isExpired]);

  const startStatusPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      await verifyPayment(true);
    }, 10000); // Polling setiap 10 detik
  };

  const verifyPayment = async (isAuto = false) => {
    if (!user || !payment) return;
    if (!isAuto) setCheckingStatus(true);

    try {
      const res = await fetch(`/api/deposit/${depositId}`);
      const result = await res.json();
      
      if (result.status && result.data?.status === 'success') {
        if (pollingRef.current) clearInterval(pollingRef.current);
        
        // Update di Firestore payments
        await updateDoc(doc(db, 'payments', payment.id), {
          status: 'success',
          paidAt: serverTimestamp()
        });

        // Update di UserProfile
        await updateDoc(doc(db, 'userProfiles', user.uid), {
          isPremium: true,
          updatedAt: serverTimestamp()
        });

        toast({ title: "UPGRADE BERHASIL", description: "Status Premium Anda telah aktif selamanya!" });
        router.push('/dashboard/premium');
      } else if (!isAuto && result.data?.status === 'pending') {
        toast({ title: "Belum Terbayar", description: "Selesaikan scan QRIS sesuai nominal unik." });
      }
    } catch (e) {
      if (!isAuto) console.error("Verifikasi error:", e);
    } finally {
      if (!isAuto) setCheckingStatus(false);
    }
  };

  const handleDownloadQRIS = async () => {
    if (!payment?.qrImage) return;
    setIsDownloading(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.crossOrigin = "anonymous";
      img.src = payment.qrImage;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      canvas.width = img.width;
      canvas.height = img.height + 80;

      if (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        ctx.fillStyle = "#ff0000"; 
        ctx.font = "bold 24px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("LINKU ENGINE - PREMIUM HUB", canvas.width / 2, canvas.height - 45);
        
        ctx.fillStyle = "#666666";
        ctx.font = "14px Inter, sans-serif";
        ctx.fillText(`ID Transaksi: ${depositId}`, canvas.width / 2, canvas.height - 20);

        const link = document.createElement('a');
        link.download = `QRIS-LINKU-${depositId}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
        
        toast({ title: "Tersimpan", description: "QRIS berhasil diunduh ke perangkat Anda." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal Unduh", description: "Terjadi kesalahan saat memproses gambar." });
    } finally {
      setIsDownloading(false);
    }
  };

  if (isPaymentsLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-[10px] font-black uppercase tracking-widest text-primary/50">Memuat Invoice...</p>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
        <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Invoice Tidak Ditemukan</h1>
        <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Atau Anda tidak memiliki izin melihat data ini.</p>
        <Button asChild className="neon-gradient text-background font-black rounded-2xl h-14 px-8 uppercase text-[10px] tracking-widest">
           <Link href="/dashboard/premium"><ChevronLeft className="mr-2" /> Kembali</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background p-6 pb-32">
      <div className="max-w-md mx-auto space-y-8 animate-in">
        <div className="flex items-center justify-between">
           <Button variant="ghost" asChild className="w-12 h-12 rounded-2xl glass-card text-white p-0">
             <Link href="/dashboard/premium"><ChevronLeft size={24} /></Link>
           </Button>
           <div className="text-right">
              <p className="text-[8px] font-black text-primary uppercase tracking-[0.3em]">Checkout</p>
              <h2 className="text-lg font-black text-white uppercase tracking-tighter">ID: {depositId}</h2>
           </div>
        </div>

        <Card className="glass-card border-none rounded-[2.5rem] overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1.5 neon-gradient" />
          <CardContent className="p-8 space-y-8 text-center">
             
             <div className="space-y-6">
                <div className="bg-white p-5 rounded-[2.5rem] shadow-2xl inline-block relative overflow-hidden group">
                   <img src={payment.qrImage} alt="QRIS" className={`w-64 h-64 mx-auto transition-opacity duration-500 ${isExpired ? 'opacity-10 grayscale' : 'opacity-100'}`} />
                   
                   {checkingStatus && (
                     <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                       <Loader2 className="text-primary animate-spin" size={48} />
                       <p className="text-[10px] font-black text-white uppercase tracking-widest">Verifikasi...</p>
                     </div>
                   )}

                   {isExpired && (
                     <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 gap-4">
                        <Clock size={48} className="text-destructive animate-pulse" />
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Waktu Habis</h3>
                        <p className="text-[9px] font-bold text-white/40 leading-relaxed uppercase">Invoice telah kedaluwarsa.</p>
                     </div>
                   )}
                   
                   {!isExpired && (
                     <button 
                       onClick={handleDownloadQRIS}
                       disabled={isDownloading}
                       className="absolute bottom-2 right-2 w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-background shadow-xl active:scale-95 transition-transform"
                     >
                       {isDownloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={20} />}
                     </button>
                   )}
                </div>

                <div className="space-y-2">
                   <div className="flex items-center justify-center gap-2 text-xs font-black text-white/70 uppercase">
                     Total Transfer: <div className="p-1 bg-primary/20 text-primary rounded-md flex items-center gap-1.5 text-[9px] px-2 font-mono">{timeLeft}</div>
                   </div>
                   <h3 className="text-5xl font-black text-primary tracking-tighter tabular-nums leading-none">
                     {formatCurrency(payment.totalAmount)}
                   </h3>
                </div>
             </div>

             <div className="p-5 bg-primary/5 rounded-[2rem] border border-primary/20 text-left space-y-3 relative overflow-hidden">
                <p className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                   <ShieldCheck size={14} /> Instruksi Penting
                </p>
                <ol className="space-y-2 relative z-10">
                   <li className="text-[9px] font-bold text-white/60 leading-relaxed uppercase flex gap-3">
                      <span className="text-primary">1.</span> Pastikan nominal transfer <span className="text-white">Eksak</span>.
                   </li>
                   <li className="text-[9px] font-bold text-white/60 leading-relaxed uppercase flex gap-3">
                      <span className="text-primary">2.</span> Sistem otomatis memproses dalam <span className="text-white">8-60 detik</span>.
                   </li>
                   <li className="text-[9px] font-bold text-white/60 leading-relaxed uppercase flex gap-3">
                      <span className="text-primary">3.</span> Simpan gambar QRIS jika ingin membayar lewat galeri.
                   </li>
                </ol>
             </div>

             <div className="flex flex-col gap-3">
                {!isExpired ? (
                  <div className="grid grid-cols-1 gap-3">
                    <Button onClick={() => verifyPayment()} disabled={checkingStatus} className="h-16 bg-primary/10 hover:bg-primary/20 text-primary font-black rounded-2xl border border-primary/20 uppercase text-[10px] tracking-[0.2em] shadow-xl active:scale-95 transition-all">
                      {checkingStatus ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw size={18} className="mr-2" />} CEK PEMBAYARAN MANUAL
                    </Button>
                    <Button onClick={handleDownloadQRIS} variant="outline" className="h-12 border-white/10 bg-white/5 text-white/60 font-black rounded-xl uppercase text-[9px] tracking-widest">
                       <Download size={14} className="mr-2" /> SIMPAN QRIS KE GALERI
                    </Button>
                  </div>
                ) : (
                  <Button asChild className="w-full h-16 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl border border-white/10 uppercase text-[10px] tracking-widest">
                    <Link href="/dashboard/premium">KEMBALI KE DASHBOARD</Link>
                  </Button>
                )}
                
                <p className="text-[8px] font-black uppercase text-white/10 tracking-[0.4em] pt-2">Powered by Linku Secure Engine</p>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
