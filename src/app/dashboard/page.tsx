
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MousePointer2, Eye, Star, TrendingUp, Sparkles, LayoutGrid, ArrowRight, Link as LinkIcon, Loader2, X } from 'lucide-react';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, setDoc, doc, serverTimestamp, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Bar, BarChart, XAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function DashboardPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isRatingSaving, setIsRatingSaving] = useState(false);
  const [linksMap, setLinksMap] = useState<Record<string, any>>({});
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

    const groupUnsubs: Record<string, Unsubscribe> = {};

    // 1. Ambil Link Mandiri
    const unsubStandalone = onSnapshot(collection(db, 'userProfiles', user.uid, 'links'), (snap) => {
      const standaloneData: Record<string, any> = {};
      snap.docs.forEach(d => {
        standaloneData[d.id] = { ...d.data(), id: d.id, isStandalone: true };
      });
      setLinksMap(prev => {
        const cleaned = { ...prev };
        // Hapus data standalone lama agar tidak duplikat saat refresh
        Object.keys(cleaned).forEach(key => { if(cleaned[key].isStandalone) delete cleaned[key]; });
        return { ...cleaned, ...standaloneData };
      });
    });

    // 2. Ambil Link dalam Group (Folder)
    const unsubGroupsMaster = onSnapshot(collection(db, 'userProfiles', user.uid, 'linkGroups'), (groupsSnap) => {
      const currentGroupIds = groupsSnap.docs.map(d => d.id);
      
      // Bersihkan unsub yang sudah tidak ada groupnya
      Object.keys(groupUnsubs).forEach(gid => {
        if (!currentGroupIds.includes(gid)) {
          groupUnsubs[gid]();
          delete groupUnsubs[gid];
        }
      });

      groupsSnap.docs.forEach(groupDoc => {
        if (!groupUnsubs[groupDoc.id]) {
          groupUnsubs[groupDoc.id] = onSnapshot(collection(db, 'userProfiles', user!.uid, 'linkGroups', groupDoc.id, 'links'), (linkSnap) => {
            const groupedData: Record<string, any> = {};
            linkSnap.docs.forEach(ld => {
              groupedData[ld.id] = { ...ld.data(), id: ld.id, isStandalone: false, groupId: groupDoc.id };
            });
            setLinksMap(prev => {
              const cleaned = { ...prev };
              // Hapus data lama dari group ini
              Object.keys(cleaned).forEach(key => { if(cleaned[key].groupId === groupDoc.id) delete cleaned[key]; });
              return { ...cleaned, ...groupedData };
            });
          });
        }
      });
    });

    return () => {
      unsubStandalone();
      unsubGroupsMaster();
      Object.values(groupUnsubs).forEach(u => u());
    };
  }, [user, db, mounted]);

  const allLinks = useMemo(() => {
    return Object.values(linksMap).sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
  }, [linksMap]);

  const topPerformers = useMemo(() => {
    return allLinks.slice(0, 4).map(l => ({
      name: l.title.length > 8 ? l.title.slice(0, 8) + '..' : l.title,
      clicks: Number(l.clicks || 0),
      fullTitle: l.title
    }));
  }, [allLinks]);

  const totalClicks = useMemo(() => {
    return allLinks.reduce((acc, curr) => acc + Number(curr.clicks || 0), 0);
  }, [allLinks]);

  const handleSaveRating = async () => {
    if (!user || !profile || rating === 0 || !comment.trim()) return;
    setIsRatingSaving(true);
    try {
      await setDoc(doc(db, 'platformReviews', user.uid), {
        userId: user.uid,
        username: profile.username,
        displayName: profile.displayName || profile.username,
        avatarUrl: profile.avatarUrl || '',
        rating,
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

  if (!mounted) return <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  return (
    <div className="space-y-8 animate-in pb-12">
      <div className="space-y-1">
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase">Overview</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">Real-time Performance Hub</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card border-none rounded-[2rem] p-5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -mr-8 -mt-8 blur-2xl transition-colors" />
          <CardContent className="p-0 space-y-3 relative z-10 text-left">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary glow-primary"><MousePointer2 size={20} /></div>
            <div>
              <p className="text-3xl font-black tracking-tighter text-white leading-none">{totalClicks}</p>
              <p className="text-[8px] font-black uppercase text-white/40 tracking-widest mt-1">Total Klik Tautan</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-none rounded-[2rem] p-5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-full -mr-8 -mt-8 blur-2xl transition-colors" />
          <CardContent className="p-0 space-y-3 relative z-10 text-left">
            <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary"><Eye size={20} /></div>
            <div>
              <p className="text-3xl font-black tracking-tighter text-white leading-none">{profile?.views || 0}</p>
              <p className="text-[8px] font-black uppercase text-white/40 tracking-widest mt-1">Views Profil</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-none rounded-[2rem] p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg neon-gradient flex items-center justify-center text-background shadow-xl"><TrendingUp size={16} /></div>
             <h3 className="font-black text-xs uppercase tracking-widest text-white">Top Performers</h3>
          </div>
          <Button variant="ghost" onClick={() => setShowAllClicksModal(true)} className="text-[9px] font-black uppercase text-primary tracking-widest h-8 px-2 hover:bg-primary/10">Lihat Semua <ArrowRight size={10} className="ml-1" /></Button>
        </div>

        {allLinks.length > 0 ? (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPerformers}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 10, fontWeight: 900}} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-black/90 border border-white/10 p-3 rounded-2xl backdrop-blur-3xl shadow-2xl">
                          <p className="text-[10px] font-black text-white uppercase mb-1">{payload[0].payload.fullTitle}</p>
                          <p className="text-xs font-black text-primary">{payload[0].value} KLIK</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="clicks" radius={[6, 6, 0, 0]}>
                  {topPerformers.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.15)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-12 text-center opacity-20 font-black uppercase text-[10px] tracking-widest flex flex-col items-center gap-4 border border-dashed border-white/10 rounded-[2rem]"><LayoutGrid size={40} /><span>Belum ada interaksi tautan.</span></div>
        )}
      </Card>

      <Card className="glass-card border-none rounded-[2.5rem] p-6 shadow-2xl text-left">
        <CardContent className="p-0 space-y-5">
          <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest"><Star size={16} /><span>Beri Ulasan Platform</span></div>
          <div className="flex justify-center gap-3 py-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setRating(s)} className={`transition-all hover:scale-110 active:scale-95 ${rating >= s ? 'text-primary drop-shadow-[0_0_8px_rgba(255,0,0,0.5)]' : 'text-white/10'}`}>
                <Star size={40} fill={rating >= s ? "currentColor" : "none"} strokeWidth={3} />
              </button>
            ))}
          </div>
          <Textarea placeholder="Bagikan pengalaman Anda menggunakan Linku..." value={comment} onChange={(e) => setComment(e.target.value)} className="bg-white/5 border-white/5 h-28 rounded-2xl p-4 text-xs font-bold border-none focus-visible:ring-primary/20 text-white placeholder:text-white/20" />
          <Button onClick={handleSaveRating} disabled={isRatingSaving || rating === 0 || !comment} className="w-full h-14 neon-gradient text-background font-black rounded-2xl glow-primary uppercase text-[10px] tracking-widest">{isRatingSaving ? "MEMPROSES..." : "PUBLIKASIKAN ULASAN"}</Button>
        </CardContent>
      </Card>

      <Dialog open={showAllClicksModal} onOpenChange={setShowAllClicksModal}>
        <DialogContent className="glass-card border-none rounded-[2.5rem] bg-black/95 backdrop-blur-3xl p-8 shadow-2xl max-w-[95%] sm:max-w-md mx-auto max-h-[85vh] overflow-hidden flex flex-col border-white/10">
          <DialogHeader className="mb-6 shrink-0 relative">
             <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl neon-gradient flex items-center justify-center text-background shadow-xl"><TrendingUp size={24} /></div>
               Statistik Seluruh Klik
             </DialogTitle>
             <button onClick={() => setShowAllClicksModal(false)} className="absolute top-0 right-0 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
               <X size={20} />
             </button>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
            {allLinks.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center gap-4 opacity-10">
                <LinkIcon size={48} />
                <p className="text-[10px] font-black uppercase tracking-widest">Database Kosong</p>
              </div>
            ) : allLinks.map((link) => (
                <div key={link.id} className="flex items-center gap-4 p-5 bg-white/[0.03] rounded-3xl border border-white/10 group hover:bg-white/[0.08] transition-all shadow-xl">
                  <div className="w-12 h-12 rounded-2xl bg-black border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" /> : <LinkIcon size={20} className="text-primary/50" />}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-black text-white uppercase truncate tracking-tight">{link.title}</p>
                    <p className="text-[9px] text-white/30 truncate font-mono uppercase tracking-tighter mt-0.5">{link.url.replace('https://', '')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-black text-primary tracking-tighter leading-none">{link.clicks || 0}</p>
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-1">KLIK</p>
                  </div>
                </div>
            ))}
          </div>
          
          <div className="pt-6 border-t border-white/5 mt-4">
             <Button onClick={() => setShowAllClicksModal(false)} className="w-full h-14 bg-white/5 hover:bg-white/10 text-white/60 font-black rounded-2xl uppercase text-[10px] tracking-widest transition-all">Tutup Panel Statistik</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
