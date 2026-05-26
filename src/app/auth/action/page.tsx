
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { applyActionCode, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck, XCircle, Loader2, Check, ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

function ActionHandler() {
  const searchParams = useSearchParams();
  const auth = useAuth();
  const router = useRouter();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'reset-form'>('loading');
  const [message, setMessage] = useState('Sedang memvalidasi kode keamanan...');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  useEffect(() => {
    if (!auth || !mode || !oobCode) {
      setStatus('error');
      setMessage('Permintaan tidak valid atau link telah kedaluwarsa.');
      return;
    }

    const handleAction = async () => {
      try {
        if (mode === 'verifyEmail') {
          await applyActionCode(auth, oobCode);
          setStatus('success');
          setMessage('Email Anda telah berhasil diverifikasi. Identitas Anda kini resmi terdaftar di Linku.');
        } else if (mode === 'resetPassword') {
          await verifyPasswordResetCode(auth, oobCode);
          setStatus('reset-form');
        } else {
          setStatus('error');
          setMessage('Mode aksi tidak didukung oleh sistem saat ini.');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Gagal memproses permintaan. Silakan coba lagi nanti.');
      }
    };

    handleAction();
  }, [auth, mode, oobCode]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setMessage('Sandi minimal harus 6 karakter.');
      return;
    }

    setIsProcessing(true);
    try {
      await confirmPasswordReset(auth, oobCode!, newPassword);
      setStatus('success');
      setMessage('Kata sandi Anda telah berhasil diperbarui. Silakan masuk menggunakan sandi baru Anda.');
    } catch (error: any) {
      setStatus('error');
      setMessage('Gagal memperbarui sandi: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0a] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background">
      <Card className="w-full max-w-md glass-card border-white/5 shadow-2xl overflow-hidden relative text-center">
        <div className="absolute top-0 left-0 w-full h-1.5 neon-gradient"></div>
        
        <CardHeader className="space-y-6 pt-12">
          <div className="mx-auto w-24 h-24 bg-black rounded-[2rem] flex items-center justify-center border border-white/10 shadow-2xl relative">
             {status === 'loading' && <Loader2 size={48} className="text-primary animate-spin" />}
             {status === 'success' && (
               <div className="relative flex items-center justify-center">
                 <ShieldCheck size={56} className="text-green-500 animate-in zoom-in" />
                 <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1">
                   <Check size={16} className="text-black" strokeWidth={4} />
                 </div>
               </div>
             )}
             {status === 'reset-form' && <Lock size={48} className="text-primary animate-pulse" />}
             {status === 'error' && <XCircle size={56} className="text-destructive animate-in bounce-in" />}
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-3xl font-black tracking-tighter text-white uppercase">
              {status === 'loading' && 'Memproses...'}
              {status === 'success' && 'Berhasil!'}
              {status === 'reset-form' && 'Sandi Baru'}
              {status === 'error' && 'Gagal'}
            </CardTitle>
            <CardDescription className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
              Security Protocol Handler
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-12 space-y-8">
          {status !== 'reset-form' ? (
            <>
              <p className="text-sm text-white/70 font-medium leading-relaxed">
                {message}
              </p>
              <div className="pt-4">
                {status === 'success' ? (
                  <Button asChild className="w-full h-16 neon-gradient text-background font-black rounded-2xl glow-primary active:scale-95 transition-all shadow-2xl uppercase tracking-widest text-xs">
                    <Link href="/login">Masuk ke Dashboard <ArrowRight className="ml-2" size={16} /></Link>
                  </Button>
                ) : status === 'error' ? (
                  <Button asChild variant="ghost" className="w-full h-14 bg-white/5 hover:bg-white/10 text-white font-black rounded-xl border border-white/5 uppercase text-[10px] tracking-widest">
                    <Link href="/login">Kembali ke Login</Link>
                  </Button>
                ) : null}
              </div>
            </>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6 text-left">
               <p className="text-[10px] text-white/40 uppercase font-black tracking-widest text-center">Masukkan kata sandi baru Anda di bawah.</p>
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Sandi Baru</label>
                 <div className="relative">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                   <Input 
                     type={showPassword ? "text" : "password"}
                     value={newPassword}
                     onChange={(e) => setNewPassword(e.target.value)}
                     className="bg-white/5 border-white/10 h-14 pl-12 pr-12 rounded-2xl focus-visible:ring-primary/30"
                     placeholder="Minimal 6 karakter"
                     required
                   />
                   <button 
                     type="button" 
                     onClick={() => setShowPassword(!showPassword)}
                     className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white"
                   >
                     {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                   </button>
                 </div>
               </div>
               <Button type="submit" disabled={isProcessing} className="w-full h-16 neon-gradient text-background font-black rounded-2xl glow-primary uppercase text-xs tracking-widest shadow-2xl">
                 {isProcessing ? "MEMPERBARUI..." : "SIMPAN KATA SANDI"}
               </Button>
            </form>
          )}
        </CardContent>

        <div className="absolute bottom-6 left-0 right-0 text-center">
           <p className="text-[8px] font-black text-white/10 uppercase tracking-[0.5em]">Linku Engine &bull; Secure Auth</p>
        </div>
      </Card>
    </div>
  );
}

export default function AuthActionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="text-primary animate-spin" size={48} />
      </div>
    }>
      <ActionHandler />
    </Suspense>
  );
}
