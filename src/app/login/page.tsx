
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Link2, Mail, Lock, Check, Chrome, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import Captcha from '@/components/Captcha';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [mounted, setMounted] = useState(false);

  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    if (!isUserLoading && user) {
      if (user.emailVerified) {
        router.push('/dashboard');
      } else {
        router.push('/verify-email');
      }
    }
  }, [user, isUserLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCaptchaVerified) return;
    
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (!user.emailVerified) {
        toast({ 
          variant: "destructive", 
          title: "Verifikasi Diperlukan", 
          description: "Harap verifikasi email Anda sebelum masuk."
        });
        router.push('/verify-email');
        setIsLoading(false);
        return;
      }

      toast({ title: "Login Berhasil", description: "Selamat datang kembali di Linku!" });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Login Gagal", 
        description: "Email atau password salah."
      });
      setIsCaptchaVerified(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      // Mengatur parameter agar Google selalu menanyakan akun
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const profileRef = doc(db, 'userProfiles', user.uid);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        const baseUsername = (user.email?.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9_]/g, '');
        let finalUsername = baseUsername;
        
        const userCheckRef = doc(db, 'usernames', finalUsername);
        const userCheckSnap = await getDoc(userCheckRef);
        if (userCheckSnap.exists()) {
          finalUsername = `${baseUsername}_${Math.floor(Math.random() * 1000)}`;
        }

        await setDoc(profileRef, {
          id: user.uid,
          email: user.email,
          username: finalUsername,
          displayName: user.displayName || finalUsername,
          avatarUrl: user.photoURL || '',
          role: 'User',
          views: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        await setDoc(doc(db, 'usernames', finalUsername), {
          userId: user.uid,
          createdAt: serverTimestamp()
        });
      }

      toast({ title: "Berhasil Masuk", description: "Otentikasi Google berhasil." });
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      let desc = "Gagal menghubungkan ke Google.";
      if (error.code === 'auth/operation-not-allowed') desc = "Metode Google belum aktif di Firebase Console.";
      if (error.code === 'auth/unauthorized-domain') desc = "Domain ini belum terdaftar di Authorized Domains Firebase.";
      
      toast({ 
        variant: "destructive", 
        title: "Google Gagal", 
        description: desc 
      });
    } finally {
      setIsGoogleLoading(false);
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
            <CardDescription className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Premium Hub Access</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-12 pt-4 space-y-6">
          <Button 
            onClick={handleGoogleLogin} 
            disabled={isGoogleLoading}
            className="w-full h-14 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-bold transition-all flex items-center justify-center gap-3"
          >
            {isGoogleLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Chrome size={20} className="text-white" />}
            MASUK DENGAN GOOGLE
          </Button>

          <div className="flex items-center gap-4 py-2">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">ATAU EMAIL</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>

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
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Password</label>
                <Link href="/forgot-password" virtual="true" className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline">Lupa Sandi?</Link>
              </div>
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
              className="w-full h-16 neon-gradient text-background font-black text-xl glow-primary mt-4 rounded-2xl active:scale-95 transition-all shadow-2xl disabled:opacity-50 disabled:grayscale"
            >
              {isLoading ? "PROSES..." : "MASUK HUB"}
            </Button>
            
            <div className="text-center space-y-4 pt-4">
              <p className="text-xs text-muted-foreground font-medium">
                Belum punya identitas? <Link href="/register" className="text-primary font-black hover:underline uppercase tracking-tighter">Daftar Disini</Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
