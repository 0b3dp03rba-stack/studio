
"use client";

import { useEffect, useState } from 'react';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection, updateDoc, increment, getDoc, query, orderBy, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { User, Share2, MousePointer2, Link2, ChevronRight, LayoutGrid, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function ProfileClient({ username }: { username: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(true);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [groupLinks, setGroupLinks] = useState<Record<string, any[]>>({});

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

  const linksQuery = useMemoFirebase(() => {
    if (!resolvedUserId) return null;
    return query(collection(db, 'userProfiles', resolvedUserId, 'links'), orderBy('createdAt', 'desc'));
  }, [db, resolvedUserId]);
  const { data: links } = useCollection(linksQuery);

  const handleLinkClick = (linkId: string, url: string, groupId?: string) => {
    if (!resolvedUserId) return;
    const linkRef = groupId 
      ? doc(db, 'userProfiles', resolvedUserId, 'linkGroups', groupId, 'links', linkId)
      : doc(db, 'userProfiles', resolvedUserId, 'links', linkId);
    
    updateDoc(linkRef, { clicks: increment(1) }).catch(() => {});
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const toggleGroup = (groupId: string) => {
    if (expandedGroupId === groupId) {
      setExpandedGroupId(null);
      return;
    }
    setExpandedGroupId(groupId);
    if (!groupLinks[groupId]) {
      const q = query(collection(db, 'userProfiles', resolvedUserId!, 'linkGroups', groupId, 'links'), orderBy('createdAt', 'desc'));
      onSnapshot(q, (snap) => {
        setGroupLinks(prev => ({ ...prev, [groupId]: snap.docs.map(d => ({ ...d.data(), id: d.id })) }));
      });
    }
  };

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

        <div className="space-y-6">
          {/* Groups First */}
          {groups?.map(group => (
            <div key={group.id} className="space-y-2">
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full p-0.5 rounded-2xl animate-flowing-gradient transition-transform active:scale-95"
                style={{ backgroundImage: dynamicGradient, backgroundSize: '200% 200%' }}
              >
                <div className="w-full h-24 bg-black/70 backdrop-blur-2xl rounded-[0.95rem] flex items-center px-6 gap-4 border border-white/10 relative overflow-hidden">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shadow-xl shrink-0">
                    {group.imageUrl ? <img src={group.imageUrl} className="w-full h-full object-cover" /> : <LayoutGrid size={32} style={{ color: primaryColor }} />}
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-lg font-black text-white tracking-tight">{group.title}</span>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">Koleksi</p>
                  </div>
                  {expandedGroupId === group.id ? <ChevronUp size={24} className="text-white/50" /> : <ChevronDown size={24} className="text-white/50" />}
                </div>
              </button>

              {expandedGroupId === group.id && (
                <div className="space-y-3 px-2 py-2 animate-in slide-in-from-top-4 duration-300">
                  {groupLinks[group.id]?.length === 0 ? (
                    <p className="text-center py-4 text-[10px] font-black uppercase text-white/20">Belum ada tautan di kelompok ini</p>
                  ) : (
                    groupLinks[group.id]?.map(link => (
                      <button
                        key={link.id}
                        onClick={() => handleLinkClick(link.id, link.url, group.id)}
                        className="w-full p-0.5 rounded-2xl hover:scale-[1.02] transition-transform shadow-lg"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                      >
                        <div className="w-full h-16 bg-black/80 backdrop-blur-xl rounded-[0.95rem] flex items-center px-5 gap-4 border border-white/5">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/5">
                            {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" /> : <Link2 size={20} style={{ color: primaryColor }} />}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <span className="text-sm font-black text-white tracking-tight truncate block">{link.title}</span>
                          </div>
                          <ChevronRight size={18} className="text-white/20" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Standalone Links Second */}
          {links?.map(link => (
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
