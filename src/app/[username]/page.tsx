
"use client";

import { use, useMemo, useEffect, useState } from 'react';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, updateDoc, increment, getDoc, query, orderBy } from 'firebase/firestore';
import { User, Share2, MousePointer2, Link2, ChevronRight, LayoutGrid, ArrowLeft, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function PublicProfileByUsername({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const db = useFirestore();
  const { toast } = useToast();
  
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(true);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

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
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Tersalin", description: "URL profil telah disalin." });
  };

  const handleLinkClick = async (linkId: string, url: string, isStandalone: boolean, groupId?: string) => {
    if (!resolvedUserId) return;
    const linkRef = isStandalone 
      ? doc(db, 'userProfiles', resolvedUserId, 'links', linkId)
      : doc(db, 'userProfiles', resolvedUserId, 'linkGroups', groupId!, 'links', linkId);
    
    updateDoc(linkRef, { clicks: increment(1) });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (isResolving || isProfileLoading || isGroupsLoading || isStandaloneLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-2xl animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-primary/50">Membangun Profil...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-black text-white tracking-tighter mb-2">Profil Tidak Ditemukan</h1>
        <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Maaf, username "@{username}" tidak terdaftar.</p>
      </div>
    );
  }

  const primaryColor = profile.themeColor || '#ff0000';
  const secondaryColor = profile.themeColorSecondary || '#ffea00';

  return (
    <div 
      className="min-h-screen bg-background p-6 pb-24 transition-colors duration-1000 relative"
      style={{ 
        backgroundImage: `radial-gradient(circle at top, ${primaryColor}44, transparent, transparent), radial-gradient(circle at bottom right, ${secondaryColor}11, transparent)`
      } as React.CSSProperties}
    >
      <div className="max-w-md mx-auto space-y-8 animate-in relative z-10">
        
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
            style={{ '--glow-color': primaryColor } as any}
          >
            <Share2 size={20} />
          </Button>
        </div>

        <div className="text-center space-y-6">
          <div 
            className="mx-auto w-32 h-32 rounded-[2.5rem] p-1 shadow-2xl transition-all duration-700"
            style={{ 
              background: `linear-gradient(-45deg, ${primaryColor}, ${secondaryColor})`,
              boxShadow: `0 0 50px -10px ${primaryColor}99`
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
          <div className="space-y-3 px-4">
            <h1 className="text-3xl font-black text-white tracking-tight">{profile.displayName || 'User'}</h1>
            {profile.bio ? (
              <p className="text-sm font-medium text-white/70 max-w-xs mx-auto leading-relaxed">
                {profile.bio}
              </p>
            ) : (
              <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-1 opacity-30">Personal Hub</p>
            )}
          </div>
        </div>

        {!activeGroupId ? (
          <div className="space-y-6 animate-in">
            <div className="flex items-center gap-2 px-2">
              <div className="h-px flex-1 bg-white/10" />
              <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] whitespace-nowrap">
                All Link @{profile.username}
              </h2>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="space-y-4">
              {standaloneLinks?.filter(l => l.isEnabled).map(link => (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id, link.url, true)}
                  className="w-full p-0.5 rounded-2xl hover:scale-[1.02] transition-transform shadow-xl group/link"
                  style={{ background: `linear-gradient(-45deg, ${primaryColor}, ${secondaryColor})` }}
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
                  className="w-full p-0.5 rounded-2xl hover:scale-[1.02] transition-transform shadow-xl group/folder"
                  style={{ background: `linear-gradient(-45deg, ${primaryColor}, ${secondaryColor})` }}
                >
                  <div className="w-full h-24 bg-black/70 backdrop-blur-2xl rounded-[0.95rem] flex items-center px-6 gap-4 border border-white/10 relative overflow-hidden">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shadow-xl shrink-0">
                      {group.imageUrl ? <img src={group.imageUrl} className="w-full h-full object-cover" /> : <LayoutGrid size={32} style={{ color: primaryColor }} />}
                    </div>
                    <div className="flex-1 text-left">
                      <span className="text-lg font-black text-white tracking-tight">{group.title}</span>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                        Buka Kelompok <ChevronRight size={12} className="text-primary" />
                      </p>
                    </div>
                    <ChevronRight size={24} className="text-white/20 transition-transform group-hover/folder:translate-x-1" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-right-10">
            <div className="flex items-center gap-2 px-2">
              <div className="h-px flex-1 bg-white/10" />
              <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] whitespace-nowrap">
                {activeGroup?.title}
              </h2>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <LinksInGroup 
              userId={resolvedUserId!} 
              groupId={activeGroupId} 
              onLinkClick={handleLinkClick} 
              accentColor={primaryColor} 
            />
          </div>
        )}

        <div className="pt-12 text-center opacity-40">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Link2 size={12} style={{ color: primaryColor }} />
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white">Powering with Linku Engine</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinksInGroup({ userId, groupId, onLinkClick, accentColor }: { userId: string, groupId: string, onLinkClick: any, accentColor: string }) {
  const db = useFirestore();
  const linksQuery = useMemoFirebase(() => query(collection(db, 'userProfiles', userId, 'linkGroups', groupId, 'links'), orderBy('order', 'asc')), [db, userId, groupId]);
  const { data: links } = useCollection(linksQuery);

  return (
    <div className="grid gap-4 animate-in">
      {links?.filter(l => l.isEnabled).map(link => (
        <button
          key={link.id}
          onClick={() => onLinkClick(link.id, link.url, false, groupId)}
          className="w-full glass-card hover:bg-white/10 rounded-2xl p-5 flex items-center gap-4 transition-all active:scale-95 group/link border-white/5"
        >
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/5 group-hover/link:border-primary/40" style={{ borderColor: `${accentColor}40` } as any}>
            {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" /> : <Link2 size={20} className="text-white/20" />}
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-black text-white tracking-tight truncate">{link.title}</p>
            <p className="text-[9px] font-bold text-white/30 truncate mt-0.5">{link.url.replace('https://', '')}</p>
          </div>
          <MousePointer2 size={16} className="text-white/10 transition-colors group-hover/link:text-primary" style={{ color: accentColor } as any} />
        </button>
      ))}
      {!links?.length && (
        <div className="text-center py-20 opacity-20 font-black uppercase text-[10px] tracking-widest">Belum ada tautan di kelompok ini.</div>
      )}
    </div>
  );
}
