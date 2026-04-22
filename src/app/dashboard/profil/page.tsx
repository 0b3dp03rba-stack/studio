
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { User, Mail, Shield, LogOut, Wallet, Save, CreditCard, MessageCircle, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';

export default function ProfilPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const profileRef = useMemoFirebase(() => user ? doc(db, 'userProfiles', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(profileRef);

  const configRef = useMemoFirebase(() => doc(db, 'appConfig', 'singletonConfig'), [db]);
  const { data: config } = useDoc(configRef);

  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (profile) {
      setBankName(profile.bankName || '');
      setBankAccount(profile.bankAccount || '');
      setBankAccountName(profile.bankAccountName || '');
    }
  }, [profile]);

  const handleLogout = async () => {
    await signOut(getAuth());
    router.push('/login');
  };

  const handleSaveProfile = async () => {
    if (!bankName || !bankAccount || !bankAccountName || !profileRef) {
      toast({ variant: "destructive", title: "Gagal", description: "Semua data rekening harus diisi." });
      return;
    }
    
    await updateDoc(profileRef, {
      bankName,
      bankAccount,
      bankAccountName,
      updatedAt: serverTimestamp()
    });
    
    toast({ title: "Berhasil", description: "Informasi profil telah diperbarui." });
    setIsEditing(false);
  };

  const enabledMethods = (config?.paymentMethods || []).filter((m: any) => m.enabled);

  return (
    <div className="space-y-6 animate-in">
      <div className="text-center space-y-4 py-6">
        <div className="mx-auto w-24 h-24 rounded-full neon-gradient flex items-center justify-center glow-primary border-4 border-background">
          <User size={48} className="text-background" />
        </div>
        <div>
          <h1 className="text-2xl font-black">{user?.email?.split('@')[0]}</h1>
          <p className="text-primary text-xs font-black uppercase tracking-widest">{profile?.role || 'User'} PLATFORM</p>
        </div>
      </div>

      <div className="space-y-4">
        <Link href="/dashboard/chat">
          <Card className="glass-card border-none rounded-2xl overflow-hidden hover:bg-white/10 transition-all group mb-4">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-background transition-all">
                <MessageCircle size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black uppercase tracking-tight">Hubungi Admin</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Bantuan Live Chat 24/7</p>
              </div>
              <ChevronRight size={18} className="text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Card className="glass-card border-white/5 rounded-2xl">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-white/5 rounded-xl text-muted-foreground"><Mail size={18} /></div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase">Email Akun</p>
                <p className="text-sm font-bold">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-white/5 rounded-xl text-muted-foreground"><Shield size={18} /></div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase">Status Member</p>
                <p className="text-sm font-bold text-primary">Verified {profile?.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5 rounded-2xl">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2"><CreditCard size={16} className="text-primary" /> Rekening WD</h3>
              {!isEditing && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-7 px-3 text-[10px] font-black text-primary rounded-lg">EDIT</Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase">Bank / E-Wallet</label>
                  <Select onValueChange={setBankName} value={bankName}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-11 text-xs rounded-xl focus:ring-primary">
                      <SelectValue placeholder="Pilih Metode" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/10 text-white z-[100]">
                      {enabledMethods.length > 0 ? (
                        enabledMethods.map((m: any) => (
                          <SelectItem key={m.name} value={m.name} className="focus:bg-primary focus:text-background font-black uppercase text-[10px] py-2">
                            {m.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-[8px] font-black uppercase opacity-50 text-center">Belum ada metode aktif</div>
                      )}
                    </SelectContent>
                  </Select>
                  {enabledMethods.length === 0 && (
                    <p className="text-[8px] text-destructive font-bold uppercase mt-1 flex items-center gap-1"><AlertCircle size={8}/> Hubungi admin untuk mengaktifkan metode WD.</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase">Nomor Rekening / HP</label>
                  <Input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} className="bg-white/5 h-11 text-xs rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase">Nama Pemilik Rekening</label>
                  <Input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} className="bg-white/5 h-11 text-xs rounded-xl" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1 h-11 text-xs font-bold rounded-xl">BATAL</Button>
                  <Button onClick={handleSaveProfile} className="flex-1 h-11 text-xs neon-gradient text-background font-black rounded-xl">SIMPAN</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white/5 rounded-xl text-muted-foreground"><Wallet size={18} /></div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase">Metode WD</p>
                    <p className="text-sm font-bold">{profile?.bankName || 'BELUM DIATUR'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white/5 rounded-xl text-muted-foreground"><CreditCard size={18} /></div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase">No. Rekening</p>
                    <p className="text-sm font-bold">{profile?.bankAccount || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white/5 rounded-xl text-muted-foreground"><User size={18} /></div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase">Atas Nama</p>
                    <p className="text-sm font-bold">{profile?.bankAccountName || '-'}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Button variant="destructive" className="w-full h-14 rounded-2xl font-black text-sm uppercase mt-6" onClick={handleLogout}>
          <LogOut size={18} className="mr-2" /> Keluar Akun
        </Button>
      </div>
    </div>
  );
}
