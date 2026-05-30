"use client";

import { useEffect, useState, useMemo } from 'react';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, updateDoc, increment, getDoc, query, orderBy, where, limit, getDocs } from 'firebase/firestore';
import { MousePointer2, Link2, ChevronLeft, Search, X, Ghost, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function GroupClient({ username, groupId }: { username: string; groupId: string }) {
  const db = useFirestore();
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
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
        setResolvedUserId(uid);
      } catch (e) {
        console.error(e);
      } finally {
        setIsResolving(false);
      }
    };
    resolveUser();
  }, [db, username]);

  const profileRef = useMemoFirebase(() => resolvedUserId ? doc(db, 'userProfiles', resolvedUserId) : null, [db, resolvedUserId]);
  const { data: profile } = useDoc(profileRef);

  const groupRef = useMemoFirebase(() => resolvedUserId ? doc(db, 'userProfiles', resolvedUserId, 'linkGroups', groupId) : null, [db, resolvedUserId, groupId]);
  const { data: group } = useDoc(groupRef);

  const linksQuery = useMemoFirebase(() => {
    if (!resolvedUserId) return null;
    return query(collection(db, 'userProfiles', resolvedUserId, 'linkGroups', groupId, 'links'), orderBy('createdAt', 'desc'));
  }, [db, resolvedUserId, groupId]);
  const { data: links } = useCollection(linksQuery);

  const handleLinkClick = (linkId: string, url: string) => {
    if (!resolvedUserId) return;
    const linkRef = doc(db, 'userProfiles', resolvedUserId, 'linkGroups', groupId, 'links', linkId);
    updateDoc(linkRef, { clicks: increment(1) }).catch(() => {});
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const filteredLinks = useMemo(() => {
    if (!links) return [];
    return links.filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [links, searchQuery]);

  if (isResolving) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-primary/50">Sinkronisasi Koleksi...</p>
      </div>
    );
  }

  if (!profile || !group) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center space-y-8">
        <div className="w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary glow-primary animate-bounce">
          <Ghost size={48} />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Koleksi Tidak Ditemukan</h1>
        </div>
        <Button onClick={() => window.history.back()} className="h-14 px-10 neon-gradient text-background font-black rounded-2xl uppercase text-[10px] tracking-[0.2em] shadow-2xl">
          <ChevronLeft size={16} className="mr-2" /> Kembali
        </Button>
      </div>
    );
  }

  const primaryColor = profile.themeColor || '#ff0000';
  const secondaryColor = profile.themeColorSecondary || '#ffea00';
  const dynamicGradient = `linear-gradient(-45deg, ${primaryColor} 0%, ${secondaryColor} 50%, ${primaryColor} 100%)`;
  
  // DYNAMIC SHAPE LOGIC
  const shape = profile.profile_shape || 'rounded';
  const getShapeClass = (type: 'card' | 'search' | 'button') => {
    if (shape === 'square') return "rounded-none";
    if (shape === 'hexagon') return "rounded-full"; 
    if (shape === 'circle') return "rounded-[3rem]";
    if (shape === 'rounded') return "rounded-2xl";
    return "rounded-2xl";
  };

  return (
    <div 
      className="min-h-screen transition-all duration-1000 relative overflow-x-hidden"
      style={{ 
        backgroundColor: '#0a0a0a',
        backgroundImage: `radial-gradient(circle at 100% 0%, ${primaryColor}22 0%, transparent 60%), radial-gradient(circle at 0% 100%, ${secondaryColor}11 0%, transparent 60%)`
      }}
    >
      <div className="max-w-md mx-auto space-y-8 animate-in relative z-10 p-6 pb-24">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => window.history.back()} className="w-12 h-12 rounded-2xl glass-card text-white p-0 flex items-center justify-center">
            <ChevronLeft size={24} />
          </Button>
          <div className="text-right">
             <p className="text-[8px] font-black text-primary uppercase tracking-[0.3em]">Melihat Koleksi</p>
             <h2 className="text-lg font-black text-white uppercase tracking-tighter truncate max-w-[200px]">{group.title}</h2>
          </div>
        </div>

        <div className="text-center space-y-6 pt-4">
          <div className={cn("mx-auto w-24 h-24 p-1 shadow-2xl animate-flowing-gradient", getShapeClass('card'))} style={{ backgroundImage: dynamicGradient, backgroundSize: '200% 200%' }}>
            <div className={cn("w-full h-full bg-background flex items-center justify-center overflow-hidden border-4 border-background", getShapeClass('card'))}>
              {group.imageUrl ? <img src={group.imageUrl} className="w-full h-full object-cover" /> : <Link2 size={40} style={{ color: primaryColor }} />}
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className={cn("absolute inset-0 bg-primary/10 blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity", getShapeClass('search'))} />
          <div className={cn("relative glass-card flex items-center px-4 gap-3 border border-white/5 h-12", getShapeClass('search'))}>
            <Search size={16} className="text-white/20" />
            <Input placeholder={`Cari di ${group.title}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none focus-visible:ring-0 text-sm font-bold text-white placeholder:text-white/20 h-full" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-white/20 hover:text-white transition-colors"><X size={16} /></button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {filteredLinks.map(link => (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link.id, link.url)}
              className={cn("w-full p-0.5 hover:scale-[1.02] transition-transform shadow-lg animate-flowing-gradient", getShapeClass('button'))}
              style={{ backgroundImage: dynamicGradient, backgroundSize: '200% 200%' }}
            >
              <div className={cn("w-full h-20 bg-black/80 backdrop-blur-xl flex items-center px-6 gap-4 border border-white/10", getShapeClass('button'))}>
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/5">
                  {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" /> : <Link2 size={24} style={{ color: primaryColor }} />}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <span className="text-base font-black text-white tracking-tight truncate block uppercase">{link.title}</span>
                </div>
                <MousePointer2 size={20} style={{ color: primaryColor }} />
              </div>
            </button>
          ))}

          {filteredLinks.length === 0 && (
            <div className="text-center py-24 opacity-20 font-black uppercase text-[10px] tracking-widest">
               {searchQuery ? `Tidak ada tautan untuk "${searchQuery}"` : "Koleksi ini kosong"}
            </div>
          )}
        </div>

        {!(profile.isPremium || profile.role === 'Admin') && (
          <div className="pt-12 text-center opacity-30">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white">Powering with Linku Engine</p>
          </div>
        )}
      </div>
    </div>
  );
}
