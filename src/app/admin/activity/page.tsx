
"use client";

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Link as LinkIcon, Clock, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { query, limit, collectionGroup, orderBy } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AdminActivityPage() {
  const db = useFirestore();

  // Activity Feed Query (Collection Group)
  // Query ini membutuhkan Index pada koleksi 'links' dengan field 'createdAt' DESC
  const linksQuery = useMemoFirebase(() => query(
    collectionGroup(db, 'links'), 
    orderBy('createdAt', 'desc'),
    limit(100)
  ), [db]);
  
  const { data: rawLinks, isLoading, error } = useCollection(linksQuery);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-primary/50">Memuat Feed Aktivitas...</p>
      </div>
    );
  }

  // Jika index belum dibuat atau ada masalah izin
  if (error) {
    const isPermissionError = error.message?.toLowerCase().includes('permission');
    
    return (
      <div className="py-20 px-6 text-center space-y-6">
        <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary mx-auto shadow-2xl">
          {isPermissionError ? <AlertTriangle size={40} /> : <RefreshCw size={40} className="animate-pulse" />}
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">
            {isPermissionError ? 'Izin Ditolak' : 'Index Diperlukan'}
          </h2>
          <p className="text-xs font-medium text-white/40 leading-relaxed uppercase tracking-widest max-w-xs mx-auto">
            {isPermissionError 
              ? 'Firestore menolak permintaan kueri. Pastikan Rules sudah benar.' 
              : 'Firestore butuh jalur khusus untuk memantau seluruh tautan. Klik tombol di bawah untuk membuatnya di Firebase Console.'}
          </p>
        </div>
        <Button asChild className="neon-gradient text-background font-black rounded-2xl h-14 px-8 uppercase text-[10px] tracking-widest shadow-xl">
           <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer">
             Buka Firebase Console <ExternalLink size={14} className="ml-2" />
           </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-center justify-between px-1">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black tracking-tighter uppercase text-white">Live Feed</h1>
          <p className="text-primary/60 text-[10px] font-black uppercase tracking-[0.4em]">Recent Link Performance</p>
        </div>
        <Badge variant="outline" className="text-[8px] font-black uppercase border-white/10 text-white/40 h-8 px-4">DATA REAL-TIME</Badge>
      </div>
      
      <div className="space-y-3">
        {rawLinks && rawLinks.length > 0 ? rawLinks.map((link) => (
          <Card key={link.id} className="glass-card border-none rounded-2xl p-5 flex items-center gap-4 group hover:bg-white/[0.05] transition-colors text-left shadow-xl">
             <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/5 shrink-0 shadow-inner">
                {link.imageUrl ? <img src={link.imageUrl} className="w-full h-full object-cover" /> : <LinkIcon size={20} className="text-primary/50" />}
             </div>
             <div className="flex-1 min-w-0">
                <h4 className="font-bold text-white text-sm truncate uppercase tracking-tight">{link.title}</h4>
                <p className="text-[9px] text-white/20 truncate uppercase font-mono mt-0.5">{link.url}</p>
             </div>
             <div className="text-right shrink-0">
                <p className="text-xl font-black text-primary tabular-nums">{link.clicks || 0}</p>
                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">CLICKS</p>
             </div>
          </Card>
        )) : (
          <div className="py-32 text-center opacity-10 font-black uppercase text-[10px] tracking-widest border border-dashed border-white/10 rounded-[3rem]">
            Belum ada aktivitas tercatat.
          </div>
        )}
      </div>
    </div>
  );
}
