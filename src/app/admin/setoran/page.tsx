"use client";

import { useApp, SubmissionStatus } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils-app';
import { Check, X, Copy, CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
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
  const pendingBatches = allBatches.filter(b => b.status === 'Pending');
  const filteredBatches = activeTab === 'pending' ? pendingBatches : allBatches;

  const handleAction = (batchId: string, gmailId: string, status: SubmissionStatus) => {
    dispatch({ type: 'PROCESS_GMAIL', payload: { batchId, gmailId, status } });
    toast({ title: "Berhasil", description: `Gmail ${status === 'Disetujui' ? 'disetujui' : 'ditolak'}.` });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Data berhasil disalin ke clipboard." });
  };

  const copyGmailBatch = (batch: any, type: 'all-pending' | 'all-valid') => {
    let toCopy = '';
    if (type === 'all-pending') {
      toCopy = batch.items.filter((i: any) => i.status === 'Pending').map((i: any) => `${i.email}|${i.pass}`).join('\n');
    } else {
      toCopy = batch.items.filter((i: any) => i.status !== 'Ditolak').map((i: any) => `${i.email}|${i.pass}`).join('\n');
    }
    
    if (!toCopy) {
      toast({ variant: "destructive", title: "Gagal", description: "Tidak ada data untuk disalin." });
      return;
    }
    copyToClipboard(toCopy);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Manajemen Setoran</h1>
        <p className="text-muted-foreground text-sm">Setujui atau tolak setoran Gmail user.</p>
      </div>

      <div className="flex bg-white/5 p-1 rounded-xl">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'pending' ? 'neon-gradient text-background glow-primary' : 'text-muted-foreground'}`}
        >
          PENDING ({pendingBatches.length})
        </button>
        <button 
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'all' ? 'neon-gradient text-background glow-primary' : 'text-muted-foreground'}`}
        >
          SEMUA BATCH
        </button>
      </div>

      <div className="space-y-4">
        {filteredBatches.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <Clock size={48} className="mx-auto mb-4" />
            <p>Tidak ada batch untuk ditampilkan.</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-3">
            {filteredBatches.map((batch) => (
              <AccordionItem key={batch.id} value={batch.id} className="border-none">
                <Card className="glass-card border-white/5 overflow-hidden">
                  <AccordionTrigger className="p-4 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                    <div className="flex items-center justify-between w-full pr-4 text-left">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{batch.id.slice(0, 8)}</span>
                          <span className="text-[10px] text-muted-foreground">{state.users.find(u => u.id === batch.userId)?.email.split('@')[0]}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{formatDate(batch.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{batch.items.length}</p>
                        <Badge variant={batch.status === 'Selesai' ? 'default' : 'secondary'} className="text-[8px] px-1 h-3.5">{batch.status}</Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-0 border-t border-white/5">
                    <div className="p-3 flex gap-2 overflow-x-auto pb-4">
                      <Button size="sm" variant="outline" className="text-[10px] h-7 whitespace-nowrap" onClick={() => copyGmailBatch(batch, 'all-pending')}>
                        <Copy size={12} className="mr-1" /> Copy Pending
                      </Button>
                      <Button size="sm" variant="outline" className="text-[10px] h-7 whitespace-nowrap" onClick={() => copyGmailBatch(batch, 'all-valid')}>
                        <Copy size={12} className="mr-1" /> Copy All Non-Rejected
                      </Button>
                    </div>
                    <div className="space-y-1 px-3 pb-3">
                      {batch.items.map((item) => (
                        <div key={item.id} className="p-3 bg-white/5 rounded-xl flex items-center justify-between group">
                          <div className="space-y-0.5 truncate flex-1 min-w-0 mr-2">
                            <p className="text-xs font-medium truncate">{item.email}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{item.pass}</p>
                          </div>
                          <div className="flex gap-1">
                            {item.status === 'Pending' ? (
                              <>
                                <Button 
                                  size="icon" 
                                  className="h-8 w-8 rounded-lg bg-primary/20 text-primary hover:bg-primary hover:text-background transition-all"
                                  onClick={() => handleAction(batch.id, item.id, 'Disetujui')}
                                >
                                  <Check size={14} />
                                </Button>
                                <Button 
                                  size="icon" 
                                  className="h-8 w-8 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-all"
                                  onClick={() => handleAction(batch.id, item.id, 'Ditolak')}
                                >
                                  <X size={14} />
                                </Button>
                              </>
                            ) : (
                              <Badge variant={item.status === 'Disetujui' ? 'default' : 'destructive'} className="text-[8px]">
                                {item.status}
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
