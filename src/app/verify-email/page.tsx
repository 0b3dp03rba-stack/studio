
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Link2, Mail, Send, ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useUser } from '@/firebase';
import { sendEmailVerification, signOut } from 'firebase/auth';

export default function VerifyEmailPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    if (!isUserLoading && !user) {
      router.push('/login');
    }
    if (user?.emailVerified) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleResend = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      await sendEmailVerification(user);
      toast({ 
        title: "Email Terkirim", 
        description: "Link verifikasi baru telah dikirim ke " + user.email 
      });
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Gagal Mengirim", 
        description: error.message 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (!mounted || isUserLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-2xl animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0a] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background">
      <Card className="w-full max-w-md glass-card border-white/5 shadow-2xl overflow-hidden relative text-center">
        <div className="absolute top-0 left-0 w-full h-1.5 neon-gradient"></div>
        <CardHeader className="space-y-6 pt-12">
          <div className="mx-auto w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center border border-primary/20 shadow-2xl relative animate-in">
             <div className="absolute inset-0 bg-primary/5 rounded-[2rem] animate-pulse-glow" />
             <Mail size={48} className="text-primary relative z-10" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-black tracking-tighter text-white uppercase">Verifikasi Email</CardTitle>
            <CardDescription className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Security Checkpoint</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-12 space-y-8">
          <div className="space-y-4">
            <p className="text-sm text-white/70 font-medium leading-relaxed">
              Kami telah mengirimkan link verifikasi ke <span className="text-white font-black">{user?.email}</span>. 
              Harap klik link tersebut untuk mengaktifkan akun Linku Anda.
            </p>
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-3 text-left">
               <ShieldCheck size={18} className="text-primary shrink-0 mt-0.5" />
               <p className="text-[9px] font-black uppercase text-primary/60 leading-normal tracking-wider">
                 Setelah verifikasi, harap muat ulang halaman atau login kembali untuk mengakses Dashboard.
               </p>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <Button 
              onClick={handleResend}
              disabled={isLoading}
              className="w-full h-14 bg-white/5 hover:bg-white/10 text-white font-black rounded-xl border border-white/5 uppercase text-[10px] tracking-[0.2em] transition-all"
            >
              {isLoading ? <RefreshCw className="animate-spin mr-2" /> : <Send size={16} className="mr-2" />}
              Kirim Ulang Link
            </Button>
            
            <Button 
              onClick={handleBackToLogin}
              variant="ghost"
              className="w-full h-12 text-white/40 hover:text-white font-black uppercase text-[10px] tracking-widest rounded-xl"
            >
              <ArrowLeft size={16} className="mr-2" /> Kembali ke Login
            </Button>
          </div>
        </CardContent>
        <div className="absolute bottom-6 left-0 right-0 text-center">
           <p className="text-[8px] font-black text-white/10 uppercase tracking-[0.5em]">Linku Verification Engine</p>
        </div>
      </Card>
    </div>
  );
}
