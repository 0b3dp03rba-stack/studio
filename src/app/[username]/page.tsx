
"use client";

import { use, useMemo, useEffect, useState } from 'react';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, updateDoc, increment, getDoc, query, orderBy } from 'firebase/firestore';
import { User, Share2, MousePointer2, Link2, ChevronRight, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

export default function PublicProfileByUsername({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const db = useFirestore();
  const { toast } = useToast();
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(true);

  useEffect(() => {
    const resolveUser = async () => {
      try {
        const userRef = doc(db, 'usernames', username.toLowerCase());
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setResolvedUserId(userSnap.data().userId);
        } else {
          // Fallback check by userId direct
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
      className="min-h-screen bg-background p-6 pb-24 transition-colors duration-1000"
      style={{ 
        backgroundImage: `radial-gradient(circle at top, ${primaryColor}33, transparent, transparent)`
      } as React.CSSProperties}
    >
      <div className="max-w-md mx-auto space-y-8 animate-in">
        
        <div className="flex justify-end">
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
              boxShadow: `0 0 40px -10px ${primaryColor}99`
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
            <h1 className="text-3xl font-black text-white tracking-tighter">{profile.displayName || profile.username || 'User Linku'}</h1>
            {profile.bio ? (
              <p className="text-sm font-medium text-white/70 max-w-xs mx-auto leading-relaxed">
                {profile.bio}
              </p>
            ) : (
              <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-1 opacity-30">Personal Link Hub</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4">
            {standaloneLinks?.filter(l => l.isEnabled).map(link => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id, link.url, true)}
                className="w-full p-0.5 rounded-2xl hover:scale-[1.02] transition-transform shadow-xl group/link"
                style={{ background: `linear-gradient(-45deg, ${primaryColor}, ${secondaryColor})` }}
              >
                <div className="w-full h-16 bg-black/80 backdrop-blur-xl rounded-[0.95rem] flex items-center px-6 gap-4 border border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10">
                    {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" /> : <Link2 size={20} style={{ color: primaryColor }} />}
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-sm font-bold text-white tracking-tight">{link.title}</span>
                  </div>
                  <MousePointer2 size={16} className="text-white/20 transition-colors" style={{ color: primaryColor }} />
                </div>
              </button>
            ))}
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {groups?.filter(g => g.isEnabled).map((group) => (
              <AccordionItem key={group.id} value={group.id} className="border-none">
                <div className="relative group">
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-30 blur-2xl transition-all duration-500 rounded-2xl" 
                    style={{ background: primaryColor }}
                  />
                  <AccordionTrigger 
                    className="relative h-24 p-0.5 rounded-2xl hover:no-underline shadow-2xl transition-transform hover:scale-[1.01] group-data-[state=open]:scale-[1.02]"
                    style={{ background: `linear-gradient(-45deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    <div className="w-full h-full bg-black/70 backdrop-blur-xl rounded-[0.95rem] flex items-center px-6 gap-4 border border-white/10">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shadow-xl shrink-0">
                        {group.imageUrl ? <img src={group.imageUrl} className="w-full h-full object-cover" /> : <LayoutGrid size={24} style={{ color: primaryColor }} />}
                      </div>
                      <div className="flex-1 text-left">
                        <span className="text-sm font-bold text-white tracking-tight">{group.title}</span>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">Buka Koleksi</p>
                      </div>
                      <ChevronRight size={20} className="text-white/40 transition-transform group-data-[state=open]:rotate-90" />
                    </div>
                  </AccordionTrigger>
                </div>
                <AccordionContent className="pt-3 pb-0 px-2 space-y-3">
                  <LinksInGroup userId={resolvedUserId!} groupId={group.id} onLinkClick={handleLinkClick} accentColor={primaryColor} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {(!groups?.length && !standaloneLinks?.length) && (
            <div className="text-center py-20 opacity-20 font-black uppercase tracking-widest text-[10px]">
              Belum ada tautan aktif.
            </div>
          )}
        </div>

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
    <div className="grid gap-3">
      {links?.filter(l => l.isEnabled).map(link => (
        <button
          key={link.id}
          onClick={() => onLinkClick(link.id, link.url, false, groupId)}
          className="w-full glass-card hover:bg-white/10 rounded-2xl p-4 flex items-center gap-4 transition-all active:scale-95 group/link"
        >
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/5 group-hover/link:border-primary/40" style={{ borderColor: `${accentColor}40` } as any}>
            {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" /> : <Link2 size={16} className="text-white/20" />}
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-bold text-white tracking-tight">{link.title}</p>
          </div>
          <MousePointer2 size={14} className="text-white/20 transition-colors" style={{ color: accentColor } as any} />
        </button>
      ))}
    </div>
  );
}
