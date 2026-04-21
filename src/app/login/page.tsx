
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Login Berhasil", description: "Selamat datang kembali di GmailKu!" });
    } catch (error: any) {
      let msg = "Email atau password salah.";
      if (error.code === 'auth/user-not-found') msg = "Akun tidak ditemukan.";
      if (error.code === 'auth/wrong-password') msg = "Password salah.";
      
      toast({ 
        variant: "destructive", 
        title: "Login Gagal", 
        description: msg
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#131711] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
      <Card className="w-full max-w-md glass-card border-white/5 shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 neon-gradient"></div>
        <CardHeader className="text-center space-y-4 pt-10">
          <div className="mx-auto w-20 h-20 rounded-[2rem] neon-gradient flex items-center justify-center glow-primary border-4 border-background/20 group hover:rotate-6 transition-transform">
            <Mail size={40} className="text-background" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-4xl font-black tracking-tighter text-white">GmailKu</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Premium Gmail Engine</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
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
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-white/5 border-white/10 h-14 pl-12 rounded-2xl focus-visible:ring-primary/30"
                />
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-14 neon-gradient text-background font-black text-lg glow-primary mt-4 rounded-2xl group active:scale-95 transition-all"
            >
              {isLoading ? "MENGOTENTIKASI..." : "MASUK SEKARANG"}
            </Button>
            <div className="text-center pt-4">
              <p className="text-xs text-muted-foreground font-medium">
                Belum punya akun? <Link href="/register" className="text-primary font-black hover:underline uppercase tracking-tight">Daftar Disini</Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
