"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Link2, Mail, Lock, Check } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import Captcha from '@/components/Captcha';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [mounted, setMounted] = useState(false);

  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCaptchaVerified) return;
    
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Login Berhasil", description: "Selamat datang kembali di Linku!" });
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Login Gagal", 
        description: "Email atau password salah."
      });
      // Reset captcha on failure for extra security
      setIsCaptchaVerified(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || isUserLoading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0a] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background">
      <Card className="w-full max-w-md glass-card border-white/5 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 neon-gradient"></div>
        <CardHeader className="text-center space-y-4 pt-12">
          <div className="mx-auto w-24 h-24 bg-black rounded-[2.5rem] flex items-center justify-center border border-white/10 shadow-2xl relative group">
            <div className="relative flex items-center justify-center">
              <Link2 size={48} className="text-primary group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute -bottom-2 -right-2 bg-black rounded-lg p-1.5 border border-white/10">
                <Check size={16} className="text-primary" strokeWidth={4} />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-5xl font-black tracking-tighter text-white">Linku</CardTitle>
            <CardDescription className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Premium Link Hub</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-12 pt-4">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 h-14 pl-12 rounded-2xl focus-visible:ring-primary/30 font-medium"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 h-14 pl-12 rounded-2xl focus-visible:ring-primary/30 font-medium"
                />
              </div>
            </div>

            <Captcha onVerify={setIsCaptchaVerified} />

            <Button 
              type="submit" 
              disabled={isLoading || !isCaptchaVerified}
              className="w-full h-16 neon-gradient text-background font-black text-xl glow-primary mt-4 rounded-2xl active:scale-95 transition-all shadow-2xl disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
            >
              {isLoading ? "MENGOTENTIKASI..." : "MASUK SEKARANG"}
            </Button>
            <div className="text-center pt-6">
              <p className="text-xs text-muted-foreground font-medium">
                Belum punya akun? <Link href="/register" className="text-primary font-black hover:underline uppercase tracking-tighter">Daftar Disini</Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}