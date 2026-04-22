
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils-app';
import { Clock, Copy, Layers, Play } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, limit, doc, updateDoc, serverTimestamp, where, getDocs } from 'firebase/firestore';

export default function AdminSetoranPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [isCopying, setIsCopying] = useState(false);

  const profileRef = useMemoFirebase(() => user ? doc(db, 'userProfiles', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(profileRef);
  const isAdmin = profile?.role === 'Admin';

  const batchesQuery = useMemoFirebase(() => {
    if (!isAdmin) return null;
    if (activeTab === 'pending') {
      return query(collection(db, 'gmailBatches'), where('status', '==', 'Pending'), limit(100));
    }
    return query(collection(db, 'gmailBatches'), limit(100));
  }, [db, activeTab, isAdmin]);

  const { data: rawBatches, isLoading } = useCollection(batchesQuery);
  const { data: users } = useCollection(useMemoFirebase(() => isAdmin ? query(collection(db, 'userProfiles'), limit(500)) : null, [db, isAdmin]));

  const sortedBatches = useMemo(() => {
    if (!rawBatches) return [];
    return [...rawBatches].sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  }, [rawBatches]);

  const handleCopyProses = async () => {
    setIsCopying(true);
    try {
      let allText = '';
      const batchesRef = collection(db, 'gmailBatches');
      const q = query(batchesRef, where('status', '==', 'Proses'));
      const snapshot = await getDocs(q);

      for (const batchDoc of snapshot.docs) {
        const subsRef = collection(db, `gmailBatches/${batchDoc.id}/gmailSubmissions`);
        const subSnapshot = await getDocs(subsRef);
        subSnapshot.docs.forEach(doc => {
          const data = doc.data();
          allText += `${data.email}|${data.password}\n`;
        });
      }

      if (!allText) {
        toast({ title: "Kosong", description: "Tidak ada data dengan status 'Proses'." });
        return;
      }

      await navigator.clipboard.writeText(allText.trim());
      toast({ title: "Berhasil", description: "Semua akun berstatus 'Proses' telah disalin ke clipboard." });
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal menyalin data." });
    } finally {
      setIsCopying(false);
    }
  };

  const handleUpdateStatus = async (batchId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'gmailBatches', batchId), {
        status,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Berhasil", description: `Status Batch diperbarui menjadi ${status}.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal memperbarui status." });
    }
  };

  if (isLoading) return <div className="p-20 text-center animate-pulse font-black uppercase tracking-widest">Memuat Setoran...</div>;
  if (!isAdmin) return <div className="p-20 text-center opacity-20 font-black uppercase">Akses Ditolak</div>;

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight">Setoran Masuk</h1>
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest">Verifikasi data Gmail user.</p>
        </div>
        <Button 
          onClick={handleCopyProses} 
          disabled={isCopying}
          className="h-12 px-5 neon-gradient text-background font-black rounded-2xl glow-primary text-xs"
        >
          <Copy size={16} className="mr-2" />
          {isCopying ? 'COPYING...' : 'COPY PROSES'}
        </Button>
      </div>

      <div className="flex glass-card p-1.5 rounded-2xl">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${activeTab === 'pending' ? 'neon-gradient text-white glow-primary' : 'text-muted-foreground'}`}
        >
          PENDING
        </button>
        <button 
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${activeTab === 'all' ? 'neon-gradient text-white glow-primary' : 'text-muted-foreground'}`}
        >
          SEMUA BATCH
        </button>
      </div>

      <div className="space-y-4">
        {sortedBatches.length === 0 ? (
          <div className="text-center py-20 opacity-20">
            <Layers size={64} className="mx-auto mb-4" />
            <p className="text-lg font-black uppercase">Belum ada setoran</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {sortedBatches.map((batch) => (
              <AccordionItem key={batch.id} value={batch.id} className="border-none">
                <Card className="glass-card border-none rounded-[1.5rem] overflow-hidden">
                  <AccordionTrigger className="p-5 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                    <div className="flex items-center justify-between w-full pr-4 text-left">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs uppercase text-primary">{batch.id.slice(0, 8)}</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">{users?.find(u => u.id === batch.userId)?.email.split('@')[0] || 'User'}</span>
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">{batch.createdAt?.seconds ? formatDate(new Date(batch.createdAt.seconds * 1000).toISOString()) : 'Baru saja'}</p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div className="space-y-0.5">
                          <p className="text-lg font-black leading-none">{batch.totalCount}</p>
                          <p className="text-[8px] font-black uppercase text-muted-foreground">Akun</p>
                        </div>
                        <Badge variant={batch.status === 'Selesai' ? 'default' : 'secondary'} className="h-6 px-3 rounded-lg text-[10px] font-black uppercase">
                          {batch.status}
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-5 border-t border-white/5 bg-white/5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        onClick={() => handleUpdateStatus(batch.id, 'Proses')}
                        variant="secondary"
                        className="h-10 text-[10px] font-black uppercase rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                      >
                        <Play size={14} className="mr-2" /> Tandai Proses
                      </Button>
                      <Button 
                        onClick={() => handleUpdateStatus(batch.id, 'Selesai')}
                        className="h-10 text-[10px] font-black uppercase rounded-xl neon-gradient text-background"
                      >
                        Selesaikan Batch
                      </Button>
                    </div>
                    <p className="text-[10px] text-center text-muted-foreground italic uppercase font-bold tracking-tight">Detail akun dapat dilihat melalui Firebase Console atau gunakan tombol 'Copy Proses' untuk manajemen massal.</p>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}
