"use client";

import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, RefreshCw, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CaptchaProps {
  onVerify: (isValid: boolean) => void;
}

interface Challenge {
  prompt: string;
  category: string;
  images: { url: string; isMatch: boolean }[];
}

const CHALLENGES: Challenge[] = [
  {
    prompt: "Pilih semua gambar PEMANDANGAN ALAM",
    category: "nature",
    images: [
      { url: "https://picsum.photos/seed/nat1/150/150", isMatch: true },
      { url: "https://picsum.photos/seed/cit1/150/150", isMatch: false },
      { url: "https://picsum.photos/seed/nat2/150/150", isMatch: true },
      { url: "https://picsum.photos/seed/tec1/150/150", isMatch: false },
      { url: "https://picsum.photos/seed/nat3/150/150", isMatch: true },
      { url: "https://picsum.photos/seed/cit2/150/150", isMatch: false },
      { url: "https://picsum.photos/seed/nat4/150/150", isMatch: true },
      { url: "https://picsum.photos/seed/tec2/150/150", isMatch: false },
      { url: "https://picsum.photos/seed/nat5/150/150", isMatch: true },
    ]
  },
  {
    prompt: "Pilih semua gambar BANGUNAN / KOTA",
    category: "city",
    images: [
      { url: "https://picsum.photos/seed/cit1/150/150", isMatch: true },
      { url: "https://picsum.photos/seed/nat1/150/150", isMatch: false },
      { url: "https://picsum.photos/seed/cit2/150/150", isMatch: true },
      { url: "https://picsum.photos/seed/cit3/150/150", isMatch: true },
      { url: "https://picsum.photos/seed/nat2/150/150", isMatch: false },
      { url: "https://picsum.photos/seed/cit4/150/150", isMatch: true },
      { url: "https://picsum.photos/seed/tec1/150/150", isMatch: false },
      { url: "https://picsum.photos/seed/cit5/150/150", isMatch: true },
      { url: "https://picsum.photos/seed/cit6/150/150", isMatch: true },
    ]
  },
  {
    prompt: "Pilih semua gambar TEKNOLOGI / GADGET",
    category: "tech",
    images: [
      { url: "https://picsum.photos/seed/tec1/150/150", isMatch: true },
      { url: "https://picsum.photos/seed/tec2/150/150", isMatch: true },
      { url: "https://picsum.photos/seed/nat1/150/150", isMatch: false },
      { url: "https://picsum.photos/seed/tec3/150/150", isMatch: true },
      { url: "https://picsum.photos/seed/tec4/150/150", isMatch: true },
      { url: "https://picsum.photos/seed/cit1/150/150", isMatch: false },
      { url: "https://picsum.photos/seed/tec5/150/150", isMatch: true },
      { url: "https://picsum.photos/seed/nat2/150/150", isMatch: false },
      { url: "https://picsum.photos/seed/tec6/150/150", isMatch: true },
    ]
  }
];

export default function Captcha({ onVerify }: CaptchaProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isVerified, setIsVerified] = useState(false);

  const generateChallenge = useCallback(() => {
    const randomIdx = Math.floor(Math.random() * CHALLENGES.length);
    const baseChallenge = CHALLENGES[randomIdx];
    // Shuffle images to increase difficulty
    const shuffledImages = [...baseChallenge.images].sort(() => Math.random() - 0.5);
    setChallenge({ ...baseChallenge, images: shuffledImages });
    setSelectedIndices([]);
  }, []);

  useEffect(() => {
    generateChallenge();
  }, [generateChallenge]);

  const toggleSelection = (index: number) => {
    setSelectedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleVerify = () => {
    if (!challenge) return;
    
    const correctIndices = challenge.images
      .map((img, idx) => img.isMatch ? idx : -1)
      .filter(idx => idx !== -1);
    
    const isCorrect = 
      selectedIndices.length === correctIndices.length && 
      selectedIndices.every(idx => correctIndices.includes(idx));

    if (isCorrect) {
      setIsVerified(true);
      onVerify(true);
      setIsOpen(false);
    } else {
      generateChallenge();
      // Show failure toast or state
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-5 bg-white/5 rounded-[2rem] border border-white/10 flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-3">
           <div className={cn(
             "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xl",
             isVerified ? "bg-green-500/20 text-green-500 border border-green-500/30" : "bg-primary/20 text-primary border border-primary/30"
           )}>
             {isVerified ? <Check size={24} strokeWidth={3} /> : <ShieldCheck size={24} />}
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Keamanan Sesi</p>
              <p className={cn(
                "text-xs font-black uppercase tracking-tighter",
                isVerified ? "text-green-500" : "text-white"
              )}>
                {isVerified ? "Identitas Terverifikasi" : "Verifikasi Manusia Wajib"}
              </p>
           </div>
        </div>

        {!isVerified ? (
          <Button 
            type="button" 
            onClick={() => setIsOpen(true)}
            className="w-full h-12 bg-white/5 hover:bg-white/10 text-white font-black rounded-xl border border-white/10 text-[10px] uppercase tracking-widest"
          >
            Mulai Verifikasi Gambar
          </Button>
        ) : (
          <div className="text-[8px] font-black uppercase text-green-500/50 tracking-[0.3em]">
             Sesi Aman & Terlindungi
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="glass-card border-none rounded-[2.5rem] bg-background/95 backdrop-blur-3xl p-8 shadow-2xl max-w-[95%] sm:max-w-md mx-auto">
          <DialogHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary glow-primary">
               <ShieldCheck size={32} />
            </div>
            <DialogTitle className="text-xl font-black uppercase tracking-tighter text-white">
              {challenge?.prompt || "Verifikasi Gambar"}
            </DialogTitle>
            <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Pilih semua kotak yang sesuai untuk melanjutkan</p>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-2 py-6">
            {challenge?.images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => toggleSelection(idx)}
                className={cn(
                  "aspect-square rounded-xl overflow-hidden border-4 transition-all relative group",
                  selectedIndices.includes(idx) ? "border-primary scale-95" : "border-transparent"
                )}
              >
                <img src={img.url} className="w-full h-full object-cover" alt="Challenge item" />
                {selectedIndices.includes(idx) && (
                  <div className="absolute inset-0 bg-primary/40 flex items-center justify-center">
                    <Check className="text-white" size={24} strokeWidth={4} />
                  </div>
                )}
              </button>
            ))}
          </div>

          <DialogFooter className="flex flex-col gap-3">
             <Button 
               type="button" 
               onClick={handleVerify}
               disabled={selectedIndices.length === 0}
               className="w-full h-14 neon-gradient text-background font-black rounded-2xl glow-primary uppercase text-[10px] tracking-widest"
             >
               Verifikasi Sekarang
             </Button>
             <Button 
               variant="ghost" 
               type="button" 
               onClick={generateChallenge}
               className="text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white"
             >
               <RefreshCw size={12} className="mr-2" /> Segarkan Gambar
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
