
"use client";

import { use, useEffect, useState } from 'react';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, updateDoc, increment, query, orderBy } from 'firebase/firestore';
import { User, Share2, MousePointer2, Link2, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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

  const handleLinkClick = async (linkId: string, url: string) => {
    const linkRef = doc(db, 'userProfiles', userId, 'links', linkId);
    updateDoc(linkRef, { clicks: increment(1) }).catch(() => {});
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (isProfileLoading || isGroupsLoading || isStandaloneLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-2xl animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-primary/50">Membangun profil...</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background p-6 pb-24">
      <div className="max-w-md mx-auto space-y-8 animate-in">
        
        <div className="flex justify-end">
          <Button variant="ghost" size="icon" onClick={handleShare} className="w-12 h-12 rounded-2xl glass-card text-white shadow-xl"><Share2 size={20} /></Button>
        </div>

        <div className="text-center space-y-6">
          <div className="mx-auto w-32 h-32 rounded-[2.5rem] neon-gradient p-1 shadow-2xl glow-primary">
            <div className="w-full h-full rounded-[2.3rem] bg-background flex items-center justify-center overflow-hidden border-4 border-background relative">
              {profile.avatarUrl ? <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <User size={64} className="text-white/20" />}
            </div>
          </div>
          <div className="space-y-3 px-4">
            <h1 className="text-3xl font-black text-white tracking-tighter">{profile.displayName || 'User Linku'}</h1>
            {profile.bio && <p className="text-sm font-medium text-white/70 max-w-xs mx-auto leading-relaxed">{profile.bio}</p>}
          </div>
        </div>

        <div className="space-y-6">
          {/* Groups First */}
          {groups?.map(group => (
            <div key={group.id} className="w-full neon-gradient p-0.5 rounded-2xl shadow-xl">
              <div className="w-full h-24 bg-black/70 backdrop-blur-xl rounded-[0.95rem] flex items-center px-6 gap-4 border border-white/10">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shadow-xl shrink-0">
                  {group.imageUrl ? <img src={group.imageUrl} className="w-full h-full object-cover" /> : <LayoutGrid size={24} className="text-primary" />}
                </div>
                <div className="flex-1 text-left">
                  <span className="text-sm font-bold text-white tracking-tight">{group.title}</span>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">Koleksi</p>
                </div>
              </div>
            </div>
          ))}

          {/* Standalone Links Second */}
          {standaloneLinks?.map(link => (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link.id, link.url)}
              className="w-full neon-gradient p-0.5 rounded-2xl hover:scale-[1.02] transition-transform shadow-xl group/link"
            >
              <div className="w-full h-20 bg-black/80 backdrop-blur-xl rounded-[0.95rem] flex items-center px-6 gap-4 border border-white/10">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10">
                  {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" /> : <Link2 size={24} className="text-primary" />}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <span className="text-base font-black text-white tracking-tight truncate block">{link.title}</span>
                </div>
                <MousePointer2 size={20} className="text-white/20 group-hover/link:text-primary transition-colors" />
              </div>
            </button>
          ))}
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
