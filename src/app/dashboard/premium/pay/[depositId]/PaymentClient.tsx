
"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, Clock, ShieldCheck, ChevronLeft, Download, Info, QrCode, X, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils-app';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { differenceInSeconds, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function PaymentClient({ depositId }: { depositId: string }) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [checkingStatus, setCheckingStatus] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isSuccessLocal, setIsSuccessLocal] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const paymentRef = useMemoFirebase(() => doc(db, 'payments', depositId), [db, depositId]);
  const { data: payment, isLoading: isPaymentsLoading } = useDoc(paymentRef);

  const breakdown = useMemo(() => {
    if (!payment) return null;
    const basePrice = payment.amount || 0;
    const total = payment.totalAmount || 0;
    const uniqueCode = total - basePrice;
    return { basePrice, uniqueCode, total };
  }, [payment]);

  // LOGIKA TIMER EXPIRED
  useEffect(() => {
    if (!payment?.expiredAt || isExpired || payment.status !== 'pending' || isSuccessLocal) return;

    const timer = setInterval(() => {
      try {
        const now = new Date();
        const end = parseISO(payment.expiredAt);
        const seconds = differenceInSeconds(end, now);

        if (seconds <= 0) {
          setIsExpired(true);
          setTimeLeft('EXPIRED');
          clearInterval(timer);
          updateDoc(doc(db, 'payments', depositId), { status: 'cancelled' }).catch(() => {});
        } else {
          const m = Math.floor(seconds / 60);
          const s = seconds % 60;
          setTimeLeft(`${m}:${s < 10 ? '0' : ''}${s}`);
        }
      } catch (e) {
        console.error("Timer error:", e);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [payment, isExpired, depositId, db, isSuccessLocal]);

  // AUTO POLLING STATUS
  useEffect(() => {
    if (payment && payment.status === 'pending' && !isExpired && !isSuccessLocal) {
      startStatusPolling();
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [payment, isExpired, isSuccessLocal]);

  const startStatusPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => { await verifyPayment(true); }, 15000); 
  };

  // VERIFIKASI PEMBAYARAN VIA API RAMS (ROBUST CHECK)
  const verifyPayment = async (isAuto = false) => {
    if (!user || !payment || isSuccessLocal) return;
    if (!isAuto) setCheckingStatus(true);
    
    try {
      const res = await fetch(`/api/deposit/${depositId}`);
      const result = await res.json();
      
      // Cek berbagai variasi label status sukses dari Rams API
      const statusFromApi = result.data?.status?.toLowerCase();
      const isActuallySuccess = ['success', 'paid', 'berhasil', 'completed'].includes(statusFromApi);

      if (result.status === true && isActuallySuccess) {
        setIsSuccessLocal(true);
        if (pollingRef.current) clearInterval(pollingRef.current);

        // 1. Update Dokumen Pembayaran
        await updateDoc(doc(db, 'payments', depositId), { 
          status: 'success', 
          paidAt: serverTimestamp(),
          rawApiStatus: statusFromApi
        });

        // 2. Update Profil User Menjadi Premium
        await updateDoc(doc(db, 'userProfiles', user.uid), { 
          isPremium: true, 
          updatedAt: serverTimestamp() 
        });

        toast({ 
          title: "PEMBAYARAN DITERIMA!", 
          description: "Selamat! Fitur premium Anda telah aktif selamanya." 
        });

        // Redirect ke dashboard premium
        setTimeout(() => router.push('/dashboard/premium'), 2000);
      } else {
        if (!isAuto) {
          toast({ 
            title: "BELUM TERVERIFIKASI", 
            description: "Pembayaran belum masuk ke sistem. Pastikan nominal transfer sama persis." 
          });
        }
      }
    } catch (e) {
      console.error("Verification Error:", e);
      if (!isAuto) toast({ variant: "destructive", title: "KESALAHAN SISTEM", description: "Gagal menghubungkan ke server Rams." });
    } finally {
      if (!isAuto) setCheckingStatus(false);
    }
  };

  const handleCancelPayment = async () => {
    if (!payment || isCancelling) return;
    setIsCancelling(true);
    try {
      await updateDoc(doc(db, 'payments', depositId), { status: 'cancelled', cancelledAt: serverTimestamp() });
      toast({ title: "PEMBAYARAN DIBATALKAN" });
      router.push('/dashboard/premium');
    } catch (e) {
      console.error(e);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDownloadQRIS = async () => {
    if (!payment?.qrImage || !breakdown) return;
    setIsDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = payment.qrImage;
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });

      const padding = 60;
      const headerH = 120;
      const priceH = 120;
      const footerH = 150;
      
      canvas.width = img.width + (padding * 2);
      canvas.height = img.height + headerH + priceH + footerH;

      if (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#000000";
        ctx.font = "bold 32px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("PEMBAYARAN QRIS LINKU", canvas.width / 2, 65);
        ctx.fillStyle = "#888888";
        ctx.font = "20px sans-serif";
        ctx.fillText(`ID: ${depositId.toUpperCase()}`, canvas.width / 2, 100);
        ctx.drawImage(img, padding, headerH);
        const priceY = headerH + img.height + 70;
        ctx.fillStyle = "#ff0000";
        ctx.font = "900 72px sans-serif";
        ctx.fillText(formatCurrency(breakdown.total), canvas.width / 2, priceY);
        const detailsY = priceY + 60;
        ctx.fillStyle = "#666666";
        ctx.font = "bold 20px sans-serif";
        ctx.fillText(`Lisensi: ${formatCurrency(breakdown.basePrice)}  |  Kode Unik: +${breakdown.uniqueCode}`, canvas.width / 2, detailsY);
        ctx.fillStyle = "#F5F5F5";
        ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
        ctx.fillStyle = "#000000";
        ctx.font = "bold 24px sans-serif";
        ctx.fillText("LINKU ENGINE - PREMIUM HUB", canvas.width / 2, canvas.height - 55);
        ctx.fillStyle = "#888888";
        ctx.font = "16px sans-serif";
        ctx.fillText("Scan nominal yang sama persis untuk verifikasi otomatis", canvas.width / 2, canvas.height - 30);

        const link = document.createElement('a');
        link.download = `QRIS-LINKU-${depositId}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.click();
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal Unduh" });
    } finally {
      setIsDownloading(false);
    }
  };

  if (isPaymentsLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  if (isSuccessLocal || payment?.status === 'success') {
     return (
       <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in zoom-in">
          <div className="w-24 h-24 rounded-[2.5rem] neon-gradient flex items-center justify-center text-background glow-primary shadow-2xl">
             <CheckCircle2 size={64} />
          </div>
          <div className="space-y-2">
             <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Verified!</h1>
             <p className="text-sm font-bold text-primary uppercase tracking-widest">Identitas Premium Anda Telah Aktif</p>
          </div>
          <p className="text-xs text-white/40 uppercase tracking-widest animate-pulse">Mengarahkan ke Dashboard...</p>
       </div>
     );
  }

  if (!payment || payment.status === 'cancelled' || isExpired) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
        <AlertTriangle size={64} className="text-white/20" />
        <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Tagihan Tidak Aktif</h1>
        <p className="text-xs text-white/40 max-w-xs mx-auto">Link pembayaran ini sudah kedaluwarsa atau telah dibatalkan. Silakan buat tagihan baru.</p>
        <Button asChild className="neon-gradient text-background font-black rounded-2xl h-16 px-10 uppercase text-[10px] tracking-widest shadow-2xl">
          <Link href="/dashboard/premium"><ChevronLeft className="mr-2" /> Kembali ke Premium</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 pb-32">
      <div className="max-w-md mx-auto space-y-8 animate-in">
        <div className="flex items-center justify-between">
           <Button variant="ghost" asChild className="w-12 h-12 rounded-2xl glass-card text-white p-0"><Link href="/dashboard/premium"><ChevronLeft size={24} /></Link></Button>
           <div className="text-right">
              <p className="text-[8px] font-black text-primary uppercase tracking-[0.3em]">Billing Authentication</p>
              <h2 className="text-lg font-black text-white uppercase tracking-tighter">INV-{depositId.slice(-6).toUpperCase()}</h2>
           </div>
        </div>

        <Card className="glass-card border-none rounded-[2.5rem] overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1.5 neon-gradient" />
          <CardContent className="p-8 space-y-8 text-center">
             <div className="space-y-6">
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Total Tagihan</p>
                   <h3 className="text-5xl font-black text-primary tracking-tighter leading-none">{formatCurrency(payment.totalAmount)}</h3>
                   <div className="flex items-center justify-center gap-2 mt-4">
                      <div className="px-4 py-1.5 bg-white/5 rounded-full flex items-center gap-2 border border-white/5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Sisa Waktu: {timeLeft}</span>
                      </div>
                   </div>
                </div>

                <div className="bg-white/5 rounded-[2rem] p-6 space-y-4 text-left border border-white/5">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase"><span className="text-white/40">Harga Lisensi</span><span className="text-white">{formatCurrency(breakdown?.basePrice || 0)}</span></div>
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase"><span className="text-white/40">Kode Unik Verifikasi</span><span className="text-primary font-black text-sm">+{breakdown?.uniqueCode}</span></div>
                  <div className="pt-4 border-t border-white/10">
                     <p className="text-[9px] font-medium text-white/30 leading-relaxed uppercase">PENTING: Mohon transfer dengan nominal yang <span className="text-white font-black">PERSIS SAMA</span> hingga 3 digit terakhir untuk verifikasi otomatis instan.</p>
                  </div>
                </div>
             </div>

             <div className="grid grid-cols-1 gap-4">
                <Button onClick={() => setIsQrModalOpen(true)} className="h-16 neon-gradient text-background font-black rounded-2xl glow-primary uppercase text-[11px] tracking-[0.2em] shadow-xl active:scale-95 transition-transform">
                  <QrCode size={20} className="mr-2" /> TAMPILKAN QRIS
                </Button>
                <Button onClick={() => verifyPayment()} disabled={checkingStatus} variant="outline" className="h-14 border-white/10 bg-white/5 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-white/10">
                  {checkingStatus ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw size={16} className="mr-2" />} CEK PEMBAYARAN MANUAL
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="text-[9px] font-black uppercase text-white/20 hover:text-destructive transition-colors py-2">
                       Batalkan Tagihan Ini
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="glass-card border-none rounded-[2.5rem] bg-black/95 p-8 shadow-2xl">
                    <AlertDialogHeader className="text-center"><AlertDialogTitle className="text-2xl font-black text-white uppercase tracking-tighter">Batalkan Transaksi?</AlertDialogTitle></AlertDialogHeader>
                    <AlertDialogDescription className="text-center text-white/40 text-xs font-medium">Anda akan menghapus tagihan ini dan harus membuat yang baru jika ingin upgrade.</AlertDialogDescription>
                    <AlertDialogFooter className="mt-8 flex flex-col gap-3">
                      <AlertDialogCancel className="bg-white/5 border-none rounded-xl text-[10px] font-black text-white h-12">Tutup</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancelPayment} className="bg-destructive hover:bg-destructive/80 border-none rounded-xl text-[10px] font-black h-12">YA, BATALKAN</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
             </div>
             <p className="text-[8px] font-black uppercase text-white/10 tracking-[0.4em]">Powered by Linku Secure Engine &bull; Rams API</p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent className="glass-card border-none rounded-[3rem] bg-black/95 p-8 shadow-2xl max-w-[90%] sm:max-w-sm mx-auto text-center">
          <div className="absolute top-0 left-0 w-full h-1.5 neon-gradient" />
          <DialogHeader className="mb-6"><DialogTitle className="text-xl font-black text-white uppercase tracking-tighter">QRIS PEMBAYARAN</DialogTitle></DialogHeader>
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-[2.5rem] inline-block w-full max-w-[280px] aspect-square shadow-2xl"><img src={payment.qrImage} alt="QRIS" className="w-full h-full object-contain" /></div>
            <div className="flex flex-col gap-3">
               <Button onClick={handleDownloadQRIS} disabled={isDownloading} className="h-16 bg-white text-background font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">
                 {isDownloading ? <Loader2 className="animate-spin mr-2" /> : <Download size={18} className="mr-2" />} SIMPAN KE GALERI
               </Button>
               <button onClick={() => setIsQrModalOpen(false)} className="text-[9px] font-black uppercase text-white/40 hover:text-white tracking-widest">
                 Tutup Jendela QR
               </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
