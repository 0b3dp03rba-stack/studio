"use client";

import { useState } from 'react';
import { useApp, Batch, GmailItem } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { validateGmailFormat } from '@/lib/utils-app';
import { Send, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SetorPage() {
  const [input, setInput] = useState('');
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const router = useRouter();

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
    router.push('/riwayat');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Setor Gmail</h1>
        <p className="text-muted-foreground text-sm">Gunakan format <code className="text-primary">email|password</code> per baris.</p>
      </div>

      <Card className="glass-card border-white/10">
        <CardContent className="p-4 space-y-4">
          <Textarea 
            placeholder="example1@gmail.com|pass123&#10;example2@gmail.com|pass456"
            className="min-h-[300px] bg-white/5 font-mono text-sm leading-relaxed"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl flex gap-2">
            <AlertCircle size={16} className="text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-primary/80 leading-snug">Pastikan data yang dimasukkan valid dan belum pernah disetor sebelumnya.</p>
          </div>
          <Button 
            onClick={handleSubmit} 
            className="w-full h-12 neon-gradient text-background font-bold glow-primary"
          >
            <Send size={18} className="mr-2" />
            Kirim Setoran
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-bold">Ketentuan Setoran</h3>
        <ul className="space-y-2">
          {state.settings.rules.map((rule, i) => (
            <li key={i} className="text-sm text-muted-foreground flex gap-2">
              <span className="text-primary font-bold">•</span>
              {rule}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
