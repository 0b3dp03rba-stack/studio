"use client";

import { useState, useMemo } from 'react';
import { useApp, Batch } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { validateGmailFormat, formatCurrency } from '@/lib/utils-app';
import { Send, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SetorPage() {
  const [input, setInput] = useState('');
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const router = useRouter();

  // Real-time calculation
  const stats = useMemo(() => {
    const { items } = validateGmailFormat(input);
    return {
      validCount: items.length,
      estimation: items.length * state.settings.gmailRate
    };
  }, [input, state.settings.gmailRate]);

  const handleSubmit = () => {
    const { items, errors } = validateGmailFormat(input);

    if (errors.length > 0) {
      toast({ 
        variant: "destructive", 
        title: "Format Salah", 
        description: errors[0] 
      });
      return;
    }

    if (items.length === 0) {
      toast({ 
        variant: "destructive", 
        title: "Input Kosong", 
        description: "Silakan masukkan data Gmail." 
      });
      return;
    }

    // Check duplicates within the batch
    const emails = items.map(i => i.email);
    const hasInternalDupes = new Set(emails).size !== emails.length;
    if (hasInternalDupes) {
      toast({ variant: "destructive", title: "Gagal", description: "Ada email duplikat di input Anda." });
      return;
    }

    // Check duplicates in existing global batches
    const existingEmails = new Set(state.batches.flatMap(b => b.items.map(i => i.email)));
    const hasGlobalDupes = items.some(i => existingEmails.has(i.email));
    if (hasGlobalDupes) {
      toast({ variant: "destructive", title: "Gagal", description: "Satu atau lebih email sudah pernah disetor sebelumnya." });
      return;
    }

    const newBatch: Batch = {
      id: `batch-${Date.now()}`,
      userId: state.currentUser!.id,
      createdAt: new Date().toISOString(),
      status: 'Pending',
      items: items.map(item => ({
        id: `mail-${Math.random().toString(36).substr(2, 9)}`,
        email: item.email,
        pass: item.pass,
        status: 'Pending'
      }))
    };

    dispatch({ type: 'SUBMIT_BATCH', payload: newBatch });
    toast({ title: "Berhasil", description: `${items.length} Gmail telah disetorkan.` });
    setInput('');
    router.push('/dashboard/riwayat');
  };

  const currentDate = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  return (
    <div className="space-y-6 animate-in">
      {/* Header Card - Custom Gradient */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#8E2DE2] to-[#4A00E0] p-8 text-white shadow-xl glow-primary">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Send size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Setor Gmail</h1>
          </div>
          <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em]">SETORAN {currentDate}</p>
          
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <p className="text-[8px] font-bold text-white/50 uppercase mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-black uppercase">OPEN</span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <p className="text-[8px] font-bold text-white/50 uppercase mb-1">Rate / email</p>
              <span className="text-xs font-black">{formatCurrency(state.settings.gmailRate)}</span>
            </div>
          </div>
        </div>
        {/* Decorative Circles */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />
      </div>

      {/* Rules Section */}
      <Card className="glass-card border-none rounded-[1.5rem] overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-yellow-500 font-bold text-sm">
            <AlertCircle size={18} />
            <span>Aturan Setoran</span>
          </div>
          <ul className="space-y-2">
            {state.settings.rules.map((rule, i) => (
              <li key={i} className="text-xs text-muted-foreground font-medium flex gap-3 leading-relaxed">
                <span className="text-muted-foreground/40">•</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Input Section */}
      <Card className="glass-card border-none rounded-[1.5rem]">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground">Daftar Gmail (bulk)</h3>
          <Textarea 
            placeholder="contoh@gmail.com|passwordku123&#10;contoh2@gmail.com|password456"
            className="min-h-[250px] bg-white/5 border-white/5 rounded-2xl font-mono text-sm leading-relaxed p-4 focus-visible:ring-primary/30"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          
          <div className="flex justify-between items-center px-1">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Valid</p>
              <p className="text-sm font-black text-primary">{stats.validCount}</p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Estimasi</p>
              <p className="text-sm font-black text-secondary">{formatCurrency(stats.estimation)}</p>
            </div>
          </div>

          <Button 
            onClick={handleSubmit} 
            className="w-full h-14 neon-gradient text-background font-black glow-primary rounded-[1.25rem] text-md group active:scale-95 transition-all"
          >
            <CheckCircle2 size={20} className="mr-2 group-hover:rotate-12 transition-transform" />
            Kirim Setoran
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
