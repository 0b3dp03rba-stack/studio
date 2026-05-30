"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Palette, Sparkles, Loader2, Save, Upload, LayoutGrid, Circle, Square, Hexagon, Maximize, Image as ImageIcon, Trash2, Smartphone, Layout, Columns, Layers, MousePointer2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import ImageCropperModal from '@/components/ImageCropperModal';
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
    profile_shape: 'rounded',
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
        profile_shape: localProfile.profile_shape || 'rounded',
        layout_type: localProfile.layout_type || 'classic',
        avatarUrl: localProfile.avatarUrl || '',
        bannerUrl: localProfile.bannerUrl || '',
        wallpaperUrl: localProfile.wallpaperUrl || '',
        updatedAt: serverTimestamp() 
      });
      toast({ title: "Visual Diperbarui" });
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
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">Customize Identity Architecture</p>
      </div>

      <div className="grid gap-6">
        
        {/* TEMPLATE CARD LAYOUT */}
        <Card className="glass-card border-none rounded-[3rem] p-8 shadow-2xl space-y-6">
           <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
              <Layout size={16} /> <span>Card Layout Template</span>
           </div>
           <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'classic', label: 'Classic', icon: Layers },
                { id: 'split', label: 'Modern', icon: Columns },
                { id: 'minimal', label: 'Elite', icon: LayoutGrid }
              ].map((layout) => (
                <button 
                  key={layout.id}
                  onClick={() => setLocalProfile({...localProfile, layout_type: layout.id})}
                  className={cn(
                    "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                    localProfile.layout_type === layout.id 
                    ? "bg-primary/10 border-primary text-primary shadow-[0_0_20px_rgba(255,0,0,0.2)]" 
                    : "bg-white/5 border-white/5 text-white/40 hover:border-white/20"
                  )}
                >
                  <layout.icon size={24} />
                  <p className="text-[9px] font-black uppercase tracking-tighter">{layout.label}</p>
                </button>
              ))}
           </div>
        </Card>

        {/* GLOBAL UI SHAPE */}
        <Card className="glass-card border-none rounded-[3rem] p-8 shadow-2xl space-y-6">
           <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
              <MousePointer2 size={16} /> <span>Global Theme Shape</span>
           </div>
           <div className="grid grid-cols-4 gap-4">
              {[
                { id: 'square', icon: Square, label: 'Square' },
                { id: 'rounded', icon: Maximize, label: 'Soft' },
                { id: 'circle', icon: Circle, label: 'Pill' },
                { id: 'hexagon', icon: Hexagon, label: 'Hex' }
              ].map((s) => (
                <button 
                  key={s.id} 
                  onClick={() => setLocalProfile({...localProfile, profile_shape: s.id})}
                  className={cn(
                    "aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border-2", 
                    localProfile.profile_shape === s.id 
                    ? "neon-gradient text-background border-primary" 
                    : "bg-white/5 text-white/20 border-white/5"
                  )}
                >
                  <s.icon size={20} />
                  <span className="text-[7px] font-black uppercase tracking-widest">{s.label}</span>
                </button>
              ))}
           </div>
        </Card>

        {/* UPLOAD SECTIONS */}
        <div className="grid grid-cols-2 gap-4">
           <Card className="glass-card border-none rounded-[2rem] p-6 space-y-4">
              <p className="text-[9px] font-black uppercase text-white/40 text-center tracking-widest">Identity Cover</p>
              <div className="aspect-[3/1] bg-white/5 rounded-xl overflow-hidden border border-white/10 relative group">
                 {localProfile.bannerUrl ? <img src={localProfile.bannerUrl} className="w-full h-full object-cover" /> : <ImageIcon className="m-auto text-white/5" />}
                 <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                    <Upload size={16} />
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, 'banner')} />
                 </label>
              </div>
           </Card>
           <Card className="glass-card border-none rounded-[2rem] p-6 space-y-4">
              <p className="text-[9px] font-black uppercase text-white/40 text-center tracking-widest">Full Wallpaper</p>
              <div className="aspect-[9/16] h-12 mx-auto bg-white/5 rounded-lg overflow-hidden border border-white/10 relative group">
                 {localProfile.wallpaperUrl ? <img src={localProfile.wallpaperUrl} className="w-full h-full object-cover" /> : <Smartphone className="m-auto text-white/5" />}
                 <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                    <Upload size={16} />
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, 'wallpaper')} />
                 </label>
              </div>
           </Card>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full h-16 neon-gradient text-background font-black rounded-3xl shadow-xl uppercase tracking-widest">
           {isSaving ? <Loader2 className="animate-spin" /> : "PUBLISH DESIGN"}
        </Button>
      </div>

      <ImageCropperModal imageSrc={tempImage} isOpen={cropperOpen} onClose={() => setCropperOpen(false)} onCropComplete={onCropComplete} aspect={getAspect()} />
    </div>
  );
}
