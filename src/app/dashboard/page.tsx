
"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Link as LinkIcon, ExternalLink, AtSign, FolderPlus, Upload, X, LayoutGrid } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'group' | 'link'>('group');
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

  const standaloneLinksQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'userProfiles', user.uid, 'links'), orderBy('createdAt', 'desc'));
  }, [db, user?.uid]);
  const { data: standaloneLinks, isLoading: isStandaloneLoading } = useCollection(standaloneLinksQuery);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024 * 5) {
        toast({ variant: "destructive", title: "File terlalu besar", description: "Maksimal ukuran foto adalah 5MB." });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setter(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

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
      toast({ title: "Kelompok dibuat", description: "Berhasil menambahkan kelompok baru." });
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan." });
    }
  };

  const handleAddLink = async () => {
    if (!user || !newLinkTitle || !newLinkUrl) return;
    try {
      const colPath = selectedGroupId 
        ? collection(db, 'userProfiles', user.uid, 'linkGroups', selectedGroupId, 'links')
        : collection(db, 'userProfiles', user.uid, 'links');

      await addDoc(colPath, {
        groupId: selectedGroupId || null,
        title: newLinkTitle,
        url: newLinkUrl.startsWith('http') ? newLinkUrl : `https://${newLinkUrl}`,
        imageUrl: newLinkImage || '',
        isEnabled: true,
        order: 1,
        clicks: 0,
        createdAt: serverTimestamp()
      });
      setNewLinkTitle('');
      setNewLinkUrl('');
      setNewLinkImage('');
      setSelectedGroupId(null);
      toast({ title: "Tautan ditambahkan", description: "Tautan baru berhasil disimpan." });
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal menyimpan link." });
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'userProfiles', user.uid, 'linkGroups', groupId));
    toast({ title: "Kelompok dihapus", description: "Kelompok telah dihapus." });
  };

  const publicUrl = `/${profile?.username || user?.uid}`;

  return (
    <div className="space-y-8 animate-in pb-12">
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tighter text-white">Linku Manager</h1>
        <div className="flex items-center gap-2 p-3 bg-white/5 rounded-2xl border border-white/5 w-fit">
           <AtSign size={14} className="text-primary" />
           <span className="text-[10px] font-black text-white uppercase tracking-widest">{profile?.username || 'user'}</span>
           <Link href={publicUrl} className="ml-2 text-[10px] text-primary hover:underline font-bold flex items-center gap-1">
             Lihat Profil <ExternalLink size={10} />
           </Link>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="flex bg-white/5 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('group')}
            className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${activeTab === 'group' ? 'neon-gradient text-white glow-primary' : 'text-white/40'}`}
          >
            Buat Kelompok
          </button>
          <button 
            onClick={() => {
              setActiveTab('link');
              setSelectedGroupId(null);
            }}
            className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${activeTab === 'link' ? 'neon-gradient text-white glow-primary' : 'text-white/40'}`}
          >
            Tambah Link Mandiri
          </button>
        </div>

        {activeTab === 'group' ? (
          <Card className="glass-card border-none rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 neon-gradient opacity-5"></div>
            <CardContent className="p-0 space-y-4 relative z-10">
              <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
                <FolderPlus size={16} />
                <span>Buat kelompok baru</span>
              </div>
              <div className="space-y-3">
                <Input 
                  placeholder="Nama Kelompok" 
                  value={newGroupTitle}
                  onChange={(e) => setNewGroupTitle(e.target.value)}
                  className="bg-white/5 border-white/5 h-12 rounded-xl px-4 font-bold"
                />
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="flex items-center justify-center gap-2 w-full h-12 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/10 transition-all">
                      <Upload size={16} className="text-primary" />
                      <span className="text-[10px] font-black uppercase text-white/60">{newGroupImage ? 'Ganti Foto' : 'Pilih Foto (1:1)'}</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setNewGroupImage)} />
                    </label>
                  </div>
                  {newGroupImage && (
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-primary/50 aspect-square">
                      <img src={newGroupImage} className="w-full h-full object-cover" />
                      <button onClick={() => setNewGroupImage('')} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <X size={14} className="text-white" />
                      </button>
                    </div>
                  )}
                </div>
                <Button onClick={handleAddGroup} disabled={!newGroupTitle} className="w-full h-12 neon-gradient text-white font-black rounded-xl glow-primary uppercase text-[10px] shadow-xl">
                  Simpan Kelompok
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card border-none rounded-[2rem] p-6 shadow-2xl animate-in">
            <CardContent className="p-0 space-y-4">
              <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
                <LinkIcon size={16} />
                <span>Tambah link mandiri</span>
              </div>
              <div className="space-y-3">
                <Input placeholder="Judul Tautan" value={newLinkTitle} onChange={(e) => setNewLinkTitle(e.target.value)} className="bg-white/5 h-12 rounded-xl px-4 font-bold" />
                <Input placeholder="URL (Misal: instagram.com/user)" value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} className="bg-white/5 h-12 rounded-xl px-4 font-bold" />
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="flex items-center justify-center gap-2 w-full h-12 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/10 transition-all">
                      <Upload size={16} className="text-primary" />
                      <span className="text-[10px] font-black uppercase text-white/60">{newLinkImage ? 'Ganti Foto' : 'Pilih Foto (1:1)'}</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setNewLinkImage)} />
                    </label>
                  </div>
                  {newLinkImage && (
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-primary/50 aspect-square">
                      <img src={newLinkImage} className="w-full h-full object-cover" />
                      <button onClick={() => setNewLinkImage('')} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <X size={14} className="text-white" />
                      </button>
                    </div>
                  )}
                </div>
                <Button onClick={handleAddLink} disabled={!newLinkTitle || !newLinkUrl} className="w-full h-12 neon-gradient text-white font-black rounded-xl glow-primary uppercase text-[10px] shadow-xl">
                  Simpan Tautan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedGroupId && (
          <Card className="glass-card border-primary/20 rounded-[2rem] p-6 shadow-2xl animate-in border">
            <CardContent className="p-0 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
                  <Plus size={16} />
                  <span>Tambah link ke kelompok</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedGroupId(null)} className="text-[10px] font-black uppercase">Batal</Button>
              </div>
              <div className="space-y-3">
                <Input placeholder="Judul Tautan" value={newLinkTitle} onChange={(e) => setNewLinkTitle(e.target.value)} className="bg-white/5 h-12 rounded-xl px-4 font-bold" />
                <Input placeholder="URL" value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} className="bg-white/5 h-12 rounded-xl px-4 font-bold" />
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="flex items-center justify-center gap-2 w-full h-12 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/10 transition-all">
                      <Upload size={16} className="text-primary" />
                      <span className="text-[10px] font-black uppercase text-white/60">{newLinkImage ? 'Ganti Foto' : 'Pilih Foto (1:1)'}</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setNewLinkImage)} />
                    </label>
                  </div>
                  {newLinkImage && (
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-primary/50 aspect-square">
                      <img src={newLinkImage} className="w-full h-full object-cover" />
                      <button onClick={() => setNewLinkImage('')} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <X size={14} className="text-white" />
                      </button>
                    </div>
                  )}
                </div>
                <Button onClick={handleAddLink} disabled={!newLinkTitle || !newLinkUrl} className="w-full h-12 neon-gradient text-white font-black rounded-xl glow-primary uppercase text-[10px] shadow-xl">
                  Simpan Tautan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-5">
        <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-white/50 flex items-center gap-2 px-1">
          <LayoutGrid size={16} className="text-primary" /> Konten Profil
        </h3>
        
        {isGroupsLoading || isStandaloneLoading ? (
          <div className="py-20 text-center animate-pulse text-primary font-black uppercase text-[10px]">Memuat...</div>
        ) : (
          <div className="space-y-4">
            {standaloneLinks?.map(link => (
              <StandaloneLinkItem key={link.id} link={link} />
            ))}

            {groups?.map((group) => (
              <GroupItem key={group.id} group={group} onAddLink={() => {
                setSelectedGroupId(group.id);
                setActiveTab('group');
              }} onDelete={() => handleDeleteGroup(group.id)} />
            ))}

            {(!groups?.length && !standaloneLinks?.length) && (
              <div className="py-24 text-center glass-card rounded-[2rem] opacity-20 border-none">
                <LinkIcon size={64} className="mx-auto mb-6" />
                <p className="text-xl font-black uppercase tracking-widest">Kosong</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StandaloneLinkItem({ link }: { link: any }) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!user) return;
    await deleteDoc(doc(db, 'userProfiles', user.uid, 'links', link.id));
    toast({ title: "Dihapus", description: "Tautan mandiri telah dihapus." });
  };

  return (
    <Card className="glass-card border-none rounded-2xl overflow-hidden shadow-xl p-4 flex items-center gap-4 group">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/5 shrink-0 aspect-square">
        {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" /> : <LinkIcon size={18} className="text-primary" />}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <h4 className="font-bold text-white text-sm truncate">{link.title}</h4>
        <p className="text-[10px] text-white/40 truncate font-mono">{link.url}</p>
      </div>
      <div className="flex gap-2">
         <Button size="icon" variant="ghost" onClick={handleDelete} className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10"><Trash2 size={16} /></Button>
      </div>
    </Card>
  );
}

function GroupItem({ group, onAddLink, onDelete }: { group: any; onAddLink: () => void; onDelete: () => void }) {
  const { user } = useUser();
  const db = useFirestore();
  const linksQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'userProfiles', user.uid, 'linkGroups', group.id, 'links'), orderBy('order', 'asc'));
  }, [db, user?.uid, group.id]);
  const { data: links } = useCollection(linksQuery);

  return (
    <Card className="glass-card border-none rounded-[1.5rem] overflow-hidden shadow-xl">
      <CardContent className="p-0">
        <div className="p-6 flex items-center gap-4 bg-white/5">
          <div className="w-12 h-12 rounded-xl neon-gradient p-0.5 glow-primary shrink-0 aspect-square">
            <div className="w-full h-full bg-black rounded-[0.7rem] flex items-center justify-center overflow-hidden">
              {group.imageUrl ? <img src={group.imageUrl} className="w-full h-full object-cover" /> : <LayoutGrid size={20} className="text-primary" />}
            </div>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <h4 className="font-bold text-white text-base truncate">{group.title}</h4>
            <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">{links?.length || 0} tautan</p>
          </div>
          <div className="flex gap-2">
            <Button size="icon" variant="ghost" onClick={onAddLink} className="h-10 w-10 rounded-xl text-primary hover:bg-primary/10"><Plus size={18} /></Button>
            <Button size="icon" variant="ghost" onClick={onDelete} className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10"><Trash2 size={18} /></Button>
          </div>
        </div>
        <div className="p-4 space-y-2">
          {links?.map(link => (
            <div key={link.id} className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/5">
               <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shrink-0 aspect-square">
                  {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" /> : <LinkIcon size={12} className="text-white/40" />}
               </div>
               <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-bold text-white truncate">{link.title}</p>
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
