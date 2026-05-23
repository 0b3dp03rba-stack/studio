
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MousePointer2, Eye, Star, TrendingUp, Sparkles, LayoutGrid, ArrowRight } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, setDoc, doc, serverTimestamp, increment, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Bar, BarChart, XAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isRatingSaving, setIsRatingSaving] = useState(false);
  const [allLinks, setAllLinks] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  // Solusi Hydration: useEffect memastikan render di client baru menampilkan data dinamis
  useEffect(() => {
    setMounted(true);
  }, []);

  const profileRef = useMemoFirebase(() => user ? doc(db, 'userProfiles', user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const userReviewRef = useMemoFirebase(() => user ? doc(db, 'platformReviews', user.uid) : null, [db, user?.uid]);
  const { data: userReview } = useDoc(userReviewRef);

  useEffect(() => {
    if (userReview) {
      setRating(userReview.rating);
      setComment(userReview.comment);
    }
  }, [userReview]);

  useEffect(() => {
    if (!user || !mounted) return;

    const unsubStandalone = onSnapshot(collection(db, 'userProfiles', user.uid, 'links'), (snap) => {
      const standalone = snap.docs.map(d => ({ ...d.data(), id: d.id, isStandalone: true }));
      setAllLinks(prev => {
        const others = prev.filter(l => !l.isStandalone);
        return [...others, ...standalone];
      });
    });

    const unsubGroups = onSnapshot(collection(db, 'userProfiles', user.uid, 'linkGroups'), (snap) => {
      snap.docs.forEach(groupDoc => {
        onSnapshot(collection(db, 'userProfiles', user!.uid, 'linkGroups', groupDoc.id, 'links'), (linkSnap) => {
          const grouped = linkSnap.docs.map(d => ({ ...d.data(), id: d.id, isStandalone: false, groupId: groupDoc.id }));
          setAllLinks(prev => {
            const others = prev.filter(l => l.groupId !== groupDoc.id);
            return [...others, ...grouped];
          });
        });
      });
    });

    return () => {
      unsubStandalone();
      unsubGroups();
    };
  }, [user, db, mounted]);

  const topPerformers = useMemo(() => {
    return [...allLinks]
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, 4)
      .map(l => ({
        name: l.title.length > 8 ? l.title.slice(0, 8) + '..' : l.title,
        clicks: l.clicks || 0,
        fullTitle: l.title
      }));
  }, [allLinks]);

  const totalClicks = useMemo(() => {
    return allLinks.reduce((acc, curr) => acc + (curr.clicks || 0), 0);
  }, [allLinks]);

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

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-none animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-primary/50">Syncing Hub...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in pb-12">
      <div className="space-y-1">
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase">Overview</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">Real-time Performance</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card border-none rounded-none p-5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-none -mr-8 -mt-8 blur-2xl group-hover:bg-primary/20 transition-colors" />
          <CardContent className="p-0 space-y-3 relative z-10">
            <div className="w-10 h-10 rounded-none bg-primary/20 flex items-center justify-center text-primary glow-primary">
              <MousePointer2 size={20} />
            </div>
            <div>
              <p className="text-3xl font-black tracking-tighter">{totalClicks}</p>
              <p className="text-[8px] font-black uppercase text-white/40 tracking-widest">Total Link Clicks</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-none rounded-none p-5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-none -mr-8 -mt-8 blur-2xl group-hover:bg-secondary/20 transition-colors" />
          <CardContent className="p-0 space-y-3 relative z-10">
            <div className="w-10 h-10 rounded-none bg-secondary/20 flex items-center justify-center text-secondary">
              <Eye size={20} />
            </div>
            <div>
              <p className="text-3xl font-black tracking-tighter">{profile?.views || 0}</p>
              <p className="text-[8px] font-black uppercase text-white/40 tracking-widest">Profile Views</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-none rounded-none p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-none neon-gradient flex items-center justify-center text-background">
               <TrendingUp size={16} />
             </div>
             <h3 className="font-black text-xs uppercase tracking-widest">Top Performers</h3>
          </div>
          <Button variant="ghost" asChild className="text-[9px] font-black uppercase text-primary tracking-widest h-8 px-2 hover:bg-primary/10">
            <Link href="/dashboard/manage">Lihat Semua <ArrowRight size={10} className="ml-1" /></Link>
          </Button>
        </div>

        {allLinks.length > 0 ? (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPerformers}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#888', fontSize: 10, fontWeight: 900}} 
                />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-black/90 border border-white/10 p-2 rounded-none backdrop-blur-xl">
                          <p className="text-[10px] font-black text-white uppercase">{payload[0].payload.fullTitle}</p>
                          <p className="text-xs font-bold text-primary">{payload[0].value} Clicks</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="clicks" radius={[0, 0, 0, 0]} strokeWidth={1} stroke="rgba(255,255,255,0.1)">
                  {topPerformers.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.15)'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-12 text-center opacity-20 font-black uppercase text-[10px] tracking-widest flex flex-col items-center gap-4">
            <LayoutGrid size={40} />
            <span>No interaction data yet.</span>
          </div>
        )}
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-white/50 flex items-center gap-2">
            <Sparkles size={16} className="text-primary" /> Community Love
          </h3>
          <Button variant="ghost" asChild className="text-[9px] font-black uppercase text-white/30 tracking-widest h-8 px-2 hover:text-white">
            <Link href="/reviews">Lihat Semua <ArrowRight size={10} className="ml-1" /></Link>
          </Button>
        </div>
        
        <Card className="glass-card border-none rounded-none p-6 shadow-2xl text-left">
          <CardContent className="p-0 space-y-5">
            <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
              <Star size={16} />
              <span>How was your experience?</span>
            </div>
            <div className="flex justify-center gap-3 py-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)} className={`transition-all hover:scale-110 active:scale-95 ${rating >= s ? 'text-primary' : 'text-white/10'}`}>
                  <Star size={36} fill={rating >= s ? "currentColor" : "none"} strokeWidth={3} />
                </button>
              ))}
            </div>
            <Textarea 
              placeholder="Your honest review..." 
              value={comment} 
              onChange={(e) => setComment(e.target.value)}
              className="bg-white/5 border-white/5 h-28 rounded-none p-4 text-xs font-medium leading-relaxed border-none focus-visible:ring-primary/20"
            />
            <Button onClick={handleSaveRating} disabled={isRatingSaving || rating === 0 || !comment} className="w-full h-14 neon-gradient text-background font-black rounded-none glow-primary uppercase text-[10px] tracking-widest">
              {isRatingSaving ? "PROCESSING..." : (userReview ? "UPDATE REVIEW" : "SEND TESTIMONIAL")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
