
"use client";

import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Check, RefreshCw, Move } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface CaptchaProps {
  onVerify: (isValid: boolean) => void;
}

// Daftar 22 ID Gambar Picsum pilihan yang HD dan kontras
const CAPTCHA_IMAGES = [
  10, 15, 20, 26, 28, 29, 30, 42, 49, 54, 58, 63, 75, 103, 111, 119, 122, 133, 152, 160, 180, 193
];

const PIECE_SIZE = 60; // Ukuran kotak puzzle
const CONTAINER_SIZE = 280; // Ukuran bingkai utama

export default function Captcha({ onVerify }: CaptchaProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Captcha Logic States
  const [currentPos, setCurrentPos] = useState({ x: 10, y: CONTAINER_SIZE - PIECE_SIZE - 10 });
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });
  const [currentImageId, setCurrentImageId] = useState(10);
  const [isError, setIsError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const initCaptcha = () => {
    const randomId = CAPTCHA_IMAGES[Math.floor(Math.random() * CAPTCHA_IMAGES.length)];
    setCurrentImageId(randomId);

    // Tentukan posisi target acak (X dan Y)
    // Pastikan target tidak terlalu dekat dengan posisi awal
    const tx = Math.floor(Math.random() * (CONTAINER_SIZE - PIECE_SIZE - 40)) + 20;
    const ty = Math.floor(Math.random() * (CONTAINER_SIZE - PIECE_SIZE - 100)) + 20;

    setTargetPos({ x: tx, y: ty });
    setCurrentPos({ x: 10, y: CONTAINER_SIZE - PIECE_SIZE - 10 });
    setIsError(false);
    setIsVerified(false);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isVerified) return;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    let x = e.clientX - rect.left - PIECE_SIZE / 2;
    let y = e.clientY - rect.top - PIECE_SIZE / 2;

    // Boundary constraints
    x = Math.max(0, Math.min(x, CONTAINER_SIZE - PIECE_SIZE));
    y = Math.max(0, Math.min(y, CONTAINER_SIZE - PIECE_SIZE));

    setCurrentPos({ x, y });
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const tolerance = 8; // Toleransi pixel X dan Y untuk akurasi manusia
    const diffX = Math.abs(currentPos.x - targetPos.x);
    const diffY = Math.abs(currentPos.y - targetPos.y);
    
    if (diffX < tolerance && diffY < tolerance) {
      // Snap to target
      setCurrentPos(targetPos);
      setIsVerified(true);
      onVerify(true);
      setTimeout(() => setIsOpen(false), 800);
    } else {
      setIsError(true);
      setTimeout(() => {
        initCaptcha();
      }, 1000);
    }
  };

  const imageUrl = `https://picsum.photos/id/${currentImageId}/600/600`;

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      <div className="p-5 bg-white/5 rounded-none border border-white/10 flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-none flex items-center justify-center transition-all shadow-xl",
            isVerified ? "bg-green-500/20 text-green-500 border border-green-500/30" : "bg-primary/20 text-primary border border-primary/30"
          )}>
            {isVerified ? <Check size={24} strokeWidth={3} /> : <ShieldCheck size={24} />}
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 leading-none mb-1">Linku Shield</p>
            <p className={cn(
              "text-xs font-black uppercase tracking-tighter",
              isVerified ? "text-green-500" : "text-white"
            )}>
              {isVerified ? "Identitas Manusia Oke" : "Verifikasi 2D Drag"}
            </p>
          </div>
        </div>

        {!isVerified ? (
          <button 
            type="button" 
            onClick={() => { initCaptcha(); setIsOpen(true); }}
            className="w-full h-12 bg-white/5 hover:bg-white/10 text-white font-black rounded-none border border-white/10 text-[10px] uppercase tracking-widest transition-colors"
          >
            Mulai Verifikasi
          </button>
        ) : (
          <div className="text-[8px] font-black uppercase text-green-500/50 tracking-[0.3em]">
            Akses Terbuka
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={(open) => !isVerified && !isDragging && setIsOpen(open)}>
        <DialogContent className="glass-card border-none rounded-none bg-background/95 backdrop-blur-3xl p-8 shadow-2xl max-w-[95%] sm:max-w-md mx-auto overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 neon-gradient" />
          
          <div className="text-center space-y-4 mb-8">
            <DialogTitle className="text-xl font-black uppercase tracking-tighter text-white">
              Cocokkan Puzzle
            </DialogTitle>
            <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Tarik kepingan ke bayangan yang tepat</p>
          </div>

          <div className="space-y-8">
            <div 
              ref={containerRef}
              className="relative mx-auto bg-black border border-white/10 overflow-hidden shadow-2xl cursor-crosshair select-none"
              style={{ width: CONTAINER_SIZE, height: CONTAINER_SIZE }}
            >
              <img 
                src={imageUrl} 
                className="w-full h-full object-cover opacity-100" 
                alt="Main"
              />
              
              {/* Target Shadow (Hole) - Kotak Siku */}
              <div 
                className="absolute bg-black/60 border border-white/30 z-10"
                style={{
                  width: PIECE_SIZE,
                  height: PIECE_SIZE,
                  left: targetPos.x,
                  top: targetPos.y,
                }}
              >
                {/* Preview pudar di dalam lubang sebagai petunjuk */}
                <div className="w-full h-full overflow-hidden opacity-20">
                  <img 
                    src={imageUrl} 
                    className="absolute max-w-none" 
                    style={{
                      width: CONTAINER_SIZE,
                      height: CONTAINER_SIZE,
                      left: -targetPos.x,
                      top: -targetPos.y,
                    }}
                    alt="Hint"
                  />
                </div>
              </div>

              {/* Kepingan (Draggable Piece) - Kotak Siku */}
              <div 
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className={cn(
                  "absolute z-30 border-2 border-primary glow-primary overflow-hidden transition-shadow touch-none cursor-grab active:cursor-grabbing",
                  isDragging && "scale-105 shadow-[0_0_30px_rgba(255,0,0,0.6)]",
                  isError && "border-destructive glow-destructive",
                  isVerified && "border-green-500 glow-none"
                )}
                style={{
                  width: PIECE_SIZE,
                  height: PIECE_SIZE,
                  left: currentPos.x,
                  top: currentPos.y,
                }}
              >
                <img 
                  src={imageUrl} 
                  className="absolute max-w-none pointer-events-none" 
                  style={{
                    width: CONTAINER_SIZE,
                    height: CONTAINER_SIZE,
                    left: -targetPos.x,
                    top: -targetPos.y,
                  }}
                  alt="Piece"
                />
              </div>
            </div>

            <div className="flex justify-between items-center px-2">
               <button 
                type="button"
                onClick={initCaptcha}
                className="flex items-center gap-2 text-[8px] font-black uppercase text-white/30 hover:text-white transition-colors"
               >
                 <RefreshCw size={12} /> Reset Tantangan
               </button>
               <div className="flex items-center gap-2 text-[8px] font-black uppercase text-primary/50">
                 <Move size={12} /> Drag X & Y
               </div>
            </div>
            
            {isError && (
              <p className="text-center text-[9px] font-black uppercase text-destructive animate-pulse">
                Penempatan Tidak Akurat. Coba Lagi.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
