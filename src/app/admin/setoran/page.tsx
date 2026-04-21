
"use client";

import { SubmissionStatus } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils-app';
import { Check, X, Copy, Clock, Play } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc, updateDoc, serverTimestamp, where, getDocs } from 'firebase/firestore';

export default function AdminSetoranPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');

  // Verify admin status first to avoid permission errors on query
  const profileRef = useMemoFirebase(() => user ? doc(db, 'userProfiles', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(profileRef);
  const isAdmin = profile?.role === 'Admin';

  const batchesQuery = useMemoFirebase(() => {
    if (!isAdmin) return null;
    if (activeTab === 'pending') {
      return query(collection(db, 'gmailBatches'), where('status', '==', 'Pending'), orderBy('createdAt', 'desc'), limit(100));
    }
    return query(collection(db, 'gmailBatches'), orderBy('createdAt', 'desc'), limit(100));
  }, [db, activeTab, isAdmin]);

  const { data: batches, isLoading } = useCollection(batchesQuery);
  const { data: users } = useCollection(useMemoFirebase(() => isAdmin ? query(collection(db, 'userProfiles'), limit(500)) : null, [db, isAdmin]));

  const handleAction = async (batchId: string, gmailId: string, status: SubmissionStatus) => {
    try {
      const submissionRef = doc(db, `gmailBatches/${batchId}/gmailSubmissions/${gmailId}`);
      await updateDoc(submissionRef, { 
        status,
        processedAt: serverTimestamp()
      });
      toast({ title: "Berhasil", description: `Gmail diperbarui menjadi ${status}.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal", description: "Anda tidak memiliki izin untuk mengubah data ini." });
    }
  };

  if (!isAdmin && !isLoading) {
    return <div className="p-8 text-center text-muted-foreground uppercase font-black tracking-widest opacity-20">Akses Ditolak</div>;
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight">Setoran Masuk</h1>
        <p className="text-muted-foreground text-sm font-medium">Verifikasi data Gmail dari para user.</p>
      </div>

      <div className="flex glass-card p-1.5 rounded-2xl">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${activeTab === 'pending' ? 'neon-gradient text-white glow-primary' : 'text-muted-foreground'}`}
        >
          AKTIF
        </button>
        <button 
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${activeTab === 'all' ? 'neon-gradient text-white glow-primary' : 'text-muted-foreground'}`}
        >
          SEMUA BATCH
        </button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : !batches || batches.length === 0 ? (
          <div className="text-center py-20 opacity-30">
            <Clock size={64} className="mx-auto mb-4" />
            <p className="text-lg font-bold">Belum ada setoran.</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {batches.map((batch) => (
              <AccordionItem key={batch.id} value={batch.id} className="border-none">
                <Card className="glass-card border-none rounded-[1.5rem] overflow-hidden">
                  <AccordionTrigger className="p-5 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                    <div className="flex items-center justify-between w-full pr-4 text-left">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm uppercase text-primary">{batch.id.slice(0, 8)}</span>
                          <div className="w-1 h-1 rounded-full bg-muted-foreground" />
                          <span className="text-xs font-bold text-muted-foreground">{users?.find(u => u.id === batch.userId)?.email.split('@')[0] || 'User'}</span>
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">{batch.createdAt?.seconds ? formatDate(new Date(batch.createdAt.seconds * 1000).toISOString()) : 'Baru saja'}</p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div className="space-y-0.5">
                          <p className="text-lg font-black leading-none">{batch.totalCount}</p>
                          <p className="text-[8px] font-black uppercase text-muted-foreground">Akun</p>
                        </div>
                        <Badge variant={batch.status === 'Selesai' ? 'default' : 'secondary'} className="h-6 px-3 rounded-lg text-[10px] font-black">
                          {batch.status}
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 border-t border-white/5 bg-white/5">
                    <p className="text-xs text-center text-muted-foreground py-4">Gunakan Firebase Console untuk manajemen detail item submisi atau aktifkan Cloud Functions untuk pemrosesan saldo otomatis.</p>
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
