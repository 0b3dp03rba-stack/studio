
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Link as LinkIcon, FolderPlus, Upload, LayoutGrid, ChevronUp, ChevronDown, Edit3, Loader2, ListTree, ChevronDown as ChevronDownIcon, MousePointer2 } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, deleteDoc, query, orderBy, updateDoc, writeBatch, onSnapshot, getDoc } from 'firebase/firestore';
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
      toast({ title: "Koleksi Dibuat" });
    } catch (e) { toast({ variant: "destructive", title: "Gagal" }); }
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
        button_style: 'solid',
        button_radius: 'rounded',
        createdAt: serverTimestamp(),
        groupId: targetGroupId === 'main' ? null : targetGroupId
      });
      setNewLinkTitle('');
      setNewLinkUrl('');
      setNewLinkImage('');
      toast({ title: "Tautan Ditambahkan" });
    } catch (e) { toast({ variant: "destructive", title: "Gagal" }); }
  };

  const handleSaveEdit = async () => {
    if (!user || !editingItem) return;
    setIsSavingEdit(true);
    try {
      if (editingItem.type === 'group') {
        const docRef = doc(db, 'userProfiles', user.uid, 'linkGroups', editingItem.id);
        await updateDoc(docRef, { title: editingItem.title, imageUrl: editingItem.imageUrl || '', updatedAt: serverTimestamp() });
      } else {
        const docRef = editingItem.groupId 
          ? doc(db, 'userProfiles', user.uid, 'linkGroups', editingItem.groupId, 'links', editingItem.id)
          : doc(db, 'userProfiles', user.uid, 'links', editingItem.id);
        
        await updateDoc(docRef, {
          title: editingItem.title,
          url: editingItem.url,
          imageUrl: editingItem.imageUrl || '',
          button_style: editingItem.button_style || 'solid',
          button_radius: editingItem.button_radius || 'rounded',
          updatedAt: serverTimestamp()
        });
      }
      toast({ title: "Perubahan Disimpan" });
      setEditingItem(null);
    } catch (e) { toast({ variant: "destructive", title: "Gagal Simpan" }); } finally { setIsSavingEdit(false); }
  };

  const confirmDelete = async () => {
    if (!user || !itemToDelete) return;
    try {
      const docRef = itemToDelete.type === 'group' 
        ? doc(db, 'userProfiles', user.uid, 'linkGroups', itemToDelete.id)
        : (itemToDelete.groupId ? doc(db, 'userProfiles', user.uid, 'linkGroups', itemToDelete.groupId, 'links', itemToDelete.id) : doc(db, 'userProfiles', user.uid, 'links', itemToDelete.id));
      await deleteDoc(docRef);
      toast({ title: "Dihapus" });
    } catch (e) { toast({ variant: "destructive", title: "Gagal Hapus" }); } finally { setItemToDelete(null); }
  };

  return (
    <div className="space-y-8 animate-in pb-32 pt-24">
      <div className="space-y-1">
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase leading-none">Hub Catalog</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">Manajemen Katalog & Folder</p>
      </div>

      <div className="grid gap-6">
        <div className="flex bg-white/5 p-1 rounded-2xl">
          <button onClick={() => setActiveTab('group')} className={`flex-1 py-3.5 text-[10px] font-black uppercase rounded-xl transition-all ${activeTab === 'group' ? 'neon-gradient text-background shadow-xl' : 'text-white/40'}`}>+ Koleksi</button>
          <button onClick={() => setActiveTab('link')} className={`flex-1 py-3.5 text-[10px] font-black uppercase rounded-xl transition-all ${activeTab === 'link' ? 'neon-gradient text-background shadow-xl' : 'text-white/40'}`}>+ Tautan</button>
        </div>

        {activeTab === 'group' && (
          <Card className="glass-card border-none rounded-[2rem] p-6 shadow-2xl">
            <CardContent className="p-0 space-y-4">
              <Input placeholder="Nama Koleksi (Folder)" value={newGroupTitle} onChange={(e) => setNewGroupTitle(e.target.value)} className="bg-white/5 border-none h-12 rounded-xl px-4 font-bold" />
              <label className="flex items-center justify-center gap-2 w-full h-12 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/10 transition-all">
                <Upload size={16} className="text-primary" /><span className="text-[10px] font-black uppercase text-white/60">{newGroupImage ? 'Ganti Ikon' : 'Upload Ikon'}</span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, 'group')} />
              </label>
              <Button onClick={handleAddGroup} disabled={!newGroupTitle} className="w-full h-12 neon-gradient text-background font-black rounded-xl uppercase text-[10px] tracking-widest">Buat Koleksi</Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'link' && (
          <Card className="glass-card border-none rounded-[2rem] p-6 shadow-2xl">
            <CardContent className="p-0 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-white/30 ml-1">Simpan Dalam:</label>
                <Select value={targetGroupId} onValueChange={setTargetGroupId}>
                  <SelectTrigger className="bg-white/5 border-none h-12 rounded-xl text-[10px] font-black uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-none rounded-xl">
                    <SelectItem value="main" className="text-xs font-bold uppercase">Main Hub</SelectItem>
                    {groups?.map(g => <SelectItem key={g.id} value={g.id} className="text-xs font-bold uppercase">{g.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Input placeholder="Judul Tautan" value={newLinkTitle} onChange={(e) => setNewLinkTitle(e.target.value)} className="bg-white/5 h-12 rounded-xl px-4 font-bold border-none" />
              <Input placeholder="URL (Tanpa https://)" value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} className="bg-white/5 h-12 rounded-xl px-4 font-bold border-none" />
              <label className="flex items-center justify-center gap-2 w-full h-12 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/10 transition-all">
                <Upload size={16} className="text-primary" /><span className="text-[10px] font-black uppercase text-white/60">Upload Foto Link</span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, 'link')} />
              </label>
              <Button onClick={handleAddLink} disabled={!newLinkTitle || !newLinkUrl} className="w-full h-12 neon-gradient text-background font-black rounded-xl uppercase text-[10px] tracking-widest">Simpan Tautan</Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-5">
        <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-white/50 flex items-center gap-2 px-1"><ListTree size={16} className="text-primary" /> Katalog Saat Ini</h3>
        
        {(isGroupsLoading || isLinksLoading) ? (
          <div className="py-20 text-center animate-pulse text-primary font-black uppercase text-[10px]">Sinkronisasi...</div>
        ) : (
          <div className="space-y-4">
            {groups?.map((group) => (
              <div key={group.id} className="space-y-2">
                <Card className="glass-card border-none rounded-[2rem] p-5 flex items-center gap-4 relative shadow-xl">
                  <div onClick={() => toggleGroupExpand(group.id)} className="flex-1 flex items-center gap-4 cursor-pointer">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                      {group.imageUrl ? <img src={group.imageUrl} className="w-full h-full object-cover" /> : <LayoutGrid size={24} className="text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <h4 className="font-black text-white text-base truncate uppercase">{group.title}</h4>
                      <p className="text-[8px] text-white/40 uppercase font-black flex items-center gap-1.5">{groupLinksData[group.id]?.length || 0} ITEMS <ChevronDownIcon size={10} className={expandedGroups[group.id] ? "rotate-180" : ""} /></p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditingItem({ ...group, type: 'group' })} className="h-10 w-10 text-white/40 hover:text-white rounded-xl"><Edit3 size={18} /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setItemToDelete({ ...group, type: 'group' })} className="h-10 w-10 text-destructive/40 hover:text-destructive rounded-xl"><Trash2 size={18} /></Button>
                  </div>
                </Card>

                {expandedGroups[group.id] && (
                  <div className="ml-10 space-y-3 animate-in slide-in-from-top-2 border-l border-white/10 pl-4">
                    {groupLinksData[group.id]?.map((link) => (
                      <div key={link.id} className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden shrink-0 border border-white/5">
                           {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" /> : <LinkIcon size={14} className="text-primary/50" />}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                           <p className="text-sm font-bold text-white/90 truncate">{link.title}</p>
                           <p className="text-[8px] text-white/20 truncate uppercase font-mono">{link.clicks || 0} CLICKS</p>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => setEditingItem({ ...link, type: 'link' })} className="h-8 w-8 text-white/20 hover:text-primary rounded-lg"><Edit3 size={14} /></Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="pt-8 border-t border-white/5">
               <p className="text-[9px] font-black uppercase text-white/20 mb-4 px-2 tracking-[0.4em]">Standalone Links</p>
               {standaloneLinks?.map((link) => (
                 <Card key={link.id} className="glass-card border-none rounded-2xl p-4 flex items-center gap-4 mb-3 shadow-xl">
                   <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                     {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" /> : <LinkIcon size={18} className="text-primary" />}
                   </div>
                   <div className="flex-1 min-w-0 text-left">
                     <h4 className="font-bold text-white text-sm truncate uppercase">{link.title}</h4>
                     <p className="text-[8px] text-white/20 uppercase tracking-tighter">{link.clicks || 0} CLICKS</p>
                   </div>
                   <Button size="icon" variant="ghost" onClick={() => setEditingItem({ ...link, type: 'link' })} className="h-10 w-10 text-white/40 hover:text-primary rounded-xl"><Edit3 size={18} /></Button>
                   <Button size="icon" variant="ghost" onClick={() => setItemToDelete({ ...link, type: 'link' })} className="h-10 w-10 text-white/20 hover:text-destructive rounded-xl"><Trash2 size={18} /></Button>
                 </Card>
               ))}
            </div>
          </div>
        )}
      </div>

      <ImageCropperModal imageSrc={tempImage} isOpen={cropperOpen} onClose={() => setCropperOpen(false)} onCropComplete={onCropComplete} />

      {/* MODAL EDIT DENGAN FITUR CARD STYLE */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="glass-card border-none rounded-[2.5rem] p-8 shadow-2xl max-w-md mx-auto text-left">
          <DialogHeader><DialogTitle className="text-xl font-black uppercase tracking-tighter text-white">Edit Hub Item</DialogTitle></DialogHeader>
          <div className="space-y-5 py-4">
             <Input value={editingItem?.title || ''} onChange={(e) => setEditingItem({...editingItem, title: e.target.value})} placeholder="Judul" className="bg-white/5 border-none h-12 rounded-xl font-bold" />
             
             {editingItem?.type === 'link' && (
               <>
                 <Input value={editingItem?.url || ''} onChange={(e) => setEditingItem({...editingItem, url: e.target.value})} placeholder="URL" className="bg-white/5 border-none h-12 rounded-xl font-medium" />
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black uppercase text-white/30 ml-1">Card Style</label>
                       <Select value={editingItem.button_style} onValueChange={(v) => setEditingItem({...editingItem, button_style: v})}>
                         <SelectTrigger className="bg-white/5 border-none h-12 rounded-xl text-[10px] font-black uppercase"><SelectValue /></SelectTrigger>
                         <SelectContent className="glass-card border-none rounded-xl">
                            <SelectItem value="solid" className="text-xs uppercase font-bold">Solid</SelectItem>
                            <SelectItem value="outline" className="text-xs uppercase font-bold">Outline</SelectItem>
                            <SelectItem value="glassmorphism" className="text-xs uppercase font-bold">Glass</SelectItem>
                            <SelectItem value="gradient" className="text-xs uppercase font-bold">Gradient</SelectItem>
                         </SelectContent>
                       </Select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black uppercase text-white/30 ml-1">Card Radius</label>
                       <Select value={editingItem.button_radius} onValueChange={(v) => setEditingItem({...editingItem, button_radius: v})}>
                         <SelectTrigger className="bg-white/5 border-none h-12 rounded-xl text-[10px] font-black uppercase"><SelectValue /></SelectTrigger>
                         <SelectContent className="glass-card border-none rounded-xl">
                            <SelectItem value="square" className="text-xs uppercase font-bold">Square</SelectItem>
                            <SelectItem value="rounded" className="text-xs uppercase font-bold">Rounded</SelectItem>
                            <SelectItem value="pill" className="text-xs uppercase font-bold">Full Pill</SelectItem>
                         </SelectContent>
                       </Select>
                    </div>
                 </div>
               </>
             )}
          </div>
          <DialogFooter className="gap-3">
             <Button variant="ghost" onClick={() => setEditingItem(null)} className="rounded-xl font-black uppercase text-[10px] flex-1">Batal</Button>
             <Button onClick={handleSaveEdit} disabled={isSavingEdit} className="neon-gradient text-background font-black rounded-xl px-8 uppercase text-[10px] flex-1">
               {isSavingEdit ? <Loader2 className="animate-spin" size={16} /> : "Simpan"}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent className="glass-card border-none rounded-[2rem]">
          <AlertDialogHeader><AlertDialogTitle className="text-white">Konfirmasi Hapus</AlertDialogTitle><AlertDialogDescription className="text-white/40">Item "{itemToDelete?.title}" akan dihapus selamanya.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="bg-white/5 border-none text-white rounded-xl">Batal</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white rounded-xl">HAPUS</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
