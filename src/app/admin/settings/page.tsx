
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Sparkles, CreditCard, LayoutDashboard, FileText, Bell } from 'lucide-react';
import { generateContentForAdmin } from '@/ai/flows/admin-genai-content-creator-flow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

export default function AdminSettingsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  
  const configRef = useMemoFirebase(() => doc(db, 'appConfig', 'singletonConfig'), [db]);
  const { data: config, isLoading } = useDoc(configRef);

  const [localConfig, setLocalConfig] = useState<any>(null);
  const [newRule, setNewRule] = useState('');
  const [newAnn, setNewAnn] = useState('');
  const [newPayment, setNewPayment] = useState('');
  const [aiType, setAiType] = useState<'Rules' | 'Announcements'>('Rules');
  const [aiKeywords, setAiKeywords] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    } else if (!isLoading) {
      setLocalConfig({
        gmailRate: 6000,
        minWithdraw: 10000,
        adminFee: 500,
        floatingBtnLink: '',
        paymentMethods: [
          { name: 'DANA', enabled: true },
          { name: 'OVO', enabled: true },
          { name: 'GOPAY', enabled: true },
          { name: 'SHOPEEPAY', enabled: true }
        ],
        rules: [],
        announcements: []
      });
    }
  }, [config, isLoading]);

  if (isLoading || !localConfig) return <div className="p-20 text-center animate-pulse font-black uppercase">Memuat Pengaturan...</div>;

  const handleUpdateParam = (key: string, val: any) => {
    setLocalConfig({ ...localConfig, [key]: val });
  };

  const saveGeneral = async () => {
    await setDoc(configRef, {
      ...localConfig,
      gmailRate: Number(localConfig.gmailRate),
      minWithdraw: Number(localConfig.minWithdraw),
      adminFee: Number(localConfig.adminFee),
    }, { merge: true });
    toast({ title: "Berhasil", description: "Parameter sistem diperbarui." });
  };

  const handleAddPayment = async () => {
    if (!newPayment) return;
    const methods = localConfig.paymentMethods || [];
    const updated = [...methods, { name: newPayment.toUpperCase(), enabled: true }];
    await setDoc(configRef, { paymentMethods: updated }, { merge: true });
    setNewPayment('');
    toast({ title: "Berhasil", description: "Metode pembayaran baru ditambahkan." });
  };

  const togglePayment = async (name: string) => {
    const updated = localConfig.paymentMethods.map((m: any) => 
      m.name === name ? { ...m, enabled: !m.enabled } : m
    );
    await setDoc(configRef, { paymentMethods: updated }, { merge: true });
  };

  const deletePayment = async (name: string) => {
    const updated = localConfig.paymentMethods.filter((m: any) => m.name !== name);
    await setDoc(configRef, { paymentMethods: updated }, { merge: true });
    toast({ title: "Dihapus", description: "Metode pembayaran telah dihapus." });
  };

  const handleAddRule = async () => {
    if (!newRule) return;
    await setDoc(configRef, { rules: arrayUnion(newRule) }, { merge: true });
    setNewRule('');
  };

  const handleAddAnn = async () => {
    if (!newAnn) return;
    await setDoc(configRef, { announcements: arrayUnion(newAnn) }, { merge: true });
    setNewAnn('');
  };

  const generateWithAi = async () => {
    if (!aiKeywords) return;
    setIsAiLoading(true);
    try {
      const result = await generateContentForAdmin({ contentType: aiType, keywordsOrThemes: aiKeywords });
      if (aiType === 'Rules') setNewRule(result.generatedContent);
      else setNewAnn(result.generatedContent);
      toast({ title: "AI Generated", description: "Draf konten berhasil dibuat oleh AI." });
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal", description: "AI gagal membuat konten." });
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight">System Settings</h1>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest">Konfigurasi operasional platform.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 glass-card p-1.5 rounded-2xl h-14">
          <TabsTrigger value="general" className="rounded-xl font-black uppercase text-[10px] data-[state=active]:neon-gradient data-[state=active]:text-background">General & Payments</TabsTrigger>
          <TabsTrigger value="content" className="rounded-xl font-black uppercase text-[10px] data-[state=active]:neon-gradient data-[state=active]:text-background">Content & AI</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="glass-card border-none rounded-[1.5rem] overflow-hidden">
            <CardHeader className="pb-2 border-b border-white/5"><CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-primary"><LayoutDashboard size={14} /> Parameter Sistem</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Rate Gmail (Per Akun)</label>
                <Input type="number" value={localConfig.gmailRate} onChange={(e) => handleUpdateParam('gmailRate', e.target.value)} className="bg-white/5 border-white/5 h-12 rounded-xl px-4 font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Min Withdraw</label>
                  <Input type="number" value={localConfig.minWithdraw} onChange={(e) => handleUpdateParam('minWithdraw', e.target.value)} className="bg-white/5 border-white/5 h-12 rounded-xl px-4 font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Admin Fee</label>
                  <Input type="number" value={localConfig.adminFee} onChange={(e) => handleUpdateParam('adminFee', e.target.value)} className="bg-white/5 border-white/5 h-12 rounded-xl px-4 font-bold" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Link Floating Button (CS)</label>
                <Input value={localConfig.floatingBtnLink} onChange={(e) => handleUpdateParam('floatingBtnLink', e.target.value)} className="bg-white/5 border-white/5 h-12 rounded-xl px-4 font-medium" />
              </div>
              <Button onClick={saveGeneral} className="w-full h-12 neon-gradient text-background font-black rounded-xl glow-primary">SIMPAN PARAMETER</Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2 px-1"><CreditCard size={14} className="text-primary" /> Metode Pembayaran</h3>
            <div className="flex gap-2">
              <Input placeholder="Nama Bank/E-Wallet..." value={newPayment} onChange={(e) => setNewPayment(e.target.value)} className="bg-white/5 border-white/5 h-12 rounded-xl px-4 text-xs font-bold" />
              <Button size="icon" onClick={handleAddPayment} className="h-12 w-12 neon-gradient text-background shrink-0 rounded-xl glow-primary"><Plus size={20} /></Button>
            </div>
            <div className="grid gap-3">
              {(localConfig.paymentMethods || []).map((method: any) => (
                <div key={method.name} className="flex items-center justify-between p-4 glass-card rounded-2xl border-none group">
                  <div className="flex flex-col">
                    <p className="text-xs font-black uppercase tracking-tight">{method.name}</p>
                    <p className={`text-[8px] font-black uppercase ${method.enabled ? 'text-primary' : 'text-muted-foreground'}`}>{method.enabled ? 'AKTIF' : 'NONAKTIF'}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Switch checked={method.enabled} onCheckedChange={() => togglePayment(method.name)} className="data-[state=checked]:bg-primary" />
                    <Button size="icon" variant="ghost" onClick={() => deletePayment(method.name)} className="text-destructive h-10 w-10 rounded-xl hover:bg-destructive/10"><Trash2 size={16} /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card className="border-none bg-primary/5 glow-primary overflow-hidden rounded-[1.5rem]">
            <CardHeader className="bg-primary/10 py-4 px-6">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-primary"><Sparkles size={16} /> AI Content Creator</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 pt-4">
              <div className="flex bg-white/5 p-1 rounded-xl h-12">
                <Button size="sm" variant={aiType === 'Rules' ? 'default' : 'ghost'} onClick={() => setAiType('Rules')} className={`flex-1 text-[10px] font-black uppercase rounded-lg ${aiType === 'Rules' ? 'bg-primary text-background' : ''}`}>Rules</Button>
                <Button size="sm" variant={aiType === 'Announcements' ? 'default' : 'ghost'} onClick={() => setAiType('Announcements')} className={`flex-1 text-[10px] font-black uppercase rounded-lg ${aiType === 'Announcements' ? 'bg-primary text-background' : ''}`}>Announcements</Button>
              </div>
              <Input placeholder="Tema/Kata Kunci (Misal: Bonus setoran, WD cepat...)" value={aiKeywords} onChange={(e) => setAiKeywords(e.target.value)} className="bg-white/5 border-white/5 h-12 rounded-xl text-xs font-bold" />
              <Button onClick={generateWithAi} disabled={isAiLoading || !aiKeywords} className="w-full h-12 bg-white text-background font-black text-[10px] uppercase rounded-xl hover:bg-white/90">
                {isAiLoading ? "PROCESSING AI..." : "GENERATE AI DRAFT"}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1"><FileText size={14} className="text-primary" /> Peraturan Platform</div>
            <Textarea placeholder="Tempel draf AI atau tulis peraturan baru..." value={newRule} onChange={(e) => setNewRule(e.target.value)} className="bg-white/5 border-white/5 h-24 rounded-2xl text-xs font-medium leading-relaxed" />
            <Button onClick={handleAddRule} className="w-full h-12 neon-gradient text-background font-black rounded-xl glow-primary">TAMBAH PERATURAN</Button>
            <div className="grid gap-2">
              {(localConfig.rules || []).map((r: string, i: number) => (
                <div key={i} className="flex items-start justify-between p-4 glass-card rounded-2xl border-none">
                  <p className="text-xs flex-1 leading-relaxed font-medium opacity-80">{r}</p>
                  <Button size="icon" variant="ghost" onClick={() => setDoc(configRef, { rules: arrayRemove(r) }, { merge: true })} className="text-destructive h-9 w-9 rounded-xl ml-2"><Trash2 size={14} /></Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 border-t border-white/5 pt-6">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1"><Bell size={14} className="text-secondary" /> Pengumuman Terbaru</div>
            <Textarea placeholder="Tulis pengumuman penting..." value={newAnn} onChange={(e) => setNewAnn(e.target.value)} className="bg-white/5 border-white/5 h-24 rounded-2xl text-xs font-medium leading-relaxed" />
            <Button onClick={handleAddAnn} className="w-full h-12 neon-gradient text-background font-black rounded-xl glow-primary">POSTING PENGUMUMAN</Button>
            <div className="grid gap-2">
              {(localConfig.announcements || []).map((a: string, i: number) => (
                <div key={i} className="flex items-start justify-between p-4 glass-card rounded-2xl border-none">
                  <p className="text-xs flex-1 leading-relaxed font-medium opacity-80">{a}</p>
                  <Button size="icon" variant="ghost" onClick={() => setDoc(configRef, { announcements: arrayRemove(a) }, { merge: true })} className="text-destructive h-9 w-9 rounded-xl ml-2"><Trash2 size={14} /></Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
