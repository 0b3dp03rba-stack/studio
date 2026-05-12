
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Palette, Sparkles, Loader2, Save, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getRecommendedSecondary, PRESTIGE_SECONDARIES } from '@/lib/utils-app';
import { getAIColorRecommendation } from '@/ai/flows/color-recommendation-flow';

export default function ThemePage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const profileRef = useMemoFirebase(() => user ? doc(db, 'userProfiles', user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const [themeColor, setThemeColor] = useState('#ff0000');
  const [themeColorSecondary, setThemeColorSecondary] = useState('#ffea00');
  const [isSaving, setIsSaving] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [extractedPalette, setExtractedPalette] = useState<string[]>([]);

  useEffect(() => {
    if (profile) {
      setThemeColor(profile.themeColor || '#ff0000');
      setThemeColorSecondary(profile.themeColorSecondary || '#ffea00');
      
      if (profile.avatarUrl) {
         import('@/lib/utils-app').then(utils => {
           utils.extractPaletteFromImage(profile.avatarUrl).then(setExtractedPalette);
         });
      }
    }
  }, [profile]);

  const handleColorSelect = async (color: string) => {
    if (isAiLoading) return;
    
    setThemeColor(color);
    setIsAiLoading(true);
    
    try {
      const recommendation = await getAIColorRecommendation({ primaryColor: color });
      setThemeColorSecondary(recommendation.secondaryColor);
      
      toast({
        title: "AI SUGGESTION APPLIED",
        description: recommendation.explanation
      });
    } catch (e) {
      setThemeColorSecondary(getRecommendedSecondary(color));
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSaveTheme = async () => {
    if (!profileRef) return;
    setIsSaving(true);
    try {
      await updateDoc(profileRef, {
        themeColor,
        themeColorSecondary,
        updatedAt: serverTimestamp()
      });
      toast({ title: "TEMA DIPERBARUI", description: "Warna visual profil Anda telah aktif." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "GAGAL MENYIMPAN" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in pb-20">
      <div className="space-y-1 text-center">
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase">Visual Lab</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">Sesuaikan Estetika Hub Anda</p>
      </div>

      <div className="space-y-6">
        <Card className="glass-card border-none rounded-[2.5rem] overflow-hidden p-6 shadow-2xl space-y-8">
          <div className="flex justify-center py-4">
             <div 
               className="w-32 h-32 rounded-[2.5rem] flex items-center justify-center border-4 border-background shadow-2xl animate-flowing-gradient relative overflow-hidden"
               style={{ 
                 backgroundImage: `linear-gradient(-45deg, ${themeColor} 0%, ${themeColorSecondary} 50%, ${themeColor} 100%)`,
                 backgroundSize: '200% 200%',
                 boxShadow: `0 0 50px -10px ${themeColor}99`
               }}
             >
                <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
                {isAiLoading ? (
                  <div className="flex flex-col items-center gap-2 relative z-10">
                    <Loader2 size={32} className="text-white animate-spin" />
                    <span className="text-[8px] font-black uppercase text-white tracking-widest">AI Pairing...</span>
                  </div>
                ) : (
                  <Sparkles size={48} className="text-background relative z-10" />
                )}
             </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-2 tracking-widest">
                  <Wand2 size={14} className="text-primary" /> AI-SMART PALETTE (DARI FOTO)
                </label>
                <div className="w-5 h-5 rounded-full shadow-lg border border-white/20" style={{ backgroundColor: themeColor }} />
              </div>
              <div className="grid grid-cols-4 gap-3">
                {extractedPalette.length > 0 ? extractedPalette.map((color, i) => (
                  <button 
                    key={`p-${i}`} 
                    disabled={isAiLoading}
                    onClick={() => handleColorSelect(color)} 
                    className={`aspect-square rounded-2xl border-4 transition-all flex items-center justify-center ${themeColor === color ? 'border-primary scale-110 shadow-[0_0_20px_rgba(255,0,0,0.4)]' : 'border-white/5 opacity-70 hover:opacity-100'} disabled:opacity-30`} 
                    style={{ backgroundColor: color }}
                  >
                    {themeColor === color && !isAiLoading && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                  </button>
                )) : (
                  <div className="col-span-4 py-8 text-center text-[9px] font-black uppercase opacity-20 tracking-widest border border-dashed border-white/10 rounded-2xl">Unggah foto profil untuk palet</div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-2 tracking-widest"><Sparkles size={14} className="text-secondary" /> WARNA GRADASI (PRESTIGE)</label>
                <div className="w-5 h-5 rounded-full shadow-lg border border-white/20" style={{ backgroundColor: themeColorSecondary }} />
              </div>
              <div className="grid grid-cols-4 gap-3">
                {PRESTIGE_SECONDARIES.slice(0, 12).map((sHex) => (
                  <button 
                    key={sHex}
                    onClick={() => setThemeColorSecondary(sHex)}
                    className={`aspect-square rounded-2xl border-4 transition-all flex items-center justify-center ${themeColorSecondary === sHex ? 'border-secondary scale-110 shadow-[0_0_20px_rgba(255,234,0,0.4)]' : 'border-white/5 opacity-70 hover:opacity-100'}`}
                    style={{ backgroundColor: sHex }}
                  >
                     {themeColorSecondary === sHex && <div className="w-2 h-2 bg-background rounded-full animate-pulse" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button onClick={handleSaveTheme} disabled={isSaving || isAiLoading} className="w-full h-16 neon-gradient text-background font-black rounded-3xl shadow-xl active:scale-95 transition-all text-sm uppercase tracking-widest">
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} className="mr-2" /> TERAPKAN VISUAL</>}
          </Button>
        </Card>
      </div>
    </div>
  );
}
