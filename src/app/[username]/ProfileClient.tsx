
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, updateDoc, increment, getDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { User, Share2, MousePointer2, Link2, LayoutGrid, ChevronRight, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function ProfileClient({ username }: { username: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [allLinks, setAllLinks] = useState<any[]>([]);

  useEffect(() => {
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
  const { data: profile } = useDoc(profileRef);

  const groupsQuery = useMemoFirebase(() => {
    if (!resolvedUserId) return null;
    return query(collection(db, 'userProfiles', resolvedUserId, 'linkGroups'), orderBy('order', 'asc'));
  }, [db, resolvedUserId]);
  const { data: groups } = useCollection(groupsQuery);

  const standaloneLinksQuery = useMemoFirebase(() => {
    if (!resolvedUserId) return null;
    return query(collection(db, 'userProfiles', resolvedUserId, 'links'), orderBy('createdAt', 'desc'));
  }, [db, resolvedUserId]);
  const { data: standaloneLinks } = useCollection(standaloneLinksQuery);

  // Listen to all links inside groups for search
  useEffect(() => {
    if (!resolvedUserId || !groups) return;
    const unsubscribers = groups.map(group => {
      return onSnapshot(collection(db, 'userProfiles', resolvedUserId, 'linkGroups', group.id, 'links'), (snap) => {
        const links = snap.docs.map(d => ({ ...d.data(), id: d.id, groupId: group.id }));
        setAllLinks(prev => {
          const filtered = prev.filter(l => l.groupId !== group.id);
          return [...filtered, ...links];
        });
      });
    });
    return () => unsubscribers.forEach(u => u());
  }, [resolvedUserId, groups, db]);

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
    if (!standaloneLinks) return [];
    return standaloneLinks.filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [standaloneLinks, searchQuery]);

  const filteredGroupedLinks = useMemo(() => {
    if (!searchQuery) return [];
    return allLinks.filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [allLinks, searchQuery]);

  if (isResolving) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-2xl animate-spin"></div>
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
              {profile.avatarUrl ? <img src={profile.avatarUrl} className="w-full h-full object-cover" /> : <User size={64} className="text-white/20" />}
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-white tracking-tighter leading-none">{profile.displayName || 'User'}</h1>
            {profile.bio && <p className="text-sm font-medium text-white/70 max-w-xs mx-auto leading-relaxed">{profile.bio}</p>}
          </div>
        </div>

        {/* Global Search Bar */}
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
          {/* Groups First */}
          {filteredGroups.map(group => (
            <Link key={group.id} href={`/${username}/g/${group.id}`} className="block">
              <div 
                className="p-0.5 rounded-2xl animate-flowing-gradient transition-transform active:scale-95 shadow-xl"
                style={{ backgroundImage: dynamicGradient, backgroundSize: '200% 200%' }}
              >
                <div className="w-full h-24 bg-black/70 backdrop-blur-2xl rounded-[0.95rem] flex items-center px-6 gap-4 border border-white/10 relative overflow-hidden">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shadow-xl shrink-0">
                    {group.imageUrl ? <img src={group.imageUrl} className="w-full h-full object-cover" /> : <LayoutGrid size={32} style={{ color: primaryColor }} />}
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

          {/* Search Result: Links from Groups */}
          {searchQuery && filteredGroupedLinks.map(link => (
             <button
              key={`search-${link.id}`}
              onClick={() => handleLinkClick(link.id, link.url, link.groupId)}
              className="w-full p-0.5 rounded-2xl hover:scale-[1.02] transition-transform shadow-xl"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <div className="w-full h-20 bg-black/80 backdrop-blur-xl rounded-[0.95rem] flex items-center px-6 gap-4 border border-white/10">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/5">
                  {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" /> : <Link2 size={24} style={{ color: primaryColor }} />}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <span className="text-base font-black text-white tracking-tight truncate block">{link.title}</span>
                  <p className="text-[8px] font-black text-primary uppercase tracking-widest mt-1">Ditemukan di Koleksi</p>
                </div>
                <MousePointer2 size={20} style={{ color: primaryColor }} />
              </div>
            </button>
          ))}

          {/* Standalone Links */}
          {filteredStandaloneLinks.map(link => (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link.id, link.url)}
              className="w-full p-0.5 rounded-2xl hover:scale-[1.02] transition-transform shadow-xl animate-flowing-gradient"
              style={{ backgroundImage: dynamicGradient, backgroundSize: '200% 200%' }}
            >
              <div className="w-full h-20 bg-black/80 backdrop-blur-xl rounded-[0.95rem] flex items-center px-6 gap-4 border border-white/10">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/5">
                  {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" /> : <Link2 size={24} style={{ color: primaryColor }} />}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <span className="text-base font-black text-white tracking-tight truncate block">{link.title}</span>
                </div>
                <MousePointer2 size={20} style={{ color: primaryColor }} />
              </div>
            </button>
          ))}

          {searchQuery && filteredGroups.length === 0 && filteredStandaloneLinks.length === 0 && filteredGroupedLinks.length === 0 && (
             <div className="text-center py-20 opacity-20 font-black uppercase text-xs tracking-widest">
                <p>Tidak ada hasil untuk "{searchQuery}"</p>
             </div>
          )}
        </div>

        <div className="pt-12 text-center">
          <Button asChild className="w-full h-14 neon-gradient text-background font-black rounded-2xl glow-primary text-[10px] uppercase tracking-widest shadow-2xl transition-all animate-flowing-gradient" style={{ backgroundImage: dynamicGradient, backgroundSize: '200% 200%' }}>
            <Link href="/"><User size={16} className="mr-2" /> Buat Linku Kamu Sekarang</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
