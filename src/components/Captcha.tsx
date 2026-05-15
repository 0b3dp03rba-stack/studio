"use client";

import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, RefreshCw, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CaptchaProps {
  onVerify: (isValid: boolean) => void;
}

interface ImageItem {
  url: string;
  isMatch: boolean;
  id: string;
}

interface Challenge {
  prompt: string;
  targetCategory: string;
  displayImages: ImageItem[];
}

// Pool gambar yang lebih spesifik agar mudah dibedakan
const IMAGE_POOLS = {
  nature: [
    "https://picsum.photos/seed/nature_1/300/300",
    "https://picsum.photos/seed/nature_2/300/300",
    "https://picsum.photos/seed/nature_3/300/300",
    "https://picsum.photos/seed/nature_4/300/300",
    "https://picsum.photos/seed/nature_5/300/300",
  ],
  city: [
    "https://picsum.photos/seed/city_1/300/300",
    "https://picsum.photos/seed/city_2/300/300",
    "https://picsum.photos/seed/city_3/300/300",
    "https://picsum.photos/seed/city_4/300/300",
    "https://picsum.photos/seed/city_5/300/300",
  ],
  tech: [
    "https://picsum.photos/seed/tech_1/300/300",
    "https://picsum.photos/seed/tech_2/300/300",
    "https://picsum.photos/seed/tech_3/300/300",
    "https://picsum.photos/seed/tech_4/300/300",
    "https://picsum.photos/seed/tech_5/300/300",
  ]
};

const CHALLENGE_TYPES = [
  { prompt: "Pilih semua gambar PEMANDANGAN ALAM", category: "nature" },
  { prompt: "Pilih semua gambar BANGUNAN / KOTA", category: "city" },
  { prompt: "Pilih semua gambar TEKNOLOGI / GADGET", category: "tech" },
];

export default function Captcha({ onVerify }: CaptchaProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  const [mounted, setMounted] = useState(false);

  const generateChallenge = useCallback(() => {
    // 1. Pilih tipe tantangan acak
    const type = CHALLENGE_TYPES[Math.floor(Math.random() * CHALLENGE_TYPES.length)];
    
    // 2. Ambil tepat 3 gambar benar dari pool kategori target
    const correctPool = [...IMAGE_POOLS[type.category as keyof typeof IMAGE_POOLS]]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((url, i) => ({ url, isMatch: true, id: `correct-${i}-${Date.now()}` }));

    // 3. Ambil tepat 6 gambar salah dari pool kategori lain
    const otherCategories = Object.keys(IMAGE_POOLS).filter(c => c !== type.category);
    const incorrectPoolRaw: string[] = [];
    otherCategories.forEach(cat => {
      incorrectPoolRaw.push(...IMAGE_POOLS[cat as keyof typeof IMAGE_POOLS]);
    });
    
    const incorrectPool = incorrectPoolRaw
      .sort(() => Math.random() - 0.5)
      .slice(0, 6)
      .map((url, i) => ({ url, isMatch: false, id: `incorrect-${i}-${Date.now()}` }));

    // 4. Gabungkan dan kocok (Shuffle)
    const displayImages = [...correctPool, ...incorrectPool].sort(() => Math.random() - 0.5);

    setChallenge({
      prompt: type.prompt,
      targetCategory: type.category,
      displayImages
    });
    setSelectedIndices([]);
  }, []);

  useEffect(() => {
    setMounted(true);
    generateChallenge();
  }, [generateChallenge]);

  const toggleSelection = (index: number) => {
    setSelectedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleVerify = () => {
    if (!challenge) return;
    
    const correctIndices = challenge.displayImages
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
      setSelectedIndices([]);
    }
  };

  if (!mounted) return null;

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
           <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 leading-none mb-1">Keamanan Sesi</p>
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
            onClick={() => { generateChallenge(); setIsOpen(true); }}
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
        <DialogContent className="glass-card border-none rounded-[2.5rem] bg-background/95 backdrop-blur-3xl p-8 shadow-2xl max-w-[95%] sm:max-w-md mx-auto overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 neon-gradient" />
          <DialogHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary glow-primary">
               <ShieldCheck size={32} />
            </div>
            <DialogTitle className="text-xl font-black uppercase tracking-tighter text-white">
              {challenge?.prompt || "Verifikasi Gambar"}
            </DialogTitle>
            <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Pilih tepat 3 kotak yang sesuai</p>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-2 py-6">
            {challenge?.displayImages.map((img, idx) => (
              <button
                key={img.id}
                type="button"
                onClick={() => toggleSelection(idx)}
                className={cn(
                  "aspect-square rounded-xl overflow-hidden border-4 transition-all relative group",
                  selectedIndices.includes(idx) ? "border-primary scale-95 shadow-[0_0_15px_rgba(255,0,0,0.5)]" : "border-transparent"
                )}
              >
                <img src={img.url} className="w-full h-full object-cover" alt="Challenge item" />
                {selectedIndices.includes(idx) && (
                  <div className="absolute inset-0 bg-primary/40 flex items-center justify-center backdrop-blur-[2px]">
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
               disabled={selectedIndices.length !== 3}
               className="w-full h-14 neon-gradient text-background font-black rounded-2xl glow-primary uppercase text-[10px] tracking-widest shadow-xl disabled:opacity-30"
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
