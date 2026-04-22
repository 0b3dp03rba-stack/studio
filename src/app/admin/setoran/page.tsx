
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils-app';
import { Clock, Copy, Layers, Play, CheckCircle2, XCircle, User } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, limit, doc, serverTimestamp, where, getDocs, getDoc, setDoc, increment } from 'firebase/firestore';

export default function AdminSetoranPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'Pending' | 'Proses' | 'Selesai'>('Pending');
  const [isCopying, setIsCopying] = useState(false);
  const [expandedSubmissions, setExpandedSubmissions] = useState<Record<string, any[]>>({});

  const profileRef = useMemoFirebase(() => user ? doc(db, 'userProfiles', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(profileRef);
  const isAdmin = profile?.role === 'Admin';

  const batchesQuery = useMemoFirebase(() => {
    if (!isAdmin) return null;
    return query(collection(db, 'gmailBatches'), where('status', '==', activeTab), limit(100));
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

  const fetchSubmissions = async (batchId: string) => {
    if (expandedSubmissions[batchId]) return;
    try {
      const q = query(collection(db, `gmailBatches/${batchId}/gmailSubmissions`));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setExpandedSubmissions(prev => ({ ...prev, [batchId]: data }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateSubmissionStatus = async (batchId: string, subId: string, status: string, userId: string) => {
    try {
      const subRef = doc(db, `gmailBatches/${batchId}/gmailSubmissions`, subId);
      const userRef = doc(db, 'userProfiles', userId);
      
      const configRef = doc(db, 'appConfig', 'singletonConfig');
      const configSnap = await getDoc(configRef);
      const rate = configSnap.exists() ? (configSnap.data().gmailRate || 6000) : 6000;

      // Update submission status using setDoc merge for safety
      await setDoc(subRef, { status, processedAt: serverTimestamp() }, { merge: true });

      // If accepted, add to user balance
      if (status === 'Disetujui') {
        await setDoc(userRef, { 
          balance: increment(rate),
          updatedAt: serverTimestamp() 
        }, { merge: true });
      }

      // Update local state for immediate feedback
      setExpandedSubmissions(prev => ({
        ...prev,
        [batchId]: prev[batchId]?.map(s => s.id === subId ? { ...s, status } : s) || []
      }));

      toast({ title: "Berhasil", description: `Status Gmail diperbarui menjadi ${status}.` });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Gagal", description: "Gagal memperbarui status Gmail." });
    }
  };

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
          if (data.status === 'Pending' || data.status === 'Proses') {
            allText += `${data.email}|${data.password}\n`;
          }
        });
      }

      if (!allText) {
        toast({ title: "Kosong", description: "Tidak ada data dengan status 'Proses' atau 'Pending' dalam batch proses." });
        return;
      }

      await navigator.clipboard.writeText(allText.trim());
      toast({ title: "Berhasil", description: "Semua akun siap proses telah disalin ke clipboard." });
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal menyalin data." });
    } finally {
      setIsCopying(false);
    }
  };

  const handleUpdateBatchStatus = async (batchId: string, status: string) => {
    try {
      await setDoc(doc(db, 'gmailBatches', batchId), {
        status,
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast({ title: "Berhasil", description: `Status Batch diperbarui menjadi ${status}.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal memperbarui status batch." });
    }
  };

  if (isLoading) return <div className="p-20 text-center animate-pulse font-black uppercase tracking-widest text-primary text-[10px]">Memuat Database Setoran...</div>;
  if (!isAdmin) return <div className="p-20 text-center opacity-20 font-black uppercase">Akses Ditolak</div>;

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tighter">Manajemen Setoran</h1>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Kelola dan verifikasi gmail masuk.</p>
        </div>
        <Button 
          onClick={handleCopyProses} 
          disabled={isCopying}
          className="h-12 px-5 neon-gradient text-background font-black rounded-2xl glow-primary text-[10px] shadow-xl active:scale-95"
        >
          <Copy size={16} className="mr-2" />
          {isCopying ? 'COPYING...' : 'COPY PROSES'}
        </Button>
      </div>

      <div className="flex glass-card p-1.5 rounded-2xl shadow-inner">
        {['Pending', 'Proses', 'Selesai'].map((status) => (
          <button 
            key={status}
            onClick={() => setActiveTab(status as any)}
            className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${activeTab === status ? 'neon-gradient text-white glow-primary shadow-lg' : 'text-muted-foreground hover:bg-white/5'}`}
          >
            {status.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {sortedBatches.length === 0 ? (
          <div className="text-center py-24 glass-card rounded-[2.5rem] opacity-20 border-none">
            <Layers size={64} className="mx-auto mb-4" />
            <p className="text-lg font-black uppercase tracking-widest">Tidak ada batch {activeTab}</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {sortedBatches.map((batch) => {
              const batchUser = users?.find(u => u.id === batch.userId);
              const userLabel = batchUser?.email?.split('@')[0] || 'User';
              
              return (
                <AccordionItem 
                  key={batch.id} 
                  value={batch.id} 
                  className="border-none"
                  onClick={() => fetchSubmissions(batch.id)}
                >
                  <Card className="glass-card border-none rounded-[2rem] overflow-hidden shadow-2xl">
                    <AccordionTrigger className="p-5 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                      <div className="flex items-center justify-between w-full pr-4 text-left">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-[10px] uppercase text-primary">#{batch.id.slice(0, 8)}</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                              <User size={10}/> {userLabel}
                            </span>
                          </div>
                          <p className="text-[8px] font-black text-muted-foreground uppercase opacity-50 tracking-widest">{batch.createdAt?.seconds ? formatDate(new Date(batch.createdAt.seconds * 1000).toISOString()) : 'Baru saja'}</p>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <div className="space-y-0.5">
                            <p className="text-2xl font-black leading-none tracking-tighter">{batch.totalCount}</p>
                            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Akun</p>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-0 border-t border-white/5 bg-white/5">
                      <div className="p-5 space-y-6">
                         <div className="grid grid-cols-2 gap-3">
                          <Button 
                            onClick={() => handleUpdateBatchStatus(batch.id, 'Proses')}
                            disabled={batch.status === 'Proses'}
                            variant="secondary"
                            className="h-12 text-[10px] font-black uppercase rounded-2xl bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-none shadow-lg active:scale-95 disabled:opacity-50"
                          >
                            <Play size={14} className="mr-2" /> Tandai Proses
                          </Button>
                          <Button 
                            onClick={() => handleUpdateBatchStatus(batch.id, 'Selesai')}
                            disabled={batch.status === 'Selesai'}
                            className="h-12 text-[10px] font-black uppercase rounded-2xl neon-gradient text-background shadow-xl active:scale-95 disabled:opacity-50"
                          >
                            <CheckCircle2 size={14} className="mr-2" /> Selesaikan
                          </Button>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1">Daftar Akun Detail</h4>
                          <div className="space-y-2">
                            {expandedSubmissions[batch.id] ? (
                              expandedSubmissions[batch.id].map((sub) => (
                                <div key={sub.id} className="p-4 bg-black/20 rounded-2xl flex flex-col gap-3 border border-white/5 group hover:border-primary/20 transition-all">
                                  <div className="flex justify-between items-start">
                                    <div className="min-w-0">
                                      <p className="text-xs font-black truncate">{sub.email}</p>
                                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5 opacity-70">PW: {sub.password}</p>
                                    </div>
                                    <Badge variant={sub.status === 'Disetujui' ? 'default' : sub.status === 'Ditolak' ? 'destructive' : 'secondary'} className="text-[8px] px-2 h-5 font-black uppercase">
                                      {sub.status}
                                    </Badge>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button 
                                      size="sm"
                                      onClick={() => handleUpdateSubmissionStatus(batch.id, sub.id, 'Proses', batch.userId)}
                                      className="flex-1 h-8 text-[8px] font-black uppercase rounded-xl bg-white/5 hover:bg-white/10"
                                    >
                                      PROSES
                                    </Button>
                                    <Button 
                                      size="sm"
                                      onClick={() => handleUpdateSubmissionStatus(batch.id, sub.id, 'Ditolak', batch.userId)}
                                      className="flex-1 h-8 text-[8px] font-black uppercase rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20"
                                    >
                                      <XCircle size={12} className="mr-1"/> REJECT
                                    </Button>
                                    <Button 
                                      size="sm"
                                      onClick={() => handleUpdateSubmissionStatus(batch.id, sub.id, 'Disetujui', batch.userId)}
                                      className="flex-1 h-8 text-[8px] font-black uppercase rounded-xl bg-primary/10 text-primary hover:bg-primary/20"
                                    >
                                      <CheckCircle2 size={12} className="mr-1"/> ACCEPT
                                    </Button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-center py-4 text-[10px] font-black uppercase opacity-20">Memuat rincian...</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </div>
  );
}
