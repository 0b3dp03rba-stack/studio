"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MousePointer2, Eye, Star, TrendingUp, Sparkles, LayoutGrid, ArrowRight, X, Link as LinkIcon } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, setDoc, doc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Bar, BarChart, XAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function DashboardPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isRatingSaving, setIsRatingSaving] = useState(false);
  const [allLinks, setAllLinks] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showAllClicksModal, setShowAllClicksModal] = useState(false);

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

    // Real-time listener untuk standalone links
    const unsubStandalone = onSnapshot(collection(db, 'userProfiles', user.uid, 'links'), (snap) => {
      const standalone = snap.docs.map(d => ({ ...d.data(), id: d.id, isStandalone: true }));
      setAllLinks(prev => {
        const others = prev.filter(l => !l.isStandalone);
        const combined = [...others, ...standalone];
        return combined.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
      });
    });

    // Real-time listener untuk link di dalam grup
    const unsubGroups = onSnapshot(collection(db, 'userProfiles', user.uid, 'linkGroups'), (snap) => {
      snap.docs.forEach(groupDoc => {
        onSnapshot(collection(db, 'userProfiles', user!.uid, 'linkGroups', groupDoc.id, 'links'), (linkSnap) => {
          const grouped = linkSnap.docs.map(d => ({ ...d.data(), id: d.id, isStandalone: false, groupId: groupDoc.id }));
          setAllLinks(prev => {
            const others = prev.filter(l => l.groupId !== groupDoc.id);
            const combined = [...others, ...grouped];
            return combined.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
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
        clicks: Number(l.clicks || 0),
        fullTitle: l.title
      }));
  }, [allLinks]);

  const totalClicks = useMemo(() => {
    return allLinks.reduce((acc, curr) => acc + Number(curr.clicks || 0), 0);
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
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-primary/50">Mempersiapkan Hub...</p>
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
        <Card className="glass-card border-none rounded-[2rem] p-5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-primary/20 transition-colors" />
          <CardContent className="p-0 space-y-3 relative z-10 text-left">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary glow-primary">
              <MousePointer2 size={20} />
            </div>
            <div>
              <p className="text-3xl font-black tracking-tighter text-white">{totalClicks}</p>
              <p className="text-[8px] font-black uppercase text-white/40 tracking-widest">Total Klik Tautan</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-none rounded-[2rem] p-5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-secondary/20 transition-colors" />
          <CardContent className="p-0 space-y-3 relative z-10 text-left">
            <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary">
              <Eye size={20} />
            </div>
            <div>
              <p className="text-3xl font-black tracking-tighter text-white">{profile?.views || 0}</p>
              <p className="text-[8px] font-black uppercase text-white/40 tracking-widest">Views Profil</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-none rounded-[2rem] p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg neon-gradient flex items-center justify-center text-background">
               <TrendingUp size={16} />
             </div>
             <h3 className="font-black text-xs uppercase tracking-widest text-white">Top Performers</h3>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => setShowAllClicksModal(true)} 
            className="text-[9px] font-black uppercase text-primary tracking-widest h-8 px-2 hover:bg-primary/10"
          >
            Lihat Semua <ArrowRight size={10} className="ml-1" />
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
                        <div className="bg-black/90 border border-white/10 p-2 rounded-xl backdrop-blur-xl">
                          <p className="text-[10px] font-black text-white uppercase">{payload[0].payload.fullTitle}</p>
                          <p className="text-xs font-bold text-primary">{payload[0].value} Klik</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="clicks" radius={[4, 4, 0, 0]} strokeWidth={1} stroke="rgba(255,255,255,0.1)">
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
            <span>Belum ada data interaksi.</span>
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
              className="bg-white/5 border-white/5 h-28 rounded-2xl p-4 text-xs font-medium leading-relaxed border-none focus-visible:ring-primary/20 text-white"
            />
            <Button onClick={handleSaveRating} disabled={isRatingSaving || rating === 0 || !comment} className="w-full h-14 neon-gradient text-background font-black rounded-2xl glow-primary uppercase text-[10px] tracking-widest">
              {isRatingSaving ? "MEMPROSES..." : (userReview ? "UPDATE ULASAN" : "KIRIM TESTIMONI")}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAllClicksModal} onOpenChange={setShowAllClicksModal}>
        <DialogContent className="glass-card border-none rounded-[2.5rem] bg-black/95 backdrop-blur-3xl p-6 shadow-2xl max-w-[95%] sm:max-w-md mx-auto max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="mb-4 shrink-0">
            <DialogTitle className="text-xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
              <TrendingUp size={20} className="text-primary" /> Statistik Klik
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
            {allLinks.length === 0 ? (
              <p className="text-center py-20 text-[10px] font-black uppercase text-white/20 tracking-widest">Belum ada data tautan.</p>
            ) : (
              allLinks.map((link) => (
                <div key={link.id} className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 group hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                    {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" /> : <LinkIcon size={18} className="text-primary/50" />}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-black text-white uppercase truncate tracking-tight">{link.title}</p>
                    <p className="text-[8px] text-white/40 truncate font-mono uppercase tracking-tighter">{link.url}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-primary tracking-tighter leading-none">{link.clicks || 0}</p>
                    <p className="text-[7px] font-bold text-white/20 uppercase tracking-widest">KLIK</p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <Button 
            onClick={() => setShowAllClicksModal(false)} 
            variant="ghost" 
            className="w-full mt-4 h-12 text-[10px] font-black uppercase text-white/40 hover:text-white shrink-0"
          >
            Tutup Panel
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}