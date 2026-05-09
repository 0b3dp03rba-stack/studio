
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { User, LogOut, Mail, Edit3, CheckCircle2, Upload, X, AtSign, Loader2, Palette, Check } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const PRESET_COLORS = [
  { name: 'Red', hex: '#ff0000', secondary: '#ff4d4d' },
  { name: 'Cyan', hex: '#00ffff', secondary: '#4dffff' },
  { name: 'Blue', hex: '#0000ff', secondary: '#4d4dff' },
  { name: 'Green', hex: '#00ff00', secondary: '#4dff4d' },
  { name: 'Magenta', hex: '#ff00ff', secondary: '#ff4dff' },
  { name: 'Yellow', hex: '#ffff00', secondary: '#ffff4d' },
  { name: 'Black', hex: '#000000', secondary: '#333333' },
  { name: 'White', hex: '#ffffff', secondary: '#cccccc' },
];

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
  const [paletteOpen, setPaletteOpen] = useState(false);

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
        toast({ variant: "destructive", title: "File terlalu besar", description: "Maksimal 5MB." });
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
    setIsEditing(true);
    
    // Auto extract colors from profile photo
    const colors = await extractThemeColors(cropped);
    setThemeColor(colors.primary);
    setThemeColorSecondary(colors.secondary);
    
    toast({ 
      title: "Warna Diekstrak", 
      description: "Warna tema telah disesuaikan dengan foto Anda." 
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
        toast({ variant: "destructive", title: "Username terlalu pendek", description: "Minimal 3 karakter." });
        setIsSaving(false);
        return;
      }

      if (cleanUsername !== profile?.username) {
        const usernameRef = doc(db, 'usernames', cleanUsername);
        const usernameSnap = await getDoc(usernameRef);
        
        if (usernameSnap.exists()) {
          toast({ variant: "destructive", title: "Username tidak tersedia", description: "Silakan pilih username lain." });
          setIsSaving(false);
          return;
        }

        if (profile?.username) {
          await deleteDoc(doc(db, 'usernames', profile.username)).catch(() => {});
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

      toast({ title: "Tersimpan", description: "Profil Anda telah diperbarui." });
      setIsEditing(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal menyimpan", description: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  const selectPreset = (color: typeof PRESET_COLORS[0]) => {
    setThemeColor(color.hex);
    setThemeColorSecondary(color.secondary);
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
             <User size={56} className="text-white relative z-10" />
           )}
           <div className="absolute inset-0 bg-black/20" />
        </div>
        <div className="px-4 text-center">
          <h1 className="text-2xl font-black text-white tracking-tight">{displayName || profile?.username || 'User Linku'}</h1>
          <div className="flex items-center justify-center gap-1.5 mt-1">
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
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Nama Tampilan</label>
                  <Input 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)} 
                    placeholder="Nama Anda..."
                    className="bg-white/5 h-14 text-sm rounded-2xl border-white/10 text-white font-bold" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Username</label>
                  <div className="relative">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <Input 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} 
                      placeholder="username"
                      className="bg-white/5 h-14 text-sm pl-10 rounded-2xl border-white/10 text-white font-bold" 
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase ml-1 flex items-center gap-2"><Palette size={14} /> Pilih Warna</label>
                  
                  <div className="grid grid-cols-4 gap-3">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => selectPreset(c)}
                        className={`aspect-square rounded-xl border-2 transition-all flex items-center justify-center ${themeColor === c.hex ? 'border-white scale-105 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'}`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {themeColor === c.hex && <Check size={16} className={c.hex === '#ffffff' ? 'text-black' : 'text-white'} />}
                      </button>
                    ))}
                  </div>

                  <Dialog open={paletteOpen} onOpenChange={setPaletteOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full h-12 rounded-xl border-white/5 text-[10px] font-black uppercase tracking-widest">
                        Sesuaikan Kustom
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card border-none rounded-[2rem] max-w-[90%] mx-auto">
                      <DialogHeader><DialogTitle className="text-center font-black uppercase text-xs">Pilih Warna Kustom</DialogTitle></DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-[8px] font-black uppercase text-muted-foreground">Utama</p>
                            <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="w-full h-12 rounded-xl bg-white/5 cursor-pointer" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] font-black uppercase text-muted-foreground">Sekunder</p>
                            <input type="color" value={themeColorSecondary} onChange={(e) => setThemeColorSecondary(e.target.value)} className="w-full h-12 rounded-xl bg-white/5 cursor-pointer" />
                          </div>
                        </div>
                        <Button onClick={() => setPaletteOpen(false)} className="w-full h-12 neon-gradient text-background font-black rounded-xl">Setel Warna</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Foto Profil</label>
                  <label className="flex items-center justify-center gap-3 h-14 bg-white/5 border border-dashed border-white/20 rounded-2xl cursor-pointer hover:bg-white/10 transition-all">
                    <Upload size={18} className="text-primary" />
                    <span className="text-xs font-bold text-white/40 uppercase">Unggah Foto</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
                  </label>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Bio</label>
                  <Textarea 
                    value={bio} 
                    onChange={(e) => setBio(e.target.value)} 
                    placeholder="Tulis bio..."
                    className="bg-white/5 h-24 text-sm rounded-2xl border-white/10 text-white font-medium" 
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving} className="flex-1 h-14 rounded-2xl">Batal</Button>
                  <Button onClick={handleSaveProfile} disabled={isSaving} className="flex-1 h-14 neon-gradient text-background font-black rounded-2xl shadow-xl">
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : "Simpan Profil"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Bio</p>
                  <p className="text-sm font-medium text-white/80 leading-relaxed">{bio || 'Belum ada bio.'}</p>
                </div>
                <div className="flex items-center gap-4 px-4">
                  <Mail size={16} className="text-white/20" />
                  <div className="flex-1">
                    <p className="text-[8px] font-black text-muted-foreground uppercase">Email</p>
                    <p className="text-xs font-bold text-white/60">{user?.email}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Button variant="destructive" className="w-full h-16 rounded-[1.5rem] font-black text-sm uppercase mt-6" onClick={handleLogout}>
          <LogOut size={20} className="mr-3" /> Keluar
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
