
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, updateDoc, increment, getDoc, query, orderBy } from 'firebase/firestore';
import { MousePointer2, Link2, ChevronLeft, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function GroupClient({ username, groupId }: { username: string; groupId: string }) {
  const db = useFirestore();
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const resolveUser = async () => {
      const userRef = doc(db, 'usernames', username.toLowerCase());
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) setResolvedUserId(userSnap.data().userId);
      else setResolvedUserId(username);
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

  if (!profile || !group) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-2xl animate-spin"></div>
    </div>
  );

  const primaryColor = profile.themeColor || '#ff0000';
  const secondaryColor = profile.themeColorSecondary || '#ffea00';
  const dynamicGradient = `linear-gradient(-45deg, ${primaryColor} 0%, ${secondaryColor} 50%, ${primaryColor} 100%)`;

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
          <Button variant="ghost" asChild className="w-12 h-12 rounded-2xl glass-card text-white p-0">
            <Link href={`/${username}`}><ChevronLeft size={24} /></Link>
          </Button>
          <div className="text-right">
             <p className="text-[8px] font-black text-primary uppercase tracking-[0.3em]">Melihat Koleksi</p>
             <h2 className="text-lg font-black text-white uppercase tracking-tighter truncate max-w-[200px]">{group.title}</h2>
          </div>
        </div>

        <div className="text-center space-y-6 pt-4">
          <div 
            className="mx-auto w-24 h-24 rounded-[2rem] p-1 shadow-2xl animate-flowing-gradient"
            style={{ backgroundImage: dynamicGradient, backgroundSize: '200% 200%' }}
          >
            <div className="w-full h-full rounded-[1.85rem] bg-background flex items-center justify-center overflow-hidden border-4 border-background">
              {group.imageUrl ? <img src={group.imageUrl} className="w-full h-full object-cover" /> : <Link2 size={40} style={{ color: primaryColor }} />}
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-primary/10 blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl" />
          <div className="relative glass-card rounded-2xl flex items-center px-4 gap-3 border border-white/5 h-12">
            <Search size={16} className="text-white/20" />
            <Input 
              placeholder={`Cari di ${group.title}...`} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus-visible:ring-0 text-sm font-bold text-white placeholder:text-white/10 h-full"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-white/20 hover:text-white transition-colors">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {filteredLinks.map(link => (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link.id, link.url)}
              className="w-full p-0.5 rounded-2xl hover:scale-[1.02] transition-transform shadow-lg animate-flowing-gradient"
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

          {filteredLinks.length === 0 && (
            <div className="text-center py-24 opacity-20 font-black uppercase text-[10px] tracking-widest">
               {searchQuery ? `Tidak ada tautan untuk "${searchQuery}"` : "Koleksi ini kosong"}
            </div>
          )}
        </div>

        <div className="pt-12 text-center opacity-30">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white">Powering with Linku Engine</p>
        </div>
      </div>
    </div>
  );
}
