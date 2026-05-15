"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, User, Link2, Check, AtSign } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import Captcha from '@/components/Captcha';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCaptchaVerified) return;
    
    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) {
      toast({ variant: "destructive", title: "Username Terlalu Pendek", description: "Minimal 3 karakter alfanumerik." });
      return;
    }

    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Gagal", description: "Password tidak cocok." });
      return;
    }

    setIsLoading(true);
    try {
      // Check username uniqueness
      const usernameRef = doc(db, 'usernames', cleanUsername);
      const usernameSnap = await getDoc(usernameRef);
      
      if (usernameSnap.exists()) {
        toast({ variant: "destructive", title: "Username Sudah Dipakai", description: "Silakan pilih username lain." });
        setIsLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Batch create profile and username mapping
      await setDoc(doc(db, 'userProfiles', firebaseUser.uid), {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        username: cleanUsername,
        displayName: cleanUsername,
        role: 'User',
        views: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await setDoc(usernameRef, {
        userId: firebaseUser.uid,
        createdAt: serverTimestamp()
      });

      toast({ title: "Berhasil", description: "Akun Linku Anda telah aktif!" });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Pendaftaran Gagal", 
        description: error.message 
      });
      setIsCaptchaVerified(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0a] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background">
      <Card className="w-full max-w-md glass-card border-white/5 shadow-2xl relative overflow-hidden">
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
            <CardDescription className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Neon Link Hub</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-12 pt-4">
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Unique Username</label>
              <div className="relative">
                <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input 
                  placeholder="username_kamu" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 h-14 pl-12 rounded-2xl focus-visible:ring-primary/30"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
              <Input 
                type="email" 
                placeholder="name@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/5 border-white/10 h-14 rounded-2xl focus-visible:ring-primary/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Password</label>
              <Input 
                type="password" 
                placeholder="Min 6 characters" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/5 border-white/10 h-14 rounded-2xl focus-visible:ring-primary/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm Password</label>
              <Input 
                type="password" 
                placeholder="Repeat password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-white/5 border-white/10 h-14 rounded-2xl focus-visible:ring-primary/30"
              />
            </div>

            <Captcha onVerify={setIsCaptchaVerified} />

            <Button 
              type="submit" 
              disabled={isLoading || !isCaptchaVerified}
              className="w-full h-16 neon-gradient text-background font-black rounded-2xl glow-primary mt-4 active:scale-95 transition-all disabled:opacity-50 uppercase text-[10px] tracking-widest"
            >
              {isLoading ? "MENDAFTAR..." : "DAFTAR SEKARANG"}
            </Button>
            <div className="text-center pt-6">
              <p className="text-xs text-muted-foreground font-medium">
                Sudah punya akun? <Link href="/login" className="text-primary font-black hover:underline uppercase tracking-tighter">Masuk Disini</Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}