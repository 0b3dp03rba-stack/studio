
"use client";

import { useState, useEffect } from 'react';
import { ShieldCheck, Check, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface CaptchaProps {
  onVerify: (isValid: boolean) => void;
}

const IMAGE_URL = "https://picsum.photos/seed/linku-security-v2/600/600";
const PIECE_SIZE = 64; // Kotak / Square
const CONTAINER_SIZE = 300; // Ukuran tampilan visual di HP

export default function Captcha({ onVerify }: CaptchaProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Captcha Logic States
  const [sliderValue, setSliderValue] = useState(0);
  const [targetX, setTargetX] = useState(0);
  const [targetY, setTargetY] = useState(0);
  const [isError, setIsError] = useState(false);

  const initCaptcha = () => {
    // Tentukan posisi acak untuk lubang target
    // Pastikan posisi X cukup jauh ke kanan agar tantangan geser terasa nyata
    const maxX = CONTAINER_SIZE - PIECE_SIZE - 20;
    const minX = 140; 
    const maxY = CONTAINER_SIZE - PIECE_SIZE - 20;
    const minY = 20;

    setTargetX(Math.floor(Math.random() * (maxX - minX)) + minX);
    setTargetY(Math.floor(Math.random() * (maxY - minY)) + minY);
    setSliderValue(0);
    setIsError(false);
  };

  useEffect(() => {
    setMounted(true);
    initCaptcha();
  }, []);

  const handleVerify = () => {
    const tolerance = 6; // Toleransi pixel untuk akurasi manusia
    const diff = Math.abs(sliderValue - targetX);
    
    if (diff < tolerance) {
      setIsVerified(true);
      onVerify(true);
      setTimeout(() => setIsOpen(false), 800);
    } else {
      setIsError(true);
      // Reset jika salah setelah jeda singkat
      setTimeout(() => {
        initCaptcha();
      }, 1000);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      <div className="p-5 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xl",
            isVerified ? "bg-green-500/20 text-green-500 border border-green-500/30" : "bg-primary/20 text-primary border border-primary/30"
          )}>
            {isVerified ? <Check size={24} strokeWidth={3} /> : <ShieldCheck size={24} />}
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 leading-none mb-1">Keamanan Linku</p>
            <p className={cn(
              "text-xs font-black uppercase tracking-tighter",
              isVerified ? "text-green-500" : "text-white"
            )}>
              {isVerified ? "Manusia Terverifikasi" : "Verifikasi Geser"}
            </p>
          </div>
        </div>

        {!isVerified ? (
          <button 
            type="button" 
            onClick={() => { initCaptcha(); setIsOpen(true); }}
            className="w-full h-12 bg-white/5 hover:bg-white/10 text-white font-black rounded-xl border border-white/10 text-[10px] uppercase tracking-widest transition-colors"
          >
            Mulai Verifikasi
          </button>
        ) : (
          <div className="text-[8px] font-black uppercase text-green-500/50 tracking-[0.3em]">
            Akses Terbuka
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={(open) => !isVerified && setIsOpen(open)}>
        <DialogContent className="glass-card border-none rounded-[2.5rem] bg-background/95 backdrop-blur-3xl p-8 shadow-2xl max-w-[95%] sm:max-w-md mx-auto overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 neon-gradient" />
          
          <div className="text-center space-y-4 mb-8">
            <DialogTitle className="text-xl font-black uppercase tracking-tighter text-white">
              Selesaikan Puzzle
            </DialogTitle>
            <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Geser kepingan kotak ke lubang yang tepat</p>
          </div>

          <div className="space-y-10">
            {/* Area Puzzle - Kotak / Square */}
            <div 
              className="relative mx-auto bg-black border border-white/10 overflow-hidden shadow-2xl rounded-none"
              style={{ width: CONTAINER_SIZE, height: CONTAINER_SIZE }}
            >
              <img 
                src={IMAGE_URL} 
                className="w-full h-full object-cover grayscale opacity-30" 
                alt="Main Captcha"
              />
              
              {/* Lubang (Target Hole) - Square / Kotak Siku */}
              <div 
                className="absolute bg-black/90 border border-white/20 z-10 shadow-inner rounded-none"
                style={{
                  width: PIECE_SIZE,
                  height: PIECE_SIZE,
                  left: targetX,
                  top: targetY,
                }}
              />

              {/* Kepingan (Sliding Piece) - Square / Kotak Siku */}
              <div 
                className={cn(
                  "absolute z-20 border-2 border-primary glow-primary overflow-hidden transition-shadow rounded-none",
                  isError && "border-destructive glow-destructive shadow-[0_0_20px_rgba(255,0,0,0.5)]"
                )}
                style={{
                  width: PIECE_SIZE,
                  height: PIECE_SIZE,
                  left: sliderValue,
                  top: targetY,
                }}
              >
                <img 
                  src={IMAGE_URL} 
                  className="absolute max-w-none grayscale-0" 
                  style={{
                    width: CONTAINER_SIZE,
                    height: CONTAINER_SIZE,
                    left: -targetX,
                    top: -targetY,
                  }}
                  alt="Puzzle Piece"
                />
              </div>
            </div>

            {/* Slider Track */}
            <div className="space-y-6 px-2">
              <div className="relative h-14 bg-white/5 rounded-none flex items-center px-4 border border-white/10">
                <Slider
                  value={[sliderValue]}
                  max={CONTAINER_SIZE - PIECE_SIZE}
                  step={1}
                  onValueChange={(val) => {
                    setSliderValue(val[0]);
                    if(isError) setIsError(false);
                  }}
                  onValueCommit={handleVerify}
                  className="relative z-10"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-[8px] font-black uppercase tracking-[0.6em] text-white/10">Geser Puzzle</span>
                </div>
              </div>

              <div className="flex justify-between items-center px-1">
                 <button 
                  type="button"
                  onClick={initCaptcha}
                  className="flex items-center gap-2 text-[8px] font-black uppercase text-white/30 hover:text-white transition-colors"
                 >
                   <RefreshCw size={12} /> Acak Ulang
                 </button>
                 {isError && <span className="text-[9px] font-black uppercase text-destructive animate-pulse">Verifikasi Gagal</span>}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
