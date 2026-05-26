
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { applyActionCode } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, XCircle, Loader2, Link2, Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function ActionHandler() {
  const searchParams = useSearchParams();
  const auth = useAuth();
  const router = useRouter();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Sedang memvalidasi kode keamanan...');

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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0a] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background">
      <Card className="w-full max-w-md glass-card border-white/5 shadow-2xl overflow-hidden relative text-center">
        <div className="absolute top-0 left-0 w-full h-1.5 neon-gradient"></div>
        
        <CardHeader className="space-y-6 pt-12">
          <div className="mx-auto w-24 h-24 bg-black rounded-[2rem] flex items-center justify-center border border-white/10 shadow-2xl relative">
             {status === 'loading' && <Loader2 size={48} className="text-primary animate-spin" />}
             {status === 'success' && (
               <div className="relative flex items-center justify-center">
                 <ShieldCheck size={56} className="text-green-500 animate-in zoom-in duration-500" />
                 <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1 shadow-lg">
                   <Check size={16} className="text-black" strokeWidth={4} />
                 </div>
               </div>
             )}
             {status === 'error' && <XCircle size={56} className="text-destructive animate-in bounce-in" />}
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-3xl font-black tracking-tighter text-white uppercase">
              {status === 'loading' && 'Memproses...'}
              {status === 'success' && 'Berhasil Terverifikasi'}
              {status === 'error' && 'Gagal Verifikasi'}
            </CardTitle>
            <CardDescription className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
              Security Protocol Handler
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-12 space-y-8">
          <p className="text-sm text-white/70 font-medium leading-relaxed">
            {message}
          </p>

          <div className="pt-4">
            {status === 'success' ? (
              <Button asChild className="w-full h-16 neon-gradient text-background font-black rounded-2xl glow-primary active:scale-95 transition-all shadow-2xl uppercase tracking-widest text-xs">
                <Link href="/dashboard">Masuk ke Dashboard <ArrowRight className="ml-2" size={16} /></Link>
              </Button>
            ) : status === 'error' ? (
              <Button asChild variant="ghost" className="w-full h-14 bg-white/5 hover:bg-white/10 text-white font-black rounded-xl border border-white/5 uppercase text-[10px] tracking-widest">
                <Link href="/login">Kembali ke Login</Link>
              </Button>
            ) : null}
          </div>
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
