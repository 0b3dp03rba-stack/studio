
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { validateGmailFormat, formatCurrency } from '@/lib/utils-app';
import { Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, writeBatch } from 'firebase/firestore';

export default function SetorPage() {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Avoid hydration mismatch by setting date after mount
    setCurrentDate(new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date()));
  }, []);

  const configRef = useMemoFirebase(() => doc(db, 'appConfig', 'singletonConfig'), [db]);
  const { data: config } = useDoc(configRef);

  const stats = useMemo(() => {
    const { items } = validateGmailFormat(input);
    const rate = config?.gmailRate || 6000;
    return {
      validCount: items.length,
      estimation: items.length * rate
    };
  }, [input, config]);

  const handleSubmit = async () => {
    if (!user) return;
    const { items, errors } = validateGmailFormat(input);

    if (errors.length > 0) {
      toast({ variant: "destructive", title: "Format Salah", description: errors[0] });
      return;
    }

    if (items.length === 0) {
      toast({ variant: "destructive", title: "Input Kosong", description: "Silakan masukkan data Gmail." });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create Batch Document
      const batchRef = await addDoc(collection(db, 'gmailBatches'), {
        userId: user.uid,
        createdAt: serverTimestamp(),
        status: 'Pending',
        totalCount: items.length
      });

      // 2. Add individual submissions using a Firestore Batch for efficiency
      const firebaseBatch = writeBatch(db);
      items.forEach((item) => {
        const submissionRef = doc(collection(db, `gmailBatches/${batchRef.id}/gmailSubmissions`));
        firebaseBatch.set(submissionRef, {
          batchId: batchRef.id,
          userId: user.uid,
          email: item.email,
          password: item.pass,
          status: 'Pending',
          createdAt: serverTimestamp()
        });
      });

      await firebaseBatch.commit();
      
      toast({ title: "Berhasil", description: `${items.length} Gmail telah disetorkan.` });
      setInput('');
      router.push('/dashboard/riwayat');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal", description: error.message || "Terjadi kesalahan saat mengirim." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="relative overflow-hidden rounded-[2rem] neon-gradient p-8 text-background shadow-xl glow-primary">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-background/20 rounded-xl backdrop-blur-md border border-background/20">
              <Send size={20} className="text-background" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Setor Gmail</h1>
          </div>
          <p className="text-background/70 text-[10px] font-black uppercase tracking-[0.2em]">SETORAN {currentDate || '...'}</p>
          
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-background/10 backdrop-blur-md rounded-2xl p-3 border border-background/10">
              <p className="text-[8px] font-bold text-background/50 uppercase mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-background animate-pulse" />
                <span className="text-xs font-black uppercase">OPEN</span>
              </div>
            </div>
            <div className="bg-background/10 backdrop-blur-md rounded-2xl p-3 border border-background/10">
              <p className="text-[8px] font-bold text-background/50 uppercase mb-1">Rate / email</p>
              <span className="text-xs font-black">{formatCurrency(config?.gmailRate || 6000)}</span>
            </div>
          </div>
        </div>
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
      </div>

      <Card className="glass-card border-none rounded-[1.5rem] overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <AlertCircle size={18} />
            <span>Aturan Setoran</span>
          </div>
          <ul className="space-y-2">
            {(config?.rules || []).map((rule: string, i: number) => (
              <li key={i} className="text-xs text-muted-foreground font-medium flex gap-3 leading-relaxed">
                <span className="text-primary/40">•</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

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
            disabled={isSubmitting || !input}
            className="w-full h-14 neon-gradient text-background font-black glow-primary rounded-[1.25rem] text-md group active:scale-95 transition-all"
          >
            <CheckCircle2 size={20} className="mr-2 group-hover:rotate-12 transition-transform" />
            {isSubmitting ? "Mengirim..." : "Kirim Setoran"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
