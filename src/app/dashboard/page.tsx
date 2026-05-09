
"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Link as LinkIcon, ExternalLink, AtSign, FolderPlus, Image as ImageIcon, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

export default function DashboardPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [newGroupImage, setNewGroupImage] = useState('');
  
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkImage, setNewLinkImage] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const profileRef = useMemoFirebase(() => user ? doc(db, 'userProfiles', user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const groupsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'userProfiles', user.uid, 'linkGroups'), orderBy('order', 'asc'));
  }, [db, user?.uid]);
  const { data: groups, isLoading: isGroupsLoading } = useCollection(groupsQuery);

  const handleAddGroup = async () => {
    if (!user || !newGroupTitle) return;
    try {
      await addDoc(collection(db, 'userProfiles', user.uid, 'linkGroups'), {
        userId: user.uid,
        title: newGroupTitle,
        imageUrl: newGroupImage || '',
        isEnabled: true,
        order: (groups?.length || 0) + 1,
        createdAt: serverTimestamp()
      });
      setNewGroupTitle('');
      setNewGroupImage('');
      toast({ title: "Kelompok Dibuat", description: "Sekarang Anda bisa menambah link ke dalamnya." });
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan." });
    }
  };

  const handleAddLink = async () => {
    if (!user || !selectedGroupId || !newLinkTitle || !newLinkUrl) return;
    try {
      await addDoc(collection(db, 'userProfiles', user.uid, 'linkGroups', selectedGroupId, 'links'), {
        groupId: selectedGroupId,
        title: newLinkTitle,
        url: newLinkUrl.startsWith('http') ? newLinkUrl : `https://${newLinkUrl}`,
        imageUrl: newLinkImage || '',
        isEnabled: true,
        order: 1, // Logic order can be improved
        clicks: 0,
        createdAt: serverTimestamp()
      });
      setNewLinkTitle('');
      setNewLinkUrl('');
      setNewLinkImage('');
      setSelectedGroupId(null);
      toast({ title: "Link Ditambahkan", description: "Tautan baru berhasil disimpan." });
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal menyimpan link." });
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'userProfiles', user.uid, 'linkGroups', groupId));
    toast({ title: "Kelompok Dihapus", description: "Semua data di dalamnya telah hilang." });
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

      <div className="grid gap-6">
        <Card className="glass-card border-none rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 neon-gradient opacity-5"></div>
          <CardContent className="p-0 space-y-4 relative z-10">
            <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
              <FolderPlus size={16} />
              <span>Buat Kelompok Baru</span>
            </div>
            <div className="space-y-3">
              <Input 
                placeholder="Nama Kelompok (Misal: Media Sosial)" 
                value={newGroupTitle}
                onChange={(e) => setNewGroupTitle(e.target.value)}
                className="bg-white/5 border-white/5 h-12 rounded-xl px-4 font-bold"
              />
              <Input 
                placeholder="URL Gambar Ikon (Opsional)" 
                value={newGroupImage}
                onChange={(e) => setNewGroupImage(e.target.value)}
                className="bg-white/5 border-white/5 h-12 rounded-xl px-4 text-xs"
              />
              <Button onClick={handleAddGroup} disabled={!newGroupTitle} className="w-full h-12 neon-gradient text-white font-black rounded-xl glow-primary uppercase text-[10px] shadow-xl">
                Tambah Kelompok
              </Button>
            </div>
          </CardContent>
        </Card>

        {selectedGroupId && (
          <Card className="glass-card border-primary/20 rounded-[2rem] p-6 shadow-2xl animate-in">
            <CardContent className="p-0 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
                  <Plus size={16} />
                  <span>Tambah Link ke Kelompok</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedGroupId(null)} className="text-[10px] font-black uppercase">Batal</Button>
              </div>
              <div className="space-y-3">
                <Input placeholder="Judul Link" value={newLinkTitle} onChange={(e) => setNewLinkTitle(e.target.value)} className="bg-white/5 h-12 rounded-xl px-4 font-bold" />
                <Input placeholder="URL Tautan" value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} className="bg-white/5 h-12 rounded-xl px-4 font-bold" />
                <Input placeholder="URL Gambar Ikon Link" value={newLinkImage} onChange={(e) => setNewLinkImage(e.target.value)} className="bg-white/5 h-12 rounded-xl px-4 text-xs" />
                <Button onClick={handleAddLink} disabled={!newLinkTitle || !newLinkUrl} className="w-full h-12 neon-gradient text-white font-black rounded-xl glow-primary uppercase text-[10px] shadow-xl">
                  Simpan Link
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-5">
        <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-white/50 flex items-center gap-2 px-1">
          <LinkIcon size={16} className="text-primary" /> Daftar Kelompok & Linku
        </h3>
        
        {isGroupsLoading ? (
          <div className="py-20 text-center animate-pulse text-primary font-black uppercase text-[10px]">Memuat Linku...</div>
        ) : groups && groups.length > 0 ? (
          <div className="space-y-4">
            {groups.map((group) => (
              <GroupItem key={group.id} group={group} onAddLink={() => setSelectedGroupId(group.id)} onDelete={() => handleDeleteGroup(group.id)} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center glass-card rounded-[3rem] opacity-20 border-none">
            <LinkIcon size={64} className="mx-auto mb-6" />
            <p className="text-xl font-black uppercase tracking-widest">Belum Ada Kelompok</p>
          </div>
        )}
      </div>
    </div>
  );
}

function GroupItem({ group, onAddLink, onDelete }: { group: any; onAddLink: () => void; onDelete: () => void }) {
  const { user } = useUser();
  const db = useFirestore();
  const linksQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'userProfiles', user.uid, 'linkGroups', group.id, 'links'), orderBy('createdAt', 'desc'));
  }, [db, user?.uid, group.id]);
  const { data: links } = useCollection(linksQuery);

  return (
    <Card className="glass-card border-none rounded-[2rem] overflow-hidden shadow-xl">
      <CardContent className="p-0">
        <div className="p-6 flex items-center gap-4 bg-white/5">
          <div className="w-12 h-12 rounded-2xl neon-gradient p-0.5 glow-primary shrink-0">
            <div className="w-full h-full bg-black rounded-[0.9rem] flex items-center justify-center overflow-hidden">
              {group.imageUrl ? <img src={group.imageUrl} className="w-full h-full object-cover" /> : <LinkIcon size={20} className="text-primary" />}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-black text-white uppercase text-sm truncate">{group.title}</h4>
            <p className="text-[8px] text-white/30 uppercase font-black tracking-widest">{links?.length || 0} Tautan</p>
          </div>
          <div className="flex gap-2">
            <Button size="icon" variant="ghost" onClick={onAddLink} className="h-10 w-10 rounded-xl text-primary hover:bg-primary/10"><Plus size={18} /></Button>
            <Button size="icon" variant="ghost" onClick={onDelete} className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10"><Trash2 size={18} /></Button>
          </div>
        </div>
        <div className="p-4 space-y-2">
          {links?.map(link => (
            <div key={link.id} className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/5">
               <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                  {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" /> : <LinkIcon size={12} className="text-white/40" />}
               </div>
               <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white uppercase truncate">{link.title}</p>
                  <p className="text-[8px] text-white/40 truncate font-mono">{link.url}</p>
               </div>
               <div className="flex items-center gap-1">
                 <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive/50 hover:text-destructive" onClick={async () => {
                    await deleteDoc(doc(db, 'userProfiles', user!.uid, 'linkGroups', group.id, 'links', link.id));
                 }}>
                   <Trash2 size={14} />
                 </Button>
               </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
