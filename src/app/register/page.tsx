
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, UserPlus } from 'lucide-react';
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

      // Logic: creeppermoment@gmail.com menjadi Admin / Obed Store
      const role = email.toLowerCase() === 'creeppermoment@gmail.com' ? 'Admin' : 'User';

      // Create User Profile in Firestore
      await setDoc(doc(db, 'userProfiles', firebaseUser.uid), {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        role: role,
        balance: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({ title: "Berhasil", description: `Akun ${role} telah dibuat. Selamat datang!` });
      router.push(role === 'Admin' ? '/admin' : '/dashboard');
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#131711] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
      <Card className="w-full max-w-md glass-card border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 neon-gradient"></div>
        <CardHeader className="text-center space-y-4 pt-10">
          <div className="mx-auto w-20 h-20 rounded-[2rem] neon-gradient flex items-center justify-center glow-primary border-4 border-background/20 group hover:rotate-6 transition-transform">
            <UserPlus size={40} className="text-background" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-4xl font-black tracking-tighter text-white">Obed Store</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Join our premium network</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <form onSubmit={handleRegister} className="space-y-5">
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
                  placeholder="Min 6 characters" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-white/5 border-white/10 h-14 pl-12 rounded-2xl focus-visible:ring-primary/30"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input 
                  type="password" 
                  placeholder="Repeat password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 h-14 pl-12 rounded-2xl focus-visible:ring-primary/30"
                />
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-14 neon-gradient text-background font-black text-lg glow-primary mt-4 rounded-2xl group active:scale-95 transition-all"
            >
              {isLoading ? "MENDAFTAR..." : "DAFTAR SEKARANG"}
            </Button>
            <div className="text-center pt-4">
              <p className="text-xs text-muted-foreground font-medium">
                Sudah punya akun? <Link href="/login" className="text-primary font-black hover:underline uppercase tracking-tight">Masuk Disini</Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
