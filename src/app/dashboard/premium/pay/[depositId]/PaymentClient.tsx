"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, Clock, ShieldCheck, ChevronLeft, Download, Info, Copy, QrCode, X, Trash2, AlertTriangle } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
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
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Gunakan ID Dokumen langsung (depositId)
  const paymentRef = useMemoFirebase(() => doc(db, 'payments', depositId), [db, depositId]);
  const { data: payment, isLoading: isPaymentsLoading } = useDoc(paymentRef);

  const breakdown = useMemo(() => {
    if (!payment) return null;
    const basePrice = payment.amount || 0;
    const total = payment.totalAmount || 0;
    const uniqueCode = total - basePrice;
    return { basePrice, uniqueCode, total };
  }, [payment]);

  useEffect(() => {
    if (!payment?.expiredAt || isExpired || payment.status !== 'pending') return;

    const timer = setInterval(() => {
      try {
        const now = new Date();
        const end = parseISO(payment.expiredAt);
        const seconds = differenceInSeconds(end, now);

        if (seconds <= 0) {
          setIsExpired(true);
          setTimeLeft('EXPIRED');
          clearInterval(timer);
        } else {
          const m = Math.floor(seconds / 60);
          const s = seconds % 60;
          setTimeLeft(`${m}:${s < 10 ? '0' : ''}${s}`);
        }
      } catch (e) {
        console.error("Timer calculation error:", e);
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
        
        // 1. Update status payment
        const docRef = doc(db, 'payments', depositId);
        await updateDoc(docRef, {
          status: 'success',
          paidAt: serverTimestamp()
        });

        // 2. Aktifkan Premium di Profil
        const profileRef = doc(db, 'userProfiles', user.uid);
        await updateDoc(profileRef, {
          isPremium: true,
          updatedAt: serverTimestamp()
        });

        toast({ title: "UPGRADE BERHASIL", description: "Status Premium Anda telah aktif selamanya!" });
        router.push('/dashboard/premium');
      } else if (!isAuto && result.data?.status === 'pending') {
        toast({ title: "Belum Terdeteksi", description: "Selesaikan scan QRIS sesuai nominal unik." });
      }
    } catch (e) {
      if (!isAuto) console.error("Verification error:", e);
    } finally {
      if (!isAuto) setCheckingStatus(false);
    }
  };

  const handleCancelPayment = async () => {
    if (!payment || isCancelling) return;
    setIsCancelling(true);
    
    try {
      const docRef = doc(db, 'payments', depositId);
      await updateDoc(docRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp()
      });
      
      toast({ title: "PEMBAYARAN DIBATALKAN", description: "Invoice telah dihapus dari sistem." });
      router.push('/dashboard/premium');
    } catch (e: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `payments/${depositId}`,
        operation: 'update',
        requestResourceData: { status: 'cancelled' }
      }));
    } finally {
      setIsCancelling(false);
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
        
        toast({ title: "Tersalin ke Galeri", description: "QRIS berhasil diunduh." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal Unduh", description: "Terjadi kesalahan sistem visual." });
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

  if (!payment || payment.status === 'cancelled') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center text-white/20">
           <AlertTriangle size={40} />
        </div>
        <div className="space-y-2">
           <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Tagihan Tidak Aktif</h1>
           <p className="text-[10px] font-black uppercase text-white/40 tracking-widest max-w-xs mx-auto">Tagihan ini mungkin sudah dibatalkan atau masa berlakunya telah habis.</p>
        </div>
        <Button asChild className="neon-gradient text-background font-black rounded-2xl h-14 px-8 uppercase text-[10px] tracking-widest">
           <Link href="/dashboard/premium"><ChevronLeft className="mr-2" /> Kembali ke Layanan</Link>
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
                   <h3 className="text-5xl font-black text-primary tracking-tighter tabular-nums leading-none">
                     {formatCurrency(payment.totalAmount)}
                   </h3>
                   <div className="flex items-center justify-center gap-2 mt-4">
                      <div className="px-3 py-1 bg-white/5 rounded-full flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${payment.status === 'success' ? 'bg-green-500' : 'bg-primary animate-pulse'}`} />
                        <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">{payment.status.toUpperCase()}</span>
                      </div>
                      <div className="px-3 py-1 bg-white/5 rounded-full flex items-center gap-2">
                        <Clock size={10} className="text-white/40" />
                        <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">{timeLeft}</span>
                      </div>
                   </div>
                </div>

                <div className="bg-white/5 rounded-2xl border border-white/5 p-5 space-y-4 text-left">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                     <span className="text-white/40">Harga Lisensi</span>
                     <span className="text-white">{formatCurrency(breakdown?.basePrice || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                     <span className="text-white/40">Kode Unik Verifikasi</span>
                     <span className="text-primary font-black">+{breakdown?.uniqueCode}</span>
                  </div>
                  <div className="h-px bg-white/10 w-full" />
                  <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
                     <span className="text-white">ID Transaksi</span>
                     <span className="text-white/40">{depositId}</span>
                  </div>
                </div>
             </div>

             <div className="grid grid-cols-1 gap-4">
                {payment.status === 'pending' && !isExpired && (
                  <Button onClick={() => setIsQrModalOpen(true)} className="h-16 neon-gradient text-background font-black rounded-2xl glow-primary uppercase text-[11px] tracking-[0.2em] shadow-xl active:scale-95 transition-all">
                    <QrCode size={20} className="mr-2" /> TAMPILKAN QRIS
                  </Button>
                )}
                
                <Button onClick={() => verifyPayment()} disabled={checkingStatus || isExpired} variant="outline" className="h-14 border-white/10 bg-white/5 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest">
                  {checkingStatus ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw size={16} className="mr-2" />} CEK STATUS PEMBAYARAN
                </Button>

                {payment.status === 'pending' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" className="h-12 text-destructive/40 hover:text-destructive hover:bg-destructive/5 font-black uppercase text-[10px] tracking-widest">
                        <Trash2 size={14} className="mr-2" /> Batalkan Tagihan
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="glass-card border-none rounded-[2.5rem] bg-background/95 backdrop-blur-3xl p-8 border-white/10 shadow-2xl">
                      <AlertDialogHeader className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center text-destructive">
                           <Trash2 size={32} />
                        </div>
                        <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter text-white">Konfirmasi Batal</AlertDialogTitle>
                        <AlertDialogDescription className="text-white/60 font-medium leading-relaxed">
                          Apakah Anda yakin ingin membatalkan tagihan ini? Anda bisa membuat tagihan baru nanti jika ingin mengganti nominal.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="mt-8 flex flex-col gap-3">
                        <AlertDialogCancel className="bg-white/5 border-none rounded-xl text-[10px] font-black uppercase h-12 text-white hover:bg-white/10">Lanjutkan Bayar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancelPayment} className="bg-destructive hover:bg-destructive/80 text-white rounded-xl text-[10px] font-black uppercase h-12 shadow-xl shadow-destructive/20">Ya, Batalkan Invoice</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {isExpired && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl">
                    <p className="text-[10px] font-black text-destructive uppercase tracking-widest">Waktu Pembayaran Telah Habis</p>
                  </div>
                )}
             </div>

             <div className="p-5 bg-primary/5 rounded-[2rem] border border-primary/20 text-left space-y-3">
                <p className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                   <ShieldCheck size={14} /> Security Protocol
                </p>
                <ul className="space-y-2">
                   <li className="text-[9px] font-bold text-white/40 uppercase flex gap-3">
                      <span className="text-primary font-black">•</span> Jangan tutup halaman ini sampai pembayaran diverifikasi.
                   </li>
                   <li className="text-[9px] font-bold text-white/40 uppercase flex gap-3">
                      <span className="text-primary font-black">•</span> Pastikan nominal yang Anda scan <span className="text-white">sama persis</span>.
                   </li>
                </ul>
             </div>
             
             <p className="text-[8px] font-black uppercase text-white/10 tracking-[0.4em]">Powered by Linku Secure Engine</p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent className="glass-card border-none rounded-[2.5rem] bg-black/95 backdrop-blur-3xl p-8 shadow-2xl max-w-[90%] sm:max-w-sm mx-auto overflow-hidden text-center border-white/10">
          <div className="absolute top-0 left-0 w-full h-1.5 neon-gradient" />
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-black uppercase tracking-tighter text-white">QRIS PEMBAYARAN</DialogTitle>
            <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.4em]">Scan atau Unduh QRIS di bawah ini</p>
          </DialogHeader>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[2rem] shadow-2xl inline-block relative aspect-square w-full max-w-[280px]">
               <img src={payment.qrImage} alt="QRIS" className="w-full h-full object-contain" />
               {isExpired && (
                 <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center rounded-[2rem]">
                    <p className="text-xs font-black text-white uppercase tracking-widest">KEDALUWARSA</p>
                 </div>
               )}
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                 <Button onClick={handleDownloadQRIS} disabled={isDownloading} className="h-14 bg-white text-background hover:bg-white/90 font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl">
                   {isDownloading ? <Loader2 className="animate-spin mr-2" /> : <Download size={18} className="mr-2" />} SIMPAN KE GALERI
                 </Button>
                 <Button variant="ghost" onClick={() => setIsQrModalOpen(false)} className="h-12 text-white/40 hover:text-white font-black uppercase text-[10px] tracking-widest">
                    <X size={16} className="mr-2" /> TUTUP POPUP
                 </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}