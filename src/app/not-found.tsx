
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Ghost, Home, ArrowLeft } from 'lucide-react';

export default function GlobalNotFound() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center space-y-12 overflow-hidden relative">
      {/* Visual Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] animate-pulse-glow" />

      <div className="relative z-10 space-y-8 animate-in">
        <div className="mx-auto w-32 h-32 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-primary glow-primary animate-bounce shadow-2xl">
          <Ghost size={64} />
        </div>
        
        <div className="space-y-4">
          <div className="relative inline-block">
             <h1 className="text-8xl font-black text-white tracking-tighter uppercase leading-none opacity-10">404</h1>
             <h2 className="text-4xl font-black text-white uppercase tracking-tighter absolute inset-0 flex items-center justify-center mt-4">Halaman Tidak Ditemukan</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 max-w-xs mx-auto leading-relaxed">
            Sepertinya Anda tersesat di dimensi yang salah. Alamat yang Anda tuju tidak tersedia di Linku.
          </p>
        </div>

        <div className="flex flex-col gap-4 max-w-xs mx-auto pt-4">
          <Button asChild className="h-16 neon-gradient text-background font-black rounded-2xl glow-primary uppercase text-[10px] tracking-[0.3em] shadow-2xl active:scale-95 transition-all">
            <Link href="/"><Home size={16} className="mr-2" /> Kembali ke Beranda</Link>
          </Button>
          <Button variant="ghost" onClick={() => window.history.back()} className="h-14 text-white/40 hover:text-white font-black uppercase text-[10px] tracking-widest rounded-2xl">
            <ArrowLeft size={16} className="mr-2" /> Kembali Sebelumnya
          </Button>
        </div>
      </div>

      <footer className="absolute bottom-12 text-[8px] font-black uppercase tracking-[0.5em] text-white/10">
        Linku Engine &bull; Error Handling System
      </footer>
    </div>
  );
}
