
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { User, Mail, Shield, LogOut, Wallet, CreditCard, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
        <div className="mx-auto w-24 h-24 rounded-[2.5rem] neon-gradient flex items-center justify-center glow-primary border-4 border-background shadow-2xl overflow-hidden relative group">
           <User size={48} className="text-white relative z-10 group-hover:scale-110 transition-transform" />
           <div className="absolute inset-0 bg-black/20" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">{user?.email?.split('@')[0]}</h1>
          <p className="text-primary text-[10px] font-black uppercase tracking-[0.4em] neon-text-pulse">Verified {profile?.role || 'User'}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* WhatsApp Team Link - New Placement */}
        <a 
          href={config?.floatingBtnLink || "#"} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block group"
        >
          <Card className="neon-gradient border-none rounded-2xl overflow-hidden shadow-2xl transition-all active:scale-95 group-hover:glow-primary">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-black/30 flex items-center justify-center text-white backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform">
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-black uppercase tracking-tight text-white">GmailKu Team</p>
                <p className="text-[10px] text-white/70 font-black uppercase tracking-widest">Bantuan Resmi via WhatsApp</p>
              </div>
              <ChevronRight size={20} className="text-white/50" />
            </CardContent>
          </Card>
        </a>

        <Card className="glass-card border-white/5 rounded-2xl">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-white/5 rounded-xl text-muted-foreground"><Mail size={18} /></div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase">Email Akun</p>
                <p className="text-sm font-bold text-white">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-white/5 rounded-xl text-muted-foreground"><Shield size={18} /></div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase">Status Member</p>
                <p className="text-sm font-bold text-primary neon-text-pulse">Verified {profile?.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5 rounded-2xl">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 text-white"><CreditCard size={16} className="text-primary" /> Rekening WD</h3>
              {!isEditing && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-7 px-3 text-[10px] font-black text-primary rounded-lg hover:bg-primary/10">EDIT</Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase">Bank / E-Wallet</label>
                  <Select onValueChange={setBankName} value={bankName}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-11 text-xs rounded-xl focus:ring-primary text-white">
                      <SelectValue placeholder="Pilih Metode" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/10 text-white z-[100]">
                      {enabledMethods.length > 0 ? (
                        enabledMethods.map((m: any) => (
                          <SelectItem key={m.name} value={m.name} className="focus:bg-primary focus:text-background font-black uppercase text-[10px] py-2 cursor-pointer">
                            {m.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-4 text-[10px] font-black uppercase opacity-50 text-center">Belum ada metode WD aktif</div>
                      )}
                    </SelectContent>
                  </Select>
                  {enabledMethods.length === 0 && (
                    <p className="text-[8px] text-destructive font-bold uppercase mt-1 flex items-center gap-1"><AlertCircle size={8}/> Hubungi admin untuk mengaktifkan metode WD.</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase">Nomor Rekening / HP</label>
                  <Input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} className="bg-white/5 h-11 text-xs rounded-xl border-white/10 text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase">Nama Pemilik Rekening</label>
                  <Input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} className="bg-white/5 h-11 text-xs rounded-xl border-white/10 text-white" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1 h-11 text-xs font-bold rounded-xl border-white/10 text-white">BATAL</Button>
                  <Button onClick={handleSaveProfile} className="flex-1 h-11 text-xs neon-gradient text-background font-black rounded-xl">SIMPAN</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white/5 rounded-xl text-muted-foreground"><Wallet size={18} /></div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase">Metode WD</p>
                    <p className="text-sm font-bold text-white">{profile?.bankName || 'BELUM DIATUR'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white/5 rounded-xl text-muted-foreground"><CreditCard size={18} /></div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase">No. Rekening</p>
                    <p className="text-sm font-bold text-white">{profile?.bankAccount || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white/5 rounded-xl text-muted-foreground"><User size={18} /></div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase">Atas Nama</p>
                    <p className="text-sm font-bold text-white">{profile?.bankAccountName || '-'}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Button variant="destructive" className="w-full h-14 rounded-2xl font-black text-sm uppercase mt-6 group shadow-2xl" onClick={handleLogout}>
          <LogOut size={18} className="mr-2 group-hover:rotate-12 transition-transform" /> Keluar Akun
        </Button>
      </div>
    </div>
  );
}

