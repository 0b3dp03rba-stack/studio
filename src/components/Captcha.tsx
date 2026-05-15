
"use client";

import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, RefreshCw, Check, Puzzle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CaptchaProps {
  onVerify: (isValid: boolean) => void;
}

interface PuzzlePiece {
  id: number; // Index asli (0-15)
  correctX: number;
  correctY: number;
}

const GRID_SIZE = 4;
const TOTAL_PIECES = GRID_SIZE * GRID_SIZE;
const IMAGE_URL = "https://picsum.photos/id/15/600/600";

export default function Captcha({ onVerify }: CaptchaProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [mounted, setMounted] = useState(false);

  // State untuk grid (16 slot)
  // null berarti kosong
  const [grid, setGrid] = useState<(number | null)[]>(new Array(TOTAL_PIECES).fill(null));
  // State untuk nampan (potongan yang harus disusun)
  const [tray, setTray] = useState<number[]>([]);
  // State pilihan potongan di tray
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null);

  const initPuzzle = useCallback(() => {
    const allIds = Array.from({ length: TOTAL_PIECES }, (_, i) => i);
    
    // Ambil 3 posisi acak untuk dikosongkan
    const shuffledIds = [...allIds].sort(() => Math.random() - 0.5);
    const missingPieceIds = shuffledIds.slice(0, 3);
    
    const newGrid = allIds.map(id => missingPieceIds.includes(id) ? null : id);
    const newTray = [...missingPieceIds].sort(() => Math.random() - 0.5);

    setGrid(newGrid);
    setTray(newTray);
    setSelectedPieceId(null);
  }, []);

  useEffect(() => {
    setMounted(true);
    initPuzzle();
  }, [initPuzzle]);

  const handleGridClick = (index: number) => {
    if (grid[index] !== null) return; // Slot sudah terisi
    if (selectedPieceId === null) return; // Belum pilih potongan di tray

    const newGrid = [...grid];
    newGrid[index] = selectedPieceId;
    setGrid(newGrid);

    const newTray = tray.filter(id => id !== selectedPieceId);
    setTray(newTray);
    setSelectedPieceId(null);

    // Cek jika semua sudah terisi dan benar
    if (newTray.length === 0) {
      const isComplete = newGrid.every((id, idx) => id === idx);
      if (isComplete) {
        setIsVerified(true);
        onVerify(true);
        setTimeout(() => setIsOpen(false), 800);
      } else {
        // Jika salah susun, reset nampan
        setTimeout(() => initPuzzle(), 500);
      }
    }
  };

  const handleTrayClick = (id: number) => {
    setSelectedPieceId(id === selectedPieceId ? null : id);
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
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 leading-none mb-1">Keamanan Linku</p>
            <p className={cn(
              "text-xs font-black uppercase tracking-tighter",
              isVerified ? "text-green-500" : "text-white"
            )}>
              {isVerified ? "Manusia Terverifikasi" : "Susun Puzzle Wajib"}
            </p>
          </div>
        </div>

        {!isVerified ? (
          <Button 
            type="button" 
            onClick={() => { initPuzzle(); setIsOpen(true); }}
            className="w-full h-12 bg-white/5 hover:bg-white/10 text-white font-black rounded-xl border border-white/10 text-[10px] uppercase tracking-widest"
          >
            Mulai Susun Gambar
          </Button>
        ) : (
          <div className="text-[8px] font-black uppercase text-green-500/50 tracking-[0.3em]">
            Sesi Terlindungi oleh Puzzle
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={(open) => !isVerified && setIsOpen(open)}>
        <DialogContent className="glass-card border-none rounded-[2.5rem] bg-background/95 backdrop-blur-3xl p-8 shadow-2xl max-w-[95%] sm:max-w-md mx-auto overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 neon-gradient" />
          <DialogHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary glow-primary">
              <Puzzle size={32} />
            </div>
            <DialogTitle className="text-xl font-black uppercase tracking-tighter text-white">
              Selesaikan Puzzle
            </DialogTitle>
            <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Klik potongan di bawah, lalu klik kotak kosong yang sesuai</p>
          </DialogHeader>

          <div className="py-6 space-y-8">
            {/* 4x4 Puzzle Grid */}
            <div className="grid grid-cols-4 gap-1 aspect-square bg-white/5 p-1 rounded-2xl border border-white/10 shadow-inner relative">
              {grid.map((pieceId, idx) => {
                const x = idx % GRID_SIZE;
                const y = Math.floor(idx / GRID_SIZE);
                
                return (
                  <div
                    key={`grid-${idx}`}
                    onClick={() => handleGridClick(idx)}
                    className={cn(
                      "aspect-square rounded-lg border-2 border-transparent transition-all relative overflow-hidden bg-black/40 cursor-pointer",
                      pieceId === null && "hover:border-primary/50"
                    )}
                  >
                    {/* Shadow Hint - Gambar yang benar tapi pudar */}
                    {pieceId === null && (
                      <div 
                        className="absolute inset-0 grayscale opacity-20 pointer-events-none"
                        style={{
                          backgroundImage: `url(${IMAGE_URL})`,
                          backgroundSize: '400%',
                          backgroundPosition: `${x * 33.33}% ${y * 33.33}%`
                        }}
                      />
                    )}
                    
                    {/* Terpasang */}
                    {pieceId !== null && (
                      <div 
                        className={cn(
                          "w-full h-full transition-all",
                          pieceId === idx ? "opacity-100" : "opacity-80 border-2 border-red-500/50"
                        )}
                        style={{
                          backgroundImage: `url(${IMAGE_URL})`,
                          backgroundSize: '400%',
                          backgroundPosition: `${(pieceId % GRID_SIZE) * 33.33}% ${Math.floor(pieceId / GRID_SIZE) * 33.33}%`
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tray / Nampan Potongan */}
            <div className="flex justify-center gap-4 bg-white/5 p-4 rounded-3xl min-h-[80px]">
              {tray.map((id) => {
                const tx = id % GRID_SIZE;
                const ty = Math.floor(id / GRID_SIZE);
                return (
                  <button
                    key={`tray-${id}`}
                    onClick={() => handleTrayClick(id)}
                    className={cn(
                      "w-16 h-16 rounded-xl border-4 transition-all overflow-hidden",
                      selectedPieceId === id ? "border-primary scale-110 shadow-lg" : "border-white/10 opacity-70 hover:opacity-100"
                    )}
                  >
                    <div 
                      className="w-full h-full"
                      style={{
                        backgroundImage: `url(${IMAGE_URL})`,
                        backgroundSize: '400%',
                        backgroundPosition: `${tx * 33.33}% ${ty * 33.33}%`
                      }}
                    />
                  </button>
                );
              })}
              {tray.length === 0 && !isVerified && (
                <div className="flex items-center text-[10px] font-black uppercase text-white/20 tracking-widest">
                  Validasi Posisi...
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-3">
            <Button 
              variant="ghost" 
              type="button" 
              onClick={initPuzzle}
              className="text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white"
            >
              <RefreshCw size={12} className="mr-2" /> Acak Ulang Puzzle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
