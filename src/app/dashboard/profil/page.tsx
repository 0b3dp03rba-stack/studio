
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { User, LogOut, Mail, Edit3, CheckCircle2, Upload, X, AtSign, Loader2, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import ImageCropperModal from '@/components/ImageCropperModal';
import { extractThemeColors } from '@/lib/utils-app';

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
  const [themeColor, setThemeColor] = useState('#ff0000');
  const [themeColorSecondary, setThemeColorSecondary] = useState('#ffea00');
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatarUrl || '');
      setThemeColor(profile.themeColor || '#ff0000');
      setThemeColorSecondary(profile.themeColorSecondary || '#ffea00');
    }
  }, [profile]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024 * 5) {
        toast({ variant: "destructive", title: "File Terlalu Besar", description: "Maksimal ukuran foto adalah 5MB." });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setTempImage(reader.result as string);
        setCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = async (cropped: string) => {
    setAvatarUrl(cropped);
    setIsEditing(true); // Pastikan masuk mode edit untuk melihat perubahan
    
    // Otomatis ekstrak warna dari foto profil
    const colors = await extractThemeColors(cropped);
    setThemeColor(colors.primary);
    setThemeColorSecondary(colors.secondary);
    
    toast({ 
      title: "Warna Diekstrak", 
      description: "Tema warna profil telah disesuaikan dengan foto Anda secara otomatis." 
    });
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
        toast({ variant: "destructive", title: "Username Terlalu Pendek", description: "Minimal 3 karakter." });
        setIsSaving(false);
        return;
      }

      if (cleanUsername !== profile?.username) {
        const usernameRef = doc(db, 'usernames', cleanUsername);
        const usernameSnap = await getDoc(usernameRef);
        
        if (usernameSnap.exists()) {
          toast({ variant: "destructive", title: "Username Tidak Tersedia", description: "Username sudah digunakan oleh user lain." });
          setIsSaving(false);
          return;
        }

        if (profile?.username) {
          try {
            await deleteDoc(doc(db, 'usernames', profile.username));
          } catch (e) {
            console.warn("Could not delete old username mapping", e);
          }
        }
        
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
        themeColor,
        themeColorSecondary,
        updatedAt: serverTimestamp()
      });

      toast({ title: "Berhasil", description: "Profil Anda telah diperbarui." });
      setIsEditing(false);
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Gagal Menyimpan", description: "Gagal menyimpan ke server." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="text-center space-y-4 py-8">
        <div 
          className="mx-auto w-28 h-28 rounded-[2.5rem] flex items-center justify-center border-4 border-background shadow-2xl overflow-hidden relative group aspect-square"
          style={{ 
            background: `linear-gradient(-45deg, ${themeColor}, ${themeColorSecondary})`,
            boxShadow: `0 0 25px -5px ${themeColor}99`
          }}
        >
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
            <AtSign size={12} style={{ color: themeColor }} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: themeColor }}>{profile?.username || 'user'}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Card className="glass-card border-white/5 rounded-[2rem] overflow-hidden">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 text-white"><Edit3 size={16} className="text-primary" /> Pengaturan Profil</h3>
              {!isEditing && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8 px-4 text-[10px] font-black text-primary rounded-xl hover:bg-primary/10">Edit Profil</Button>
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
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase ml-1 flex items-center gap-2"><Palette size={14} /> Tema Warna Profil</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black uppercase text-white/30 ml-1">Utama</p>
                      <input 
                        type="color" 
                        value={themeColor}
                        onChange={(e) => setThemeColor(e.target.value)}
                        className="w-full h-12 rounded-xl bg-white/5 border-none cursor-pointer p-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black uppercase text-white/30 ml-1">Gradasi</p>
                      <input 
                        type="color" 
                        value={themeColorSecondary}
                        onChange={(e) => setThemeColorSecondary(e.target.value)}
                        className="w-full h-12 rounded-xl bg-white/5 border-none cursor-pointer p-1"
                      />
                    </div>
                  </div>
                  <p className="text-[8px] text-muted-foreground italic px-1">*Saran: Ganti foto profil untuk ekstraksi warna otomatis.</p>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Foto Profil</label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 flex items-center justify-center gap-3 h-14 bg-white/5 border border-dashed border-white/20 rounded-2xl cursor-pointer hover:bg-white/10 transition-all group">
                      <Upload size={18} className="text-primary" />
                      <span className="text-xs font-bold text-white/40 uppercase">Ganti Foto</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
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
                  <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving} className="flex-1 h-14 text-xs font-black rounded-2xl border-white/10 text-white">Batal</Button>
                  <Button onClick={handleSaveProfile} disabled={isSaving} className="flex-1 h-14 text-xs neon-gradient text-background font-black rounded-2xl glow-primary shadow-xl">
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : "Simpan Profil"}
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
          <LogOut size={20} className="mr-3 group-hover:rotate-12 transition-transform" /> Keluar Aplikasi
        </Button>
      </div>

      <ImageCropperModal
        imageSrc={tempImage}
        isOpen={cropperOpen}
        onClose={() => setCropperOpen(false)}
        onCropComplete={onCropComplete}
      />
    </div>
  );
}
