
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldCheck, Check, RefreshCw, Move } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import data from '@/app/lib/placeholder-images.json';

const PIECE_SIZE = 60; 
const CONTAINER_SIZE = 280; 

export default function Captcha({ onVerify }: { onVerify: (isValid: boolean) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [currentImageHint, setCurrentImageHint] = useState('');
  const [isError, setIsError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const initCaptcha = useCallback(() => {
    // Memilih gambar secara acak dari 20 koleksi
    const collection = data.placeholderImages;
    const randomIndex = Math.floor(Math.random() * collection.length);
    const randomImg = collection[randomIndex];
    
    setCurrentImageUrl(randomImg.imageUrl);
    setCurrentImageHint(randomImg.imageHint);

    // Tentukan posisi target (slot kosong) secara acak
    const tx = Math.floor(Math.random() * (CONTAINER_SIZE - PIECE_SIZE - 40)) + 20;
    const ty = Math.floor(Math.random() * (CONTAINER_SIZE - PIECE_SIZE - 40)) + 20;
    setTargetPos({ x: tx, y: ty });

    // Tentukan posisi awal kepingan secara acak (jauh dari target)
    let sx, sy;
    let distance = 0;
    do {
      sx = Math.floor(Math.random() * (CONTAINER_SIZE - PIECE_SIZE));
      sy = Math.floor(Math.random() * (CONTAINER_SIZE - PIECE_SIZE));
      distance = Math.sqrt(Math.pow(sx - tx, 2) + Math.pow(sy - ty, 2));
    } while (distance < 120); 

    setCurrentPos({ x: sx, y: sy });
    setIsError(false);
  }, []);

  useEffect(() => {
    setMounted(true);
    initCaptcha();
  }, [initCaptcha]);

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
    // Batasan di dalam kontainer
    x = Math.max(0, Math.min(x, CONTAINER_SIZE - PIECE_SIZE));
    y = Math.max(0, Math.min(y, CONTAINER_SIZE - PIECE_SIZE));
    setCurrentPos({ x, y });
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const tolerance = 15; // Toleransi pixel
    if (Math.abs(currentPos.x - targetPos.x) < tolerance && Math.abs(currentPos.y - targetPos.y) < tolerance) {
      setCurrentPos(targetPos);
      setIsVerified(true);
      onVerify(true);
      setTimeout(() => setIsOpen(false), 800);
    } else {
      setIsError(true);
      // Reset tantangan jika gagal
      setTimeout(initCaptcha, 1000);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      <div className="p-6 bg-white/[0.03] rounded-[2rem] border border-white/10 flex flex-col items-center gap-5 text-center shadow-xl">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-2xl",
            isVerified ? "bg-green-500/20 text-green-500 border border-green-500/30" : "bg-primary/20 text-primary border border-primary/30"
          )}>
            {isVerified ? <Check size={32} strokeWidth={4} /> : <ShieldCheck size={32} />}
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 leading-none mb-1">Identity Shield</p>
            <p className={cn("text-sm font-black uppercase tracking-tighter", isVerified ? "text-green-500" : "text-white")}>
              {isVerified ? "Verified Human" : "Slide Verification"}
            </p>
          </div>
        </div>
        {!isVerified ? (
          <button 
            type="button" 
            onClick={() => { initCaptcha(); setIsOpen(true); }} 
            className="w-full h-14 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl border border-white/10 text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95"
          >
            Start Identity Check
          </button>
        ) : (
          <div className="flex items-center gap-2 py-2">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
             <p className="text-[9px] font-black uppercase text-green-500/70 tracking-[0.3em]">Access Sequence Granted</p>
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={(open) => !isVerified && !isDragging && setIsOpen(open)}>
        <DialogContent className="glass-card border-none rounded-[2.5rem] bg-background/95 backdrop-blur-3xl p-8 shadow-2xl max-w-[95%] sm:max-w-md mx-auto overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 neon-gradient" />
          <div className="text-center space-y-4 mb-8">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-white">Match the Visual</DialogTitle>
            <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.4em]">Drag piece to the target silhouette</p>
          </div>
          <div className="space-y-8">
            <div ref={containerRef} className="relative mx-auto bg-black rounded-xl border border-white/10 overflow-hidden shadow-2xl cursor-crosshair select-none" style={{ width: CONTAINER_SIZE, height: CONTAINER_SIZE }}>
              {currentImageUrl && <img src={currentImageUrl} className="w-full h-full object-cover opacity-100" alt="Source" data-ai-hint={currentImageHint} />}
              
              {/* Target Silhouette (Square) */}
              <div className="absolute bg-black/80 border-2 border-white/40 z-10 overflow-hidden" style={{ width: PIECE_SIZE, height: PIECE_SIZE, left: targetPos.x, top: targetPos.y }}>
                <div className="w-full h-full opacity-30">
                  {currentImageUrl && <img src={currentImageUrl} className="absolute max-w-none" style={{ width: CONTAINER_SIZE, height: CONTAINER_SIZE, left: -targetPos.x, top: -targetPos.y }} alt="Hint" />}
                </div>
              </div>

              {/* Draggable Piece (Square for precision) */}
              <div 
                onPointerDown={handlePointerDown} 
                onPointerMove={handlePointerMove} 
                onPointerUp={handlePointerUp} 
                className={cn(
                  "absolute z-30 border-2 border-primary glow-primary overflow-hidden transition-shadow touch-none cursor-grab active:cursor-grabbing", 
                  isDragging && "scale-105 shadow-[0_0_30px_rgba(255,0,0,0.6)]", 
                  isError && "border-destructive animate-shake", 
                  isVerified && "border-green-500"
                )} 
                style={{ width: PIECE_SIZE, height: PIECE_SIZE, left: currentPos.x, top: currentPos.y }}
              >
                {currentImageUrl && <img src={currentImageUrl} className="absolute max-w-none pointer-events-none" style={{ width: CONTAINER_SIZE, height: CONTAINER_SIZE, left: -targetPos.x, top: -targetPos.y }} alt="Piece" />}
              </div>
            </div>
            
            <div className="flex justify-between items-center px-2">
               <button type="button" onClick={initCaptcha} className="flex items-center gap-2 text-[8px] font-black uppercase text-white/30 hover:text-white transition-colors group">
                 <RefreshCw size={14} className="group-active:rotate-180 transition-transform duration-500" /> 
                 Shuffle Image
               </button>
               <div className="flex items-center gap-2 text-[8px] font-black uppercase text-primary/50">
                 <Move size={14} /> 2D Axis Lock
               </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
