
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { User, LogOut, Mail, Edit3, Upload, AtSign, Loader2, Palette, Check, Copy, Share2, Plus, Trash2, Instagram, Youtube, Facebook, MessageCircle, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import ImageCropperModal from '@/components/ImageCropperModal';
import { extractPaletteFromImage } from '@/lib/utils-app';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DEFAULT_PALETTE = ['#ff0000', '#00ffff', '#0000ff', '#00ff00', '#ff00ff', '#ffff00', '#000000', '#ffffff'];

const TikTokIcon = ({ className, size = 16 }: { className?: string, size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const socialPlatforms = [
  { name: 'Instagram', icon: Instagram },
  { name: 'YouTube', icon: Youtube },
  { name: 'TikTok', icon: TikTokIcon },
  { name: 'Facebook', icon: Facebook },
  { name: 'WhatsApp', icon: MessageCircle },
  { name: 'Email', icon: Mail },
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
  const [customPalette, setCustomPalette] = useState<string[]>(DEFAULT_PALETTE);
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [fullUrl, setFullUrl] = useState('');

  // New Social Link Form State
  const [newSocialPlatform, setNewSocialPlatform] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [newSocialValue, setNewSocialValue] = useState('');
  const [newSocialLabel, setNewSocialLabel] = useState('');

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatarUrl || '');
      setThemeColor(profile.themeColor || '#ff0000');
      setThemeColorSecondary(profile.themeColorSecondary || '#ffea00');
      setSocialLinks(profile.socialLinks || []);
      
      if (typeof window !== 'undefined') {
        setFullUrl(`${window.location.origin}/${profile.username || profile.id}`);
      }
    }
  }, [profile]);

  const handleCopyUrl = () => {
    if (!fullUrl) return;
    navigator.clipboard.writeText(fullUrl);
    toast({
      title: "Berhasil Salin",
      description: "URL profil Linku Anda telah disalin.",
    });
  };

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
    
    const palette = await extractPaletteFromImage(cropped);
    setCustomPalette(palette);
    
    setThemeColor(palette[0]);
    setThemeColorSecondary(palette[1] || palette[0]);
    
    toast({ 
      title: "Palet Diperbarui", 
      description: "Warna tema telah disesuaikan dengan foto profil Anda." 
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
        socialLinks,
        updatedAt: serverTimestamp()
      });

      toast({ title: "Tersimpan", description: "Profil Linku Anda telah diperbarui." });
      setIsEditing(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal menyimpan", description: "Gagal memperbarui profil. Silakan coba lagi." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSocialLink = () => {
    if (!newSocialPlatform || !newSocialUrl) return;
    const newLink = {
      platform: newSocialPlatform,
      url: newSocialUrl,
      value: newSocialValue || '0',
      label: newSocialLabel || 'Followers'
    };
    setSocialLinks([...socialLinks, newLink]);
    setNewSocialPlatform('');
    setNewSocialUrl('');
    setNewSocialValue('');
    setNewSocialLabel('');
    setIsEditing(true);
  };

  const handleRemoveSocialLink = (index: number) => {
    const updated = [...socialLinks];
    updated.splice(index, 1);
    setSocialLinks(updated);
    setIsEditing(true);
  };

  return (
    <div className="space-y-6 animate-in pb-12">
      <div className="text-center space-y-4 py-8">
        <div 
          className="mx-auto w-28 h-28 rounded-[2rem] flex items-center justify-center border-4 border-background shadow-2xl overflow-hidden relative group aspect-square"
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

      <Card className="glass-card border-none bg-primary/5 rounded-[2rem] overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-primary tracking-widest">URL Profil Linku</p>
              <p className="text-sm font-bold text-white truncate max-w-[220px]">{fullUrl || 'Menyiapkan URL...'}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleCopyUrl}
              className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-primary/20 hover:text-primary shadow-xl"
            >
              <Copy size={20} />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {/* Profile Settings Section */}
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
                  <label className="text-[10px] font-black text-muted-foreground uppercase ml-1 flex items-center gap-2"><Palette size={14} /> Palet Warna Foto</label>
                  
                  <div className="grid grid-cols-4 gap-3">
                    {customPalette.map((color, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setThemeColor(color);
                          setThemeColorSecondary(color);
                        }}
                        className={`aspect-square rounded-xl border-2 transition-all flex items-center justify-center ${themeColor === color ? 'border-white scale-105 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'}`}
                        style={{ backgroundColor: color }}
                      >
                        {themeColor === color && <Check size={16} className="text-white mix-blend-difference" />}
                      </button>
                    ))}
                  </div>

                  <Dialog open={paletteOpen} onOpenChange={setPaletteOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full h-12 rounded-xl border-white/5 text-[10px] font-black uppercase tracking-widest">
                        Sesuaikan Manual
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card border-none rounded-[2.5rem] max-w-[90%] mx-auto">
                      <DialogHeader><DialogTitle className="text-center font-black uppercase text-xs">Pilih Warna Kustom</DialogTitle></DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-[8px] font-black uppercase text-muted-foreground">Warna Utama</p>
                            <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="w-full h-12 rounded-xl bg-white/5 cursor-pointer" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] font-black uppercase text-muted-foreground">Warna Sekunder</p>
                            <input type="color" value={themeColorSecondary} onChange={(e) => setThemeColorSecondary(e.target.value)} className="w-full h-12 rounded-xl bg-white/5 cursor-pointer" />
                          </div>
                        </div>
                        <Button onClick={() => setPaletteOpen(false)} className="w-full h-12 neon-gradient text-background font-black rounded-xl">Terapkan Warna</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Foto Profil</label>
                  <label className="flex items-center justify-center gap-3 h-14 bg-white/5 border border-dashed border-white/20 rounded-2xl cursor-pointer hover:bg-white/10 transition-all">
                    <Upload size={18} className="text-primary" />
                    <span className="text-xs font-bold text-white/40 uppercase">Ganti Foto</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
                  </label>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Bio</label>
                  <Textarea 
                    value={bio} 
                    onChange={(e) => setBio(e.target.value)} 
                    placeholder="Tulis sedikit tentang Anda..."
                    className="bg-white/5 h-24 text-sm rounded-2xl border-white/10 text-white font-medium" 
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Bio</p>
                  <p className="text-sm font-medium text-white/80 leading-relaxed">{bio || 'Belum ada bio.'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Social Links Manager */}
        <Card className="glass-card border-white/5 rounded-[2rem] overflow-hidden">
          <CardContent className="p-6 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 text-white"><Share2 size={16} className="text-primary" /> Media Sosial & Statistik</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-muted-foreground uppercase ml-1">Platform</label>
                  <Select value={newSocialPlatform} onValueChange={setNewSocialPlatform}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl text-xs font-bold">
                      <SelectValue placeholder="Pilih Sosmed" />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-none rounded-xl">
                      {socialPlatforms.map(p => (
                        <SelectItem key={p.name} value={p.name} className="text-xs font-bold">{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-muted-foreground uppercase ml-1">Nilai Statistik</label>
                  <Input 
                    value={newSocialValue} 
                    onChange={(e) => setNewSocialValue(e.target.value)} 
                    placeholder="Contoh: 1.2M"
                    className="bg-white/5 border-white/10 h-12 rounded-xl text-xs font-bold" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-muted-foreground uppercase ml-1">URL Profil</label>
                <Input 
                  value={newSocialUrl} 
                  onChange={(e) => setNewSocialUrl(e.target.value)} 
                  placeholder="https://..."
                  className="bg-white/5 border-white/10 h-12 rounded-xl text-xs font-bold" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-muted-foreground uppercase ml-1">Label Statistik</label>
                <Input 
                  value={newSocialLabel} 
                  onChange={(e) => setNewSocialLabel(e.target.value)} 
                  placeholder="Contoh: Followers / Subscribers"
                  className="bg-white/5 border-white/10 h-12 rounded-xl text-xs font-bold" 
                />
              </div>

              <Button onClick={handleAddSocialLink} disabled={!newSocialPlatform || !newSocialUrl} className="w-full h-12 neon-gradient text-background font-black rounded-xl text-[10px] uppercase tracking-widest glow-primary">
                <Plus size={16} className="mr-2" /> Tambah Sosmed
              </Button>
            </div>

            <div className="grid gap-3 pt-4 border-t border-white/5">
              {socialLinks.map((social, i) => {
                const Icon = platformIcons[social.platform] || Link2;
                return (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary">
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase truncate">{social.platform}</p>
                        <p className="text-[10px] text-muted-foreground font-bold truncate">{social.value} {social.label}</p>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => handleRemoveSocialLink(i)} className="text-destructive h-10 w-10 rounded-xl hover:bg-destructive/10">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                );
              })}
              {socialLinks.length === 0 && (
                <p className="text-center py-6 text-[10px] font-black uppercase text-muted-foreground opacity-50">Belum ada sosmed ditambahkan.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {isEditing && (
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving} className="flex-1 h-14 rounded-2xl">Batal</Button>
            <Button onClick={handleSaveProfile} disabled={isSaving} className="flex-1 h-14 neon-gradient text-background font-black rounded-2xl shadow-xl">
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : "Simpan Semua Perubahan"}
            </Button>
          </div>
        )}

        <Button variant="destructive" className="w-full h-16 rounded-[2rem] font-black text-sm uppercase mt-6" onClick={handleLogout}>
          <LogOut size={20} className="mr-3" /> Keluar Sesi
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

const platformIcons: Record<string, any> = {
  Instagram: Instagram,
  YouTube: Youtube,
  TikTok: TikTokIcon,
  Facebook: Facebook,
  WhatsApp: MessageCircle,
  Email: Mail
};
