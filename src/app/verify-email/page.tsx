
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send, ArrowLeft, RefreshCw, ShieldCheck, Search, AlertCircle, Inbox, BellRing, Sparkles } from 'lucide-react';
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
            <CardDescription className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Identity Security Check</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-12 space-y-8">
          <div className="space-y-6">
            <p className="text-sm text-white/70 font-medium leading-relaxed">
              Link aktivasi telah dikirim ke <br/> <span className="text-primary font-black">{user?.email}</span>. 
            </p>
            
            <div className="p-5 bg-primary/10 rounded-[2.5rem] border-2 border-primary/30 flex flex-col gap-4 text-left relative overflow-hidden group shadow-[0_0_50px_-10px_rgba(255,0,0,0.2)]">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                 <Sparkles size={60} className="text-primary" />
               </div>
               <div className="flex items-center gap-2 text-primary relative z-10">
                 <AlertCircle size={18} />
                 <p className="text-[11px] font-black uppercase tracking-widest">Email Tidak Ditemukan?</p>
               </div>
               <div className="space-y-4 relative z-10">
                 <div className="flex items-start gap-3">
                   <div className="w-6 h-6 rounded-full bg-primary text-background flex items-center justify-center shrink-0 mt-0.5"><span className="text-[10px] font-black">1</span></div>
                   <p className="text-[10px] font-bold text-white/90 leading-snug uppercase">
                     Periksa folder <span className="text-primary underline decoration-2 underline-offset-4">SPAM</span> atau <span className="text-primary underline decoration-2 underline-offset-4">PROMOSI</span> di Gmail/Email Anda.
                   </p>
                 </div>
                 <div className="flex items-start gap-3">
                   <div className="w-6 h-6 rounded-full bg-primary text-background flex items-center justify-center shrink-0 mt-0.5"><span className="text-[10px] font-black">2</span></div>
                   <p className="text-[10px] font-bold text-white/90 leading-snug uppercase">
                     Jika ada di Spam, klik tombol <span className="text-primary font-black">"LAPORKAN BUKAN SPAM"</span>. Langkah ini sangat membantu sistem kami mengenali domain Linku.
                   </p>
                 </div>
                 <div className="flex items-start gap-3">
                   <div className="w-6 h-6 rounded-full bg-primary text-background flex items-center justify-center shrink-0 mt-0.5"><span className="text-[10px] font-black">3</span></div>
                   <p className="text-[10px] font-bold text-white/90 leading-snug uppercase">
                     Klik link di dalam email, lalu kembali ke sini dan REFRESH halaman dashboard.
                   </p>
                 </div>
               </div>
            </div>

            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3 text-left">
               <ShieldCheck size={18} className="text-primary shrink-0" />
               <p className="text-[9px] font-black uppercase text-white/40 tracking-wider leading-relaxed">
                 Identity Protection by Linku Engine &bull; Secure Auth Protocol
               </p>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <Button 
              onClick={handleResend}
              disabled={isLoading}
              className="w-full h-16 neon-gradient text-background font-black rounded-2xl glow-primary uppercase text-[11px] tracking-[0.2em] transition-all shadow-2xl active:scale-95"
            >
              {isLoading ? <RefreshCw className="animate-spin mr-2" /> : <Send size={16} className="mr-2" />}
              Kirim Ulang Link Aktivasi
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
        <div className="absolute bottom-6 left-0 right-0 text-center opacity-20">
           <p className="text-[8px] font-black text-white uppercase tracking-[0.5em]">auth@linku.biz.id &bull; Secure Access</p>
        </div>
      </Card>
    </div>
  );
}
