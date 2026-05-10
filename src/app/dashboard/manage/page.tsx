
"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Link as LinkIcon, FolderPlus, Upload, LayoutGrid, ChevronUp, ChevronDown, Edit3, Save, X, Loader2 } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, deleteDoc, query, orderBy, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import ImageCropperModal from '@/components/ImageCropperModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

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
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // States for Editing
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Cropper States
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [activeCropTarget, setActiveCropTarget] = useState<'group' | 'link' | 'edit' | null>(null);

  const groupsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'userProfiles', user.uid, 'linkGroups'), orderBy('order', 'asc'));
  }, [db, user?.uid]);
  const { data: groups, isLoading: isGroupsLoading } = useCollection(groupsQuery);

  const standaloneLinksQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'userProfiles', user.uid, 'links'), orderBy('order', 'asc'));
  }, [db, user?.uid]);
  const { data: standaloneLinks, isLoading: isStandaloneLoading } = useCollection(standaloneLinksQuery);

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
      toast({ variant: "destructive", title: "Gagal" });
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
        order: selectedGroupId ? 0 : (standaloneLinks?.length || 0) + 1,
        clicks: 0,
        createdAt: serverTimestamp()
      });
      setNewLinkTitle('');
      setNewLinkUrl('');
      setNewLinkImage('');
      setSelectedGroupId(null);
      toast({ title: "Tautan Ditambahkan" });
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal" });
    }
  };

  const handleSaveEdit = async () => {
    if (!user || !editingItem) return;
    setIsSavingEdit(true);
    try {
      let docRef;
      if (editingItem.type === 'group') {
        docRef = doc(db, 'userProfiles', user.uid, 'linkGroups', editingItem.id);
      } else if (editingItem.parentGroupId) {
        docRef = doc(db, 'userProfiles', user.uid, 'linkGroups', editingItem.parentGroupId, 'links', editingItem.id);
      } else {
        docRef = doc(db, 'userProfiles', user.uid, 'links', editingItem.id);
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
      toast({ title: "Berhasil Diperbarui" });
      setEditingItem(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal memperbarui" });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleMove = async (id: string, type: 'group' | 'link', direction: 'up' | 'down') => {
    if (!user) return;
    const items = type === 'group' ? groups : standaloneLinks;
    if (!items) return;

    const index = items.findIndex(item => item.id === id);
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const currentItem = items[index];
    const swapItem = items[swapIndex];

    const currentRef = doc(db, 'userProfiles', user.uid, type === 'group' ? 'linkGroups' : 'links', currentItem.id);
    const swapRef = doc(db, 'userProfiles', user.uid, type === 'group' ? 'linkGroups' : 'links', swapItem.id);

    await updateDoc(currentRef, { order: swapItem.order });
    await updateDoc(swapRef, { order: currentItem.order });
  };

  return (
    <div className="space-y-8 animate-in pb-32">
      <div className="space-y-1">
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase">Manage Hub</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">Atur Struktur Konten Anda</p>
      </div>

      <div className="grid gap-6">
        <div className="flex bg-white/5 p-1 rounded-2xl">
          <button onClick={() => setActiveTab('group')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${activeTab === 'group' ? 'neon-gradient text-background glow-primary' : 'text-white/40'}`}>Buat Kelompok</button>
          <button onClick={() => { setActiveTab('link'); setSelectedGroupId(null); }} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${activeTab === 'link' ? 'neon-gradient text-background glow-primary' : 'text-white/40'}`}>Link Mandiri</button>
        </div>

        {activeTab === 'group' && (
          <Card className="glass-card border-none rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group">
            <CardContent className="p-0 space-y-4 relative z-10 text-left">
              <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest"><FolderPlus size={16} /><span>Buat kelompok baru</span></div>
              <Input placeholder="Nama Kelompok" value={newGroupTitle} onChange={(e) => setNewGroupTitle(e.target.value)} className="bg-white/5 border-white/5 h-12 rounded-xl px-4 font-bold" />
              <label className="flex items-center justify-center gap-2 w-full h-12 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/10 transition-all">
                <Upload size={16} className="text-primary" /><span className="text-[10px] font-black uppercase text-white/60">{newGroupImage ? 'Ganti Foto' : 'Unggah Foto'}</span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, 'group')} />
              </label>
              <Button onClick={handleAddGroup} disabled={!newGroupTitle} className="w-full h-12 neon-gradient text-background font-black rounded-xl glow-primary uppercase text-[10px] tracking-widest">Simpan Kelompok</Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'link' && (
          <Card className="glass-card border-none rounded-[2.5rem] p-6 shadow-2xl text-left">
            <CardContent className="p-0 space-y-4">
              <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest"><LinkIcon size={16} /><span>Tambah link mandiri</span></div>
              <Input placeholder="Judul Tautan" value={newLinkTitle} onChange={(e) => setNewLinkTitle(e.target.value)} className="bg-white/5 h-12 rounded-xl px-4 font-bold border-none" />
              <Input placeholder="URL (instagram.com/user)" value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} className="bg-white/5 h-12 rounded-xl px-4 font-bold border-none" />
              <label className="flex items-center justify-center gap-2 w-full h-12 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/10 transition-all">
                <Upload size={16} className="text-primary" /><span className="text-[10px] font-black uppercase text-white/60">{newLinkImage ? 'Ganti Foto' : 'Unggah Foto'}</span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, 'link')} />
              </label>
              <Button onClick={handleAddLink} disabled={!newLinkTitle || !newLinkUrl} className="w-full h-12 neon-gradient text-background font-black rounded-xl glow-primary uppercase text-[10px] tracking-widest">Simpan Tautan {selectedGroupId ? '(Dalam Folder)' : ''}</Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-5">
        <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-white/50 flex items-center gap-2 px-1">
          <LayoutGrid size={16} className="text-primary" /> Konten Aktif
        </h3>
        
        {isGroupsLoading || isStandaloneLoading ? (
          <div className="py-20 text-center animate-pulse text-primary font-black uppercase text-[10px]">Sinkronisasi...</div>
        ) : (
          <div className="space-y-4">
            {standaloneLinks?.map((link, idx) => (
              <StandaloneLinkItem 
                key={link.id} 
                link={link} 
                onEdit={() => setEditingItem({ ...link, type: 'link' })}
                onMoveUp={() => handleMove(link.id, 'link', 'up')} 
                onMoveDown={() => handleMove(link.id, 'link', 'down')} 
                isFirst={idx === 0} 
                isLast={idx === (standaloneLinks.length - 1)} 
              />
            ))}
            {groups?.map((group, idx) => (
              <GroupItem 
                key={group.id} 
                group={group} 
                onEdit={() => setEditingItem({ ...group, type: 'group' })}
                onEditLink={(link: any) => setEditingItem({ ...link, type: 'link', parentGroupId: group.id })}
                onAddLink={() => { setSelectedGroupId(group.id); setActiveTab('link'); }} 
                onDelete={() => deleteDoc(doc(db, 'userProfiles', user!.uid, 'linkGroups', group.id))} 
                onMoveUp={() => handleMove(group.id, 'group', 'up')} 
                onMoveDown={() => handleMove(group.id, 'group', 'down')} 
                isFirst={idx === 0} 
                isLast={idx === (groups.length - 1)} 
              />
            ))}
          </div>
        )}
      </div>

      <ImageCropperModal imageSrc={tempImage} isOpen={cropperOpen} onClose={() => setCropperOpen(false)} onCropComplete={onCropComplete} />

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="glass-card border-none rounded-[2.5rem] bg-background/95 backdrop-blur-3xl p-8 shadow-2xl max-w-[95%] sm:max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tighter text-white">Edit {editingItem?.type === 'group' ? 'Kelompok' : 'Tautan'}</DialogTitle>
          </DialogHeader>
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

function StandaloneLinkItem({ link, onEdit, onMoveUp, onMoveDown, isFirst, isLast }: { link: any, onEdit: () => void, onMoveUp: () => void, onMoveDown: () => void, isFirst: boolean, isLast: boolean }) {
  const { user } = useUser();
  const db = useFirestore();
  const handleDelete = async () => { 
    if (!user) return; 
    if(confirm('Hapus tautan ini?')) {
      await deleteDoc(doc(db, 'userProfiles', user.uid, 'links', link.id)); 
    }
  };
  return (
    <Card className="glass-card border-none rounded-2xl overflow-hidden shadow-xl p-4 flex items-center gap-4">
      <div className="flex flex-col gap-1 mr-1">
        <Button variant="ghost" size="icon" onClick={onMoveUp} disabled={isFirst} className="h-6 w-6 opacity-20 hover:opacity-100 disabled:opacity-0"><ChevronUp size={14}/></Button>
        <Button variant="ghost" size="icon" onClick={onMoveDown} disabled={isLast} className="h-6 w-6 opacity-20 hover:opacity-100 disabled:opacity-0"><ChevronDown size={14}/></Button>
      </div>
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/5 shrink-0">
        {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" /> : <LinkIcon size={18} className="text-primary" />}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <h4 className="font-bold text-white text-sm truncate">{link.title}</h4>
        <p className="text-[10px] text-white/40 truncate font-mono uppercase tracking-tighter">{link.clicks || 0} KLIK • MANDIRI</p>
      </div>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" onClick={onEdit} className="h-10 w-10 text-white/40 hover:text-primary hover:bg-primary/10 transition-colors"><Edit3 size={16} /></Button>
        <Button size="icon" variant="ghost" onClick={handleDelete} className="h-10 w-10 text-white/20 hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 size={16} /></Button>
      </div>
    </Card>
  );
}

function GroupItem({ group, onEdit, onEditLink, onAddLink, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: { group: any; onEdit: () => void; onEditLink: (l: any) => void; onAddLink: () => void; onDelete: () => void, onMoveUp: () => void, onMoveDown: () => void, isFirst: boolean, isLast: boolean }) {
  const { user } = useUser();
  const db = useFirestore();
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: links } = useCollection(useMemoFirebase(() => user ? query(collection(db, 'userProfiles', user.uid, 'linkGroups', group.id, 'links'), orderBy('createdAt', 'desc')) : null, [db, user?.uid, group.id]));
  
  const handleDeleteLink = async (linkId: string) => {
    if(!user) return;
    if(confirm('Hapus link ini dari kelompok?')) {
      await deleteDoc(doc(db, 'userProfiles', user.uid, 'linkGroups', group.id, 'links', linkId));
    }
  }

  return (
    <Card className="glass-card border-none rounded-[2rem] overflow-hidden shadow-xl">
      <CardContent className="p-0">
        <div className="p-6 flex items-center gap-4 bg-white/5">
          <div className="flex flex-col gap-1 mr-1">
            <Button variant="ghost" size="icon" onClick={onMoveUp} disabled={isFirst} className="h-6 w-6 opacity-20 hover:opacity-100 disabled:opacity-0"><ChevronUp size={14}/></Button>
            <Button variant="ghost" size="icon" onClick={onMoveDown} disabled={isLast} className="h-6 w-6 opacity-20 hover:opacity-100 disabled:opacity-0"><ChevronDown size={14}/></Button>
          </div>
          <div className="w-12 h-12 rounded-xl neon-gradient p-0.5 glow-primary shrink-0">
            <div className="w-full h-full bg-background rounded-[0.7rem] flex items-center justify-center overflow-hidden">
              {group.imageUrl ? <img src={group.imageUrl} className="w-full h-full object-cover" /> : <LayoutGrid size={20} className="text-primary" />}
            </div>
          </div>
          <div className="flex-1 min-w-0 text-left cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            <h4 className="font-bold text-white text-base truncate">{group.title}</h4>
            <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">{links?.length || 0} Tautan • KLIK UNTUK LIST</p>
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={onAddLink} className="h-10 w-10 text-primary hover:bg-primary/10"><Plus size={20} /></Button>
            <Button size="icon" variant="ghost" onClick={onEdit} className="h-10 w-10 text-white/40 hover:text-primary hover:bg-primary/10"><Edit3 size={16} /></Button>
            <Button size="icon" variant="ghost" onClick={() => { if(confirm('Hapus folder ini?')){onDelete()} }} className="h-10 w-10 text-white/20 hover:text-destructive hover:bg-destructive/10"><Trash2 size={16} /></Button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="p-4 pt-0 space-y-2 bg-black/20 animate-in">
             {links?.length === 0 ? (
               <p className="py-4 text-center text-[10px] font-black uppercase text-white/10 tracking-widest">Belum ada tautan di dalam</p>
             ) : (
               links?.map((l) => (
                 <div key={l.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center">
                       {l.imageUrl ? <img src={l.imageUrl} className="w-full h-full object-cover" /> : <LinkIcon size={12} className="text-white/20" />}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                       <p className="text-xs font-bold text-white/80 truncate">{l.title}</p>
                       <p className="text-[8px] font-mono text-white/30 uppercase">{l.clicks || 0} Klik</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => onEditLink(l)} className="h-8 w-8 text-white/30 hover:text-primary"><Edit3 size={14}/></Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteLink(l.id)} className="h-8 w-8 text-white/10 hover:text-destructive"><Trash2 size={14}/></Button>
                    </div>
                 </div>
               ))
             )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

