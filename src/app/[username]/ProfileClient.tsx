"use client";

import { useEffect, useState, useMemo } from 'react';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, updateDoc, increment, getDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { User, Share2, MousePointer2, Link2, LayoutGrid, ChevronRight, Search, X, Instagram, Youtube, Facebook, MessageCircle, Globe, Mail, Sparkles, ExternalLink, Ghost, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import Link from 'next/link';
import { getSmartSocialUrl } from '@/lib/utils-app';

const TikTokIcon = ({ className, size = 16 }: { className?: string, size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>
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
  
  const [mounted, setMounted] = useState(false);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [allLinks, setAllLinks] = useState<any[]>([]);
  const [selectedSocial, setSelectedSocial] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const resolveUserAndTrackView = async () => {
      try {
        const userRef = doc(db, 'usernames', username.toLowerCase());
        const userSnap = await getDoc(userRef);
        let uid = userSnap.exists() ? userSnap.data().userId : null;
        if (!uid) {
          const profileRef = doc(db, 'userProfiles', username);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) uid = username;
        }

        if (uid) {
          setResolvedUserId(uid);
          updateDoc(doc(db, 'userProfiles', uid), { views: increment(1) }).catch(() => {});
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsResolving(false);
      }
    };
    resolveUserAndTrackView();
  }, [db, username]);

  const profileRef = useMemoFirebase(() => resolvedUserId ? doc(db, 'userProfiles', resolvedUserId) : null, [db, resolvedUserId]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

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

    if (groups) {
      const groupUnsubs = groups.map(group => {
        return onSnapshot(collection(db, 'userProfiles', resolvedUserId, 'linkGroups', group.id, 'links'), (snap) => {
          const links = snap.docs.map(d => ({ ...d.data(), id: d.id, groupId: group.id, isStandalone: false }));
          setAllLinks(prev => {
            const others = prev.filter(l => l.groupId !== group.id);
            return [...others, ...links];
          });
        });
      });
      return () => {
        unsubStandalone();
        groupUnsubs.forEach(u => u());
      };
    }

    return () => unsubStandalone();
  }, [resolvedUserId, groups, db]);

  const newestLink = useMemo(() => {
    if (allLinks.length === 0) return null;
    return [...allLinks].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))[0];
  }, [allLinks]);

  const handleLinkClick = (linkId: string, url: string, groupId?: string) => {
    if (!resolvedUserId) return;
    const linkRef = groupId 
      ? doc(db, 'userProfiles', resolvedUserId, 'linkGroups', groupId, 'links', linkId)
      : doc(db, 'userProfiles', resolvedUserId, 'links', linkId);
    updateDoc(linkRef, { clicks: increment(1) }).catch(() => {});
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    return groups.filter(g => g.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [groups, searchQuery]);

  const filteredStandaloneLinks = useMemo(() => {
    return allLinks.filter(l => l.isStandalone && l.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [allLinks, searchQuery]);

  if (!mounted || isResolving || (resolvedUserId && isProfileLoading)) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-primary/50">Membangun Linku...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center space-y-8">
        <div className="w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary glow-primary animate-bounce">
          <Ghost size={48} />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Identitas Tidak Ditemukan</h1>
          <p className="text-sm font-medium text-white/40 max-w-xs mx-auto uppercase tracking-widest">Maaf, profil @{username} belum terdaftar di Linku.</p>
        </div>
        <Button asChild className="h-14 px-10 neon-gradient text-background font-black rounded-2xl uppercase text-[10px] tracking-[0.2em] shadow-2xl">
          <Link href="https://linku.biz.id"><Home size={16} className="mr-2" /> Kembali ke Beranda</Link>
        </Button>
      </div>
    );
  }

  const primaryColor = profile.themeColor || '#ff0000';
  const secondaryColor = profile.themeColorSecondary || '#ffea00';
  const dynamicGradient = `linear-gradient(-45deg, ${primaryColor} 0%, ${secondaryColor} 50%, ${primaryColor} 100%)`;

  return (
    <div 
      className="min-h-screen transition-all duration-1000 relative overflow-x-hidden"
      style={{ 
        backgroundColor: '#0a0a0a',
        backgroundImage: `radial-gradient(circle at 0% 0%, ${primaryColor}33 0%, transparent 60%), radial-gradient(circle at 100% 100%, ${secondaryColor}22 0%, transparent 60%)`
      }}
    >
      <div className="max-w-md mx-auto space-y-8 animate-in relative z-10 p-6 pb-24">
        <div className="flex justify-end">
          <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(window.location.href); toast({title: "Tersalin"}); }} className="w-12 h-12 rounded-2xl glass-card text-white">
            <Share2 size={20} />
          </Button>
        </div>

        <div className="text-center space-y-6">
          <div 
            className="mx-auto w-32 h-32 rounded-[2.5rem] p-1 shadow-2xl animate-flowing-gradient"
            style={{ backgroundImage: dynamicGradient, backgroundSize: '200% 200%', boxShadow: `0 0 50px -10px ${primaryColor}99` }}
          >
            <div className="w-full h-full rounded-[2.3rem] bg-background flex items-center justify-center overflow-hidden border-4 border-background">
              {profile.avatarUrl ? <img src={profile.avatarUrl} className="w-full h-full object-cover" alt={profile.username} /> : <User size={64} className="text-white/20" />}
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-white tracking-tighter leading-none">{profile.displayName || 'User'}</h1>
            {profile.bio && <p className="text-sm font-medium text-white/70 max-w-xs mx-auto leading-relaxed">{profile.bio}</p>}
          </div>

          {profile.socialLinks && profile.socialLinks.length > 0 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              {profile.socialLinks.map((social: any, i: number) => {
                const Icon = platformIcons[social.platform] || Globe;
                return (
                  <button 
                    key={i} 
                    onClick={() => setSelectedSocial(social)}
                    className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center text-white/60 hover:text-white transition-all hover:scale-110 border border-white/5 active:scale-95"
                  >
                    <Icon size={22} style={{ color: primaryColor }} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl" />
          <div className="relative glass-card rounded-2xl flex items-center px-4 gap-3 border border-white/10 h-14">
            <Search size={18} className="text-white/40" />
            <Input 
              placeholder="Cari koleksi atau tautan..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus-visible:ring-0 text-sm font-bold text-white placeholder:text-white/20 h-full"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-white/40 hover:text-white transition-colors">
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {!searchQuery && newestLink && (
            <div className="space-y-3">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] ml-1 flex items-center gap-2">
                <Sparkles size={12} className="animate-pulse" /> Update Terbaru
              </p>
              <button
                onClick={() => handleLinkClick(newestLink.id, newestLink.url, newestLink.groupId)}
                className="w-full p-1 rounded-[1.5rem] hover:scale-[1.02] transition-transform shadow-2xl animate-flowing-gradient relative overflow-hidden"
                style={{ backgroundImage: dynamicGradient, backgroundSize: '200% 200%' }}
              >
                <div className="absolute top-0 right-0 p-2">
                   <div className="bg-white text-background text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg">NEW</div>
                </div>
                <div className="w-full h-24 bg-black/80 backdrop-blur-2xl rounded-[1.4rem] flex items-center px-6 gap-4 border border-white/10">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shadow-xl">
                    {newestLink.imageUrl ? <img src={newestLink.imageUrl} className="w-full h-full object-cover" alt="Link" /> : <Link2 size={32} style={{ color: primaryColor }} />}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <span className="text-lg font-black text-white tracking-tight truncate block">{newestLink.title}</span>
                    <p className="text-[8px] font-black text-primary uppercase tracking-widest mt-1">
                      {newestLink.groupId ? 'Ditemukan di Koleksi' : 'Tautan Hub Utama'}
                    </p>
                  </div>
                  <MousePointer2 size={24} style={{ color: primaryColor }} />
                </div>
              </button>
            </div>
          )}

          <div className="space-y-4 pt-4 border-t border-white/5">
             <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">Koleksi Konten</p>
            {filteredGroups.map(group => (
              <Link key={group.id} href={`/${username}/g/${group.id}`} className="block">
                <div 
                  className="p-0.5 rounded-[2rem] animate-flowing-gradient transition-transform active:scale-95 shadow-xl"
                  style={{ backgroundImage: dynamicGradient, backgroundSize: '200% 200%' }}
                >
                  <div className="w-full h-24 bg-black/70 backdrop-blur-2xl rounded-[1.9rem] flex items-center px-6 gap-4 border border-white/10 relative overflow-hidden">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shadow-xl shrink-0">
                      {group.imageUrl ? <img src={group.imageUrl} className="w-full h-full object-cover" alt="Group" /> : <LayoutGrid size={32} style={{ color: primaryColor }} />}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <span className="text-lg font-black text-white tracking-tight block truncate">{group.title}</span>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">Koleksi</p>
                    </div>
                    <ChevronRight size={24} className="text-white/50" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            {(!searchQuery || filteredStandaloneLinks.length > 0) && (
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] ml-1">Tautan Mandiri</p>
            )}
            {filteredStandaloneLinks.map(link => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id, link.url)}
                className="w-full p-0.5 rounded-2xl hover:scale-[1.02] transition-transform shadow-xl animate-flowing-gradient"
                style={{ backgroundImage: dynamicGradient, backgroundSize: '200% 200%' }}
              >
                <div className="w-full h-20 bg-black/80 backdrop-blur-xl rounded-[0.95rem] flex items-center px-6 gap-4 border border-white/10">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/5">
                    {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" alt="Link" /> : <Link2 size={24} style={{ color: primaryColor }} />}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <span className="text-base font-black text-white tracking-tight truncate block">{link.title}</span>
                  </div>
                  <MousePointer2 size={20} style={{ color: primaryColor }} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {!profile.isPremium && (
          <div className="pt-12 text-center">
            <Button asChild className="w-full h-14 neon-gradient text-background font-black rounded-2xl glow-primary text-[10px] uppercase tracking-widest shadow-2xl transition-all animate-flowing-gradient" style={{ backgroundImage: dynamicGradient, backgroundSize: '200% 200%' }}>
              <Link href="https://linku.biz.id"><User size={16} className="mr-2" /> Buat Linku Kamu Sekarang</Link>
            </Button>
          </div>
        )}
      </div>

      <Dialog open={!!selectedSocial} onOpenChange={(open) => !open && setSelectedSocial(null)}>
        <DialogContent className="glass-card border-none rounded-[2.5rem] bg-background/95 backdrop-blur-3xl p-8 shadow-2xl max-w-[90%] sm:max-w-sm mx-auto overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 neon-gradient" style={{ backgroundImage: dynamicGradient }} />
          <div className="flex flex-col items-center text-center space-y-6 py-4">
            <div 
              className="w-24 h-24 rounded-[1.5rem] p-1 shadow-2xl animate-flowing-gradient"
              style={{ backgroundImage: dynamicGradient, backgroundSize: '200% 200%' }}
            >
              <div className="w-full h-full rounded-[1.3rem] bg-background flex items-center justify-center overflow-hidden border-4 border-background">
                {selectedSocial && (() => {
                  const Icon = platformIcons[selectedSocial.platform] || Globe;
                  return <Icon size={48} style={{ color: primaryColor }} />;
                })()}
              </div>
            </div>
            
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black text-white tracking-tighter uppercase">{selectedSocial?.platform}</DialogTitle>
              <p className="text-sm font-bold text-primary uppercase tracking-widest">@{selectedSocial?.label}</p>
            </div>

            <Button 
              asChild 
              className="w-full h-14 neon-gradient text-background font-black rounded-2xl glow-primary text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
              style={{ backgroundImage: dynamicGradient, backgroundSize: '200% 200%' }}
            >
              <a 
                href={selectedSocial ? getSmartSocialUrl(selectedSocial.platform, selectedSocial.label) : '#'} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Kunjungi Profil <ExternalLink size={14} className="ml-2" />
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
