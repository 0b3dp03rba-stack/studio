
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Login Berhasil", description: "Selamat datang kembali!" });
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Login Gagal", 
        description: error.message || "Email atau password salah." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
      <Card className="w-full max-w-md glass-card border-white/10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl neon-gradient flex items-center justify-center glow-primary">
            <Mail size={32} className="text-background" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight neon-text">GmailKu</CardTitle>
          <CardDescription>Masuk untuk mengelola setoran Gmail Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input 
                type="email" 
                placeholder="Email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/5 border-white/10 h-12"
              />
            </div>
            <div className="space-y-2">
              <Input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-white/5 border-white/10 h-12"
              />
            </div>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-12 neon-gradient text-background font-bold text-lg glow-primary mt-4"
            >
              {isLoading ? "Memproses..." : "Masuk"}
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Belum punya akun? <Link href="/register" className="text-primary hover:underline">Daftar sekarang</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
