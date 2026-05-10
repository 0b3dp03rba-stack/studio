
"use client";

import { useMemo, useEffect, useState } from 'react';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, updateDoc, increment, getDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { User, Share2, MousePointer2, Link2, ChevronRight, LayoutGrid, ArrowLeft, Instagram, Youtube, Facebook, Mail, MessageCircle, ExternalLink, Globe, Search, X, Sparkles, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const TikTokIcon = ({ className, size = 20 }: { className?: string, size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const platformIcons: Record<string, any> = {
  Instagram: Instagram,
  YouTube: Youtube,
  TikTok: TikTokIcon,
  Facebook: Facebook,
  WhatsApp: MessageCircle,
  Email: Mail,
  Website: Globe
};

export default function ProfileClient({ username }: { username: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(true);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [selectedSocial, setSelectedSocial] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [allGroupLinks, setAllGroupLinks] = useState<any[]>([]);

  useEffect(() => {
    const resolveUser = async () => {
      try {
        const userRef = doc(db, 'usernames', username.toLowerCase());
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const uid = userSnap.data().userId;
          setResolvedUserId(uid);
          // Increment daily views
          updateDoc(doc(db, 'userProfiles', uid), { views: increment(1) }).catch(() => {});
        } else {
          const profileRef = doc(db, 'userProfiles', username);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            setResolvedUserId(username);
            updateDoc(doc(db, 'userProfiles', username), { views: increment(1) }).catch(() => {});
          }
        }
      } catch (e) {
        console.error("Resolution failed:", e);
      } finally {
        setIsResolving(false);
      }
    };
    resolveUser();
  }, [db, username]);

  const profileRef = useMemoFirebase(() => resolvedUserId ? doc(db, 'userProfiles', resolvedUserId) : null, [db, resolvedUserId]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  const groupsQuery = useMemoFirebase(() => resolvedUserId ? query(collection(db, 'userProfiles', resolvedUserId, 'linkGroups'), orderBy('order', 'asc')) : null, [db, resolvedUserId]);
  const { data: groups, isLoading: isGroupsLoading } = useCollection(groupsQuery);

  const standaloneLinksQuery = useMemoFirebase(() => resolvedUserId ? query(collection(db, 'userProfiles', resolvedUserId, 'links'), orderBy('order', 'asc')) : null, [db, resolvedUserId]);
  const { data: standaloneLinks, isLoading: isStandaloneLoading } = useCollection(standaloneLinksQuery);

  useEffect(() => {
    if (!resolvedUserId || !groups) return;

    const unsubscribes = groups.map(group => {
      return onSnapshot(collection(db, 'userProfiles', resolvedUserId, 'linkGroups', group.id, 'links'), (snapshot) => {
        const links = snapshot.docs.map(d => ({ ...d.data(), id: d.id, parentGroupId: group.id, parentGroupTitle: group.title }));
        setAllGroupLinks(prev => {
          const otherLinks = prev.filter(l => l.parentGroupId !== group.id);
          return [...otherLinks, ...links];
        });
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [resolvedUserId, groups, db]);

  const combinedLinks = useMemo(() => {
    const standalone = (standaloneLinks || []).map(l => ({ ...l, isStandalone: true }));
    const grouped = allGroupLinks.map(l => ({ ...l, isStandalone: false }));
    return [...standalone, ...grouped].sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  }, [standaloneLinks, allGroupLinks]);

  const latestLink = useMemo(() => {
    const enabled = combinedLinks.filter(l => l.isEnabled);
    return enabled.length > 0 ? enabled[0] : null;
  }, [combinedLinks]);

  const filteredCombined = useMemo(() => {
    if (!searchQuery) return [];
    return combinedLinks.filter(l => 
      l.isEnabled && l.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [combinedLinks, searchQuery]);

  const filteredStandalone = useMemo(() => {
    if (!standaloneLinks) return [];
    return standaloneLinks.filter(l => 
      l.isEnabled && 
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (!latestLink || l.id !== latestLink.id)
    );
  }, [standaloneLinks, searchQuery, latestLink]);

  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    return groups.filter(g => 
      g.isEnabled && (g.title.toLowerCase().includes(searchQuery.toLowerCase()) || searchQuery === '')
    );
  }, [groups, searchQuery]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Tersalin", description: "URL profil telah disalin." });
    }
  };

  const handleLinkClick = (linkId: string, url: string, isStandalone: boolean, groupId?: string) => {
    if (!resolvedUserId) return;
    const linkRef = isStandalone 
      ? doc(db, 'userProfiles', resolvedUserId, 'links', linkId)
      : doc(db, 'userProfiles', resolvedUserId, 'linkGroups', groupId!, 'links', linkId);
    
    updateDoc(linkRef, { clicks: increment(1) }).catch(() => {});
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const generateSocialUrl = (platform: string, label: string) => {
    const cleanLabel = label.replace('@', '');
    switch (platform) {
      case 'Instagram': return `https://instagram.com/${cleanLabel}`;
      case 'YouTube': return `https://youtube.com/@${cleanLabel}`;
      case 'TikTok': return `https://tiktok.com/@${cleanLabel}`;
      case 'Facebook': return `https://facebook.com/${cleanLabel}`;
      case 'WhatsApp': return `https://wa.me/${cleanLabel}`;
      case 'Email': return `mailto:${cleanLabel}`;
      case 'Website': return label.startsWith('http') ? label : `https://${label}`;
      default: return '#';
    }
  };

  if (isResolving || isProfileLoading || isGroupsLoading || isStandaloneLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-2xl animate-spin glow-primary"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-primary/50">Membangun Linku...</p>
      </div>
    );
  }

  if (!profile) return null;

  const primaryColor = profile.themeColor || '#ff0000';
  const secondaryColor = profile.themeColorSecondary || '#ffea00';
  const dynamicGradient = `linear-gradient(-45deg, ${primaryColor} 0%, ${secondaryColor} 50%, ${primaryColor} 100%)`;

  return (
    <div 
      className="min-h-screen transition-all duration-1000 relative overflow-x-hidden"
      style={{ 
        backgroundColor: '#0a0a0a',
        backgroundImage: `
          radial-gradient(circle at 0% 0%, ${primaryColor}33 0%, transparent 60%),
          radial-gradient(circle at 100% 100%, ${secondaryColor}22 0%, transparent 60%),
          linear-gradient(to bottom, transparent, #000 90%)
        `
      }}
    >
      <div className="max-w-md mx-auto space-y-8 animate-in relative z-10 p-6 pb-24">
        
        <div className="flex justify-between items-center">
          {activeGroupId ? (
            <Button 
              variant="ghost" 
              onClick={() => setActiveGroupId(null)}
              className="glass-card text-white hover:bg-white/10 border-none px-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
            >
              <ArrowLeft size={16} /> Kembali
            </Button>
          ) : <div className="w-10 h-10" />}
          <Button variant="ghost" size="icon" onClick={handleShare} className="w-12 h-12 rounded-2xl glass-card text-white hover:bg-white/10 border-none shadow-xl">
            <Share2 size={20} />
          </Button>
        </div>

        <div className="text-center space-y-6">
          <div 
            className="mx-auto w-32 h-32 rounded-[2.5rem] p-1 shadow-2xl transition-all duration-700 animate-flowing-gradient"
            style={{ backgroundImage: dynamicGradient, backgroundSize: '200% 200%', boxShadow: `0 0 50px -10px ${primaryColor}99` }}
          >
            <div className="w-full h-full rounded-[2.3rem] bg-background flex items-center justify-center overflow-hidden border-4 border-background relative">
              {profile.avatarUrl ? <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <User size={64} className="text-white/20" />}
            </div>
          </div>
          <div className="space-y-4 px-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-black text-white tracking-tighter leading-none">{profile.displayName || 'User'}</h1>
              {profile.bio && <p className="text-sm font-medium text-white/70 max-w-xs mx-auto leading-relaxed pt-1">{profile.bio}</p>}
            </div>
            {profile.socialLinks && profile.socialLinks.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3 pt-4">
                {profile.socialLinks.map((social: any, idx: number) => {
                  const Icon = platformIcons[social.platform] || Link2;
                  return (
                    <button key={idx} onClick={() => setSelectedSocial(social)} className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center text-white/60 hover:text-white transition-all hover:scale-110 active:scale-95 border border-white/5 shadow-xl">
                      <Icon size={22} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 animate-in">
          <div className="px-2">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-primary transition-colors" size={16} />
              <Input 
                placeholder="Cari tautan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-card bg-white/5 border-none h-12 pl-12 pr-10 rounded-2xl text-xs font-bold text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-white/20"
              />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"><X size={14} /></button>}
            </div>
          </div>

          <div className="flex items-center gap-2 px-2">
            <div className="h-px flex-1 bg-white/10" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap" style={{ color: primaryColor }}>
              {searchQuery ? 'Hasil Pencarian' : (activeGroupId ? groups?.find(g => g.id === activeGroupId)?.title : `Koleksi @${profile.username}`)}
            </h2>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="space-y-4">
            {searchQuery ? (
              <>
                {filteredCombined.map(link => (
                  <LinkItem 
                    key={link.id} 
                    link={link} 
                    onClick={() => handleLinkClick(link.id, link.url, link.isStandalone, link.parentGroupId)} 
                    primaryColor={primaryColor} 
                    dynamicGradient={dynamicGradient}
                    subTitle={link.isStandalone ? 'Tautan Langsung' : `Dalam: ${link.parentGroupTitle}`}
                  />
                ))}
                {filteredCombined.length === 0 && <div className="text-center py-20 opacity-20 font-black uppercase text-[10px] tracking-widest">Tidak ada hasil.</div>}
              </>
            ) : !activeGroupId ? (
              <>
                {latestLink && (
                  <div className="space-y-3">
                    <p className="text-[8px] font-black uppercase tracking-[0.4em] text-primary flex items-center gap-2 px-2">
                      <Sparkles size={10} /> Tautan Terbaru
                    </p>
                    <LinkItem 
                      link={latestLink} 
                      onClick={() => handleLinkClick(latestLink.id, latestLink.url, latestLink.isStandalone, latestLink.parentGroupId)} 
                      primaryColor={primaryColor} 
                      dynamicGradient={dynamicGradient}
                      subTitle={latestLink.isStandalone ? 'Tautan Langsung' : `Baru di ${latestLink.parentGroupTitle}`}
                      featured
                    />
                  </div>
                )}

                {filteredStandalone.map(link => (
                  <LinkItem 
                    key={link.id} 
                    link={link} 
                    onClick={() => handleLinkClick(link.id, link.url, true)} 
                    primaryColor={primaryColor} 
                    dynamicGradient={dynamicGradient}
                    subTitle="Tautan Langsung"
                  />
                ))}

                {filteredGroups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => setActiveGroupId(group.id)}
                    className="w-full p-0.5 rounded-2xl hover:scale-[1.02] transition-transform shadow-xl group/folder animate-flowing-gradient"
                    style={{ backgroundImage: dynamicGradient, backgroundSize: '200% 200%' }}
                  >
                    <div className="w-full h-24 bg-black/70 backdrop-blur-2xl rounded-[0.95rem] flex items-center px-6 gap-4 border border-white/10 relative overflow-hidden">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shadow-xl shrink-0">
                        {group.imageUrl ? <img src={group.imageUrl} className="w-full h-full object-cover" /> : <LayoutGrid size={32} style={{ color: primaryColor }} />}
                      </div>
                      <div className="flex-1 text-left">
                        <span className="text-lg font-black text-white tracking-tight">{group.title}</span>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                          Buka Kelompok <ChevronRight size={12} style={{ color: primaryColor }} />
                        </p>
                      </div>
                      <ChevronRight size={24} className="text-white/20 transition-transform group-hover/folder:translate-x-1" />
                    </div>
                  </button>
                ))}
              </>
            ) : (
              <LinksInGroup 
                userId={resolvedUserId!} 
                groupId={activeGroupId} 
                onLinkClick={handleLinkClick} 
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                username={profile.username}
                onJoinHub={() => setActiveGroupId(null)}
              />
            )}
          </div>
        </div>

        <div className="pt-12 text-center space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-2 opacity-40">
              <Link2 size={12} style={{ color: primaryColor }} />
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white">Powering with Linku Engine</p>
            </div>
            
            <Button 
              asChild
              className="w-full h-14 neon-gradient text-background font-black rounded-2xl glow-primary text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all animate-flowing-gradient"
              style={{ backgroundImage: dynamicGradient, backgroundSize: '200% 200%' }}
            >
              <Link href="/">
                <UserPlus size={16} className="mr-2" /> Bergabung dengan {profile.displayName || profile.username} di Linku
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedSocial} onOpenChange={() => setSelectedSocial(null)}>
        <DialogContent className="glass-card border-none rounded-[2.5rem] bg-background/95 backdrop-blur-3xl p-0 overflow-hidden max-w-[95%] sm:max-w-md mx-auto shadow-2xl">
          <div className="p-0 space-y-0">
            <div className="p-6 pb-2 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl flex items-center justify-center text-background" style={{ backgroundImage: dynamicGradient }}>
                   {selectedSocial && (platformIcons[selectedSocial.platform] ? (() => {
                     const Icon = platformIcons[selectedSocial.platform];
                     return <Icon size={20} />;
                   })() : <Link2 size={20} />)}
                 </div>
                 <DialogTitle className="font-black text-lg tracking-tight text-white uppercase">{profile.displayName || 'User'} Hub</DialogTitle>
              </div>
            </div>
            <div className="w-full aspect-[4/3] bg-black/40 relative overflow-hidden flex flex-col items-center justify-center gap-6 text-center p-8 animate-in">
               <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-background glow-primary transition-all duration-700 animate-flowing-gradient" style={{ backgroundImage: dynamicGradient, backgroundSize: '200% 200%' }}>
                  {selectedSocial && (platformIcons[selectedSocial.platform] ? (() => {
                    const Icon = platformIcons[selectedSocial.platform];
                    return <Icon size={40} />;
                  })() : <Link2 size={40} />)}
               </div>
               <div className="space-y-2">
                 <h3 className="text-xl font-black text-white tracking-tight uppercase">{profile.displayName || 'User'}</h3>
                 <p className="text-[11px] font-black text-white/50 uppercase tracking-widest">@{selectedSocial?.label}</p>
               </div>
            </div>
            <div className="p-6 space-y-3">
              <Button 
                className="w-full h-14 neon-gradient text-background font-black rounded-2xl glow-primary text-[10px] uppercase tracking-widest active:scale-95 transition-transform"
                style={{ backgroundImage: dynamicGradient }}
                onClick={() => {
                  const url = generateSocialUrl(selectedSocial.platform, selectedSocial.label);
                  window.open(url, '_blank', 'noopener,noreferrer');
                  setSelectedSocial(null);
                }}
              >
                Bergabung Sekarang <ExternalLink size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LinkItem({ link, onClick, primaryColor, dynamicGradient, subTitle, featured }: { link: any, onClick: () => void, primaryColor: string, dynamicGradient: string, subTitle: string, featured?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-0.5 rounded-2xl hover:scale-[1.02] transition-transform shadow-xl group/link animate-flowing-gradient ${featured ? 'glow-primary scale-[1.03]' : ''}`}
      style={{ backgroundImage: dynamicGradient, backgroundSize: '200% 200%' }}
    >
      <div className={`w-full h-20 bg-black/80 backdrop-blur-xl rounded-[0.95rem] flex items-center px-6 gap-4 border border-white/10 ${featured ? 'border-primary/40' : ''}`}>
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/5">
          {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" /> : <Link2 size={24} style={{ color: primaryColor }} />}
        </div>
        <div className="flex-1 text-left min-w-0">
          <span className="text-base font-black text-white tracking-tight truncate block">{link.title}</span>
          <p className="text-[9px] font-black uppercase text-white/30 tracking-widest mt-0.5">{subTitle}</p>
        </div>
        <MousePointer2 size={20} className="text-white/20 group-hover/link:text-primary transition-colors" style={{ color: primaryColor }} />
      </div>
    </button>
  );
}

function LinksInGroup({ userId, groupId, onLinkClick, primaryColor, secondaryColor, username, onJoinHub }: { userId: string, groupId: string, onLinkClick: any, primaryColor: string, secondaryColor: string, username: string, onJoinHub: () => void }) {
  const db = useFirestore();
  const dynamicGradient = `linear-gradient(-45deg, ${primaryColor} 0%, ${secondaryColor} 50%, ${primaryColor} 100%)`;
  
  const linksQuery = useMemoFirebase(() => query(collection(db, 'userProfiles', userId, 'linkGroups', groupId, 'links'), orderBy('createdAt', 'desc')), [db, userId, groupId]);
  const { data: links } = useCollection(linksQuery);

  return (
    <div className="grid gap-4 animate-in">
      {links?.filter(l => l.isEnabled).map(link => (
        <LinkItem 
          key={link.id} 
          link={link} 
          onClick={() => onLinkClick(link.id, link.url, false, groupId)} 
          primaryColor={primaryColor} 
          dynamicGradient={dynamicGradient}
          subTitle="Tautan Kelompok"
        />
      ))}
      {!links?.length && <div className="text-center py-20 opacity-20 font-black uppercase text-[10px] tracking-widest">Tidak ada tautan.</div>}
      
      <button 
        onClick={onJoinHub}
        className="mt-4 text-center group/join"
      >
        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] group-hover/join:text-primary transition-colors">
          Klik untuk bergabung dengan <span className="underline decoration-primary/40 underline-offset-4">@{username}</span>
        </p>
      </button>
    </div>
  );
}
