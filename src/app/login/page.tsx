"use client";

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { state, dispatch } = useApp();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = state.users.find(u => u.email === email && u.password === password);
    
    if (user) {
      dispatch({ type: 'LOGIN', payload: user });
      toast({ title: "Login Berhasil", description: `Selamat datang kembali, ${user.role}!` });
      router.push(user.role === 'Admin' ? '/admin' : '/dashboard');
    } else {
      toast({ 
        variant: "destructive", 
        title: "Login Gagal", 
        description: "Email atau password salah." 
      });
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
            <Button type="submit" className="w-full h-12 neon-gradient text-background font-bold text-lg glow-primary mt-4">
              Masuk
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
