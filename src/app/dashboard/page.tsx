
"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, GripVertical, Link as LinkIcon, Eye, ExternalLink, MousePointer2 } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

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
      toast({ title: "Tautan Ditambahkan", description: "Link baru Anda sudah siap!" });
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

  return (
    <div className="space-y-8 animate-in pb-10">
      <div className="space-y-1">
        <h1 className="text-4xl font-black tracking-tighter neon-text-pulse uppercase">Link Manager</h1>
        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">Kelola semua tautan penting Anda.</p>
      </div>

      <Card className="glass-card border-none rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group">
        <CardContent className="p-0 space-y-4">
          <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest mb-2">
            <Plus size={16} />
            <span>Tambah Link Baru</span>
          </div>
          <div className="space-y-3">
            <Input 
              placeholder="Judul Link (Contoh: Instagram Saya)" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="bg-white/5 border-white/5 h-14 rounded-2xl px-6 font-bold focus-visible:ring-primary/20"
            />
            <Input 
              placeholder="URL (Contoh: instagram.com/username)" 
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="bg-white/5 border-white/5 h-14 rounded-2xl px-6 font-bold focus-visible:ring-primary/20"
            />
            <Button 
              onClick={handleAddLink}
              disabled={!newTitle || !newUrl}
              className="w-full h-14 neon-gradient text-white font-black rounded-2xl glow-primary uppercase text-[10px] tracking-[0.2em] group active:scale-95 transition-all shadow-xl"
            >
              Simpan Link
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-white/50 flex items-center gap-2 px-1">
          <LinkIcon size={16} className="text-primary" /> Daftar Link Anda
        </h3>
        
        {isLoading ? (
          <div className="py-20 text-center animate-pulse text-primary font-black uppercase text-[10px]">Memuat Link...</div>
        ) : links && links.length > 0 ? (
          <div className="space-y-4">
            {links.sort((a,b) => (a.order || 0) - (b.order || 0)).map((link) => (
              <Card key={link.id} className={`glass-card border-none rounded-[2rem] overflow-hidden group hover:bg-white/5 transition-all shadow-xl ${!link.isEnabled ? 'opacity-50' : ''}`}>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="cursor-grab text-white/20 hover:text-white transition-colors">
                    <GripVertical size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-white uppercase text-sm truncate">{link.title}</h4>
                    <p className="text-[10px] text-white/40 truncate font-mono">{link.url}</p>
                    <div className="flex items-center gap-3 mt-2">
                       <div className="flex items-center gap-1 text-[9px] font-black text-primary uppercase">
                         <MousePointer2 size={10} /> {link.clicks || 0} Clicks
                       </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => toggleLink(link.id, link.isEnabled)}
                      className={`h-10 w-10 rounded-xl ${link.isEnabled ? 'text-primary' : 'text-white/20'}`}
                    >
                      <Eye size={18} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteLink(link.id)}
                      className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center glass-card rounded-[2.5rem] opacity-20 border-none">
            <LinkIcon size={64} className="mx-auto mb-4" />
            <p className="text-lg font-black uppercase tracking-widest">Belum Ada Tautan</p>
          </div>
        )}
      </div>

      {user && (
        <div className="pt-6">
          <Link href={`/u/${user.uid}`} className="block">
            <Card className="neon-gradient border-none rounded-2xl overflow-hidden shadow-2xl transition-all active:scale-95 group hover:glow-primary">
              <CardContent className="p-6 flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-black/30 flex items-center justify-center backdrop-blur-md border border-white/10">
                    <ExternalLink size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-tight">Lihat Profil Publik</p>
                    <p className="text-[10px] font-black uppercase opacity-70 tracking-widest">Bagikan linktree Anda ke dunia</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}
    </div>
  );
}
