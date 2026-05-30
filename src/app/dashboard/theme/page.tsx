
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Palette, Sparkles, Loader2, Save, Upload, LayoutGrid, Circle, Square, Hexagon, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import ImageCropperModal from '@/components/ImageCropperModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils-app';

export default function ThemePage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const profileRef = useMemoFirebase(() => user ? doc(db, 'userProfiles', user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const [isSaving, setIsSaving] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [cropTarget, setActiveCropTarget] = useState<'avatar' | 'banner'>('avatar');

  const [localProfile, setLocalProfile] = useState<any>({
    profile_shape: 'circle',
    layout_type: 'classic',
    themeColor: '#ff0000',
    themeColorSecondary: '#ffea00',
    avatarUrl: '',
    bannerUrl: ''
  });

  useEffect(() => {
    if (profile) setLocalProfile({ ...profile });
  }, [profile]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, target: 'avatar' | 'banner') => {
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
    else setLocalProfile({ ...localProfile, bannerUrl: cropped });
  };

  const handleSave = async () => {
    if (!profileRef) return;
    setIsSaving(true);
    try {
      await updateDoc(profileRef, { ...localProfile, updatedAt: serverTimestamp() });
      toast({ title: "Visual Diperbarui" });
    } catch (e) { toast({ variant: "destructive", title: "Gagal Simpan" }); } finally { setIsSaving(false); }
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
           <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest"><Maximize size={16} /><span>Cover Banner</span></div>
           <div className="w-full aspect-[3/1] bg-white/5 rounded-2xl overflow-hidden border border-white/10 relative group">
              {localProfile.bannerUrl ? <img src={localProfile.bannerUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/10"><Sparkles size={32} /></div>}
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                 <Upload className="text-white" size={24} />
                 <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, 'banner')} />
              </label>
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
      <ImageCropperModal imageSrc={tempImage} isOpen={cropperOpen} onClose={() => setCropperOpen(false)} onCropComplete={onCropComplete} />
    </div>
  );
}
