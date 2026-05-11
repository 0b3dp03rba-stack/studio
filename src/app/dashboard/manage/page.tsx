
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Link as LinkIcon, FolderPlus, Upload, LayoutGrid, ChevronUp, ChevronDown, Edit3, Loader2, AlertCircle, ChevronRight, ListTree } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, deleteDoc, query, orderBy, updateDoc, writeBatch, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import ImageCropperModal from '@/components/ImageCropperModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

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
  const [targetGroupId, setTargetGroupId] = useState('main');

  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [activeCropTarget, setActiveCropTarget] = useState<'group' | 'link' | 'edit' | null>(null);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [groupLinksData, setGroupLinksData] = useState<Record<string, any[]>>({});

  const groupsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'userProfiles', user.uid, 'linkGroups'), orderBy('order', 'asc'));
  }, [db, user?.uid]);
  const { data: groups, isLoading: isGroupsLoading } = useCollection(groupsQuery);

  const linksQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'userProfiles', user.uid, 'links'), orderBy('createdAt', 'desc'));
  }, [db, user?.uid]);
  const { data: standaloneLinks, isLoading: isLinksLoading } = useCollection(linksQuery);

  // Monitor links inside each group
  useEffect(() => {
    if (!user || !groups) return;
    const unsubs = groups.map(group => {
      const q = query(collection(db, 'userProfiles', user.uid, 'linkGroups', group.id, 'links'), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snap) => {
        const links = snap.docs.map(d => ({ ...d.data(), id: d.id, groupId: group.id }));
        setGroupLinksData(prev => ({ ...prev, [group.id]: links }));
      });
    });
    return () => unsubs.forEach(unsub => unsub());
  }, [user, groups, db]);

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

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
      toast({ title: "Kelompok Berhasil Dibuat" });
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
      toast({ title: "Tautan Berhasil Ditambahkan" });
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

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'userProfiles', user.uid, 'linkGroups', current.id), { order: swap.order });
      batch.update(doc(db, 'userProfiles', user.uid, 'linkGroups', swap.id), { order: current.order });
      await batch.commit();
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal mengurutkan" });
    }
  };

  const handleSaveEdit = async () => {
    if (!user || !editingItem) return;
    setIsSavingEdit(true);
    try {
      // 1. Group Edit
      if (editingItem.type === 'group') {
        const docRef = doc(db, 'userProfiles', user.uid, 'linkGroups', editingItem.id);
        await updateDoc(docRef, {
          title: editingItem.title,
          imageUrl: editingItem.imageUrl || '',
          updatedAt: serverTimestamp(),
        });
      } 
      // 2. Link Edit
      else {
        const oldGroupId = editingItem.groupId || 'main';
        const newGroupId = editingItem.newGroupId || oldGroupId;

        const updateData: any = {
          title: editingItem.title,
          url: editingItem.url.startsWith('http') ? editingItem.url : `https://${editingItem.url}`,
          imageUrl: editingItem.imageUrl || '',
          updatedAt: serverTimestamp(),
          groupId: newGroupId === 'main' ? null : newGroupId
        };

        // If group changed, move document
        if (oldGroupId !== newGroupId) {
          const oldRef = oldGroupId === 'main' 
            ? doc(db, 'userProfiles', user.uid, 'links', editingItem.id)
            : doc(db, 'userProfiles', user.uid, 'linkGroups', oldGroupId, 'links', editingItem.id);
          
          const newCol = newGroupId === 'main'
            ? collection(db, 'userProfiles', user.uid, 'links')
            : collection(db, 'userProfiles', user.uid, 'linkGroups', newGroupId, 'links');
          
          const existingDataSnap = await getDoc(oldRef);
          if (existingDataSnap.exists()) {
             await setDoc(doc(newCol), { ...existingDataSnap.data(), ...updateData });
             await deleteDoc(oldRef);
          }
        } else {
          const docRef = oldGroupId === 'main' 
            ? doc(db, 'userProfiles', user.uid, 'links', editingItem.id)
            : doc(db, 'userProfiles', user.uid, 'linkGroups', oldGroupId, 'links', editingItem.id);
          await updateDoc(docRef, updateData);
        }
      }
      
      toast({ title: "Pembaruan Berhasil" });
      setEditingItem(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal memperbarui" });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const confirmDelete = async () => {
    if (!user || !itemToDelete) return;
    try {
      if (itemToDelete.type === 'group') {
        await deleteDoc(doc(db, 'userProfiles', user.uid, 'linkGroups', itemToDelete.id));
      } else {
        const docRef = itemToDelete.groupId 
          ? doc(db, 'userProfiles', user.uid, 'linkGroups', itemToDelete.groupId, 'links', itemToDelete.id)
          : doc(db, 'userProfiles', user.uid, 'links', itemToDelete.id);
        await deleteDoc(docRef);
      }
      toast({ title: "Item Telah Dihapus" });
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal menghapus" });
    } finally {
      setItemToDelete(null);
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
              <Input placeholder="Nama Kelompok (Misal: All Addon)" value={newGroupTitle} onChange={(e) => setNewGroupTitle(e.target.value)} className="bg-white/5 border-none h-12 rounded-xl px-4 font-bold" />
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
          <ListTree size={16} className="text-primary" /> Katalog Konten Aktif
        </h3>
        
        {(isGroupsLoading || isLinksLoading) ? (
          <div className="py-20 text-center animate-pulse text-primary font-black uppercase text-[10px]">Menyinkronkan...</div>
        ) : (
          <div className="space-y-4">
            {groups?.map((group, idx) => (
              <div key={group.id} className="space-y-2">
                <Card className="glass-card border-none rounded-[2rem] p-5 flex items-center gap-4 relative overflow-hidden group shadow-xl">
                  <div className="flex flex-col gap-1 z-10">
                    <Button variant="ghost" size="icon" onClick={() => handleMoveGroup(group.id, 'up')} disabled={idx === 0} className="h-7 w-7 opacity-40 hover:opacity-100 disabled:opacity-5"><ChevronUp size={16}/></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleMoveGroup(group.id, 'down')} disabled={idx === (groups?.length || 0) - 1} className="h-7 w-7 opacity-40 hover:opacity-100 disabled:opacity-5"><ChevronDown size={16}/></Button>
                  </div>
                  <div 
                    onClick={() => toggleGroupExpand(group.id)}
                    className="flex-1 flex items-center gap-4 cursor-pointer z-10"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shrink-0 shadow-2xl">
                      {group.imageUrl ? <img src={group.imageUrl} className="w-full h-full object-cover" /> : <LayoutGrid size={24} className="text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <h4 className="font-black text-white text-base truncate uppercase tracking-tight">{group.title}</h4>
                      <p className="text-[9px] text-white/40 uppercase tracking-widest font-black flex items-center gap-1.5">
                        {groupLinksData[group.id]?.length || 0} TAUTAN 
                        <ChevronRight size={10} className={expandedGroups[group.id] ? 'rotate-90 transition-transform' : ''} />
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 z-10">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => { setTargetGroupId(group.id); setActiveTab('link'); }}
                      className="h-10 w-10 text-primary hover:bg-primary/10"
                    >
                      <Plus size={20} />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => setEditingItem({ ...group, type: 'group' })} 
                      className="h-10 w-10 text-white/40 hover:text-white"
                    >
                      <Edit3 size={18} />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => setItemToDelete({ ...group, type: 'group' })} 
                      className="h-10 w-10 text-destructive/40 hover:text-destructive"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </Card>

                {expandedGroups[group.id] && (
                  <div className="ml-10 space-y-3 animate-in slide-in-from-top-2 border-l-2 border-white/5 pl-4 pb-4">
                    {groupLinksData[group.id]?.length === 0 ? (
                      <p className="text-[8px] font-black uppercase text-white/20 px-4 py-4 italic">Belum ada tautan di kelompok ini</p>
                    ) : (
                      groupLinksData[group.id]?.map((link) => (
                        <div key={link.id} className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-2xl border border-white/5 shadow-inner">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden shrink-0 border border-white/5">
                            {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" /> : <LinkIcon size={14} className="text-primary/50" />}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                             <p className="text-sm font-bold text-white/90 truncate">{link.title}</p>
                             <p className="text-[8px] text-white/20 truncate uppercase font-mono">{link.url}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => setEditingItem({ ...link, type: 'link' })} className="h-8 w-8 text-white/20 hover:text-primary"><Edit3 size={14} /></Button>
                            <Button size="icon" variant="ghost" onClick={() => setItemToDelete({ ...link, type: 'link' })} className="h-8 w-8 text-white/10 hover:text-destructive"><Trash2 size={14} /></Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}

            <div className="pt-8 border-t border-white/5">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-4 px-2">Tautan Hub Utama (Mandiri)</p>
              {standaloneLinks?.map((link) => (
                <Card key={link.id} className="glass-card border-none rounded-2xl p-4 flex items-center gap-4 mb-3 shadow-xl hover:bg-white/[0.05] transition-colors">
                  <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/5 shrink-0 shadow-2xl">
                    {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" /> : <LinkIcon size={20} className="text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <h4 className="font-bold text-white text-base truncate uppercase tracking-tight">{link.title}</h4>
                    <p className="text-[10px] text-white/20 uppercase tracking-tighter font-mono">{link.url}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditingItem({ ...link, type: 'link' })} className="h-10 w-10 text-white/40 hover:text-primary"><Edit3 size={18} /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setItemToDelete({ ...link, type: 'link' })} className="h-10 w-10 text-white/20 hover:text-destructive"><Trash2 size={18} /></Button>
                  </div>
                </Card>
              ))}
              {standaloneLinks?.length === 0 && (
                <div className="text-center py-10 opacity-10 font-black uppercase text-[10px] tracking-widest border border-dashed border-white/10 rounded-3xl">Tautan Mandiri Kosong</div>
              )}
            </div>
          </div>
        )}
      </div>

      <ImageCropperModal imageSrc={tempImage} isOpen={cropperOpen} onClose={() => setCropperOpen(false)} onCropComplete={onCropComplete} />

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="glass-card border-none rounded-[2.5rem] bg-background/95 backdrop-blur-3xl p-8 shadow-2xl max-w-[95%] sm:max-w-md mx-auto">
          <DialogHeader><DialogTitle className="text-xl font-black uppercase tracking-tighter text-white">Edit {editingItem?.type === 'group' ? 'Kelompok' : 'Tautan'}</DialogTitle></DialogHeader>
          <div className="space-y-5 py-4 text-left">
            <div className="flex flex-col items-center gap-4">
               <div className="w-28 h-24 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 relative group shadow-2xl">
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
                 <>
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">URL Tujuan</label>
                      <Input value={editingItem?.url || ''} onChange={(e) => setEditingItem({...editingItem, url: e.target.value})} className="bg-white/5 border-none h-12 rounded-xl font-medium" />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Pindah ke Kelompok:</label>
                      <Select value={editingItem.newGroupId || editingItem.groupId || 'main'} onValueChange={(v) => setEditingItem({...editingItem, newGroupId: v})}>
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
                 </>
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

      {/* Delete AlertDialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent className="glass-card border-none rounded-[2rem] bg-background/95 backdrop-blur-2xl border-white/5">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-3 text-white">
              <AlertCircle className="text-destructive" /> Konfirmasi Hapus
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60 font-medium leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong>{itemToDelete?.title}</strong>? Tindakan ini bersifat permanen dan tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-4">
            <AlertDialogCancel className="bg-white/5 border-white/5 rounded-xl text-[10px] font-black uppercase h-12 hover:bg-white/10 text-white">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white hover:bg-destructive/80 rounded-xl text-[10px] font-black uppercase h-12 border-none">Hapus Sekarang</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
