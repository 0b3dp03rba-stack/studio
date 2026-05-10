
"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Link as LinkIcon, FolderPlus, Upload, LayoutGrid, ChevronUp, ChevronDown, Edit3, Loader2, Globe } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, deleteDoc, query, orderBy, updateDoc, getDocs, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import ImageCropperModal from '@/components/ImageCropperModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ManagePage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'group' | 'link'>('group');
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [newGroupImage, setNewGroupImage] = useState('');
  
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkImage, setNewLinkImage] = useState('');
  const [targetGroupId, setTargetGroupId] = useState('main'); // 'main' or groupId

  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [activeCropTarget, setActiveCropTarget] = useState<'group' | 'link' | 'edit' | null>(null);

  // Query groups
  const groupsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'userProfiles', user.uid, 'linkGroups'), orderBy('order', 'asc'));
  }, [db, user?.uid]);
  const { data: groups, isLoading: isGroupsLoading } = useCollection(groupsQuery);

  // Query standalone links
  const linksQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'userProfiles', user.uid, 'links'), orderBy('createdAt', 'desc'));
  }, [db, user?.uid]);
  const { data: standaloneLinks, isLoading: isLinksLoading } = useCollection(linksQuery);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, target: 'group' | 'link' | 'edit') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setTempImage(reader.result as string);
        setActiveCropTarget(target);
        setCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (cropped: string) => {
    if (activeCropTarget === 'group') setNewGroupImage(cropped);
    if (activeCropTarget === 'link') setNewLinkImage(cropped);
    if (activeCropTarget === 'edit') setEditingItem({ ...editingItem, imageUrl: cropped });
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
      toast({ title: "Kelompok Dibuat" });
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal membuat kelompok" });
    }
  };

  const handleAddLink = async () => {
    if (!user || !newLinkTitle || !newLinkUrl) return;
    try {
      const colPath = targetGroupId === 'main' 
        ? collection(db, 'userProfiles', user.uid, 'links')
        : collection(db, 'userProfiles', user.uid, 'linkGroups', targetGroupId, 'links');

      await addDoc(colPath, {
        userId: user.uid,
        title: newLinkTitle,
        url: newLinkUrl.startsWith('http') ? newLinkUrl : `https://${newLinkUrl}`,
        imageUrl: newLinkImage || '',
        isEnabled: true,
        clicks: 0,
        createdAt: serverTimestamp(),
        groupId: targetGroupId === 'main' ? null : targetGroupId
      });
      setNewLinkTitle('');
      setNewLinkUrl('');
      setNewLinkImage('');
      toast({ title: "Tautan Ditambahkan" });
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal menambah tautan" });
    }
  };

  const handleMoveGroup = async (id: string, direction: 'up' | 'down') => {
    if (!user || !groups) return;
    const index = groups.findIndex(g => g.id === id);
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === groups.length - 1) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const current = groups[index];
    const swap = groups[swapIndex];

    const batch = writeBatch(db);
    batch.update(doc(db, 'userProfiles', user.uid, 'linkGroups', current.id), { order: swap.order });
    batch.update(doc(db, 'userProfiles', user.uid, 'linkGroups', swap.id), { order: current.order });
    await batch.commit();
  };

  const handleSaveEdit = async () => {
    if (!user || !editingItem) return;
    setIsSavingEdit(true);
    try {
      let docRef;
      if (editingItem.type === 'group') {
        docRef = doc(db, 'userProfiles', user.uid, 'linkGroups', editingItem.id);
      } else {
        // Find correct path for link
        docRef = editingItem.groupId 
          ? doc(db, 'userProfiles', user.uid, 'linkGroups', editingItem.groupId, 'links', editingItem.id)
          : doc(db, 'userProfiles', user.uid, 'links', editingItem.id);
      }
      
      const updateData: any = {
        title: editingItem.title,
        imageUrl: editingItem.imageUrl || '',
        updatedAt: serverTimestamp(),
      };
      if (editingItem.type === 'link') {
        updateData.url = editingItem.url.startsWith('http') ? editingItem.url : `https://${editingItem.url}`;
      }

      await updateDoc(docRef, updateData);
      toast({ title: "Pembaruan Berhasil" });
      setEditingItem(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal memperbarui" });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (item: any) => {
    if (!user) return;
    const label = item.type === 'group' ? 'kelompok' : 'tautan';
    if (!window.confirm(`Yakin ingin menghapus ${label} "${item.title}"?`)) return;
    
    try {
      if (item.type === 'group') {
        await deleteDoc(doc(db, 'userProfiles', user.uid, 'linkGroups', item.id));
      } else {
        const docRef = item.groupId 
          ? doc(db, 'userProfiles', user.uid, 'linkGroups', item.groupId, 'links', item.id)
          : doc(db, 'userProfiles', user.uid, 'links', item.id);
        await deleteDoc(docRef);
      }
      toast({ title: "Item Dihapus" });
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal menghapus" });
    }
  };

  return (
    <div className="space-y-8 animate-in pb-32">
      <div className="space-y-1">
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase">Manage Hub</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">Atur Struktur Katalog Anda</p>
      </div>

      <div className="grid gap-6">
        <div className="flex bg-white/5 p-1 rounded-2xl">
          <button onClick={() => setActiveTab('group')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${activeTab === 'group' ? 'neon-gradient text-background glow-primary' : 'text-white/40'}`}>+ Kelompok</button>
          <button onClick={() => setActiveTab('link')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${activeTab === 'link' ? 'neon-gradient text-background glow-primary' : 'text-white/40'}`}>+ Tautan</button>
        </div>

        {activeTab === 'group' && (
          <Card className="glass-card border-none rounded-[2rem] p-6 shadow-2xl">
            <CardContent className="p-0 space-y-4 text-left">
              <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
                <FolderPlus size={16} />
                <span>Buat kelompok baru</span>
              </div>
              <Input placeholder="Nama Kelompok" value={newGroupTitle} onChange={(e) => setNewGroupTitle(e.target.value)} className="bg-white/5 border-none h-12 rounded-xl px-4 font-bold" />
              <label className="flex items-center justify-center gap-2 w-full h-12 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/10 transition-all">
                <Upload size={16} className="text-primary" /><span className="text-[10px] font-black uppercase text-white/60">{newGroupImage ? 'Ganti Foto' : 'Unggah Foto'}</span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, 'group')} />
              </label>
              <Button onClick={handleAddGroup} disabled={!newGroupTitle} className="w-full h-12 neon-gradient text-background font-black rounded-xl glow-primary uppercase text-[10px] tracking-widest">Simpan Kelompok</Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'link' && (
          <Card className="glass-card border-none rounded-[2rem] p-6 shadow-2xl text-left">
            <CardContent className="p-0 space-y-4">
              <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
                <LinkIcon size={16} />
                <span>Tambah link baru</span>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Simpan di dalam:</label>
                <Select value={targetGroupId} onValueChange={setTargetGroupId}>
                  <SelectTrigger className="bg-white/5 border-none h-12 rounded-xl text-[10px] font-black uppercase">
                    <SelectValue placeholder="Pilih Tujuan" />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-none rounded-xl">
                    <SelectItem value="main" className="text-xs font-bold uppercase">Hub Utama</SelectItem>
                    {groups?.map(g => (
                      <SelectItem key={g.id} value={g.id} className="text-xs font-bold uppercase">{g.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Input placeholder="Judul Tautan" value={newLinkTitle} onChange={(e) => setNewLinkTitle(e.target.value)} className="bg-white/5 h-12 rounded-xl px-4 font-bold border-none" />
              <Input placeholder="URL (instagram.com/user)" value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} className="bg-white/5 h-12 rounded-xl px-4 font-bold border-none" />
              
              <label className="flex items-center justify-center gap-2 w-full h-12 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/10 transition-all">
                <Upload size={16} className="text-primary" /><span className="text-[10px] font-black uppercase text-white/60">{newLinkImage ? 'Ganti Foto' : 'Unggah Foto'}</span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, 'link')} />
              </label>
              
              <Button onClick={handleAddLink} disabled={!newLinkTitle || !newLinkUrl} className="w-full h-12 neon-gradient text-background font-black rounded-xl glow-primary uppercase text-[10px] tracking-widest">Simpan Tautan</Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-5">
        <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-white/50 flex items-center gap-2 px-1">
          <LayoutGrid size={16} className="text-primary" /> Daftar Isi Hub
        </h3>
        
        {(isGroupsLoading || isLinksLoading) ? (
          <div className="py-20 text-center animate-pulse text-primary font-black uppercase text-[10px]">Sinkronisasi...</div>
        ) : (
          <div className="space-y-4">
            {/* Groups First */}
            {groups?.map((group, idx) => (
              <Card key={group.id} className="glass-card border-none rounded-2xl p-4 flex items-center gap-4">
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleMoveGroup(group.id, 'up')} disabled={idx === 0} className="h-6 w-6 opacity-20 hover:opacity-100"><ChevronUp size={14}/></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleMoveGroup(group.id, 'down')} disabled={idx === (groups?.length || 0) - 1} className="h-6 w-6 opacity-20 hover:opacity-100"><ChevronDown size={14}/></Button>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/5 shrink-0">
                  {group.imageUrl ? <img src={group.imageUrl} className="w-full h-full object-cover" /> : <LayoutGrid size={18} className="text-primary" />}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h4 className="font-bold text-white text-sm truncate">{group.title}</h4>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">KELOMPOK</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setEditingItem({ ...group, type: 'group' })} className="h-10 w-10 text-white/40 hover:text-primary"><Edit3 size={16} /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete({ ...group, type: 'group' })} className="h-10 w-10 text-white/20 hover:text-destructive"><Trash2 size={16} /></Button>
                </div>
              </Card>
            ))}

            {/* Standalone Links */}
            {standaloneLinks?.map((link) => (
              <Card key={link.id} className="glass-card border-none rounded-2xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/5 shrink-0 ml-7">
                  {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" /> : <LinkIcon size={18} className="text-primary" />}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h4 className="font-bold text-white text-sm truncate">{link.title}</h4>
                  <p className="text-[10px] text-white/40 uppercase tracking-tighter font-mono">HUB UTAMA</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setEditingItem({ ...link, type: 'link' })} className="h-10 w-10 text-white/40 hover:text-primary"><Edit3 size={16} /></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete({ ...link, type: 'link' })} className="h-10 w-10 text-white/20 hover:text-destructive"><Trash2 size={16} /></Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ImageCropperModal imageSrc={tempImage} isOpen={cropperOpen} onClose={() => setCropperOpen(false)} onCropComplete={onCropComplete} />

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="glass-card border-none rounded-[2.5rem] bg-background/95 backdrop-blur-3xl p-8 shadow-2xl max-w-[95%] sm:max-w-md mx-auto">
          <DialogHeader><DialogTitle className="text-xl font-black uppercase tracking-tighter text-white">Edit {editingItem?.type === 'group' ? 'Kelompok' : 'Tautan'}</DialogTitle></DialogHeader>
          <div className="space-y-5 py-4">
            <div className="flex flex-col items-center gap-4">
               <div className="w-24 h-24 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 relative group">
                  {editingItem?.imageUrl ? <img src={editingItem.imageUrl} className="w-full h-full object-cover" /> : <Upload size={32} className="text-white/20" />}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                    <Upload size={20} className="text-white" />
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, 'edit')} />
                  </label>
               </div>
               <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Klik foto untuk mengganti</p>
            </div>
            <div className="space-y-4">
               <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Nama / Judul</label>
                  <Input value={editingItem?.title || ''} onChange={(e) => setEditingItem({...editingItem, title: e.target.value})} className="bg-white/5 border-none h-12 rounded-xl font-bold" />
               </div>
               {editingItem?.type === 'link' && (
                 <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">URL Tujuan</label>
                    <Input value={editingItem?.url || ''} onChange={(e) => setEditingItem({...editingItem, url: e.target.value})} className="bg-white/5 border-none h-12 rounded-xl font-medium" />
                 </div>
               )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
             <Button variant="ghost" onClick={() => setEditingItem(null)} className="rounded-xl font-black uppercase text-[10px]">Batal</Button>
             <Button onClick={handleSaveEdit} disabled={isSavingEdit} className="neon-gradient text-background font-black rounded-xl glow-primary px-8 uppercase text-[10px]">
               {isSavingEdit ? <Loader2 className="animate-spin" size={16} /> : "Simpan Perubahan"}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
