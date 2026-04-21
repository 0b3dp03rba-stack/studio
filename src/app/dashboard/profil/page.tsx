"use client";

import { useState } from 'react';
import { useApp } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { User, Mail, Shield, LogOut, Wallet, Save, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ProfilPage() {
  const { state, dispatch } = useApp();
  const router = useRouter();
  const { toast } = useToast();

  const [bankName, setBankName] = useState(state.currentUser?.bankName || '');
  const [bankAccount, setBankAccount] = useState(state.currentUser?.bankAccount || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    router.push('/login');
  };

  const handleSaveProfile = () => {
    if (!bankName || !bankAccount) {
      toast({ variant: "destructive", title: "Gagal", description: "Nama Bank dan Nomor Rekening harus diisi." });
      return;
    }
    dispatch({ type: 'UPDATE_PROFILE', payload: { bankName, bankAccount } });
    toast({ title: "Berhasil", description: "Informasi profil telah diperbarui." });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4 py-6">
        <div className="mx-auto w-24 h-24 rounded-full neon-gradient flex items-center justify-center glow-primary border-4 border-background">
          <User size={48} className="text-background" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{state.currentUser?.email.split('@')[0]}</h1>
          <p className="text-primary text-sm font-medium uppercase tracking-widest">{state.currentUser?.role}</p>
        </div>
      </div>

      <div className="space-y-4">
        <Card className="glass-card border-white/5">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/5 rounded-lg">
                <Mail size={18} className="text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Email</p>
                <p className="text-sm font-medium">{state.currentUser?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/5 rounded-lg">
                <Shield size={18} className="text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Role Akun</p>
                <p className="text-sm font-medium">{state.currentUser?.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <CreditCard size={16} className="text-primary" />
                Informasi Pembayaran
              </h3>
              {!isEditing && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-7 text-[10px] text-primary">Edit</Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Metode / Nama Bank</label>
                  <Select onValueChange={setBankName} value={bankName}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-10 text-xs">
                      <SelectValue placeholder="Pilih Bank/E-Wallet" />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-white/10">
                      {state.settings.paymentMethods.filter(m => m.enabled).map(m => (
                        <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Nomor Rekening / HP</label>
                  <Input 
                    value={bankAccount} 
                    onChange={(e) => setBankAccount(e.target.value)} 
                    placeholder="Contoh: 0812xxx atau 123456xxx"
                    className="bg-white/5 border-white/10 h-10 text-xs"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1 h-9 text-xs">Batal</Button>
                  <Button onClick={handleSaveProfile} className="flex-1 h-9 text-xs neon-gradient text-background font-bold">
                    <Save size={14} className="mr-1" /> Simpan
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white/5 rounded-lg">
                    <Wallet size={18} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Bank / E-Wallet</p>
                    <p className="text-sm font-medium">{state.currentUser?.bankName || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white/5 rounded-lg">
                    <CreditCard size={18} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Nomor Rekening</p>
                    <p className="text-sm font-medium">{state.currentUser?.bankAccount || '-'}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Button 
          variant="destructive" 
          className="w-full h-12 rounded-2xl glow-destructive"
          onClick={handleLogout}
        >
          <LogOut size={18} className="mr-2" />
          Keluar dari Akun
        </Button>
      </div>

      <div className="text-center pt-8">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">GmailKu v1.0.0</p>
      </div>
    </div>
  );
}
