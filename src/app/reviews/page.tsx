
"use client";

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Star, Quote, ChevronLeft, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

export default function AllReviewsPage() {
  const db = useFirestore();

  const reviewsQuery = useMemoFirebase(() => query(collection(db, 'platformReviews'), orderBy('createdAt', 'desc')), [db]);
  const { data: reviews, isLoading } = useCollection(reviewsQuery);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />

      <header className="fixed top-0 w-full h-20 px-6 flex items-center z-50 backdrop-blur-md border-b border-white/5">
        <Button variant="ghost" asChild className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white">
          <Link href="/"><ChevronLeft size={16} className="mr-2" /> Kembali</Link>
        </Button>
      </header>

      <main className="relative z-10 pt-32 pb-24 px-6 max-w-2xl mx-auto space-y-12 animate-in text-center">
        <div className="space-y-4">
          <div className="mx-auto w-20 h-20 rounded-[1.5rem] bg-black border border-white/10 flex items-center justify-center text-primary shadow-2xl glow-primary">
            <Star size={40} fill="currentColor" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Rating Pengguna</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">Testimonial jujur dari komunitas Linku</p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-4 animate-pulse">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Menyinkronkan data...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews?.map((review) => (
              <div key={review.id} className="glass-card p-8 rounded-[2.5rem] text-left space-y-5 relative group shadow-2xl">
                <Quote className="absolute top-8 right-8 text-primary/5 w-16 h-16" />
                <div className="flex items-center gap-5">
                  <Avatar className="w-14 h-14 border-2 border-primary/20 shadow-xl">
                    <AvatarImage src={review.avatarUrl} />
                    <AvatarFallback className="bg-primary/10 text-primary font-black uppercase text-sm">{review.username?.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-base font-black text-white uppercase tracking-tight">{review.displayName || review.username}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} className={i < review.rating ? "text-primary fill-primary" : "text-white/10"} />
                        ))}
                      </div>
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                        {review.createdAt?.seconds ? formatDistanceToNow(new Date(review.createdAt.seconds * 1000), { addSuffix: true, locale: id }) : '-'}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm md:text-base text-white/80 font-medium leading-relaxed italic">
                  "{review.comment}"
                </p>
              </div>
            ))}

            {(!reviews || reviews.length === 0) && (
              <div className="py-24 opacity-20 font-black uppercase text-[10px] tracking-[0.5em] space-y-4">
                <LayoutGrid size={48} className="mx-auto" />
                <p>Belum ada ulasan yang masuk.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-12 text-center text-[10px] font-black uppercase tracking-[0.4em] text-white/10">
        Linku Engine &bull; Transparency Hub
      </footer>
    </div>
  );
}
