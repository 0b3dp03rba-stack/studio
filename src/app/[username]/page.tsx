
"use client";

import { use, useMemo, useEffect, useState } from 'react';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, updateDoc, increment, getDoc, query, orderBy } from 'firebase/firestore';
import { User, Share2, MousePointer2, Link2, ChevronRight, LayoutGrid, ArrowLeft, Instagram, Youtube, Facebook, Mail, MessageCircle, ExternalLink, Loader2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  Email: Mail
};

// Robust Social ID Extractor
function getSocialIdentifier(url: string, platform: string) {
  if (!url) return '';
  const cleanUrl = url.trim().replace(/\/$/, '');
  
  if (cleanUrl.startsWith('@')) return cleanUrl.replace('@', '');

  try {
    const urlObj = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`);
    const parts = urlObj.pathname.split('/').filter(p => p);
    
    if (platform === 'YouTube') {
      const channelId = parts.find(p => p.startsWith('UC'));
      if (channelId) return channelId;
      if (parts.includes('channel')) return parts[parts.indexOf('channel') + 1];
      const handle = parts.find(p => p.startsWith('@'));
      if (handle) return handle;
      return parts[0] || '';
    }
    
    if (platform === 'TikTok') {
      const handle = parts.find(p => p.startsWith('@'));
      return handle || parts[0] || '';
    }
    
    return parts[0] || '';
  } catch (e) {
    return cleanUrl.split('/').pop()?.replace('@', '') || '';
  }
}

// Widget Provider Logic
function getWidgetUrl(social: any) {
  const id = getSocialIdentifier(social.url, social.platform);
  if (!id) return null;

  switch (social.platform) {
    case 'YouTube':
      // YouTube Embed from SocialCounts
      return `https://socialcounts.org/youtube-live-subscriber-count/${id}/embed`;
    case 'TikTok':
      // TikTok Embed from Countik
      const tiktokId = id.startsWith('@') ? id : `@${id}`;
      return `https://countik.com/embed/user/${tiktokId}`;
    case 'Instagram':
      // Instagram Stat
      return `https://instastat.net/${id.replace('@', '')}`;
    default:
      return null;
  }
}

export default function PublicProfileByUsername({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const db = useFirestore();
  const { toast } = useToast();
  
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(true);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [selectedSocial, setSelectedSocial] = useState<any>(null);

  useEffect(() => {
    const resolveUser = async () => {
      try {
        const userRef = doc(db, 'usernames', username.toLowerCase());
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setResolvedUserId(userSnap.data().userId);
        } else {
          const profileRef = doc(db, 'userProfiles', username);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) setResolvedUserId(username);
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

  const standaloneLinksQuery = useMemoFirebase(() => resolvedUserId ? query(collection(db, 'userProfiles', resolvedUserId, 'links'), orderBy('createdAt', 'desc')) : null, [db, resolvedUserId]);
  const { data: standaloneLinks, isLoading: isStandaloneLoading } = useCollection(standaloneLinksQuery);

  const activeGroup = useMemo(() => groups?.find(g => g.id === activeGroupId), [groups, activeGroupId]);

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

  if (isResolving || isProfileLoading || isGroupsLoading || isStandaloneLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-2xl animate-spin glow-primary"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-primary/50">Membangun Linku...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-black text-white tracking-tighter mb-2">Profil Tidak Ditemukan</h1>
        <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Maaf, @{username} tidak terdaftar.</p>
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
        backgroundImage: `
          radial-gradient(circle at 0% 0%, ${primaryColor}33 0%, transparent 60%),
          radial-gradient(circle at 100% 100%, ${secondaryColor}22 0%, transparent 60%),
          linear-gradient(to bottom, transparent, #000 90%)
        `
      } as React.CSSProperties}
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
          ) : (
            <div className="w-10 h-10" /> 
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleShare}
            className="w-12 h-12 rounded-2xl glass-card text-white hover:bg-white/10 border-none shadow-xl"
          >
            <Share2 size={20} />
          </Button>
        </div>

        <div className="text-center space-y-6">
          <div 
            className="mx-auto w-32 h-32 rounded-[2.5rem] p-1 shadow-2xl transition-all duration-700 animate-flowing-gradient"
            style={{ 
              background: dynamicGradient,
              backgroundSize: '200% 200%',
              boxShadow: `0 0 50px -10px ${primaryColor}99`,
              animationDuration: '7s'
            }}
          >
            <div className="w-full h-full rounded-[2.3rem] bg-background flex items-center justify-center overflow-hidden border-4 border-background relative">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={64} className="text-white/20" />
              )}
            </div>
          </div>
          <div className="space-y-4 px-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-white tracking-tight leading-none">{profile.displayName || 'User'}</h1>
              <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.3em]">@{profile.username}</p>
            </div>
            {profile.bio && (
              <p className="text-sm font-medium text-white/70 max-w-xs mx-auto leading-relaxed">
                {profile.bio}
              </p>
            )}

            {profile.socialLinks && profile.socialLinks.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                {profile.socialLinks.map((social: any, idx: number) => {
                  const Icon = platformIcons[social.platform] || Link2;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedSocial(social)}
                      className="w-11 h-11 rounded-xl glass-card flex items-center justify-center text-white/60 hover:text-white transition-all hover:scale-110 active:scale-95 border border-white/5 shadow-lg"
                    >
                      <Icon size={20} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 animate-in">
          <div className="flex items-center gap-2 px-2">
            <div className="h-px flex-1 bg-white/10" />
            <h2 
              className="text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap"
              style={{ color: primaryColor }}
            >
              {activeGroupId ? activeGroup?.title : `All Link @${profile.username}`}
            </h2>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="space-y-4">
            {!activeGroupId ? (
              <>
                {standaloneLinks?.filter(l => l.isEnabled).map(link => (
                  <button
                    key={link.id}
                    onClick={() => handleLinkClick(link.id, link.url, true)}
                    className="w-full p-0.5 rounded-2xl hover:scale-[1.02] transition-transform shadow-xl group/link animate-flowing-gradient"
                    style={{ 
                      background: dynamicGradient,
                      backgroundSize: '200% 200%',
                      animationDuration: '7s'
                    }}
                  >
                    <div className="w-full h-20 bg-black/80 backdrop-blur-xl rounded-[0.95rem] flex items-center px-6 gap-4 border border-white/10">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10">
                        {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" /> : <Link2 size={24} style={{ color: primaryColor }} />}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="text-base font-black text-white tracking-tight truncate block">{link.title}</span>
                        <p className="text-[9px] font-black uppercase text-white/30 tracking-widest mt-0.5">Tautan Langsung</p>
                      </div>
                      <MousePointer2 size={20} className="text-white/20 group-hover/link:text-primary transition-colors" style={{ color: primaryColor }} />
                    </div>
                  </button>
                ))}

                {groups?.filter(g => g.isEnabled).map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setActiveGroupId(group.id)}
                    className="w-full p-0.5 rounded-2xl hover:scale-[1.02] transition-transform shadow-xl group/folder animate-flowing-gradient"
                    style={{ 
                      background: dynamicGradient,
                      backgroundSize: '200% 200%',
                      animationDuration: '7s'
                    }}
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
              />
            )}
          </div>
        </div>

        <div className="pt-12 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 opacity-40">
            <Link2 size={12} style={{ color: primaryColor }} />
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white">Powering with Linku Engine</p>
          </div>
          <Link href="/" className="block text-[10px] font-bold text-white/30 hover:text-white transition-colors uppercase tracking-widest underline underline-offset-4">
            Klik untuk bergabung dengan {profile.displayName || profile.username} di Linku
          </Link>
        </div>
      </div>

      <Dialog open={!!selectedSocial} onOpenChange={() => setSelectedSocial(null)}>
        <DialogContent className="glass-card border-none rounded-[2.5rem] bg-background/95 backdrop-blur-3xl p-0 overflow-hidden max-w-[95%] sm:max-w-md mx-auto shadow-2xl">
          <div className="p-0 space-y-0">
            <div className="p-6 pb-2 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl neon-gradient flex items-center justify-center text-background" style={{ background: dynamicGradient }}>
                   {selectedSocial && (platformIcons[selectedSocial.platform] ? (() => {
                     const Icon = platformIcons[selectedSocial.platform];
                     return <Icon size={20} />;
                   })() : <Link2 size={20} />)}
                 </div>
                 <DialogTitle className="font-black text-lg tracking-tight text-white uppercase">
                   Live {selectedSocial?.platform}
                 </DialogTitle>
              </div>
            </div>

            <div className="w-full aspect-[4/3] bg-black/60 relative overflow-hidden">
               {selectedSocial && getWidgetUrl(selectedSocial) ? (
                 <iframe 
                   src={getWidgetUrl(selectedSocial)!} 
                   className="w-full h-full border-none"
                   title="Live Counter"
                   loading="lazy"
                   referrerPolicy="no-referrer"
                   sandbox="allow-scripts allow-same-origin allow-popups"
                 />
               ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center p-8">
                   <Loader2 className="w-10 h-10 text-primary animate-spin" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Menghubungkan ke Statistik Live...</p>
                 </div>
               )}
            </div>

            <div className="p-6 space-y-3">
              <Button 
                className="w-full h-14 neon-gradient text-background font-black rounded-2xl glow-primary text-[10px] uppercase tracking-widest active:scale-95 transition-transform"
                style={{ background: dynamicGradient }}
                onClick={() => {
                  window.open(selectedSocial?.url, '_blank', 'noopener,noreferrer');
                  setSelectedSocial(null);
                }}
              >
                Kunjungi Profil {selectedSocial?.platform} <ExternalLink size={16} className="ml-2" />
              </Button>
              <p className="text-[8px] text-center text-white/30 font-black uppercase tracking-widest leading-relaxed">
                Widget memuat statistik real-time. Jika tampilan kosong, kemungkinan provider memblokir akses atau profil Anda bersifat privat.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LinksInGroup({ userId, groupId, onLinkClick, primaryColor, secondaryColor }: { userId: string, groupId: string, onLinkClick: any, primaryColor: string, secondaryColor: string }) {
  const db = useFirestore();
  const dynamicGradient = `linear-gradient(-45deg, ${primaryColor} 0%, ${secondaryColor} 50%, ${primaryColor} 100%)`;
  
  const linksQuery = useMemoFirebase(() => query(collection(db, 'userProfiles', userId, 'linkGroups', groupId, 'links'), orderBy('order', 'asc')), [db, userId, groupId]);
  const { data: links } = useCollection(linksQuery);

  return (
    <div className="grid gap-4 animate-in">
      {links?.filter(l => l.isEnabled).map(link => (
        <button
          key={link.id}
          onClick={() => onLinkClick(link.id, link.url, false, groupId)}
          className="w-full p-0.5 rounded-2xl hover:scale-[1.02] transition-transform shadow-xl group/link animate-flowing-gradient"
          style={{ 
            background: dynamicGradient,
            backgroundSize: '200% 200%',
            animationDuration: '7s'
          }}
        >
          <div className="w-full h-20 bg-black/80 backdrop-blur-xl rounded-[0.95rem] flex items-center px-6 gap-4 border border-white/10">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10">
              {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" /> : <Link2 size={24} style={{ color: primaryColor }} />}
            </div>
            <div className="flex-1 text-left min-w-0">
              <span className="text-base font-black text-white tracking-tight truncate block">{link.title}</span>
              <p className="text-[9px] font-black uppercase text-white/30 tracking-widest mt-0.5">Tautan Kelompok</p>
            </div>
            <MousePointer2 size={20} className="text-white/20 group-hover/link:text-primary transition-colors" style={{ color: primaryColor }} />
          </div>
        </button>
      ))}
      {!links?.length && (
        <div className="text-center py-20 opacity-20 font-black uppercase text-[10px] tracking-widest">Belum ada tautan di kelompok ini.</div>
      )}
    </div>
  );
}
