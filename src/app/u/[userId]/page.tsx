
"use client";

import { use, useMemo } from 'react';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, updateDoc, increment } from 'firebase/firestore';
import { User, Share2, MousePointer2, Link2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const db = useFirestore();
  const { toast } = useToast();

  const profileRef = useMemoFirebase(() => doc(db, 'userProfiles', userId), [db, userId]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  const linksQuery = useMemoFirebase(() => collection(db, 'userProfiles', userId, 'links'), [db, userId]);
  const { data: links, isLoading: isLinksLoading } = useCollection(linksQuery);

  const activeLinks = useMemo(() => {
    if (!links) return [];
    return links.filter(l => l.isEnabled).sort((a,b) => (a.order || 0) - (b.order || 0));
  }, [links]);

  const handleLinkClick = async (linkId: string, url: string) => {
    updateDoc(doc(db, 'userProfiles', userId, 'links', linkId), {
      clicks: increment(1)
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Tersalin", description: "URL profil telah disalin ke clipboard." });
  };

  if (isProfileLoading || isLinksLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-primary/50">Membangun Profil...</p>
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
          <div className="mx-auto w-32 h-32 rounded-[3rem] neon-gradient p-1 shadow-2xl glow-primary">
            <div className="w-full h-full rounded-[2.8rem] bg-background flex items-center justify-center overflow-hidden border-4 border-background relative">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={64} className="text-white/20" />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase animate-text-fast-pulse">{profile.displayName || profile.username || 'User Linku'}</h1>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mt-1">Verified Link Member</p>
          </div>
          {profile.bio && (
            <p className="text-sm font-medium text-white/60 leading-relaxed max-w-xs mx-auto">
              {profile.bio}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {activeLinks.length > 0 ? (
            activeLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id, link.url)}
                className="w-full relative group"
              >
                <div className="absolute inset-0 neon-gradient opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500 rounded-3xl" />
                <div className="relative h-20 neon-gradient p-0.5 rounded-3xl transition-transform group-hover:scale-[1.02] group-active:scale-[0.98] shadow-2xl">
                   <div className="w-full h-full bg-black/60 backdrop-blur-xl rounded-[1.4rem] flex items-center px-8 border border-white/10 group-hover:bg-black/20 transition-all">
                      <div className="flex-1 text-left">
                        <span className="text-sm font-black text-white uppercase tracking-wider">{link.title}</span>
                      </div>
                      <MousePointer2 size={18} className="text-white/40 group-hover:text-white transition-colors" />
                   </div>
                </div>
              </button>
            ))
          ) : (
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
