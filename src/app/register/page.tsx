
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Gagal", description: "Password tidak cocok." });
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Create User Profile in Firestore using UID
      await setDoc(doc(db, 'userProfiles', firebaseUser.uid), {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        role: 'User',
        balance: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({ title: "Berhasil", description: "Akun Anda telah dibuat. Selamat datang!" });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Pendaftaran Gagal", 
        description: error.message || "Terjadi kesalahan saat mendaftar." 
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
          <CardDescription>Daftar akun baru</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <Input 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/5 border-white/10 h-12"
            />
            <Input 
              type="password" 
              placeholder="Password (Min 6 Karakter)" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-white/5 border-white/10 h-12"
            />
            <Input 
              type="password" 
              placeholder="Konfirmasi Password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="bg-white/5 border-white/10 h-12"
            />
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-12 neon-gradient text-background font-bold text-lg glow-primary mt-4"
            >
              {isLoading ? "Mendaftar..." : "Daftar"}
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Sudah punya akun? <Link href="/login" className="text-primary hover:underline">Login disini</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
