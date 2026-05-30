
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Palette, Sparkles, Loader2, Save, Upload, LayoutGrid, Circle, Square, Hexagon, Maximize, Image as ImageIcon, Trash2, Smartphone, Layout, Columns, Layers, MousePointer2 } from 'lucide-react';
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
    <div className="space-y-8 animate-in pb-32 pt-24 px-4">
      <div className="space-y-1">
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase leading-none">Visual Lab</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">Customize Identity Hub</p>
      </div>

      <div className="grid gap-6">
        
        {/* CARD LAYOUT TEMPLATE SELECTOR */}
        <Card className="glass-card border-none rounded-[3rem] p-8 shadow-2xl space-y-6">
           <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
              <Layout size={16} /> <span>Card Content Template</span>
           </div>
           <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'classic', label: 'Classic', icon: Layers, desc: 'Centered Hero' },
                { id: 'split', label: 'Modern', icon: Columns, desc: 'Side-by-Side' },
                { id: 'minimal', label: 'Elite', icon: LayoutGrid, desc: 'Compact Hub' }
              ].map((layout) => (
                <button 
                  key={layout.id}
                  onClick={() => setLocalProfile({...localProfile, layout_type: layout.id})}
                  className={cn(
                    "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all group",
                    localProfile.layout_type === layout.id 
                    ? "bg-primary/10 border-primary text-primary shadow-[0_0_20px_rgba(255,0,0,0.2)]" 
                    : "bg-white/5 border-white/5 text-white/40 hover:border-white/20 hover:text-white"
                  )}
                >
                  <layout.icon size={24} className={cn(localProfile.layout_type === layout.id ? "animate-pulse" : "")} />
                  <div className="text-center">
                    <p className="text-[9px] font-black uppercase tracking-tighter">{layout.label}</p>
                  </div>
                </button>
              ))}
           </div>
        </Card>

        {/* IDENTITY CARD EDITOR (SAMPUL) */}
        <Card className="glass-card border-none rounded-[3rem] overflow-hidden p-8 shadow-2xl space-y-6">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest"><Maximize size={16} /><span>Identity Cover (3:1)</span></div>
              {localProfile.bannerUrl && (
                <button onClick={() => handleRemoveImage('banner')} className="text-[9px] font-black text-destructive uppercase flex items-center gap-1 hover:underline">
                  <Trash2 size={10} /> Delete Cover
                </button>
              )}
           </div>
           <div className="w-full aspect-[3/1] bg-white/5 rounded-[2rem] overflow-hidden border border-white/10 relative group shadow-inner">
              {localProfile.bannerUrl ? <img src={localProfile.bannerUrl} className="w-full h-full object-cover" alt="Banner Preview" /> : <div className="w-full h-full flex items-center justify-center text-white/5"><ImageIcon size={32} /></div>}
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity backdrop-blur-sm">
                 <div className="flex flex-col items-center gap-2">
                    <Upload className="text-white" size={24} />
                    <span className="text-[10px] font-black text-white uppercase">Upload Cover Photo</span>
                 </div>
                 <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, 'banner')} />
              </label>
           </div>
        </Card>

        {/* SHAPE & UI STYLE */}
        <Card className="glass-card border-none rounded-[3rem] p-8 shadow-2xl space-y-8">
           <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
                 <MousePointer2 size={16} /> <span>Global UI Shape</span>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { id: 'square', icon: Square, label: 'Square' },
                  { id: 'rounded', icon: Maximize, label: 'Soft' },
                  { id: 'circle', icon: Circle, label: 'Circle' },
                  { id: 'hexagon', icon: Smartphone, label: 'Pill' }
                ].map((s) => (
                  <button 
                    key={s.id} 
                    onClick={() => setLocalProfile({...localProfile, profile_shape: s.id})}
                    className={cn(
                      "aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border-2", 
                      localProfile.profile_shape === s.id 
                      ? "neon-gradient text-background border-primary shadow-xl scale-105" 
                      : "bg-white/5 text-white/20 border-white/5 hover:border-white/20"
                    )}
                  >
                    <s.icon size={20} />
                    <span className="text-[7px] font-black uppercase tracking-widest">{s.label}</span>
                  </button>
                ))}
              </div>
           </div>
           
           <div className="pt-4">
              <Button onClick={handleSave} disabled={isSaving} className="w-full h-20 neon-gradient text-background font-black rounded-[2rem] shadow-2xl uppercase tracking-[0.3em] text-xs glow-primary active:scale-95 transition-all">
                {isSaving ? <Loader2 className="animate-spin" /> : "PUBLISH DESIGN"}
              </Button>
           </div>
        </Card>

        {/* WALLPAPER EDITOR */}
        <Card className="glass-card border-none rounded-[3rem] overflow-hidden p-8 shadow-2xl space-y-6">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-secondary font-black text-[10px] uppercase tracking-widest"><ImageIcon size={16} /><span>Full Wallpaper (9:16)</span></div>
              {localProfile.wallpaperUrl && (
                <button onClick={() => handleRemoveImage('wallpaper')} className="text-[9px] font-black text-destructive uppercase flex items-center gap-1 hover:underline">
                  <Trash2 size={10} /> Delete Wallpaper
                </button>
              )}
           </div>
           <div className="flex gap-6 items-center">
              <div className="w-24 aspect-[9/16] bg-white/5 rounded-[1.5rem] overflow-hidden border border-white/10 relative group shrink-0 shadow-2xl">
                {localProfile.wallpaperUrl ? <img src={localProfile.wallpaperUrl} className="w-full h-full object-cover" alt="Wallpaper Preview" /> : <div className="w-full h-full flex items-center justify-center text-white/5"><Smartphone size={24} /></div>}
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity backdrop-blur-sm">
                   <Upload className="text-white" size={20} />
                   <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, 'wallpaper')} />
                </label>
              </div>
              <div className="space-y-2">
                 <p className="text-xs font-black text-white uppercase tracking-tight">Atmosfer Profil</p>
                 <p className="text-[9px] text-white/40 leading-relaxed uppercase font-medium">Upload a full background for an exclusive look.</p>
              </div>
           </div>
        </Card>
      </div>
      <ImageCropperModal imageSrc={tempImage} isOpen={cropperOpen} onClose={() => setCropperOpen(false)} onCropComplete={onCropComplete} aspect={getAspect()} />
    </div>
  );
}
