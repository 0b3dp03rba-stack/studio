
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { User, LogOut, Mail, Edit3, CheckCircle2, Upload, X, AtSign, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';

export default function ProfilPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const profileRef = useMemoFirebase(() => user ? doc(db, 'userProfiles', user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatarUrl || '');
    }
  }, [profile]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024 * 5) {
        toast({ variant: "destructive", title: "File terlalu besar", description: "Maksimal ukuran foto adalah 5MB." });
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
    if (!profileRef || !user) return;
    
    setIsSaving(true);
    try {
      const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
      
      if (cleanUsername.length < 3) {
        toast({ variant: "destructive", title: "Username terlalu pendek", description: "Minimal 3 karakter." });
        setIsSaving(false);
        return;
      }

      // Check if username changed and handle uniqueness
      if (cleanUsername !== profile?.username) {
        const usernameRef = doc(db, 'usernames', cleanUsername);
        const usernameSnap = await getDoc(usernameRef);
        
        if (usernameSnap.exists()) {
          toast({ variant: "destructive", title: "Username tidak tersedia", description: "Username sudah digunakan oleh user lain." });
          setIsSaving(false);
          return;
        }

        // Delete old mapping if exists
        if (profile?.username) {
          try {
            await deleteDoc(doc(db, 'usernames', profile.username));
          } catch (e) {
            console.warn("Could not delete old username mapping, might be permission or non-existent", e);
          }
        }
        
        // Set new mapping
        await setDoc(usernameRef, {
          userId: user.uid,
          createdAt: serverTimestamp()
        });
      }

      await updateDoc(profileRef, {
        displayName,
        username: cleanUsername,
        bio,
        avatarUrl,
        updatedAt: serverTimestamp()
      });

      toast({ title: "Berhasil", description: "Profil Anda telah diperbarui." });
      setIsEditing(false);
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Gagal", description: "Terjadi kesalahan saat menyimpan. Cek koneksi atau izin." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="text-center space-y-4 py-8">
        <div className="mx-auto w-28 h-28 rounded-[2rem] neon-gradient flex items-center justify-center glow-primary border-4 border-background shadow-2xl overflow-hidden relative group aspect-square">
           {avatarUrl ? (
             <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover relative z-10" />
           ) : (
             <User size={56} className="text-white relative z-10 group-hover:scale-110 transition-transform" />
           )}
           <div className="absolute inset-0 bg-black/20" />
        </div>
        <div className="px-4 text-left sm:text-center">
          <h1 className="text-2xl font-black text-white tracking-tight">{displayName || profile?.username || 'User Linku'}</h1>
          <div className="flex items-center sm:justify-center gap-1.5 mt-1">
            <AtSign size={12} className="text-primary" />
            <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">{profile?.username || 'user'}</p>
          </div>
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
                  <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Nama Tampilan</label>
                  <Input 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)} 
                    placeholder="Masukkan nama Anda..."
                    className="bg-white/5 h-14 text-sm rounded-2xl border-white/10 text-white font-bold" 
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Username (URL Unik)</label>
                  <div className="relative">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <Input 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} 
                      placeholder="username_kamu"
                      className="bg-white/5 h-14 text-sm pl-10 rounded-2xl border-white/10 text-white font-bold" 
                    />
                  </div>
                  <p className="text-[9px] text-muted-foreground ml-1">URL Profil: domain.com/{username || 'username'}</p>
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Foto Profil (1:1)</label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 flex items-center justify-center gap-3 h-14 bg-white/5 border border-dashed border-white/20 rounded-2xl cursor-pointer hover:bg-white/10 transition-all group">
                      <Upload size={18} className="text-primary group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-white/40 uppercase">Pilih Foto</span>
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
                  <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving} className="flex-1 h-14 text-xs font-black rounded-2xl border-white/10 text-white">BATAL</Button>
                  <Button onClick={handleSaveProfile} disabled={isSaving} className="flex-1 h-14 text-xs neon-gradient text-background font-black rounded-2xl glow-primary shadow-xl">
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : "SIMPAN"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-5 text-left">
                <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Bio Anda</p>
                  <p className="text-sm font-medium text-white/80 leading-relaxed">{bio || 'Belum ada bio.'}</p>
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
          <LogOut size={20} className="mr-3 group-hover:rotate-12 transition-transform" /> Keluar
        </Button>
      </div>
    </div>
  );
}
