
"use client";

import { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Link2, Sparkles, LayoutGrid, Palette, ArrowRight, Star, Quote } from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export default function LandingPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const reviewsQuery = useMemoFirebase(() => query(collection(db, 'platformReviews'), orderBy('createdAt', 'desc'), limit(3)), [db]);
  const { data: reviews, isLoading: isReviewsLoading } = useCollection(reviewsQuery);

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
          <div className="space-y-2">
             <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Wall of Love</h2>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">Apa kata mereka tentang Linku</p>
          </div>

          <div className="grid gap-6 max-w-2xl mx-auto">
            {reviews?.map((review) => (
              <div key={review.id} className="glass-card p-6 rounded-[2rem] text-left space-y-4 relative group hover:scale-[1.02] transition-transform">
                <Quote className="absolute top-6 right-6 text-primary/10 w-12 h-12" />
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 border-2 border-primary/20">
                    <AvatarImage src={review.avatarUrl} />
                    <AvatarFallback className="bg-primary/10 text-primary font-black uppercase text-xs">{review.username?.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-black text-white uppercase tracking-tight">{review.displayName || review.username}</p>
                    <div className="flex gap-0.5 mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} className={i < review.rating ? "text-primary fill-primary" : "text-white/10"} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-white/70 italic font-medium leading-relaxed">"{review.comment}"</p>
              </div>
            ))}
            
            {reviews && reviews.length > 0 && (
              <div className="pt-4">
                <Button variant="ghost" asChild className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:bg-primary/10 rounded-xl px-8">
                  <Link href="/reviews">Lihat Semua Rating <ArrowRight size={14} className="ml-2" /></Link>
                </Button>
              </div>
            )}
            
            {!isReviewsLoading && (!reviews || reviews.length === 0) && (
              <p className="opacity-20 font-black uppercase text-[10px] tracking-widest">Belum ada ulasan.</p>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in" style={{ animationDelay: '0.5s' }}>
          <div className="glass-card p-6 rounded-[2rem] space-y-4">
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
              <LayoutGrid size={24} />
            </div>
            <h3 className="font-black text-white uppercase text-sm tracking-tight">Sistem Kelompok</h3>
            <p className="text-xs text-white/40 leading-relaxed font-medium">Atur tautan Anda dalam folder yang rapi dengan navigasi sub-halaman yang elegan.</p>
          </div>
          <div className="glass-card p-6 rounded-[2rem] space-y-4">
            <div className="w-12 h-12 bg-secondary/20 rounded-2xl flex items-center justify-center text-secondary">
              <Palette size={24} />
            </div>
            <h3 className="font-black text-white uppercase text-sm tracking-tight">Warna Dinamis</h3>
            <p className="text-xs text-white/40 leading-relaxed font-medium">Warna visual profil Anda akan otomatis menyesuaikan dengan foto profil yang Anda unggah.</p>
          </div>
          <div className="glass-card p-6 rounded-[2rem] space-y-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
              <Link2 size={24} />
            </div>
            <h3 className="font-black text-white uppercase text-sm tracking-tight">Domain Kustom</h3>
            <p className="text-xs text-white/40 leading-relaxed font-medium">Bagikan URL unik Anda sendiri (linku.com/username) dengan bangga ke seluruh dunia.</p>
          </div>
        </div>
      </main>

      <footer className="py-12 text-center text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
        &copy; {new Date().getFullYear()} Linku Engine &bull; Premium Experience
      </footer>
    </div>
  );
}
