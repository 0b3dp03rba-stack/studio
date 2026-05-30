
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Palette, Sparkles, Loader2, Save, Upload, LayoutGrid, Circle, Square, Hexagon, Maximize, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import ImageCropperModal from '@/components/ImageCropperModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function ThemePage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const profileRef = useMemoFirebase(() => user ? doc(db, 'userProfiles', user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const [isSaving, setIsSaving] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [cropTarget, setActiveCropTarget] = useState<'avatar' | 'banner' | 'wallpaper'>('avatar');

  const [localProfile, setLocalProfile] = useState<any>({
    profile_shape: 'circle',
    layout_type: 'classic',
    themeColor: '#ff0000',
    themeColorSecondary: '#ffea00',
    avatarUrl: '',
    bannerUrl: '',
    wallpaperUrl: ''
  });

  useEffect(() => {
    if (profile) setLocalProfile({ ...profile });
  }, [profile]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, target: 'avatar' | 'banner' | 'wallpaper') => {
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
    if (cropTarget === 'avatar') setLocalProfile({ ...localProfile, avatarUrl: cropped });
    else if (cropTarget === 'banner') setLocalProfile({ ...localProfile, bannerUrl: cropped });
    else setLocalProfile({ ...localProfile, wallpaperUrl: cropped });
  };

  const handleSave = async () => {
    if (!profileRef) return;
    setIsSaving(true);
    try {
      await updateDoc(profileRef, { 
        profile_shape: localProfile.profile_shape || 'circle',
        layout_type: localProfile.layout_type || 'classic',
        avatarUrl: localProfile.avatarUrl || '',
        bannerUrl: localProfile.bannerUrl || '',
        wallpaperUrl: localProfile.wallpaperUrl || '',
        updatedAt: serverTimestamp() 
      });
      toast({ title: "Visual Diperbarui", description: "Tampilan profil Anda telah diperbarui." });
    } catch (e) { 
      toast({ variant: "destructive", title: "Gagal Simpan" }); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const handleRemoveImage = (target: 'banner' | 'wallpaper') => {
    if (target === 'banner') setLocalProfile({ ...localProfile, bannerUrl: '' });
    else setLocalProfile({ ...localProfile, wallpaperUrl: '' });
  };

  const getAspect = () => {
    if (cropTarget === 'banner') return 3/1;
    if (cropTarget === 'wallpaper') return 9/16;
    return 1;
  };

  return (
    <div className="space-y-8 animate-in pb-32 pt-24">
      <div className="space-y-1">
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase leading-none">Visual Lab</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">Kustomisasi Estetika Identitas</p>
      </div>

      <div className="grid gap-6">
        {/* BANNER EDITOR */}
        <Card className="glass-card border-none rounded-[2.5rem] overflow-hidden p-6 shadow-2xl space-y-6">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest"><Maximize size={16} /><span>Cover Banner (3:1)</span></div>
              {localProfile.bannerUrl && (
                <button onClick={() => handleRemoveImage('banner')} className="text-[9px] font-black text-destructive uppercase flex items-center gap-1 hover:underline">
                  <Trash2 size={10} /> Hapus
                </button>
              )}
           </div>
           <div className="w-full aspect-[3/1] bg-white/5 rounded-2xl overflow-hidden border border-white/10 relative group">
              {localProfile.bannerUrl ? <img src={localProfile.bannerUrl} className="w-full h-full object-cover" alt="Banner Preview" /> : <div className="w-full h-full flex items-center justify-center text-white/10"><ImageIcon size={32} /></div>}
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                 <div className="flex flex-col items-center gap-2">
                    <Upload className="text-white" size={24} />
                    <span className="text-[10px] font-black text-white uppercase">Upload Banner</span>
                 </div>
                 <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, 'banner')} />
              </label>
           </div>
        </Card>

        {/* WALLPAPER EDITOR */}
        <Card className="glass-card border-none rounded-[2.5rem] overflow-hidden p-6 shadow-2xl space-y-6">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest"><ImageIcon size={16} /><span>Wallpaper (9:16)</span></div>
              {localProfile.wallpaperUrl && (
                <button onClick={() => handleRemoveImage('wallpaper')} className="text-[9px] font-black text-destructive uppercase flex items-center gap-1 hover:underline">
                  <Trash2 size={10} /> Hapus
                </button>
              )}
           </div>
           <div className="flex gap-6 items-center">
              <div className="w-32 aspect-[9/16] bg-white/5 rounded-2xl overflow-hidden border border-white/10 relative group shrink-0">
                {localProfile.wallpaperUrl ? <img src={localProfile.wallpaperUrl} className="w-full h-full object-cover" alt="Wallpaper Preview" /> : <div className="w-full h-full flex items-center justify-center text-white/5"><ImageIcon size={24} /></div>}
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                   <Upload className="text-white" size={20} />
                   <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, 'wallpaper')} />
                </label>
              </div>
              <div className="space-y-2">
                 <p className="text-xs font-bold text-white uppercase">Latar Belakang Penuh</p>
                 <p className="text-[10px] text-white/40 leading-relaxed uppercase">Unggah wallpaper untuk membuat profil Anda jauh lebih imersif dan mewah.</p>
              </div>
           </div>
        </Card>

        {/* SHAPE & LAYOUT */}
        <Card className="glass-card border-none rounded-[2.5rem] p-6 shadow-2xl space-y-8">
           <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-white/30 tracking-[0.3em] ml-1">Avatar Shape</label>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { id: 'circle', icon: Circle },
                  { id: 'square', icon: Square },
                  { id: 'rounded', icon: Maximize },
                  { id: 'hexagon', icon: Hexagon }
                ].map((s) => (
                  <button 
                    key={s.id} 
                    onClick={() => setLocalProfile({...localProfile, profile_shape: s.id})}
                    className={cn("aspect-square rounded-2xl flex items-center justify-center transition-all", localProfile.profile_shape === s.id ? "neon-gradient text-background shadow-xl" : "bg-white/5 text-white/20")}
                  >
                    <s.icon size={24} />
                  </button>
                ))}
              </div>
           </div>

           <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-white/30 tracking-[0.3em] ml-1">Profile Layout</label>
              <Select value={localProfile.layout_type} onValueChange={(v) => setLocalProfile({...localProfile, layout_type: v})}>
                <SelectTrigger className="bg-white/5 border-none h-14 rounded-2xl font-black uppercase text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card border-none rounded-xl">
                   <SelectItem value="classic" className="text-xs uppercase font-bold">Classic (Center)</SelectItem>
                   <SelectItem value="split" className="text-xs uppercase font-bold">Split (Modern)</SelectItem>
                   <SelectItem value="minimal" className="text-xs uppercase font-bold">Minimal (Sidebar)</SelectItem>
                </SelectContent>
              </Select>
           </div>
           
           <Button onClick={handleSave} disabled={isSaving} className="w-full h-16 neon-gradient text-background font-black rounded-3xl shadow-xl uppercase tracking-widest text-sm">
             {isSaving ? <Loader2 className="animate-spin" /> : "Terapkan Desain"}
           </Button>
        </Card>
      </div>
      <ImageCropperModal imageSrc={tempImage} isOpen={cropperOpen} onClose={() => setCropperOpen(false)} onCropComplete={onCropComplete} aspect={getAspect()} />
    </div>
  );
}
