
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Sparkles, Wand2, CreditCard, LayoutDashboard, FileText, Bell } from 'lucide-react';
import { generateContentForAdmin } from '@/ai/flows/admin-genai-content-creator-flow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

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
    if (config) setLocalConfig(config);
  }, [config]);

  if (isLoading || !localConfig) return <div className="p-20 text-center animate-pulse">Memuat Pengaturan...</div>;

  const handleUpdateParam = (key: string, val: any) => {
    setLocalConfig({ ...localConfig, [key]: val });
  };

  const saveGeneral = async () => {
    await updateDoc(configRef, {
      gmailRate: Number(localConfig.gmailRate),
      minWithdraw: Number(localConfig.minWithdraw),
      adminFee: Number(localConfig.adminFee),
      floatingBtnLink: localConfig.floatingBtnLink
    });
    toast({ title: "Berhasil", description: "Parameter sistem diperbarui." });
  };

  const handleAddPayment = async () => {
    if (!newPayment) return;
    const methods = localConfig.paymentMethods || [];
    await updateDoc(configRef, {
      paymentMethods: [...methods, { name: newPayment, enabled: true }]
    });
    setNewPayment('');
  };

  const togglePayment = async (name: string) => {
    const updated = localConfig.paymentMethods.map((m: any) => 
      m.name === name ? { ...m, enabled: !m.enabled } : m
    );
    await updateDoc(configRef, { paymentMethods: updated });
  };

  const deletePayment = async (name: string) => {
    const updated = localConfig.paymentMethods.filter((m: any) => m.name !== name);
    await updateDoc(configRef, { paymentMethods: updated });
  };

  const handleAddRule = async () => {
    if (!newRule) return;
    await updateDoc(configRef, { rules: arrayUnion(newRule) });
    setNewRule('');
  };

  const handleAddAnn = async () => {
    if (!newAnn) return;
    await updateDoc(configRef, { announcements: arrayUnion(newAnn) });
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
        <h1 className="text-2xl font-bold">Pengaturan Sistem</h1>
        <p className="text-muted-foreground text-sm">Konfigurasi variabel, metode pembayaran, dan konten platform.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 glass-card p-1">
          <TabsTrigger value="general" className="data-[state=active]:neon-gradient data-[state=active]:text-background">Umum & Pembayaran</TabsTrigger>
          <TabsTrigger value="content" className="data-[state=active]:neon-gradient data-[state=active]:text-background">Konten & AI</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="glass-card border-white/5">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><LayoutDashboard size={16} /> Parameter Sistem</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Rate Gmail (Per Akun)</label>
                <Input type="number" value={localConfig.gmailRate} onChange={(e) => handleUpdateParam('gmailRate', e.target.value)} className="bg-white/5" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Min Withdraw</label>
                  <Input type="number" value={localConfig.minWithdraw} onChange={(e) => handleUpdateParam('minWithdraw', e.target.value)} className="bg-white/5" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Biaya Admin</label>
                  <Input type="number" value={localConfig.adminFee} onChange={(e) => handleUpdateParam('adminFee', e.target.value)} className="bg-white/5" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Link CS (Telegram/WA)</label>
                <Input value={localConfig.floatingBtnLink} onChange={(e) => handleUpdateParam('floatingBtnLink', e.target.value)} className="bg-white/5" />
              </div>
              <Button onClick={saveGeneral} className="w-full neon-gradient text-background font-bold">Simpan Parameter</Button>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h3 className="font-bold text-sm uppercase text-muted-foreground flex items-center gap-2"><CreditCard size={14} /> Metode Pembayaran</h3>
            <div className="flex gap-2">
              <Input placeholder="Nama Bank/E-Wallet..." value={newPayment} onChange={(e) => setNewPayment(e.target.value)} className="bg-white/5 h-10 text-xs" />
              <Button size="icon" onClick={handleAddPayment} className="h-10 w-10 neon-gradient text-background shrink-0"><Plus size={18} /></Button>
            </div>
            <div className="space-y-2">
              {(localConfig.paymentMethods || []).map((method: any) => (
                <div key={method.name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex flex-col">
                    <p className="text-xs font-bold">{method.name}</p>
                    <p className={`text-[9px] uppercase ${method.enabled ? 'text-primary' : 'text-muted-foreground'}`}>{method.enabled ? 'Aktif' : 'Nonaktif'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={method.enabled} onCheckedChange={() => togglePayment(method.name)} />
                    <Button size="icon" variant="ghost" onClick={() => deletePayment(method.name)} className="text-destructive h-8 w-8"><Trash2 size={14} /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card className="border border-primary/20 bg-primary/5 glow-primary overflow-hidden">
            <CardHeader className="bg-primary/10">
              <CardTitle className="text-sm font-bold flex items-center gap-2"><Sparkles size={16} className="text-primary" /> AI Assistant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex bg-white/5 p-1 rounded-lg">
                <Button size="sm" variant={aiType === 'Rules' ? 'default' : 'ghost'} onClick={() => setAiType('Rules')} className="flex-1 text-[10px]">Rules</Button>
                <Button size="sm" variant={aiType === 'Announcements' ? 'default' : 'ghost'} onClick={() => setAiType('Announcements')} className="flex-1 text-[10px]">Announcements</Button>
              </div>
              <Input placeholder="Kata Kunci..." value={aiKeywords} onChange={(e) => setAiKeywords(e.target.value)} className="bg-white/5 text-xs" />
              <Button onClick={generateWithAi} disabled={isAiLoading || !aiKeywords} className="w-full bg-white text-background text-xs font-bold">
                {isAiLoading ? "Processing..." : "Generate AI Draft"}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold uppercase text-muted-foreground"><FileText size={16} /> Peraturan</div>
            <Textarea placeholder="Aturan baru..." value={newRule} onChange={(e) => setNewRule(e.target.value)} className="bg-white/5 text-xs h-20" />
            <Button onClick={handleAddRule} className="w-full h-9 neon-gradient text-background text-xs font-bold">Tambah Peraturan</Button>
            <div className="space-y-2">
              {(localConfig.rules || []).map((r: string, i: number) => (
                <div key={i} className="flex items-start justify-between p-3 bg-white/5 rounded-xl border border-white/5 group">
                  <p className="text-xs flex-1 leading-relaxed">{r}</p>
                  <Button size="icon" variant="ghost" onClick={() => updateDoc(configRef, { rules: arrayRemove(r) })} className="text-destructive h-8 w-8"><Trash2 size={14} /></Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 border-t border-white/5 pt-6">
            <div className="flex items-center gap-2 text-sm font-bold uppercase text-muted-foreground"><Bell size={16} /> Pengumuman</div>
            <Textarea placeholder="Pengumuman baru..." value={newAnn} onChange={(e) => setNewAnn(e.target.value)} className="bg-white/5 text-xs h-20" />
            <Button onClick={handleAddAnn} className="w-full h-9 neon-gradient text-background text-xs font-bold">Posting Pengumuman</Button>
            <div className="space-y-2">
              {(localConfig.announcements || []).map((a: string, i: number) => (
                <div key={i} className="flex items-start justify-between p-3 bg-white/5 rounded-xl border border-white/5 group">
                  <p className="text-xs flex-1 leading-relaxed">{a}</p>
                  <Button size="icon" variant="ghost" onClick={() => updateDoc(configRef, { announcements: arrayRemove(a) })} className="text-destructive h-8 w-8"><Trash2 size={14} /></Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
