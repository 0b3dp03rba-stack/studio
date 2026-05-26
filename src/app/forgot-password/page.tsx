
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, ArrowLeft, Send, Sparkles, Key } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  
  const auth = useAuth();
  const { toast } = useToast();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setIsSent(true);
      toast({ title: "Email Terkirim", description: "Instruksi reset sandi telah dikirim ke email Anda." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0a] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background">
      <Card className="w-full max-w-md glass-card border-white/5 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1.5 neon-gradient"></div>
        <CardHeader className="text-center space-y-6 pt-12">
          <div className="mx-auto w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center border border-primary/20 shadow-2xl relative">
             <Key size={48} className="text-primary relative z-10" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-black tracking-tighter text-white uppercase">Reset Sandi</CardTitle>
            <CardDescription className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Identity Recovery</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-12 space-y-6">
          {!isSent ? (
            <form onSubmit={handleReset} className="space-y-6">
              <p className="text-xs text-white/60 text-center font-medium leading-relaxed">
                Masukkan email Anda untuk menerima link reset kata sandi resmi dari <span className="text-primary">Linku Engine</span>.
              </p>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Anda</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input 
                    type="email" 
                    placeholder="name@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 h-14 pl-12 rounded-2xl focus-visible:ring-primary/30"
                  />
                </div>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full h-16 neon-gradient text-background font-black rounded-2xl glow-primary active:scale-95 transition-all shadow-xl uppercase tracking-widest text-xs">
                {isLoading ? "MEMPROSES..." : <><Send size={16} className="mr-2" /> KIRIM LINK RESET</>}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-8 py-4">
               <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                 <Sparkles size={32} className="text-primary mx-auto mb-4" />
                 <p className="text-sm font-bold text-white mb-2 uppercase">Periksa Kotak Masuk!</p>
                 <p className="text-[10px] text-white/50 leading-relaxed uppercase tracking-wider">
                   Link pemulihan telah dikirim ke <br/> <strong className="text-white">{email}</strong>.
                 </p>
               </div>
               <Button asChild className="w-full h-14 bg-white/5 hover:bg-white/10 text-white rounded-xl uppercase text-[10px] font-black tracking-widest border border-white/5">
                 <Link href="/login">Kembali ke Login</Link>
               </Button>
            </div>
          )}

          <div className="text-center pt-2">
            <Link href="/login" className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] hover:text-white transition-colors flex items-center justify-center gap-2">
              <ArrowLeft size={12} /> Kembali ke Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
