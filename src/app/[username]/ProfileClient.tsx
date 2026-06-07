"use client";

import { useEffect, useState, useMemo } from 'react';
import { useDoc, useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, updateDoc, increment, getDoc, query, orderBy, onSnapshot, where, limit, getDocs, collectionGroup } from 'firebase/firestore';
import { User, Share2, MousePointer2, Link2, LayoutGrid, ChevronRight, Search, Instagram, Youtube, Facebook, MessageCircle, Globe, Mail, Sparkles, ExternalLink, Ghost, Home, AlertTriangle, Zap, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getSmartSocialUrl } from '@/lib/utils-app';

const platformIcons: Record<string, any> = {
  Instagram, YouTube: Youtube, Facebook, WhatsApp: MessageCircle, Email: Mail, Website: Globe,
  TikTok: ({ className, size = 22 }: any) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>
  )
};

export default function ProfileClient({ username }: { username: string }) {
  const db = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [standaloneLinks, setStandaloneLinks] = useState<any[]>([]);
  const [basePath, setBasePath] = useState('');

  useEffect(() => {
    setMounted(true);
    // SSR Safe: Window only available on client
    setBasePath(window.location.pathname.endsWith('/') ? window.location.pathname.slice(0, -1) : window.location.pathname);
    
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

  // SPOTLIGHT QUERY
  const spotlightQuery = useMemoFirebase(() => {
    if (!resolvedUserId) return null;
    return query(collectionGroup(db, 'links'), where('userId', '==', resolvedUserId), orderBy('createdAt', 'desc'), limit(1));
  }, [db, resolvedUserId]);
  const { data: spotlightLinks, error: spotlightError } = useCollection(spotlightQuery);
  const latestLink = spotlightLinks?.[0];

  const spotlightConfigUrl = useMemo(() => {
    if (!spotlightError) return null;
    const msg = (spotlightError as any).message || "";
    const urlMatch = msg.match(/https:\/\/console\.firebase\.google\.com[^\s]*/);
    return urlMatch ? urlMatch[0] : null;
  }, [spotlightError]);

  const groupsQuery = useMemoFirebase(() => {
    if (!resolvedUserId) return null;
    return query(collection(db, 'userProfiles', resolvedUserId, 'linkGroups'), orderBy('order', 'asc'));
  }, [db, resolvedUserId]);
  const { data: groups } = useCollection(groupsQuery);

  useEffect(() => {
    if (!resolvedUserId) return;
    const unsubStandalone = onSnapshot(collection(db, 'userProfiles', resolvedUserId, 'links'), (snap) => {
      setStandaloneLinks(snap.docs.map(d => ({ ...d.data(), id: d.id, isStandalone: true })));
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
  
  const shape = profile.profile_shape || 'rounded';
  const getShapeClass = (type: 'card' | 'search' | 'button') => {
    if (shape === 'square') return "rounded-none";
    if (shape === 'hexagon') return type === 'card' ? "rounded-[3rem]" : "rounded-full"; 
    if (shape === 'circle') return "rounded-[3rem]";
    if (shape === 'rounded') return "rounded-[2.5rem]";
    return "rounded-2xl";
  };

  const avatarClass = "rounded-[2rem]";

  const getGroupHref = (groupId: string) => {
    return `${basePath}/g/${groupId}`;
  };

  const handleLinkClick = (link: any) => {
    const isStandalone = link.isStandalone || !link.groupId;
    const linkRef = isStandalone 
      ? doc(db, 'userProfiles', resolvedUserId!, 'links', link.id)
      : doc(db, 'userProfiles', resolvedUserId!, 'linkGroups', link.groupId, 'links', link.id);
    
    updateDoc(linkRef, { clicks: increment(1) }).catch(() => {});
    window.open(link.url, '_blank');
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-[#0a0a0a]" style={{ 
      backgroundImage: profile.wallpaperUrl ? `url(${profile.wallpaperUrl})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      {profile.wallpaperUrl && <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />}

      <div className="max-w-md mx-auto relative z-10 p-4 pb-24 pt-6 space-y-8">
        <div className={cn(
          "relative glass-card border-none overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transition-all duration-500",
          getShapeClass('card'),
          "before:absolute before:inset-0 before:p-[1px] before:bg-gradient-to-br before:from-white/10 before:to-transparent before:-z-10"
        )}>
           {profile.bannerUrl ? (
             <div className="absolute inset-0 z-0">
                <img src={profile.bannerUrl} className="w-full h-full object-cover opacity-40" alt="Card Cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/95" />
             </div>
           ) : (
             <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 z-0" />
           )}

           <div className="relative z-10 p-8">
              {profile.layout_type === 'split' ? (
                <div className="flex justify-between items-start gap-4">
                   <div className="flex flex-col gap-6 flex-1 min-w-0 text-left">
                      <div className={cn("p-1 shadow-2xl animate-flowing-gradient shrink-0 w-24 h-24", avatarClass)} style={{ backgroundImage: `linear-gradient(45deg, ${primaryColor}, ${secondaryColor})` }}>
                         <div className={cn("w-full h-full bg-background flex items-center justify-center overflow-hidden border-4 border-background", avatarClass)}>
                            {profile.avatarUrl ? <img src={profile.avatarUrl} className="w-full h-full object-cover" alt="Avatar" /> : <User size={40} className="text-white/20" />}
                         </div>
                      </div>
                      <div className="space-y-1">
                         <h1 className="text-2xl font-black text-white tracking-tighter uppercase leading-tight">{profile.displayName}</h1>
                         {profile.bio && <p className="text-[10px] font-bold text-white/50 leading-relaxed uppercase tracking-widest line-clamp-3">{profile.bio}</p>}
                      </div>
                   </div>
                   <div className="flex flex-col items-end gap-6 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(window.location.href); toast({title: "Link Tersalin"}); }} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-all">
                        <Share2 size={22} />
                      </Button>
                      {profile.socialLinks?.length > 0 && (
                        <div className="flex flex-col gap-4">
                           {profile.socialLinks.map((social: any, i: number) => {
                             const Icon = platformIcons[social.platform] || Globe;
                             return (
                               <a key={i} href={getSmartSocialUrl(social.platform, social.label)} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-primary transition-all">
                                 <Icon size={22} />
                               </a>
                             );
                           })}
                        </div>
                      )}
                   </div>
                </div>
              ) : profile.layout_type === 'minimal' ? (
                <div className="flex items-center gap-6">
                   <div className={cn("p-0.5 shadow-xl w-20 h-20 shrink-0", avatarClass)} style={{ backgroundColor: primaryColor }}>
                         <div className={cn("w-full h-full bg-background flex items-center justify-center overflow-hidden border-2 border-background", avatarClass)}>
                            {profile.avatarUrl ? <img src={profile.avatarUrl} className="w-full h-full object-cover" alt="Avatar" /> : <User size={32} className="text-white/20" />}
                         </div>
                   </div>
                   <div className="flex-1 min-w-0 text-left space-y-3">
                      <div>
                         <h1 className="text-xl font-black text-white tracking-widest uppercase truncate">{profile.displayName}</h1>
                         {profile.bio && <p className="text-[8px] font-bold text-white/40 uppercase tracking-[0.2em] truncate">{profile.bio}</p>}
                      </div>
                      <div className="flex gap-4">
                         {profile.socialLinks?.slice(0, 5).map((social: any, i: number) => {
                           const Icon = platformIcons[social.platform] || Globe;
                           return (
                             <a key={i} href={getSmartSocialUrl(social.platform, social.label)} target="_blank" rel="noreferrer" className="text-white/20 hover:text-primary transition-colors">
                               <Icon size={22} />
                             </a>
                           );
                         })}
                      </div>
                   </div>
                   <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(window.location.href); toast({title: "Link Tersalin"}); }} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white/40 shrink-0">
                      <Share2 size={20} />
                   </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                   <div className="absolute top-6 right-6">
                      <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(window.location.href); toast({title: "Link Tersalin"}); }} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all shadow-xl">
                        <Share2 size={22} />
                      </Button>
                   </div>
                   <div className={cn("p-1 shadow-2xl animate-flowing-gradient mb-6 w-28 h-28", avatarClass)} style={{ backgroundImage: `linear-gradient(45deg, ${primaryColor}, ${secondaryColor})` }}>
                     <div className={cn("w-full h-full bg-background flex items-center justify-center overflow-hidden border-4 border-background", avatarClass)}>
                        {profile.avatarUrl ? <img src={profile.avatarUrl} className="w-full h-full object-cover" alt="Avatar" /> : <User size={48} className="text-white/20" />}
                     </div>
                  </div>
                  <div className="space-y-2">
                     <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">{profile.displayName}</h1>
                     {profile.bio && <p className="text-[10px] font-bold text-white/60 leading-relaxed max-w-[240px] mx-auto uppercase tracking-widest">{profile.bio}</p>}
                  </div>
                  {profile.socialLinks?.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-5 mt-8 pt-6 border-t border-white/5 w-full">
                      {profile.socialLinks.map((social: any, i: number) => {
                        const Icon = platformIcons[social.platform] || Globe;
                        return (
                          <a key={i} href={getSmartSocialUrl(social.platform, social.label)} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-primary transition-all">
                            <Icon size={22} />
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
           </div>
        </div>

        {spotlightConfigUrl && (
          <Card className="p-6 border-2 border-primary/30 bg-primary/10 rounded-[2.5rem] shadow-[0_0_50px_-10px_rgba(255,0,0,0.4)] animate-in zoom-in-95">
             <div className="flex items-center gap-4 text-primary">
                <Zap size={28} className="animate-bounce" />
                <div className="flex-1">
                   <p className="text-[11px] font-black uppercase tracking-widest">Setup Spotlight Diperlukan</p>
                   <p className="text-[8px] font-bold opacity-70 uppercase mt-0.5">Aktifkan Index agar fitur 'NEW' muncul otomatis.</p>
                </div>
             </div>
             <Button asChild className="w-full mt-5 h-14 neon-gradient text-background font-black rounded-2xl text-[10px] tracking-widest shadow-2xl active:scale-95 transition-all">
                <a href={spotlightConfigUrl} target="_blank" rel="noreferrer">KONFIGURASI OTOMATIS SEKARANG</a>
             </Button>
          </Card>
        )}

        {latestLink && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-1000">
             <div className="flex items-center gap-2 px-4">
                <Sparkles size={14} className="text-primary animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Latest Update</p>
                <div className="bg-primary px-2 py-0.5 rounded-full text-[8px] font-black text-background animate-pulse">NEW</div>
             </div>
             <button 
               onClick={() => handleLinkClick(latestLink)}
               className={cn("w-full p-1 animate-flowing-gradient shadow-2xl transition-transform active:scale-95", getShapeClass('card'))}
               style={{ backgroundImage: `linear-gradient(45deg, ${primaryColor}, ${secondaryColor})` }}
             >
                <div className={cn("w-full h-24 bg-black/80 backdrop-blur-3xl flex items-center px-6 gap-4 border border-white/10", getShapeClass('card'))}>
                   <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden border border-white/10 shadow-xl shrink-0">
                      {latestLink.imageUrl ? <img src={latestLink.imageUrl} className="w-full h-full object-cover" alt={latestLink.title} /> : <LinkIcon size={24} style={{ color: primaryColor }} />}
                   </div>
                   <div className="flex-1 text-left min-w-0">
                      <span className="text-lg font-black text-white tracking-tight block truncate uppercase">{latestLink.title}</span>
                      <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Visit Now</p>
                   </div>
                   <ExternalLink size={20} style={{ color: primaryColor }} />
                </div>
             </button>
          </div>
        )}

        <div className="space-y-6">
           <div className={cn("relative glass-card flex items-center px-6 gap-3 border border-white/10 h-14 mx-1", getShapeClass('search'))}>
              <Search size={18} className="text-white/40" />
              <Input placeholder="Search collections..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none focus-visible:ring-0 text-sm font-bold text-white placeholder:text-white/20 h-full" />
           </div>

           <div className="space-y-4">
              {groups?.filter(g => g.title.toLowerCase().includes(searchQuery.toLowerCase())).map(group => (
                <Link key={group.id} href={getGroupHref(group.id)} className="block group px-1">
                  <div className={cn("p-0.5 glass-card border-white/5 hover:border-white/20 transition-all hover:scale-[1.02] shadow-xl", getShapeClass('card'))}>
                    <div className={cn("w-full h-24 bg-black/40 backdrop-blur-2xl flex items-center px-6 gap-4 border border-white/10", getShapeClass('card'))}>
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                        {group.imageUrl ? <img src={group.imageUrl} className="w-full h-full object-cover" alt={group.title} /> : <LayoutGrid size={32} style={{ color: primaryColor }} />}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="text-lg font-black text-white tracking-tight block truncate uppercase">{group.title}</span>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">Collection</p>
                      </div>
                      <ChevronRight size={24} className="text-white/20 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}

              {standaloneLinks.filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase())).map(link => (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link)}
                  className={cn(
                    "w-full p-5 flex items-center gap-4 transition-all active:scale-95 group shadow-lg mx-1",
                    getShapeClass('button'),
                    link.button_style === 'glassmorphism' ? "glass-card border-white/10" : 
                    link.button_style === 'outline' ? "bg-transparent border-2 border-white/20" :
                    "bg-white/5 border border-white/5"
                  )}
                >
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10">
                    {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" alt={link.title} /> : <LinkIcon size={24} style={{ color: primaryColor }} />}
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
             <Link href="/" className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 hover:text-primary transition-colors flex items-center justify-center gap-2">
                <LinkIcon size={12} /> Powered by Linku Engine
             </Link>
          </div>
        )}
      </div>
    </div>
  );
}
