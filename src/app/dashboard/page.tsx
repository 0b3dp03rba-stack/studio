
"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, GripVertical, Link as LinkIcon, Eye, ExternalLink, MousePointer2, AtSign } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const profileRef = useMemoFirebase(() => user ? doc(db, 'userProfiles', user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const linksQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, 'userProfiles', user.uid, 'links');
  }, [db, user?.uid]);

  const { data: links, isLoading } = useCollection(linksQuery);

  const handleAddLink = async () => {
    if (!user || !newTitle || !newUrl) return;
    
    try {
      await addDoc(collection(db, 'userProfiles', user.uid, 'links'), {
        userId: user.uid,
        title: newTitle,
        url: newUrl.startsWith('http') ? newUrl : `https://${newUrl}`,
        isEnabled: true,
        order: (links?.length || 0) + 1,
        clicks: 0,
        createdAt: serverTimestamp()
      });
      
      setNewTitle('');
      setNewUrl('');
      toast({ title: "Tautan Ditambahkan", description: "Linku baru Anda sudah siap!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat menyimpan link." });
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'userProfiles', user.uid, 'links', linkId));
    toast({ title: "Dihapus", description: "Link telah dihapus dari profil Anda." });
  };

  const toggleLink = async (linkId: string, currentStatus: boolean) => {
    if (!user) return;
    await updateDoc(doc(db, 'userProfiles', user.uid, 'links', linkId), {
      isEnabled: !currentStatus
    });
  };

  const publicUrl = profile?.username ? `${window.location.origin}/${profile.username}` : `${window.location.origin}/u/${user?.uid}`;

  return (
    <div className="space-y-8 animate-in pb-12">
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tighter uppercase text-white">Linku Manager</h1>
        <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/5 w-fit">
           <AtSign size={14} className="text-primary" />
           <span className="text-[10px] font-black text-white uppercase tracking-widest">{profile?.username || 'Belum ada username'}</span>
           <Link href={publicUrl} target="_blank" className="ml-2 text-[10px] text-primary hover:underline font-bold flex items-center gap-1">
             Lihat Profil <ExternalLink size={10} />
           </Link>
        </div>
      </div>

      <Card className="glass-card border-none rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 neon-gradient opacity-5"></div>
        <CardContent className="p-0 space-y-5 relative z-10">
          <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest mb-2">
            <Plus size={16} />
            <span>Tambah Link Baru</span>
          </div>
          <div className="space-y-4">
            <Input 
              placeholder="Judul Link (Contoh: Instagram Saya)" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="bg-white/5 border-white/5 h-16 rounded-2xl px-6 font-bold focus-visible:ring-primary/30"
            />
            <Input 
              placeholder="URL (Contoh: instagram.com/username)" 
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="bg-white/5 border-white/5 h-16 rounded-2xl px-6 font-bold focus-visible:ring-primary/30"
            />
            <Button 
              onClick={handleAddLink}
              disabled={!newTitle || !newUrl}
              className="w-full h-16 neon-gradient text-background font-black rounded-2xl glow-primary uppercase text-xs tracking-[0.2em] active:scale-95 transition-all shadow-xl"
            >
              Simpan Linku
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-5">
        <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-white/50 flex items-center gap-2 px-1">
          <LinkIcon size={16} className="text-primary" /> Daftar Linku Anda
        </h3>
        
        {isLoading ? (
          <div className="py-20 text-center animate-pulse text-primary font-black uppercase text-[10px]">Memuat Linku...</div>
        ) : links && links.length > 0 ? (
          <div className="space-y-4">
            {links.sort((a,b) => (a.order || 0) - (b.order || 0)).map((link) => (
              <Card key={link.id} className={`glass-card border-none rounded-[2rem] overflow-hidden group hover:bg-white/5 transition-all shadow-xl ${!link.isEnabled ? 'opacity-40' : ''}`}>
                <CardContent className="p-6 flex items-center gap-5">
                  <div className="cursor-grab text-white/20 hover:text-white transition-colors">
                    <GripVertical size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-white uppercase text-sm truncate">{link.title}</h4>
                    <p className="text-[10px] text-white/30 truncate font-mono mt-0.5">{link.url}</p>
                    <div className="flex items-center gap-3 mt-3">
                       <div className="flex items-center gap-1.5 text-[9px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/10">
                         <MousePointer2 size={10} /> {link.clicks || 0} CLICKS
                       </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => toggleLink(link.id, link.isEnabled)}
                      className={`h-11 w-11 rounded-xl ${link.isEnabled ? 'text-primary' : 'text-white/20'}`}
                    >
                      <Eye size={20} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteLink(link.id)}
                      className="h-11 w-11 rounded-xl text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 size={20} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center glass-card rounded-[3rem] opacity-20 border-none">
            <LinkIcon size={64} className="mx-auto mb-6" />
            <p className="text-xl font-black uppercase tracking-widest">Belum Ada Tautan</p>
          </div>
        )}
      </div>
    </div>
  );
}
