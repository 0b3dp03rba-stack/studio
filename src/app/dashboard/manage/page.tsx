
"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Link as LinkIcon, FolderPlus, Upload, LayoutGrid, ChevronUp, ChevronDown, MousePointer2 } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, deleteDoc, query, orderBy, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import ImageCropperModal from '@/components/ImageCropperModal';

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

  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [activeCropTarget, setActiveCropTarget] = useState<'group' | 'link' | null>(null);

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, target: 'group' | 'link') => {
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
    <div className="space-y-8 animate-in pb-20">
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
              <Button onClick={handleAddLink} disabled={!newLinkTitle || !newLinkUrl} className="w-full h-12 neon-gradient text-background font-black rounded-xl glow-primary uppercase text-[10px] tracking-widest">Simpan Tautan</Button>
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
              <StandaloneLinkItem key={link.id} link={link} onMoveUp={() => handleMove(link.id, 'link', 'up')} onMoveDown={() => handleMove(link.id, 'link', 'down')} isFirst={idx === 0} isLast={idx === (standaloneLinks.length - 1)} />
            ))}
            {groups?.map((group, idx) => (
              <GroupItem key={group.id} group={group} onAddLink={() => { setSelectedGroupId(group.id); setActiveTab('link'); }} onDelete={() => deleteDoc(doc(db, 'userProfiles', user!.uid, 'linkGroups', group.id))} onMoveUp={() => handleMove(group.id, 'group', 'up')} onMoveDown={() => handleMove(group.id, 'group', 'down')} isFirst={idx === 0} isLast={idx === (groups.length - 1)} />
            ))}
          </div>
        )}
      </div>

      <ImageCropperModal imageSrc={tempImage} isOpen={cropperOpen} onClose={() => setCropperOpen(false)} onCropComplete={onCropComplete} />
    </div>
  );
}

function StandaloneLinkItem({ link, onMoveUp, onMoveDown, isFirst, isLast }: { link: any, onMoveUp: () => void, onMoveDown: () => void, isFirst: boolean, isLast: boolean }) {
  const { user } = useUser();
  const db = useFirestore();
  const handleDelete = async () => { if (!user) return; await deleteDoc(doc(db, 'userProfiles', user.uid, 'links', link.id)); };
  return (
    <Card className="glass-card border-none rounded-2xl overflow-hidden shadow-xl p-4 flex items-center gap-4">
      <div className="flex flex-col gap-1 mr-1">
        <Button variant="ghost" size="icon" onClick={onMoveUp} disabled={isFirst} className="h-6 w-6 opacity-20 hover:opacity-100"><ChevronUp size={14}/></Button>
        <Button variant="ghost" size="icon" onClick={onMoveDown} disabled={isLast} className="h-6 w-6 opacity-20 hover:opacity-100"><ChevronDown size={14}/></Button>
      </div>
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/5 shrink-0">
        {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" /> : <LinkIcon size={18} className="text-primary" />}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <h4 className="font-bold text-white text-sm truncate">{link.title}</h4>
        <p className="text-[10px] text-white/40 truncate font-mono uppercase tracking-tighter">{link.clicks || 0} KLIK</p>
      </div>
      <Button size="icon" variant="ghost" onClick={handleDelete} className="h-10 w-10 text-destructive"><Trash2 size={16} /></Button>
    </Card>
  );
}

function GroupItem({ group, onAddLink, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: { group: any; onAddLink: () => void; onDelete: () => void, onMoveUp: () => void, onMoveDown: () => void, isFirst: boolean, isLast: boolean }) {
  const { user } = useUser();
  const db = useFirestore();
  const { data: links } = useCollection(useMemoFirebase(() => user ? query(collection(db, 'userProfiles', user.uid, 'linkGroups', group.id, 'links'), orderBy('createdAt', 'desc')) : null, [db, user?.uid, group.id]));
  return (
    <Card className="glass-card border-none rounded-[2rem] overflow-hidden shadow-xl">
      <CardContent className="p-0">
        <div className="p-6 flex items-center gap-4 bg-white/5">
          <div className="flex flex-col gap-1 mr-1">
            <Button variant="ghost" size="icon" onClick={onMoveUp} disabled={isFirst} className="h-6 w-6 opacity-20 hover:opacity-100"><ChevronUp size={14}/></Button>
            <Button variant="ghost" size="icon" onClick={onMoveDown} disabled={isLast} className="h-6 w-6 opacity-20 hover:opacity-100"><ChevronDown size={14}/></Button>
          </div>
          <div className="w-12 h-12 rounded-xl neon-gradient p-0.5 glow-primary shrink-0">
            <div className="w-full h-full bg-background rounded-[0.7rem] flex items-center justify-center overflow-hidden">
              {group.imageUrl ? <img src={group.imageUrl} className="w-full h-full object-cover" /> : <LayoutGrid size={20} className="text-primary" />}
            </div>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <h4 className="font-bold text-white text-base truncate">{group.title}</h4>
            <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">{links?.length || 0} Tautan</p>
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={onAddLink} className="h-10 w-10 text-primary"><Plus size={20} /></Button>
            <Button size="icon" variant="ghost" onClick={onDelete} className="h-10 w-10 text-destructive"><Trash2 size={20} /></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
