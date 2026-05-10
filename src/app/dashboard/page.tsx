
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MousePointer2, Eye, Star, MessageSquareQuote, ChevronRight, TrendingUp, Sparkles } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, setDoc, doc, serverTimestamp, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils-app';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isRatingSaving, setIsRatingSaving] = useState(false);

  const profileRef = useMemoFirebase(() => user ? doc(db, 'userProfiles', user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const userReviewRef = useMemoFirebase(() => user ? doc(db, 'platformReviews', user.uid) : null, [db, user?.uid]);
  const { data: userReview } = useDoc(userReviewRef);

  // Initialize rating from existing review
  useState(() => {
    if (userReview) {
      setRating(userReview.rating);
      setComment(userReview.comment);
    }
  });

  // Stats Logic: Ambil semua link dari root links dan linkGroups sub-links
  // Note: Untuk MVP, kita tampilkan stats dari root links (Standalone)
  const standaloneLinksQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'userProfiles', user.uid, 'links'), orderBy('clicks', 'desc'), limit(10));
  }, [db, user?.uid]);
  const { data: topLinks, isLoading: isLinksLoading } = useCollection(standaloneLinksQuery);

  const chartData = useMemo(() => {
    if (!topLinks) return [];
    return topLinks.slice(0, 4).map(l => ({
      name: l.title.length > 10 ? l.title.slice(0, 10) + '...' : l.title,
      clicks: l.clicks || 0,
      fullTitle: l.title
    }));
  }, [topLinks]);

  const totalClicks = useMemo(() => {
    return topLinks?.reduce((acc, curr) => acc + (curr.clicks || 0), 0) || 0;
  }, [topLinks]);

  const handleSaveRating = async () => {
    if (!user || !profile || rating === 0 || !comment.trim()) {
      toast({ variant: "destructive", title: "Lengkapi Form", description: "Bintang dan komentar wajib diisi." });
      return;
    }
    setIsRatingSaving(true);
    try {
      await setDoc(doc(db, 'platformReviews', user.uid), {
        userId: user.uid,
        username: profile.username,
        displayName: profile.displayName || profile.username,
        avatarUrl: profile.avatarUrl || '',
        rating: rating,
        comment: comment.trim(),
        createdAt: serverTimestamp()
      }, { merge: true });
      toast({ title: "Ulasan Terkirim", description: "Terima kasih atas dukungannya!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal mengirim rating" });
    } finally {
      setIsRatingSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in pb-12">
      <div className="space-y-1">
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase">Overview</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">Ringkasan Performa Anda</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card border-none rounded-[2rem] p-5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-primary/20 transition-colors" />
          <CardContent className="p-0 space-y-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary glow-primary">
              <MousePointer2 size={20} />
            </div>
            <div>
              <p className="text-3xl font-black tracking-tighter">{totalClicks}</p>
              <p className="text-[8px] font-black uppercase text-white/40 tracking-widest">Total Klik Link</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-none rounded-[2rem] p-5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-secondary/20 transition-colors" />
          <CardContent className="p-0 space-y-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary">
              <Eye size={20} />
            </div>
            <div>
              <p className="text-3xl font-black tracking-tighter">{profile?.views || 0}</p>
              <p className="text-[8px] font-black uppercase text-white/40 tracking-widest">Kunjungan Profil</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-none rounded-[2.5rem] p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg neon-gradient flex items-center justify-center text-background">
               <TrendingUp size={16} />
             </div>
             <h3 className="font-black text-xs uppercase tracking-widest">Top Performers</h3>
          </div>
          <Button variant="ghost" size="sm" className="text-[9px] font-black text-primary uppercase tracking-widest">Details</Button>
        </div>

        {isLinksLoading ? (
          <div className="h-40 flex items-center justify-center animate-pulse opacity-20 font-black uppercase text-[10px]">Menganalisa Data...</div>
        ) : chartData.length > 0 ? (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 9, fontWeight: 900}} />
                <Bar dataKey="clicks" fill="currentColor" className="text-primary" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-12 text-center opacity-20 font-black uppercase text-[10px] tracking-widest">Belum ada data klik.</div>
        )}
      </Card>

      <div className="space-y-4">
        <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-white/50 flex items-center gap-2 px-1">
          <Sparkles size={16} className="text-primary" /> Community Love
        </h3>
        
        <Card className="glass-card border-none rounded-[2.5rem] p-6 shadow-2xl text-left">
          <CardContent className="p-0 space-y-5">
            <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
              <Star size={16} />
              <span>Bagaimana pengalaman Anda?</span>
            </div>
            <div className="flex justify-center gap-3 py-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)} className={`transition-all hover:scale-110 active:scale-95 ${rating >= s ? 'text-primary' : 'text-white/10'}`}>
                  <Star size={36} fill={rating >= s ? "currentColor" : "none"} strokeWidth={3} />
                </button>
              ))}
            </div>
            <Textarea 
              placeholder="Berikan ulasan jujur Anda..." 
              value={comment} 
              onChange={(e) => setComment(e.target.value)}
              className="bg-white/5 border-white/5 h-28 rounded-2xl p-4 text-xs font-medium leading-relaxed"
            />
            <Button onClick={handleSaveRating} disabled={isRatingSaving || rating === 0 || !comment} className="w-full h-14 neon-gradient text-background font-black rounded-2xl glow-primary uppercase text-[10px] tracking-widest">
              {isRatingSaving ? "MEMPROSES..." : (userReview ? "PERBARUI RATING" : "KIRIM Ulasan")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
