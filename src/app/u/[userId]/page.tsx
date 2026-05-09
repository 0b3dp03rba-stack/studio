"use client";

import { use, useMemo, useEffect, useState } from 'react';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, updateDoc, increment, query, orderBy } from 'firebase/firestore';
import { User, Share2, MousePointer2, Link2, ChevronRight, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

export default function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const db = useFirestore();
  const { toast } = useToast();

  const profileRef = useMemoFirebase(() => doc(db, 'userProfiles', userId), [db, userId]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  const groupsQuery = useMemoFirebase(() => query(collection(db, 'userProfiles', userId, 'linkGroups'), orderBy('order', 'asc')), [db, userId]);
  const { data: groups, isLoading: isGroupsLoading } = useCollection(groupsQuery);

  const standaloneLinksQuery = useMemoFirebase(() => query(collection(db, 'userProfiles', userId, 'links'), orderBy('createdAt', 'desc')), [db, userId]);
  const { data: standaloneLinks, isLoading: isStandaloneLoading } = useCollection(standaloneLinksQuery);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Tersalin", description: "URL profil telah disalin ke clipboard." });
  };

  const handleLinkClick = async (linkId: string, url: string, isStandalone: boolean, groupId?: string) => {
    const linkRef = isStandalone 
      ? doc(db, 'userProfiles', userId, 'links', linkId)
      : doc(db, 'userProfiles', userId, 'linkGroups', groupId!, 'links', linkId);
    
    updateDoc(linkRef, { clicks: increment(1) });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (isProfileLoading || isGroupsLoading || isStandaloneLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-primary/50">Membangun profil...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Profil Tidak Ditemukan</h1>
        <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Maaf, halaman ini tidak eksis atau telah dihapus.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background p-6 pb-24">
      <div className="max-w-md mx-auto space-y-8 animate-in">
        
        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleShare}
            className="w-12 h-12 rounded-2xl glass-card text-white hover:bg-primary/20 hover:text-primary border-none shadow-xl"
          >
            <Share2 size={20} />
          </Button>
        </div>

        <div className="text-center space-y-6">
          <div className="mx-auto w-32 h-32 rounded-[3.5rem] neon-gradient p-1 shadow-2xl glow-primary">
            <div className="w-full h-full rounded-[3.3rem] bg-background flex items-center justify-center overflow-hidden border-4 border-background relative">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={64} className="text-white/20" />
              )}
            </div>
          </div>
          <div className="space-y-3 px-4">
            <h1 className="text-3xl font-black text-white tracking-tighter animate-text-fast-pulse">{profile.displayName || profile.username || 'User Linku'}</h1>
            {profile.bio ? (
              <p className="text-sm font-medium text-white/70 max-w-xs mx-auto leading-relaxed">
                {profile.bio}
              </p>
            ) : (
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mt-1">Personal Link Hub</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4">
            {standaloneLinks?.filter(l => l.isEnabled).map(link => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id, link.url, true)}
                className="w-full neon-gradient p-0.5 rounded-[2rem] hover:scale-[1.02] transition-transform shadow-xl group/link"
              >
                <div className="w-full h-16 bg-black/80 backdrop-blur-xl rounded-[1.8rem] flex items-center px-6 gap-4 border border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10">
                    {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" /> : <Link2 size={20} className="text-primary" />}
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-sm font-bold text-white tracking-tight">{link.title}</span>
                  </div>
                  <MousePointer2 size={16} className="text-white/20 group-hover/link:text-primary transition-colors" />
                </div>
              </button>
            ))}
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {groups?.filter(g => g.isEnabled).map((group) => (
              <AccordionItem key={group.id} value={group.id} className="border-none">
                <div className="relative group">
                  <div className="absolute inset-0 neon-gradient opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-500 rounded-3xl" />
                  <AccordionTrigger className="relative h-24 neon-gradient p-0.5 rounded-[2rem] hover:no-underline shadow-2xl transition-transform hover:scale-[1.01] group-data-[state=open]:scale-[1.02]">
                    <div className="w-full h-full bg-black/70 backdrop-blur-xl rounded-[1.8rem] flex items-center px-6 gap-4 border border-white/10">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shadow-xl shrink-0">
                        {group.imageUrl ? <img src={group.imageUrl} className="w-full h-full object-cover" /> : <LayoutGrid size={24} className="text-primary" />}
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
                  <LinksInGroup userId={userId} groupId={group.id} onLinkClick={handleLinkClick} />
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
            <Link2 size={12} className="text-primary" />
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white">Powering with Linku Engine</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinksInGroup({ userId, groupId, onLinkClick }: { userId: string, groupId: string, onLinkClick: any }) {
  const db = useFirestore();
  const linksQuery = useMemoFirebase(() => query(collection(db, 'userProfiles', userId, 'linkGroups', groupId, 'links'), orderBy('createdAt', 'desc')), [db, userId, groupId]);
  const { data: links } = useCollection(linksQuery);

  return (
    <div className="grid gap-3">
      {links?.filter(l => l.isEnabled).map(link => (
        <button
          key={link.id}
          onClick={() => onLinkClick(link.id, link.url, false, groupId)}
          className="w-full glass-card hover:bg-white/10 rounded-2xl p-4 flex items-center gap-4 transition-all active:scale-95 group/link"
        >
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/5 group-hover/link:border-primary/40">
            {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" /> : <Link2 size={16} className="text-white/20" />}
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-bold text-white tracking-tight">{link.title}</p>
          </div>
          <MousePointer2 size={14} className="text-white/20 group-hover/link:text-primary transition-colors" />
        </button>
      ))}
    </div>
  );
}