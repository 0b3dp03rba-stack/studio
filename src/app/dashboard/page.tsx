
"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Link as LinkIcon, ExternalLink, AtSign, FolderPlus, Upload, X, LayoutGrid, ChevronUp, ChevronDown, Star, MessageSquareQuote } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, deleteDoc, query, orderBy, updateDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import ImageCropperModal from '@/components/ImageCropperModal';

export default function DashboardPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'group' | 'link' | 'rating'>('group');
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [newGroupImage, setNewGroupImage] = useState('');
  
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkImage, setNewLinkImage] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Rating State
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isRatingSaving, setIsRatingSaving] = useState(false);

  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [activeCropTarget, setActiveCropTarget] = useState<'group' | 'link' | null>(null);

  const profileRef = useMemoFirebase(() => user ? doc(db, 'userProfiles', user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const userReviewRef = useMemoFirebase(() => user ? doc(db, 'platformReviews', user.uid) : null, [db, user?.uid]);
  const { data: userReview } = useDoc(userReviewRef);

  // Initialize rating from existing review
  useState(() => {
    if (userReview) {
      setRating(userReview.rating);
      setComment(userReview.comment);
    }
  });

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
      toast({ title: "Kelompok Dibuat", description: "Berhasil menambahkan kelompok baru." });
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

  const handleSaveRating = async () => {
    if (!user || !profile || rating === 0 || !comment.trim()) {
      toast({ variant: "destructive", title: "Lengkapi Form", description: "Bintang dan komentar wajib diisi." });
      return;
    }
    setIsRatingSaving(true);
    try {
      await setDoc(doc(db, 'platformReviews', user.uid), {
        userId: user.uid,
        username: profile.username,
        displayName: profile.displayName || profile.username,
        avatarUrl: profile.avatarUrl || '',
        rating: rating,
        comment: comment.trim(),
        createdAt: serverTimestamp()
      }, { merge: true });
      toast({ title: "Ulasan Terkirim", description: "Terima kasih atas dukungannya!" });
      setActiveTab('group');
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal mengirim rating" });
    } finally {
      setIsRatingSaving(false);
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
          <button onClick={() => setActiveTab('group')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${activeTab === 'group' ? 'neon-gradient text-white glow-primary' : 'text-white/40'}`}>Buat Kelompok</button>
          <button onClick={() => { setActiveTab('link'); setSelectedGroupId(null); }} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${activeTab === 'link' ? 'neon-gradient text-white glow-primary' : 'text-white/40'}`}>Link Mandiri</button>
          <button onClick={() => setActiveTab('rating')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${activeTab === 'rating' ? 'neon-gradient text-white glow-primary' : 'text-white/40'}`}>Rating Linku</button>
        </div>

        {activeTab === 'group' && (
          <Card className="glass-card border-none rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 neon-gradient opacity-5"></div>
            <CardContent className="p-0 space-y-4 relative z-10 text-left">
              <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest"><FolderPlus size={16} /><span>Buat kelompok baru</span></div>
              <Input placeholder="Nama Kelompok" value={newGroupTitle} onChange={(e) => setNewGroupTitle(e.target.value)} className="bg-white/5 border-white/5 h-12 rounded-xl px-4 font-bold" />
              <label className="flex items-center justify-center gap-2 w-full h-12 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/10 transition-all">
                <Upload size={16} className="text-primary" /><span className="text-[10px] font-black uppercase text-white/60">{newGroupImage ? 'Ganti Foto' : 'Unggah Foto'}</span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, 'group')} />
              </label>
              <Button onClick={handleAddGroup} disabled={!newGroupTitle} className="w-full h-12 neon-gradient text-white font-black rounded-xl glow-primary uppercase text-[10px]">Simpan Kelompok</Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'link' && (
          <Card className="glass-card border-none rounded-[2rem] p-6 shadow-2xl text-left">
            <CardContent className="p-0 space-y-4">
              <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest"><LinkIcon size={16} /><span>Tambah link mandiri</span></div>
              <Input placeholder="Judul Tautan" value={newLinkTitle} onChange={(e) => setNewLinkTitle(e.target.value)} className="bg-white/5 h-12 rounded-xl px-4 font-bold" />
              <Input placeholder="URL (Misal: instagram.com/user)" value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} className="bg-white/5 h-12 rounded-xl px-4 font-bold" />
              <label className="flex items-center justify-center gap-2 w-full h-12 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/10 transition-all">
                <Upload size={16} className="text-primary" /><span className="text-[10px] font-black uppercase text-white/60">{newLinkImage ? 'Ganti Foto' : 'Unggah Foto'}</span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, 'link')} />
              </label>
              <Button onClick={handleAddLink} disabled={!newLinkTitle || !newLinkUrl} className="w-full h-12 neon-gradient text-white font-black rounded-xl glow-primary uppercase text-[10px]">Simpan Tautan</Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'rating' && (
          <Card className="glass-card border-none rounded-[2rem] p-6 shadow-2xl text-left">
            <CardContent className="p-0 space-y-4">
              <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
                <Star size={16} />
                <span>Bagaimana pengalaman Anda di Linku?</span>
              </div>
              <div className="flex justify-center gap-3 py-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setRating(s)} className={`transition-all hover:scale-110 active:scale-95 ${rating >= s ? 'text-primary' : 'text-white/10'}`}>
                    <Star size={40} fill={rating >= s ? "currentColor" : "none"} strokeWidth={3} />
                  </button>
                ))}
              </div>
              <Textarea 
                placeholder="Tulis ulasan jujur Anda di sini..." 
                value={comment} 
                onChange={(e) => setComment(e.target.value)}
                className="bg-white/5 border-white/5 h-32 rounded-2xl p-4 text-sm font-medium leading-relaxed"
              />
              <Button onClick={handleSaveRating} disabled={isRatingSaving || rating === 0 || !comment} className="w-full h-14 neon-gradient text-white font-black rounded-xl glow-primary uppercase text-[10px]">
                {isRatingSaving ? "Mengirim..." : (userReview ? "Perbarui Ulasan" : "Kirim Rating Sekarang")}
              </Button>
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
        <p className="text-[10px] text-white/40 truncate font-mono">{link.url}</p>
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
    <Card className="glass-card border-none rounded-[1.5rem] overflow-hidden shadow-xl">
      <CardContent className="p-0">
        <div className="p-6 flex items-center gap-4 bg-white/5">
          <div className="flex flex-col gap-1 mr-1">
            <Button variant="ghost" size="icon" onClick={onMoveUp} disabled={isFirst} className="h-6 w-6 opacity-20 hover:opacity-100"><ChevronUp size={14}/></Button>
            <Button variant="ghost" size="icon" onClick={onMoveDown} disabled={isLast} className="h-6 w-6 opacity-20 hover:opacity-100"><ChevronDown size={14}/></Button>
          </div>
          <div className="w-12 h-12 rounded-xl neon-gradient p-0.5 glow-primary shrink-0">
            <div className="w-full h-full bg-black rounded-[0.7rem] flex items-center justify-center overflow-hidden">
              {group.imageUrl ? <img src={group.imageUrl} className="w-full h-full object-cover" /> : <LayoutGrid size={20} className="text-primary" />}
            </div>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <h4 className="font-bold text-white text-base truncate">{group.title}</h4>
            <p className="text-[10px] text-white/30 uppercase font-black">{links?.length || 0} tautan</p>
          </div>
          <div className="flex gap-2">
            <Button size="icon" variant="ghost" onClick={onAddLink} className="h-10 w-10 text-primary"><Plus size={18} /></Button>
            <Button size="icon" variant="ghost" onClick={onDelete} className="h-10 w-10 text-destructive"><Trash2 size={18} /></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
