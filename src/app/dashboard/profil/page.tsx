"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { User, LogOut, Mail, Edit3, Upload, AtSign, Loader2, Palette, Share2, Plus, Trash2, Instagram, Youtube, Facebook, MessageCircle, Link2, Globe, Copy } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  { name: 'Website', icon: Globe },
];

const platformIcons: Record<string, any> = {
  Instagram: Instagram,
  YouTube: Youtube,
  TikTok: TikTokIcon,
  Facebook: Facebook,
  WhatsApp: MessageCircle,
  Email: Mail,
  Website: Globe
};

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
  const [extractedPalette, setExtractedPalette] = useState<string[]>([]);
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [fullUrl, setFullUrl] = useState('');

  const [newSocial, setNewSocial] = useState({
    platform: '',
    url: '',
    embedUrl: '',
    label: ''
  });

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
        const domain = window.location.origin;
        setFullUrl(`${domain}/${profile.username || profile.id}`);
      }
    }
  }, [profile]);

  const handleCopyUrl = () => {
    if (!fullUrl) return;
    navigator.clipboard.writeText(fullUrl);
    toast({ title: "Berhasil Salin", description: "URL profil Linku Anda telah disalin." });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    setExtractedPalette(palette);
    setThemeColor(palette[0]);
    setThemeColorSecondary(palette[1] || palette[0]);
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
      if (cleanUsername !== profile?.username) {
        const usernameRef = doc(db, 'usernames', cleanUsername);
        const usernameSnap = await getDoc(usernameRef);
        if (usernameSnap.exists()) {
          toast({ variant: "destructive", title: "Username tidak tersedia" });
          setIsSaving(false);
          return;
        }
        if (profile?.username) await deleteDoc(doc(db, 'usernames', profile.username));
        await setDoc(usernameRef, { userId: user.uid, createdAt: serverTimestamp() });
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
      toast({ variant: "destructive", title: "Gagal menyimpan" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSocialLink = () => {
    if (!newSocial.platform || !newSocial.url || !newSocial.label) {
      toast({ variant: "destructive", title: "Lengkapi Form", description: "Platform, Link, dan Username wajib diisi." });
      return;
    }
    
    const cleanLink = {
      ...newSocial,
      url: newSocial.url.startsWith('http') ? newSocial.url : `https://${newSocial.url}`
    };

    setSocialLinks([...socialLinks, cleanLink]);
    setNewSocial({ platform: '', url: '', embedUrl: '', label: '' });
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
            boxShadow: `0 0 30px -5px ${themeColor}66`
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
          <h1 className="text-2xl font-black text-white tracking-tight leading-none">{displayName || profile?.username || 'User Linku'}</h1>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <AtSign size={12} style={{ color: themeColor }} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: themeColor }}>{profile?.username || 'user'}</p>
          </div>
        </div>
      </div>

      <Card className="glass-card border-none bg-primary/5 rounded-[2rem] overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1 min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase text-primary tracking-widest">URL Profil Linku</p>
              <p className="text-sm font-bold text-white truncate pr-4">{fullUrl || 'Menyiapkan URL...'}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleCopyUrl} className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-primary/20 hover:text-primary shadow-xl shrink-0">
              <Copy size={20} />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="glass-card border-white/5 rounded-[2rem] overflow-hidden">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 text-white"><Edit3 size={16} className="text-primary" /> Edit Profil</h3>
              {!isEditing && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8 px-4 text-[10px] font-black text-primary rounded-xl hover:bg-primary/10">Buka Mode Edit</Button>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Nama Tampilan</label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Nama Anda..." className="bg-white/5 h-14 text-sm rounded-2xl border-white/10 text-white font-bold" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Username</label>
                  <div className="relative">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <Input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="username" className="bg-white/5 h-14 text-sm pl-10 rounded-2xl border-white/10 text-white font-bold" />
                  </div>
                </div>

                {extractedPalette.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-1 flex items-center gap-2"><Palette size={14} /> Pilih Tema Warna</label>
                    <div className="grid grid-cols-4 gap-3">
                      {extractedPalette.map((color, i) => (
                        <button 
                          key={i} 
                          onClick={() => {
                            if (themeColor === color) setThemeColorSecondary(color);
                            else setThemeColor(color);
                          }} 
                          className={`aspect-square rounded-xl border-2 transition-all flex items-center justify-center ${themeColor === color || themeColorSecondary === color ? 'border-white scale-105 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'}`} 
                          style={{ backgroundColor: color }}
                        >
                          {themeColor === color && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Unggah Foto Profil</label>
                  <label className="flex items-center justify-center gap-3 h-14 bg-white/5 border border-dashed border-white/20 rounded-2xl cursor-pointer hover:bg-white/10 transition-all">
                    <Upload size={18} className="text-primary" />
                    <span className="text-xs font-bold text-white/40 uppercase">Pilih Gambar</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
                  </label>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Bio Singkat</label>
                  <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tulis bio Anda..." className="bg-white/5 h-24 text-sm rounded-2xl border-white/10 text-white font-medium" />
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Bio Anda</p>
                  <p className="text-sm font-medium text-white/80 leading-relaxed">{bio || 'Belum ada bio.'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5 rounded-[2rem] overflow-hidden">
          <CardContent className="p-6 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 text-white"><Share2 size={16} className="text-primary" /> Sosmed & Live Stats</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-muted-foreground uppercase ml-1">Platform</label>
                  <Select value={newSocial.platform} onValueChange={(v) => setNewSocial({...newSocial, platform: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl text-xs font-bold">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-none rounded-xl">
                      {socialPlatforms.map(p => (
                        <SelectItem key={p.name} value={p.name} className="text-xs font-bold">{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-muted-foreground uppercase ml-1">Username / Label</label>
                  <Input value={newSocial.label} onChange={(e) => setNewSocial({...newSocial, label: e.target.value})} placeholder="@username" className="bg-white/5 border-white/10 h-12 rounded-xl text-xs font-bold" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-muted-foreground uppercase ml-1">Link Profil Asli</label>
                <Input value={newSocial.url} onChange={(e) => setNewSocial({...newSocial, url: e.target.value})} placeholder="https://youtube.com/@..." className="bg-white/5 border-white/10 h-12 rounded-xl text-xs font-bold" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-primary uppercase ml-1 flex items-center gap-1"><Plus size={10}/> Channel ID (Khusus YouTube Live Stats)</label>
                <Input value={newSocial.embedUrl} onChange={(e) => setNewSocial({...newSocial, embedUrl: e.target.value})} placeholder="UC..." className="bg-white/5 border-white/10 h-12 rounded-xl text-xs font-bold" />
                <p className="text-[8px] text-muted-foreground px-1">Masukkan Channel ID (biasanya dimulai dengan UC) untuk mengaktifkan counter real-time YouTube.</p>
              </div>
              <Button onClick={handleAddSocialLink} className="w-full h-12 neon-gradient text-background font-black rounded-xl text-[10px] uppercase tracking-widest glow-primary">
                Tambah Sosmed
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
                        <p className="text-[10px] text-muted-foreground font-black truncate uppercase tracking-widest">{social.label}</p>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => handleRemoveSocialLink(i)} className="text-destructive h-10 w-10 rounded-xl hover:bg-destructive/10">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {isEditing && (
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving} className="flex-1 h-14 rounded-2xl">Batal</Button>
            <Button onClick={handleSaveProfile} disabled={isSaving} className="flex-1 h-14 neon-gradient text-background font-black rounded-2xl shadow-xl">
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : "Simpan Perubahan"}
            </Button>
          </div>
        )}
        <Button variant="destructive" className="w-full h-16 rounded-[2rem] font-black text-sm uppercase mt-6" onClick={handleLogout}>
          <LogOut size={20} className="mr-3" /> Keluar Sesi
        </Button>
      </div>
      <ImageCropperModal imageSrc={tempImage} isOpen={cropperOpen} onClose={() => setCropperOpen(false)} onCropComplete={onCropComplete} />
    </div>
  );
}
