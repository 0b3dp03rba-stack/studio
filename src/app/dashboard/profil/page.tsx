
"use client";

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { User, Mail, Shield, LogOut, Wallet, Save, CreditCard, MessageCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

export default function ProfilPage() {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const { toast } = useToast();

  const [bankName, setBankName] = useState(state.currentUser?.bankName || '');
  const [bankAccount, setBankAccount] = useState(state.currentUser?.bankAccount || '');
  const [bankAccountName, setBankAccountName] = useState(state.currentUser?.bankAccountName || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    router.push('/login');
  };

  const handleSaveProfile = () => {
    if (!bankName || !bankAccount || !bankAccountName) {
      toast({ variant: "destructive", title: "Gagal", description: "Semua data rekening harus diisi." });
      return;
    }
    dispatch({ type: 'UPDATE_PROFILE', payload: { bankName, bankAccount, bankAccountName } });
    toast({ title: "Berhasil", description: "Informasi profil telah diperbarui." });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="text-center space-y-4 py-6">
        <div className="mx-auto w-24 h-24 rounded-full neon-gradient flex items-center justify-center glow-primary border-4 border-background">
          <User size={48} className="text-background" />
        </div>
        <div>
          <h1 className="text-2xl font-black">{state.currentUser?.email.split('@')[0]}</h1>
          <p className="text-primary text-xs font-black uppercase tracking-widest">{state.currentUser?.role} PLATFORM</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Hubungi CS Button */}
        <Link href="/dashboard/chat">
          <Card className="glass-card border-none rounded-2xl overflow-hidden hover:bg-white/10 transition-all group mb-4">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-background transition-all">
                <MessageCircle size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black uppercase tracking-tight">Hubungi CS</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Bantuan Live Chat 24/7</p>
              </div>
              <ChevronRight size={18} className="text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Card className="glass-card border-white/5 rounded-2xl">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-white/5 rounded-xl text-muted-foreground">
                <Mail size={18} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Email Akun</p>
                <p className="text-sm font-bold">{state.currentUser?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-white/5 rounded-xl text-muted-foreground">
                <Shield size={18} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Status Member</p>
                <p className="text-sm font-bold text-primary">Verified {state.currentUser?.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5 rounded-2xl">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <CreditCard size={16} className="text-primary" />
                Rekening WD
              </h3>
              {!isEditing && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-7 px-3 text-[10px] font-black text-primary hover:bg-primary/10 rounded-lg">EDIT</Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase">Bank / E-Wallet</label>
                  <Select onValueChange={setBankName} value={bankName}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-11 text-xs rounded-xl focus:ring-primary/30">
                      <SelectValue placeholder="Pilih Metode" />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-white/10">
                      {state.settings.paymentMethods.filter(m => m.enabled).map(m => (
                        <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase">Nomor Rekening / HP</label>
                  <Input 
                    value={bankAccount} 
                    onChange={(e) => setBankAccount(e.target.value)} 
                    placeholder="Masukkan Nomor"
                    className="bg-white/5 border-white/10 h-11 text-xs rounded-xl focus:ring-primary/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase">Nama Pemilik Rekening</label>
                  <Input 
                    value={bankAccountName} 
                    onChange={(e) => setBankAccountName(e.target.value)} 
                    placeholder="Sesuai Nama di Bank"
                    className="bg-white/5 border-white/10 h-11 text-xs rounded-xl focus:ring-primary/30"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1 h-11 text-xs font-bold rounded-xl">BATAL</Button>
                  <Button onClick={handleSaveProfile} className="flex-1 h-11 text-xs neon-gradient text-background font-black rounded-xl glow-primary">
                    <Save size={16} className="mr-2" /> SIMPAN
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white/5 rounded-xl text-muted-foreground">
                    <Wallet size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Metode WD</p>
                    <p className="text-sm font-bold">{state.currentUser?.bankName || 'BELUM DIATUR'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white/5 rounded-xl text-muted-foreground">
                    <CreditCard size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">No. Rekening</p>
                    <p className="text-sm font-bold">{state.currentUser?.bankAccount || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white/5 rounded-xl text-muted-foreground">
                    <User size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Atas Nama</p>
                    <p className="text-sm font-bold">{state.currentUser?.bankAccountName || '-'}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Button 
          variant="destructive" 
          className="w-full h-14 rounded-2xl glow-destructive font-black text-sm uppercase tracking-widest mt-6"
          onClick={handleLogout}
        >
          <LogOut size={18} className="mr-2" />
          Keluar Akun
        </Button>
      </div>

      <div className="text-center pt-8 pb-4">
        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.4em] opacity-40">GMAILKU PREMIUM ENGINE v1.2</p>
      </div>
    </div>
  );
}
