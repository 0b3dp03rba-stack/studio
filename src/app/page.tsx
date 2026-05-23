
"use client";

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link2, Sparkles, LayoutGrid, Palette, ArrowRight, Star, Quote } from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, doc, increment, setDoc } from 'firebase/firestore';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const StaticStarRating = ({ rating, size = 16 }: { rating: number, size?: number }) => {
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
    const trackLandingVisit = async () => {
      try {
        const statsRef = doc(db, 'appConfig', 'globalStats');
        await setDoc(statsRef, { landingPageViews: increment(1) }, { merge: true });
      } catch (e) {
        // Silent catch
      }
    };
    trackLandingVisit();
  }, [db]);

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const reviewsQuery = useMemoFirebase(() => query(collection(db, 'platformReviews'), orderBy('createdAt', 'desc')), [db]);
  const { data: allReviews, isLoading: isReviewsLoading } = useCollection(reviewsQuery);

  const stats = useMemo(() => {
    if (!allReviews || allReviews.length === 0) return { average: 0, total: 0 };
    const sum = allReviews.reduce((acc, rev) => acc + (rev.rating || 0), 0);
    return {
      average: Number((sum / allReviews.length).toFixed(1)),
      total: allReviews.length
    };
  }, [allReviews]);

  const displayedReviews = useMemo(() => {
    return allReviews?.slice(0, 3) || [];
  }, [allReviews]);

  if (!mounted) {
    return <div className="min-h-screen bg-black" />;
  }

  if (isUserLoading || user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-2xl animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px] animate-pulse-glow" />

      <header className="fixed top-0 w-full h-20 px-6 flex items-center justify-between z-50 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="logo-box">
            <Link2 size={24} className="text-primary" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white">Linku</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white">Masuk</Link>
          <Button asChild className="neon-gradient text-background font-black text-[10px] uppercase tracking-widest px-6 rounded-xl h-10 shadow-xl">
            <Link href="/register">Daftar</Link>
          </Button>
        </div>
      </header>

      <main className="relative z-10 pt-40 pb-24 px-6 max-w-4xl mx-auto text-center space-y-24">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-4 animate-in">
            <Sparkles size={14} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Platform Manajemen Tautan Premium</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.95] animate-in" style={{ animationDelay: '0.1s' }}>
            Tampilkan Semua <br/> 
            <span className="neon-text-pulse">Dunia Anda</span> Dalam Satu Link.
          </h1>
          
          <p className="text-sm md:text-base text-white/50 max-w-lg mx-auto font-medium leading-relaxed animate-in" style={{ animationDelay: '0.2s' }}>
            Kelola portofolio, media sosial, dan bisnis online Anda dengan desain kotak melengkung modern dan warna tema otomatis yang menyesuaikan dengan foto Anda.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in" style={{ animationDelay: '0.3s' }}>
            <Button asChild className="h-16 px-10 neon-gradient text-background font-black text-lg rounded-2xl glow-primary w-full sm:w-auto shadow-2xl active:scale-95 transition-transform">
              <Link href="/register">Mulai Gratis <ArrowRight className="ml-2" /></Link>
            </Button>
            <Button variant="outline" asChild className="h-16 px-10 border-white/10 bg-white/5 text-white font-black text-lg rounded-2xl hover:bg-white/10 w-full sm:w-auto">
              <Link href="/login">Masuk Sesi</Link>
            </Button>
          </div>
        </div>

        {/* Reviews Section */}
        <section className="space-y-12 py-12 animate-in" style={{ animationDelay: '0.4s' }}>
          <div className="space-y-4">
             <div className="space-y-1 text-center">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Wall of Love</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">Apa kata mereka tentang Linku</p>
             </div>
             
             {!isReviewsLoading && stats.total > 0 && (
               <div className="flex flex-col items-center gap-2 py-4 animate-in">
                  <div className="flex items-center gap-4">
                    <span className="text-5xl font-black text-white tracking-tighter">{stats.average}</span>
                    <div className="text-left">
                      <StaticStarRating rating={stats.average} size={24} />
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Rating Komunitas</p>
                    </div>
                  </div>
               </div>
             )}
          </div>

          <div className="grid gap-6 max-w-2xl mx-auto">
            {displayedReviews.map((review) => (
              <div key={review.id} className="glass-card p-6 rounded-[2rem] text-left space-y-4 relative group hover:scale-[1.02] transition-transform">
                <Quote className="absolute top-6 right-6 text-primary/10 w-12 h-12" />
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 border-2 border-primary/20">
                    <AvatarImage src={review.avatarUrl} />
                    <AvatarFallback className="bg-primary/10 text-primary font-black uppercase text-xs">{review.username?.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-black text-white uppercase tracking-tight">{review.displayName || review.username}</p>
                    <StaticStarRating rating={review.rating} size={10} />
                  </div>
                </div>
                <p className="text-sm text-white/70 italic font-medium leading-relaxed">"{review.comment}"</p>
              </div>
            ))}
            
            <div className="pt-8 text-center">
              <Button asChild variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-primary transition-all gap-2 group">
                <Link href="/reviews">
                  Lihat Semua Ulasan <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in" style={{ animationDelay: '0.5s' }}>
          <div className="glass-card p-6 rounded-[2rem] space-y-4 text-left">
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
              <LayoutGrid size={24} />
            </div>
            <h3 className="font-black text-white uppercase text-sm tracking-tight">Sistem Kelompok</h3>
            <p className="text-xs text-white/40 leading-relaxed font-medium">Atur tautan Anda dalam folder yang rapi dengan navigasi sub-halaman yang elegan.</p>
          </div>
          <div className="glass-card p-6 rounded-[2rem] space-y-4 text-left">
            <div className="w-12 h-12 bg-secondary/20 rounded-2xl flex items-center justify-center text-secondary">
              <Palette size={24} />
            </div>
            <h3 className="font-black text-white uppercase text-sm tracking-tight">Warna Dinamis</h3>
            <p className="text-xs text-white/40 leading-relaxed font-medium">Warna visual profil Anda akan otomatis menyesuaikan dengan foto profil yang Anda unggah.</p>
          </div>
          <div className="glass-card p-6 rounded-[2rem] space-y-4 text-left">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
              <Link2 size={24} />
            </div>
            <h3 className="font-black text-white uppercase text-sm tracking-tight">Domain Kustom</h3>
            <p className="text-xs text-white/40 leading-relaxed font-medium">Bagikan URL unik Anda sendiri (linku.biz.id/username) dengan bangga ke seluruh dunia.</p>
          </div>
        </div>
      </main>

      <footer className="py-12 text-center text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
        &copy; {new Date().getFullYear()} Linku Engine &bull; Premium Experience
      </footer>
    </div>
  );
}
