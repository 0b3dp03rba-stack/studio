
"use client";

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Link2, Sparkles, LayoutGrid, ArrowRight, ShieldCheck, Zap, Globe, MousePointer2, Star, Quote, Heart } from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

// Komponen rating statis
const StaticStarRating = ({ rating, size = 14 }: { rating: number, size?: number }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star 
          key={i} 
          size={size} 
          className={i <= Math.round(rating) ? "text-primary fill-primary" : "text-white/10"} 
        />
      ))}
    </div>
  );
};

export default function LandingPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user && !isUserLoading && user.emailVerified) router.push('/dashboard');
  }, [user, isUserLoading, router]);

  // Fetch reviews for Wall of Love
  const reviewsQuery = useMemoFirebase(() => query(
    collection(db, 'platformReviews'), 
    orderBy('createdAt', 'desc'),
    limit(6)
  ), [db]);
  const { data: reviews } = useCollection(reviewsQuery);

  if (!mounted) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[140px] animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px] animate-pulse-glow" />

      <header className="fixed top-0 w-full h-20 px-6 flex items-center justify-between z-50 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center border border-white/10 shadow-xl">
            <Link2 size={24} className="text-primary" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white">Linku</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">Log In</Link>
          <Button asChild className="neon-gradient text-background font-black text-[10px] uppercase tracking-widest px-8 rounded-2xl h-12 shadow-2xl">
            <Link href="/register">Buat Link Gratis</Link>
          </Button>
        </div>
      </header>

      <main className="relative z-10 pt-44 pb-32 px-6 max-w-5xl mx-auto text-center space-y-32">
        {/* HERO SECTION */}
        <div className="space-y-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full animate-in">
            <Sparkles size={14} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">The Elite Link Management Platform</span>
          </div>
          
          <div className="space-y-6">
            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] animate-in" style={{ animationDelay: '0.1s' }}>
              Satu Link Untuk <br/> <span className="neon-text-pulse">Semua Jualanmu.</span>
            </h1>
            <p className="text-base md:text-xl text-white/50 max-w-2xl mx-auto font-medium leading-relaxed animate-in" style={{ animationDelay: '0.2s' }}>
              Bangun identitas digital mewah dalam 2 menit. Kelola toko, portofolio, dan media sosial dengan desain interaktif yang cerdas.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in" style={{ animationDelay: '0.3s' }}>
            <Button asChild className="h-20 px-12 neon-gradient text-background font-black text-xl rounded-[2rem] glow-primary shadow-2xl active:scale-95 transition-all">
              <Link href="/register">MULAI SEKARANG <ArrowRight className="ml-3" /></Link>
            </Button>
          </div>
        </div>

        {/* FEATURES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {[
             { t: 'Desain Tanpa Batas', d: 'Kustomisasi bentuk, warna, dan layout sesuka hati Master.', i: LayoutGrid },
             { t: 'Analitik Real-time', d: 'Pantau setiap klik dan pengunjung secara instan dari dashboard.', i: MousePointer2 },
             { t: 'Domain Kustom', d: 'Gunakan domain pribadi Anda untuk branding yang lebih profesional.', i: Globe },
           ].map((f, i) => (
             <div key={i} className="glass-card p-10 rounded-[3rem] text-left space-y-6 animate-in" style={{ animationDelay: `${0.4 + (i*0.1)}s` }}>
                <div className="w-16 h-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center text-primary border border-primary/20"><f.i size={32} /></div>
                <div className="space-y-2">
                   <h3 className="text-xl font-black text-white uppercase tracking-tight">{f.t}</h3>
                   <p className="text-sm text-white/40 font-medium leading-relaxed">{f.d}</p>
                </div>
             </div>
           ))}
        </div>

        {/* WALL OF LOVE SECTION */}
        {reviews && reviews.length > 0 && (
          <section className="space-y-16 animate-in">
             <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
                   <Heart size={12} className="text-primary fill-primary" />
                   <span className="text-[10px] font-black uppercase text-primary tracking-widest">Wall of Love</span>
                </div>
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Dipercaya Ribuan Master</h2>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {reviews.map((review) => (
                  <div key={review.id} className="glass-card p-6 rounded-[2.5rem] text-left space-y-4 relative shadow-2xl group hover:bg-white/[0.05] transition-all">
                     <Quote className="absolute top-6 right-6 text-primary/10 w-10 h-10" />
                     <div className="flex items-center gap-4">
                        <Avatar className="w-10 h-10 border border-primary/20">
                          <AvatarImage src={review.avatarUrl} />
                          <AvatarFallback className="bg-primary/10 text-primary font-black uppercase text-[10px]">{review.username?.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                           <p className="text-[11px] font-black text-white uppercase tracking-tight">{review.displayName || review.username}</p>
                           <StaticStarRating rating={review.rating} />
                        </div>
                     </div>
                     <p className="text-xs text-white/70 font-medium leading-relaxed italic">
                        "{review.comment}"
                     </p>
                  </div>
                ))}
             </div>

             <Button asChild variant="ghost" className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 hover:text-primary">
                <Link href="/reviews">Lihat Semua Kesaksian Master <ArrowRight size={12} className="ml-2" /></Link>
             </Button>
          </section>
        )}

        {/* PRICING PREVIEW */}
        <section className="glass-card p-12 rounded-[4rem] border-primary/10 shadow-[0_0_100px_-20px_rgba(255,0,0,0.1)]">
           <div className="space-y-12">
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Identity Investment</h2>
              <div className="grid md:grid-cols-2 gap-8 text-left">
                 <div className="bg-white/5 p-8 rounded-[2.5rem] space-y-6">
                    <h4 className="font-black text-white/40 uppercase text-xs tracking-widest">FREE PLAN</h4>
                    <p className="text-5xl font-black text-white tracking-tighter">Rp 0</p>
                    <ul className="space-y-4">
                       <li className="flex items-center gap-3 text-xs font-bold text-white/60"><ShieldCheck size={16} className="text-white/20" /> Unlimited Links</li>
                       <li className="flex items-center gap-3 text-xs font-bold text-white/60"><ShieldCheck size={16} className="text-white/20" /> Standard Theme</li>
                    </ul>
                 </div>
                 <div className="neon-gradient p-8 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-20"><Zap size={80} /></div>
                    <h4 className="font-black text-background/60 uppercase text-xs tracking-widest">PRO LICENSE</h4>
                    <p className="text-5xl font-black text-background tracking-tighter">Lifetime</p>
                    <ul className="space-y-4">
                       <li className="flex items-center gap-3 text-xs font-black text-background"><Zap size={16} /> Custom Domain API</li>
                       <li className="flex items-center gap-3 text-xs font-black text-background"><Zap size={16} /> No Linku Watermark</li>
                       <li className="flex items-center gap-3 text-xs font-black text-background"><Zap size={16} /> Advanced Analytics</li>
                    </ul>
                 </div>
              </div>
           </div>
        </section>
      </main>

      <footer className="py-24 text-center border-t border-white/5">
        <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white/20">&copy; {new Date().getFullYear()} Linku Secure Engine &bull; Premium Identity</p>
      </footer>
    </div>
  );
}
