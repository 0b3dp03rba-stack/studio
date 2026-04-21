
"use client";

import { useApp, SubmissionStatus } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils-app';
import { Check, X, Copy, Clock, Play, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

export default function AdminSetoranPage() {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');

  const allBatches = [...state.batches].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const pendingBatches = allBatches.filter(b => b.items.some(i => i.status === 'Pending' || i.status === 'Proses'));
  const filteredBatches = activeTab === 'pending' ? pendingBatches : allBatches;

  const handleAction = (batchId: string, gmailId: string, status: SubmissionStatus) => {
    dispatch({ type: 'PROCESS_GMAIL', payload: { batchId, gmailId, status } });
    toast({ 
      title: status, 
      description: `Gmail ${status === 'Proses' ? 'sedang diproses' : status === 'Disetujui' ? 'disetujui' : 'ditolak'}.` 
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Data berhasil disalin ke clipboard." });
  };

  const copyGmailBatch = (batch: any, type: 'proses' | 'all') => {
    let toCopy = '';
    if (type === 'proses') {
      toCopy = batch.items.filter((i: any) => i.status === 'Proses').map((i: any) => `${i.email}|${i.pass}`).join('\n');
    } else {
      toCopy = batch.items.map((i: any) => `${i.email}|${i.pass}`).join('\n');
    }
    
    if (!toCopy) {
      toast({ variant: "destructive", title: "Gagal", description: "Tidak ada data untuk disalin." });
      return;
    }
    copyToClipboard(toCopy);
  };

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
          AKTIF ({pendingBatches.length})
        </button>
        <button 
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${activeTab === 'all' ? 'neon-gradient text-white glow-primary' : 'text-muted-foreground'}`}
        >
          SEMUA BATCH
        </button>
      </div>

      <div className="space-y-4">
        {filteredBatches.length === 0 ? (
          <div className="text-center py-20 opacity-30">
            <Clock size={64} className="mx-auto mb-4" />
            <p className="text-lg font-bold">Belum ada setoran aktif.</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {filteredBatches.map((batch) => (
              <AccordionItem key={batch.id} value={batch.id} className="border-none">
                <Card className="glass-card border-none rounded-[1.5rem] overflow-hidden">
                  <AccordionTrigger className="p-5 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                    <div className="flex items-center justify-between w-full pr-4 text-left">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm uppercase text-primary">{batch.id.slice(0, 8)}</span>
                          <div className="w-1 h-1 rounded-full bg-muted-foreground" />
                          <span className="text-xs font-bold text-muted-foreground">{state.users.find(u => u.id === batch.userId)?.email.split('@')[0]}</span>
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">{formatDate(batch.createdAt)}</p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div className="space-y-0.5">
                          <p className="text-lg font-black leading-none">{batch.items.length}</p>
                          <p className="text-[8px] font-black uppercase text-muted-foreground">Akun</p>
                        </div>
                        <Badge variant={batch.status === 'Selesai' ? 'default' : 'secondary'} className="h-6 px-3 rounded-lg text-[10px] font-black">
                          {batch.status}
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-0 border-t border-white/5 bg-white/5">
                    <div className="p-4 flex gap-3 overflow-x-auto">
                      <Button size="sm" variant="outline" className="text-[10px] h-9 px-4 rounded-xl font-bold bg-white/5 border-primary/20 text-primary" onClick={() => copyGmailBatch(batch, 'proses')}>
                        <Copy size={14} className="mr-2" /> Copy Status Proses
                      </Button>
                      <Button size="sm" variant="outline" className="text-[10px] h-9 px-4 rounded-xl font-bold bg-white/5" onClick={() => copyGmailBatch(batch, 'all')}>
                        <Copy size={14} className="mr-2" /> Copy All
                      </Button>
                    </div>
                    <div className="space-y-2 px-4 pb-4">
                      {batch.items.map((item) => (
                        <div key={item.id} className="p-4 glass-card rounded-2xl flex items-center justify-between group">
                          <div className="space-y-1 truncate flex-1 min-w-0 mr-4">
                            <p className="text-sm font-bold truncate tracking-tight">{item.email}</p>
                            <p className="text-xs font-mono text-muted-foreground truncate opacity-70">{item.pass}</p>
                          </div>
                          <div className="flex gap-2">
                            {item.status === 'Pending' && (
                              <Button 
                                size="icon" 
                                className="h-10 w-10 rounded-xl bg-secondary/20 text-secondary hover:bg-secondary hover:text-white transition-all"
                                onClick={() => handleAction(batch.id, item.id, 'Proses')}
                                title="Mulai Proses"
                              >
                                <Play size={18} />
                              </Button>
                            )}
                            {(item.status === 'Pending' || item.status === 'Proses') && (
                              <>
                                <Button 
                                  size="icon" 
                                  className="h-10 w-10 rounded-xl bg-primary/20 text-primary hover:bg-primary hover:text-black transition-all"
                                  onClick={() => handleAction(batch.id, item.id, 'Disetujui')}
                                  title="Setujui"
                                >
                                  <Check size={18} />
                                </Button>
                                <Button 
                                  size="icon" 
                                  className="h-10 w-10 rounded-xl bg-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-all"
                                  onClick={() => handleAction(batch.id, item.id, 'Ditolak')}
                                  title="Tolak"
                                >
                                  <X size={18} />
                                </Button>
                              </>
                            )}
                            {(item.status === 'Disetujui' || item.status === 'Ditolak') && (
                              <Badge 
                                variant={item.status === 'Disetujui' ? 'default' : 'destructive'} 
                                className="h-7 px-3 rounded-lg text-[9px] font-black uppercase"
                              >
                                {item.status}
                              </Badge>
                            )}
                            {item.status === 'Proses' && (
                              <Badge className="h-7 px-3 rounded-lg text-[9px] font-black uppercase bg-secondary/20 text-secondary border-none">
                                Proses
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
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
