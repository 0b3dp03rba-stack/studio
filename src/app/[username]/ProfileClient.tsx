
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, updateDoc, increment, getDoc, query, orderBy, onSnapshot, where, limit, getDocs, collectionGroup } from 'firebase/firestore';
import { User, Share2, MousePointer2, Link2, LayoutGrid, ChevronRight, Search, Instagram, Youtube, Facebook, MessageCircle, Globe, Mail, Sparkles, ExternalLink, Ghost, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ProfileClient({ username }: { username: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [allLinks, setAllLinks] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    const resolveUser = async () => {
      try {
        let uid = null;
        if (username.startsWith('d:')) {
          const domain = username.replace('d:', '');
          const q = query(collection(db, 'userProfiles'), where('customDomain', '==', domain), limit(1));
          const snap = await getDocs(q);
          if (!snap.empty) uid = snap.docs[0].id;
        } else {
          const cleanUsername = username.replace('u:', '').toLowerCase();
          const userRef = doc(db, 'usernames', cleanUsername);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) uid = userSnap.data().userId;
        }
        if (uid) {
          setResolvedUserId(uid);
          updateDoc(doc(db, 'userProfiles', uid), { views: increment(1) }).catch(() => {});
        }
      } catch (e) { console.error(e); } finally { setIsResolving(false); }
    };
    resolveUser();
  }, [db, username]);

  const profileRef = useMemoFirebase(() => resolvedUserId ? doc(db, 'userProfiles', resolvedUserId) : null, [db, resolvedUserId]);
  const { data: profile } = useDoc(profileRef);

  // SPOTLIGHT (TAUTAN TERBARU LINTAS FOLDER)
  const spotlightQuery = useMemoFirebase(() => {
    if (!resolvedUserId) return null;
    return query(collectionGroup(db, 'links'), where('userId', '==', resolvedUserId), orderBy('createdAt', 'desc'), limit(1));
  }, [db, resolvedUserId]);
  const { data: spotlightLinks } = useCollection(spotlightQuery);
  const latestLink = spotlightLinks?.[0];

  const groupsQuery = useMemoFirebase(() => {
    if (!resolvedUserId) return null;
    return query(collection(db, 'userProfiles', resolvedUserId, 'linkGroups'), orderBy('order', 'asc'));
  }, [db, resolvedUserId]);
  const { data: groups } = useCollection(groupsQuery);

  useEffect(() => {
    if (!resolvedUserId) return;
    const unsubStandalone = onSnapshot(collection(db, 'userProfiles', resolvedUserId, 'links'), (snap) => {
      const links = snap.docs.map(d => ({ ...d.data(), id: d.id, isStandalone: true }));
      setAllLinks(prev => {
        const others = prev.filter(l => !l.isStandalone);
        return [...others, ...links];
      });
    });
    return () => unsubStandalone();
  }, [resolvedUserId, db]);

  if (!mounted || isResolving) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  if (!profile) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center space-y-8">
      <div className="w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary glow-primary animate-bounce"><Ghost size={48} /></div>
      <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Profil Tidak Ada</h1>
      <Button asChild className="neon-gradient text-background font-black rounded-2xl"><Link href="/"><Home size={16} className="mr-2" /> Ke Beranda</Link></Button>
    </div>
  );

  const primaryColor = profile.themeColor || '#ff0000';
  const secondaryColor = profile.themeColorSecondary || '#ffea00';
  const isMinimal = profile.layout_type === 'minimal';
  const isSplit = profile.layout_type === 'split';

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-black" style={{ 
      backgroundImage: profile.wallpaperUrl ? `url(${profile.wallpaperUrl})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      {/* OVERLAY WALLPAPER AGAR TEXT TETAP TERBACA */}
      {profile.wallpaperUrl && <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />}

      {/* BANNER / COVER */}
      {profile.bannerUrl && (
        <div className="absolute top-0 left-0 w-full h-64 overflow-hidden z-0">
           <img src={profile.bannerUrl} className="w-full h-full object-cover opacity-80" alt="Cover" />
           <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0a]" />
        </div>
      )}

      <div className={cn("max-w-md mx-auto relative z-10 p-6 pb-24", isMinimal ? "pt-12" : "pt-24")}>
        <div className="flex justify-end mb-4">
           <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(window.location.href); toast({title: "Link Tersalin"}); }} className="glass-card text-white rounded-2xl border-white/10"><Share2 size={20} /></Button>
        </div>

        <div className={cn("text-center space-y-6", isMinimal && "flex items-center gap-4 text-left space-y-0")}>
           <div className={cn(
             "mx-auto p-1 shadow-2xl animate-flowing-gradient relative",
             profile.profile_shape === 'circle' ? "w-32 h-32 rounded-full" : 
             profile.profile_shape === 'hexagon' ? "w-32 h-32 [clip-path:polygon(25%_0%,75%_0%,100%_50%,75%_100%,25%_100%,0%_50%)]" :
             profile.profile_shape === 'rounded' ? "w-32 h-32 rounded-[2.5rem]" : "w-32 h-32 rounded-none",
             isMinimal && "mx-0 w-16 h-16"
           )} style={{ backgroundImage: `linear-gradient(45deg, ${primaryColor}, ${secondaryColor})` }}>
              <div className={cn("w-full h-full bg-background flex items-center justify-center overflow-hidden border-4 border-background", 
                profile.profile_shape === 'circle' ? "rounded-full" : 
                profile.profile_shape === 'hexagon' ? "[clip-path:polygon(25%_0%,75%_0%,100%_50%,75%_100%,25%_100%,0%_50%)]" :
                profile.profile_shape === 'rounded' ? "rounded-[2.3rem]" : "rounded-none"
              )}>
                 {profile.avatarUrl ? <img src={profile.avatarUrl} className="w-full h-full object-cover" alt="Avatar" /> : <User size={isMinimal ? 24 : 64} className="text-white/20" />}
              </div>
           </div>
           
           <div className="space-y-2 flex-1">
              <h1 className={cn("font-black text-white tracking-tighter uppercase leading-none", isMinimal ? "text-xl" : "text-4xl")}>{profile.displayName}</h1>
              {profile.bio && <p className="text-sm font-medium text-white/60 leading-relaxed max-w-xs mx-auto">{profile.bio}</p>}
           </div>
        </div>

        {/* SPOTLIGHT SECTION */}
        {latestLink && (
          <div className="mt-12 space-y-3">
             <div className="flex items-center gap-2 px-1">
                <Sparkles size={12} className="text-primary animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Latest Update</p>
                <div className="bg-primary px-2 py-0.5 rounded-full text-[8px] font-black text-background animate-pulse">NEW</div>
             </div>
             <button 
               onClick={() => { updateDoc(doc(db, 'userProfiles', resolvedUserId!, 'links', latestLink.id), { clicks: increment(1) }).catch(()=>{}); window.open(latestLink.url, '_blank'); }}
               className="w-full p-1 rounded-3xl animate-flowing-gradient shadow-2xl transition-transform active:scale-95"
               style={{ backgroundImage: `linear-gradient(45deg, ${primaryColor}, ${secondaryColor})` }}
             >
                <div className="w-full h-24 bg-black/80 backdrop-blur-3xl rounded-[1.4rem] flex items-center px-6 gap-4 border border-white/10">
                   <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden border border-white/10 shadow-xl shrink-0">
                      {latestLink.imageUrl ? <img src={latestLink.imageUrl} className="w-full h-full object-cover" /> : <Link2 size={24} style={{ color: primaryColor }} />}
                   </div>
                   <div className="flex-1 text-left min-w-0">
                      <span className="text-lg font-black text-white tracking-tight block truncate uppercase">{latestLink.title}</span>
                      <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Kunjungi Sekarang</p>
                   </div>
                   <ExternalLink size={20} style={{ color: primaryColor }} />
                </div>
             </button>
          </div>
        )}

        <div className="mt-12 space-y-6">
           <div className="relative glass-card rounded-2xl flex items-center px-4 gap-3 border border-white/10 h-14">
              <Search size={18} className="text-white/40" />
              <Input placeholder="Cari koleksi..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none focus-visible:ring-0 text-sm font-bold text-white placeholder:text-white/20 h-full" />
           </div>

           <div className="space-y-4">
              {groups?.filter(g => g.title.toLowerCase().includes(searchQuery.toLowerCase())).map(group => (
                <Link key={group.id} href={`${window.location.pathname}/g/${group.id}`} className="block group">
                  <div className="p-0.5 rounded-[2rem] glass-card border-white/5 hover:border-white/20 transition-all hover:scale-[1.02]">
                    <div className="w-full h-24 bg-black/40 backdrop-blur-2xl rounded-[1.9rem] flex items-center px-6 gap-4 border border-white/10">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                        {group.imageUrl ? <img src={group.imageUrl} className="w-full h-full object-cover" /> : <LayoutGrid size={32} style={{ color: primaryColor }} />}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="text-lg font-black text-white tracking-tight block truncate uppercase">{group.title}</span>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">Koleksi</p>
                      </div>
                      <ChevronRight size={24} className="text-white/20 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}

              {allLinks.filter(l => l.isStandalone && l.title.toLowerCase().includes(searchQuery.toLowerCase())).map(link => (
                <button
                  key={link.id}
                  onClick={() => { updateDoc(doc(db, 'userProfiles', resolvedUserId!, 'links', link.id), { clicks: increment(1) }).catch(()=>{}); window.open(link.url, '_blank'); }}
                  className={cn(
                    "w-full p-4 flex items-center gap-4 transition-all active:scale-95 group",
                    link.button_style === 'glassmorphism' ? "glass-card border-white/10 rounded-2xl" : 
                    link.button_style === 'outline' ? "bg-transparent border border-white/20 rounded-2xl" :
                    "bg-white/5 border border-white/5 rounded-2xl",
                    link.button_radius === 'pill' && "rounded-full",
                    link.button_radius === 'square' && "rounded-none"
                  )}
                >
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10">
                    {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" /> : <Link2 size={24} style={{ color: primaryColor }} />}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <span className="text-base font-black text-white tracking-tight truncate block uppercase">{link.title}</span>
                  </div>
                  <MousePointer2 size={20} className="text-white/10 group-hover:text-primary transition-colors" />
                </button>
              ))}
           </div>
        </div>

        {!(profile.isPremium || profile.role === 'Admin') && (
          <div className="pt-24 text-center">
             <Link href="https://linku.biz.id" className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 hover:text-primary transition-colors flex items-center justify-center gap-2">
                <Link2 size={12} /> Powered by Linku Engine
             </Link>
          </div>
        )}
      </div>
    </div>
  );
}
