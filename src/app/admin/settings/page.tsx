"use client";

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Sparkles, Wand2, CreditCard, ToggleLeft, ToggleRight } from 'lucide-react';
import { generateContentForAdmin } from '@/ai/flows/admin-genai-content-creator-flow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

export default function AdminSettingsPage() {
  const { state, dispatch } = useApp();
  const { toast } = useToast();

  const [gmailRate, setGmailRate] = useState(state.settings.gmailRate);
  const [minWithdraw, setMinWithdraw] = useState(state.settings.minWithdraw);
  const [adminFee, setAdminFee] = useState(state.settings.adminFee);
  const [floatingBtn, setFloatingBtn] = useState(state.settings.floatingBtnLink);

  const [newRule, setNewRule] = useState('');
  const [newAnn, setNewAnn] = useState('');
  const [newPayment, setNewPayment] = useState('');

  // AI State
  const [aiType, setAiType] = useState<'Rules' | 'Announcements'>('Rules');
  const [aiKeywords, setAiKeywords] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleUpdateGeneral = () => {
    dispatch({ 
      type: 'UPDATE_SETTINGS', 
      payload: { gmailRate, minWithdraw, adminFee, floatingBtnLink: floatingBtn } 
    });
    toast({ title: "Berhasil", description: "Pengaturan umum diperbarui." });
  };

  const handleAddPayment = () => {
    if (!newPayment) return;
    if (state.settings.paymentMethods.some(m => m.name.toLowerCase() === newPayment.toLowerCase())) {
      toast({ variant: "destructive", title: "Gagal", description: "Metode ini sudah ada." });
      return;
    }
    dispatch({ type: 'ADD_PAYMENT_METHOD', payload: newPayment });
    setNewPayment('');
    toast({ title: "Berhasil", description: "Metode pembayaran ditambahkan." });
  };

  const handleAddRule = () => {
    if (!newRule) return;
    dispatch({ type: 'ADD_RULE', payload: newRule });
    setNewRule('');
  };

  const handleAddAnn = () => {
    if (!newAnn) return;
    dispatch({ type: 'ADD_ANNOUNCEMENT', payload: newAnn });
    setNewAnn('');
  };

  const generateWithAi = async () => {
    if (!aiKeywords) return;
    setIsAiLoading(true);
    try {
      const result = await generateContentForAdmin({
        contentType: aiType,
        keywordsOrThemes: aiKeywords
      });
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
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Pengaturan Sistem</h1>
        <p className="text-muted-foreground text-sm">Konfigurasi variabel dan konten platform.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 glass-card p-1">
          <TabsTrigger value="general" className="data-[state=active]:neon-gradient data-[state=active]:text-background">Umum</TabsTrigger>
          <TabsTrigger value="content" className="data-[state=active]:neon-gradient data-[state=active]:text-background">Konten & AI</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="glass-card border-white/5">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Rate Gmail (Per Akun)</label>
                <Input type="number" value={gmailRate} onChange={(e) => setGmailRate(parseInt(e.target.value))} className="bg-white/5 border-white/10" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Min Withdraw</label>
                <Input type="number" value={minWithdraw} onChange={(e) => setMinWithdraw(parseInt(e.target.value))} className="bg-white/5 border-white/10" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Biaya Admin</label>
                <Input type="number" value={adminFee} onChange={(e) => setAdminFee(parseInt(e.target.value))} className="bg-white/5 border-white/10" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Link Tombol Melayang</label>
                <Input value={floatingBtn} onChange={(e) => setFloatingBtn(e.target.value)} className="bg-white/5 border-white/10" />
              </div>
              <Button onClick={handleUpdateGeneral} className="w-full neon-gradient text-background font-bold glow-primary">Simpan Perubahan</Button>
            </CardContent>
          </Card>

          {/* Payment Methods Management */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm uppercase text-muted-foreground tracking-widest flex items-center gap-2">
              <CreditCard size={14} /> Metode Pembayaran
            </h3>
            <div className="flex gap-2">
              <Input 
                placeholder="Nama Bank/E-Wallet..." 
                value={newPayment} 
                onChange={(e) => setNewPayment(e.target.value)} 
                className="bg-white/5 border-white/10 h-10 text-xs" 
              />
              <Button size="icon" onClick={handleAddPayment} className="h-10 w-10 neon-gradient text-background"><Plus size={18} /></Button>
            </div>
            <div className="space-y-2">
              {state.settings.paymentMethods.map((method) => (
                <div key={method.name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex flex-col">
                    <p className="text-xs font-bold">{method.name}</p>
                    <p className={`text-[9px] uppercase ${method.enabled ? 'text-primary' : 'text-muted-foreground'}`}>
                      {method.enabled ? 'Aktif' : 'Nonaktif'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={method.enabled} 
                      onCheckedChange={() => dispatch({ type: 'TOGGLE_PAYMENT_METHOD', payload: method.name })}
                    />
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => dispatch({ type: 'DELETE_PAYMENT_METHOD', payload: method.name })} 
                      className="text-destructive h-8 w-8"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          {/* AI Creator Tool */}
          <Card className="border border-primary/20 bg-primary/5 glow-primary">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                AI Content Creator
              </CardTitle>
              <CardDescription className="text-[10px]">Gunakan AI untuk membuat draf peraturan atau pengumuman.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant={aiType === 'Rules' ? 'default' : 'outline'}
                  onClick={() => setAiType('Rules')}
                  className={aiType === 'Rules' ? 'flex-1 h-8 text-[10px] bg-primary text-background' : 'flex-1 h-8 text-[10px]'}
                >Peraturan</Button>
                <Button 
                  size="sm" 
                  variant={aiType === 'Announcements' ? 'default' : 'outline'}
                  onClick={() => setAiType('Announcements')}
                  className={aiType === 'Announcements' ? 'flex-1 h-8 text-[10px] bg-primary text-background' : 'flex-1 h-8 text-[10px]'}
                >Pengumuman</Button>
              </div>
              <Input 
                placeholder="Tema atau kata kunci..." 
                value={aiKeywords}
                onChange={(e) => setAiKeywords(e.target.value)}
                className="bg-white/5 border-white/10 h-9 text-xs"
              />
              <Button 
                onClick={generateWithAi} 
                disabled={isAiLoading || !aiKeywords} 
                className="w-full h-9 bg-white text-background hover:bg-white/90 text-xs font-bold"
              >
                {isAiLoading ? "Sedang Memproses..." : <><Wand2 size={14} className="mr-2"/> Generate Draft AI</>}
              </Button>
            </CardContent>
          </Card>

          {/* Manual Rules */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm uppercase text-muted-foreground tracking-widest">Peraturan Platform</h3>
            <div className="flex gap-2">
              <Input placeholder="Tambah peraturan baru..." value={newRule} onChange={(e) => setNewRule(e.target.value)} className="bg-white/5 border-white/10 h-10 text-xs" />
              <Button size="icon" onClick={handleAddRule} className="h-10 w-10 neon-gradient text-background"><Plus size={18} /></Button>
            </div>
            <div className="space-y-2">
              {state.settings.rules.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-xs flex-1 pr-4">{r}</p>
                  <Button size="icon" variant="ghost" onClick={() => dispatch({ type: 'DELETE_RULE', payload: i })} className="text-destructive h-8 w-8">
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Manual Announcements */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm uppercase text-muted-foreground tracking-widest">Pengumuman Dashboard</h3>
            <div className="flex gap-2">
              <Input placeholder="Tambah pengumuman..." value={newAnn} onChange={(e) => setNewAnn(e.target.value)} className="bg-white/5 border-white/10 h-10 text-xs" />
              <Button size="icon" onClick={handleAddAnn} className="h-10 w-10 neon-gradient text-background"><Plus size={18} /></Button>
            </div>
            <div className="space-y-2">
              {state.settings.announcements.map((a, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-xs flex-1 pr-4">{a}</p>
                  <Button size="icon" variant="ghost" onClick={() => dispatch({ type: 'DELETE_ANNOUNCEMENT', payload: i })} className="text-destructive h-8 w-8">
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
