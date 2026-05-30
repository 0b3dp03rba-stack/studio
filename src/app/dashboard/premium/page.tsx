"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, ShieldCheck, Zap, Globe, Loader2, Save, ReceiptText, ArrowRight, Info, Network, CheckCircle2 } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, serverTimestamp, collection, setDoc, query, where, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils-app';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PremiumPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const profileRef = useMemoFirebase(() => user ? doc(db, 'userProfiles', user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const globalStatsRef = useMemoFirebase(() => doc(db, 'appConfig', 'globalStats'), [db]);
  const { data: globalStats } = useDoc(globalStatsRef);

  const pendingPaymentsQuery = useMemoFirebase(() => 
    user ? query(collection(db, 'payments'), where('userId', '==', user.uid), where('status', '==', 'pending'), limit(1)) : null,
    [db, user?.uid]
  );
  const { data: pendingPayments } = useCollection(pendingPaymentsQuery);

  const [isProcessing, setIsProcessing] = useState(false);
  const [customDomain, setCustomDomain] = useState('');
  const [isSavingDomain, setIsSavingDomain] = useState(false);
  
  const PREMIUM_PRICE = globalStats?.premiumPrice || 10000;

  useEffect(() => { if (profile?.customDomain) setCustomDomain(profile.customDomain); }, [profile]);

  const activeInvoice = pendingPayments?.[0];

  const handleCreateInvoice = async () => {
    if (!user || isProcessing) return;
    if (activeInvoice) { router.push(`/dashboard/premium/pay/${activeInvoice.id}`); return; }
    setIsProcessing(true);
    try {
      const res = await fetch('/api/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: PREMIUM_PRICE })
      });
      const result = await res.json();
      if (result.success && result.data) {
        const data = result.data;
        await setDoc(doc(db, 'payments', data.depositId), {
          id: data.depositId,
          userId: user.uid,
          amount: data.amount,
          totalAmount: data.totalAmount,
          qrImage: data.qrImage,
          expiredAt: data.expiredAt,
          status: 'pending',
          createdAt: serverTimestamp(),
        });
        router.push(`/dashboard/premium/pay/${data.depositId}`);
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally { setIsProcessing(false); }
  };

  const handleSaveDomain = async () => {
    if (!profileRef || !customDomain.includes('.')) return;
    setIsSavingDomain(true);
    try {
      await updateDoc(profileRef, { customDomain: customDomain.trim().toLowerCase(), updatedAt: serverTimestamp() });
      toast({ title: "DOMAIN DISIMPAN" });
    } catch (e) {
      toast({ variant: "destructive", title: "GAGAL" });
    } finally { setIsSavingDomain(false); }
  };

  const isActuallyPremium = profile?.isPremium || profile?.role === 'Admin';

  if (isActuallyPremium) {
    return (
      <div className="space-y-8 animate-in pb-24">
        <div className="text-center space-y-4 pt-6">
          <div className="mx-auto w-24 h-24 rounded-[2.5rem] neon-gradient flex items-center justify-center text-background glow-primary shadow-2xl relative">
            <ShieldCheck size={56} />
            <div className="absolute -bottom-2 bg-black border border-white/10 px-3 py-1 rounded-full text-[8px] font-black text-primary uppercase">Premium Active</div>
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Linku Gold</h1>
        </div>

        <Card className="glass-card border-none rounded-[2.5rem] p-8 space-y-8">
           <div className="flex items-center gap-3 border-b border-white/5 pb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Globe size={24} /></div>
              <h3 className="font-black text-base uppercase text-white">Custom Domain</h3>
           </div>
           
           <div className="space-y-6">
              <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase text-muted-foreground">Domain / Subdomain:</label>
                 <div className="flex gap-2">
                    <Input placeholder="budi.com" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} className="bg-white/5 border-none h-16 rounded-2xl font-bold text-base px-6" />
                    <Button onClick={handleSaveDomain} disabled={isSavingDomain} className="h-16 w-16 rounded-2xl neon-gradient text-background shrink-0 active:scale-95">{isSavingDomain ? <Loader2 className="animate-spin" /> : <Save size={28} />}</Button>
                 </div>
              </div>

              {customDomain && (
                <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/20 space-y-6 animate-in">
                  <div className="flex items-center gap-3 text-primary"><Network size={20} /><p className="text-xs font-black uppercase">Panduan DNS (Sangat Penting):</p></div>
                  <p className="text-[10px] font-bold text-white/60 leading-relaxed uppercase">Atur DNS domain Anda di panel domain (Niagahoster/Cloudflare/dll):</p>
                  <div className="bg-black/40 rounded-2xl overflow-hidden border border-white/10">
                    <table className="w-full text-[10px] text-left">
                      <thead className="bg-white/5 text-white/40 uppercase font-black"><tr><th className="p-3">Tipe</th><th className="p-3">Nama / Host</th><th className="p-3">Nilai / Target</th></tr></thead>
                      <tbody className="font-bold text-white uppercase"><tr className="border-t border-white/5"><td className="p-3">CNAME</td><td className="p-3 text-primary">@ (atau nama subdomain)</td><td className="p-3 text-primary">linku.biz.id</td></tr></tbody>
                    </table>
                  </div>
                  <div className="flex gap-3 pt-2"><CheckCircle2 size={16} className="text-primary shrink-0" /><p className="text-[9px] font-bold text-white/40 uppercase leading-relaxed">Gunakan CNAME ke <span className="text-white underline">linku.biz.id</span>. Ini metode paling stabil dan aman.</p></div>
                </div>
              )}
           </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in pb-24">
      <div className="text-center space-y-1"><h1 className="text-4xl font-black text-white uppercase tracking-tighter">Go Premium</h1><p className="text-[10px] font-black text-primary/70 uppercase tracking-[0.4em]">Satu Kali Bayar. Selamanya.</p></div>
      <Card className="glass-card border-none rounded-[2.5rem] overflow-hidden relative shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1.5 neon-gradient" />
        <CardContent className="p-8 space-y-8">
          <div className="text-center space-y-2">
             <p className="text-[10px] font-black text-white/40 uppercase">Investasi Identitas</p>
             <h2 className="text-6xl font-black text-white tracking-tighter">{formatCurrency(PREMIUM_PRICE)}</h2>
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full mt-3"><Sparkles size={12} className="text-primary" /><span className="text-[9px] font-black uppercase text-primary">Lifetime Access</span></div>
          </div>
          <div className="space-y-4 pt-6 border-t border-white/5">
            {[
              { t: 'Custom Domain', d: 'Gunakan domain pribadi Anda sendiri.', i: Globe },
              { t: 'Hapus Watermark', d: 'Branding bersih tanpa embel-embel.', i: ShieldCheck },
              { t: 'Fitur Prioritas', d: 'Akses visual premium paling cerdas.', i: Zap },
            ].map((f, i) => (
              <div key={i} className="flex gap-4 items-center p-4 bg-white/[0.02] rounded-2xl border border-white/5"><div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><f.i size={20} /></div><div><h3 className="text-xs font-black text-white uppercase">{f.t}</h3><p className="text-[10px] text-white/40">{f.d}</p></div></div>
            ))}
          </div>
          <div className="p-5 bg-white/5 rounded-3xl border border-white/10 space-y-3">
             <div className="flex items-center gap-2 text-primary"><Info size={16} /><p className="text-[10px] font-black uppercase">Sistem Verifikasi:</p></div>
             <p className="text-[9px] font-bold text-white/40 leading-relaxed uppercase">Sistem akan menambahkan <span className="text-white">kode unik (1-500 IDR)</span> pada nominal akhir untuk verifikasi otomatis.</p>
          </div>
          <Button onClick={handleCreateInvoice} disabled={isProcessing} className="w-full h-16 neon-gradient text-background font-black rounded-3xl glow-primary shadow-2xl uppercase tracking-[0.2em] text-sm active:scale-95 transition-all">
            {isProcessing ? <Loader2 className="animate-spin" /> : (activeInvoice ? "LANJUTKAN PEMBAYARAN" : "AKTIFKAN SEKARANG")}
          </Button>
          {activeInvoice && (
            <Link href={`/dashboard/premium/pay/${activeInvoice.id}`}>
              <Card className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex items-center justify-between shadow-xl mt-4">
                <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><ReceiptText size={24} /></div><div className="text-left"><p className="text-[10px] font-black text-white uppercase">Invoice Aktif</p><p className="text-[8px] font-bold text-primary uppercase">ID: {activeInvoice.id}</p></div></div>
                <ArrowRight size={16} className="text-primary" />
              </Card>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
