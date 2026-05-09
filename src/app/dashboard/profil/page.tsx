"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { User, LogOut, Mail, Edit3, CheckCircle2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';

export default function ProfilPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const profileRef = useMemoFirebase(() => user ? doc(db, 'userProfiles', user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatarUrl || '');
    }
  }, [profile]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024 * 5) {
        toast({ variant: "destructive", title: "File Terlalu Besar", description: "Maksimal ukuran foto profil adalah 5MB." });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setAvatarUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = async () => {
    await signOut(getAuth());
    router.push('/login');
  };

  const handleSaveProfile = async () => {
    if (!profileRef) return;
    
    try {
      await updateDoc(profileRef, {
        displayName,
        bio,
        avatarUrl,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Berhasil", description: "Profil Anda telah diperbarui." });
      setIsEditing(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat menyimpan." });
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="text-center space-y-4 py-8">
        <div className="mx-auto w-28 h-28 rounded-[2.5rem] neon-gradient flex items-center justify-center glow-primary border-4 border-background shadow-2xl overflow-hidden relative group aspect-square">
           {avatarUrl ? (
             <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover relative z-10" />
           ) : (
             <User size={56} className="text-white relative z-10 group-hover:scale-110 transition-transform" />
           )}
           <div className="absolute inset-0 bg-black/20" />
        </div>
        <div className="px-4">
          <h1 className="text-2xl font-black text-white tracking-tight">{displayName || user?.email?.split('@')[0]}</h1>
          <p className="text-primary text-[10px] font-black uppercase tracking-[0.4em] neon-text-pulse">Penyedia Tautan</p>
        </div>
      </div>

      <div className="space-y-4">
        <Card className="glass-card border-white/5 rounded-[2rem] overflow-hidden">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 text-white"><Edit3 size={16} className="text-primary" /> Pengaturan Profil</h3>
              {!isEditing && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8 px-4 text-[10px] font-black text-primary rounded-xl hover:bg-primary/10">EDIT</Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Nama Lengkap</label>
                  <Input 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)} 
                    placeholder="Masukkan nama Anda..."
                    className="bg-white/5 h-14 text-sm rounded-2xl border-white/10 text-white font-bold" 
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Foto Profil (1:1)</label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 flex items-center justify-center gap-3 h-14 bg-white/5 border border-dashed border-white/20 rounded-2xl cursor-pointer hover:bg-white/10 transition-all group">
                      <Upload size={18} className="text-primary group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-white/40 uppercase">Ganti Foto</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                    {avatarUrl && (
                      <Button variant="ghost" size="icon" onClick={() => setAvatarUrl('')} className="h-14 w-14 rounded-2xl bg-destructive/10 text-destructive">
                        <X size={20} />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Bio Singkat</label>
                  <Textarea 
                    value={bio} 
                    onChange={(e) => setBio(e.target.value)} 
                    placeholder="Tulis bio singkat Anda di sini..."
                    className="bg-white/5 h-24 text-sm rounded-2xl border-white/10 text-white font-medium leading-relaxed" 
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1 h-14 text-xs font-black rounded-2xl border-white/10 text-white">BATAL</Button>
                  <Button onClick={handleSaveProfile} className="flex-1 h-14 text-xs neon-gradient text-background font-black rounded-2xl glow-primary shadow-xl">SIMPAN</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-5 text-left">
                <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Bio Anda</p>
                  <p className="text-sm font-medium text-white/80 leading-relaxed">{bio || 'Anda belum menuliskan bio apapun.'}</p>
                </div>
                <div className="flex items-center gap-4 px-4">
                  <Mail size={16} className="text-white/20" />
                  <div className="flex-1">
                    <p className="text-[8px] font-black text-muted-foreground uppercase">Email Akun</p>
                    <p className="text-xs font-bold text-white/60">{user?.email}</p>
                  </div>
                  <CheckCircle2 size={14} className="text-primary" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Button variant="destructive" className="w-full h-16 rounded-[1.5rem] font-black text-sm uppercase mt-6 group shadow-2xl active:scale-95 transition-all" onClick={handleLogout}>
          <LogOut size={20} className="mr-3 group-hover:rotate-12 transition-transform" /> Keluar Dari Akun
        </Button>
      </div>
    </div>
  );
}
