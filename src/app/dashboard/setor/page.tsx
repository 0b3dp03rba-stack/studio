
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { validateGmailFormat, formatCurrency } from '@/lib/utils-app';
import { Send, AlertCircle, CheckCircle2, Lock, Clock, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, writeBatch, getDoc } from 'firebase/firestore';

export default function SetorPage() {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setCurrentDate(new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date()));
  }, []);

  const configRef = useMemoFirebase(() => doc(db, 'appConfig', 'singletonConfig'), [db]);
  const { data: config, isLoading: isConfigLoading } = useDoc(configRef);

  const isClosed = config && config.isPlatformOpen === false;

  const stats = useMemo(() => {
    const { items } = validateGmailFormat(input);
    
    // Check for internal duplicates in current input
    const emails = items.map(i => i.email.toLowerCase());
    const uniqueEmails = new Set(emails);
    const internalDuplicates = items.filter((item, index) => emails.indexOf(item.email.toLowerCase()) !== index);

    const rate = config?.gmailRate || 6000;
    return {
      validCount: items.length,
      uniqueCount: uniqueEmails.size,
      internalDuplicates,
      estimation: uniqueEmails.size * rate
    };
  }, [input, config]);

  const handleSubmit = async () => {
    if (!user || isClosed) return;
    const { items, errors } = validateGmailFormat(input);

    if (errors.length > 0) {
      toast({ variant: "destructive", title: "Format Salah", description: errors[0] });
      return;
    }

    if (items.length === 0) {
      toast({ variant: "destructive", title: "Input Kosong", description: "Silakan masukkan data Gmail." });
      return;
    }

    if (stats.internalDuplicates.length > 0) {
      toast({ 
        variant: "destructive", 
        title: "Duplikasi Terdeteksi", 
        description: `Ada ${stats.internalDuplicates.length} email ganda dalam input Anda: ${stats.internalDuplicates[0].email}` 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Global Duplicate Check
      // We check each email against /submittedEmails/{email}
      // Note: For large batches, this could be optimized, but for MVP it ensures safety.
      const duplicateFound: string[] = [];
      
      for (const item of items) {
        const emailKey = item.email.toLowerCase().trim();
        const checkRef = doc(db, 'submittedEmails', emailKey);
        const snap = await getDoc(checkRef);
        if (snap.exists()) {
          duplicateFound.push(item.email);
        }
      }

      if (duplicateFound.length > 0) {
        toast({ 
          variant: "destructive", 
          title: "Email Sudah Pernah Disetor", 
          description: `${duplicateFound[0]} dan ${duplicateFound.length - 1} lainnya sudah ada di database.` 
        });
        setIsSubmitting(false);
        return;
      }

      // Proceed with batch creation
      const batchRef = await addDoc(collection(db, 'gmailBatches'), {
        userId: user.uid,
        createdAt: serverTimestamp(),
        status: 'Pending',
        totalCount: items.length
      });

      const firebaseBatch = writeBatch(db);
      
      items.forEach((item) => {
        const emailKey = item.email.toLowerCase().trim();
        
        // 1. Create Submission Detail
        const submissionRef = doc(collection(db, `gmailBatches/${batchRef.id}/gmailSubmissions`));
        firebaseBatch.set(submissionRef, {
          batchId: batchRef.id,
          userId: user.uid,
          email: item.email,
          password: item.pass,
          status: 'Pending',
          createdAt: serverTimestamp()
        });

        // 2. Mark as globally submitted to prevent future duplicates
        const trackerRef = doc(db, 'submittedEmails', emailKey);
        firebaseBatch.set(trackerRef, {
          userId: user.uid,
          batchId: batchRef.id,
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

  if (isConfigLoading) return <div className="p-20 text-center animate-pulse text-primary font-black uppercase text-[10px] tracking-widest">Sinkronisasi Server...</div>;

  return (
    <div className="space-y-6 animate-in">
      <div className="relative overflow-hidden rounded-[2.5rem] neon-gradient p-8 text-white shadow-xl glow-primary">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-black/30 rounded-2xl backdrop-blur-xl border border-white/10">
              <Send size={24} className="text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase neon-text">Setor Gmail</h1>
          </div>
          <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em] ml-1">SETORAN {currentDate || '...'}</p>
          
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className={`backdrop-blur-xl rounded-3xl p-4 border border-white/10 ${isClosed ? 'bg-red-500/10' : 'bg-white/5'}`}>
              <p className="text-[8px] font-black text-white/40 uppercase mb-1 tracking-widest">Status Layanan</p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isClosed ? 'bg-red-500 animate-pulse' : 'bg-primary animate-pulse'}`} />
                <span className={`text-[11px] font-black uppercase tracking-widest ${isClosed ? 'text-red-500' : 'text-primary'}`}>
                  {isClosed ? 'CLOSED' : 'OPEN'}
                </span>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-4 border border-white/10">
              <p className="text-[8px] font-black text-white/40 uppercase mb-1 tracking-widest">Rate / Akun</p>
              <span className="text-[11px] font-black tracking-tight text-white">{formatCurrency(config?.gmailRate || 6000)}</span>
            </div>
          </div>
        </div>
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />
      </div>

      {isClosed ? (
        <Card className="glass-card border-none rounded-[2rem] p-10 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500 glow-red">
            <Clock size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black uppercase tracking-tighter text-white">Layanan Sedang Tutup</h2>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed px-4">Maaf, Admin sedang offline atau layanan setoran sedang dinonaktifkan sementara. Silakan hubungi CS atau coba lagi nanti.</p>
          </div>
          <Button 
            variant="outline" 
            asChild
            className="w-full h-14 rounded-2xl border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/5"
          >
            <a href={config?.floatingBtnLink || "#"} target="_blank" rel="noopener noreferrer">Hubungi Customer Service</a>
          </Button>
        </Card>
      ) : (
        <>
          <Card className="glass-card border-none rounded-[2rem] overflow-hidden group">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
                <AlertCircle size={16} />
                <span>Aturan Setoran Obed Store</span>
              </div>
              <ul className="space-y-2.5">
                {(config?.rules || []).map((rule: string, i: number) => (
                  <li key={i} className="text-[11px] text-muted-foreground font-medium flex gap-3 leading-relaxed">
                    <span className="text-primary mt-1">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
                <li className="text-[11px] text-primary font-black uppercase flex gap-3 leading-relaxed">
                   <span className="mt-1">•</span>
                   <span>Satu akun Gmail hanya bisa disetor satu kali selamanya.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card border-none rounded-[2rem] shadow-2xl">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Input Batch Akun</h3>
                <span className="text-[8px] font-bold text-white/30 uppercase">Format: email|pass</span>
              </div>
              <Textarea 
                placeholder="contoh@gmail.com|passwordku123&#10;user2@gmail.com|rahasia456"
                className="min-h-[250px] bg-white/[0.02] border-white/5 rounded-3xl font-mono text-xs leading-relaxed p-5 focus-visible:ring-primary/20 shadow-inner"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Jumlah Akun</p>
                    <p className="text-xl font-black text-primary tracking-tighter">{stats.validCount}</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Estimasi Saldo</p>
                    <p className="text-xl font-black text-white tracking-tighter">{formatCurrency(stats.estimation)}</p>
                  </div>
                </div>

                {stats.internalDuplicates.length > 0 && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500">
                    <XCircle size={16} />
                    <p className="text-[10px] font-black uppercase">Duplikasi terdeteksi dalam input!</p>
                  </div>
                )}
              </div>

              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !input || stats.internalDuplicates.length > 0}
                className="w-full h-16 neon-gradient text-white font-black glow-primary rounded-[1.5rem] text-sm uppercase tracking-[0.2em] group active:scale-95 transition-all shadow-2xl"
              >
                <CheckCircle2 size={20} className="mr-3 group-hover:rotate-12 transition-transform" />
                {isSubmitting ? "CHECKING & PROCESSING..." : "KIRIM SETORAN"}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
