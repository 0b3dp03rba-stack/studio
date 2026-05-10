
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { User, LogOut, Mail, Edit3, Upload, AtSign, Loader2, Palette, Share2, Plus, Trash2, Instagram, Youtube, Facebook, MessageCircle, Link2, Globe, Copy, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import ImageCropperModal from '@/components/ImageCropperModal';
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
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [fullUrl, setFullUrl] = useState('');

  const [newSocial, setNewSocial] = useState({
    platform: '',
    label: '',
    url: ''
  });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatarUrl || '');
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
    toast({ title: "Tersalin!", description: "Link profil Anda siap dibagikan." });
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
        socialLinks,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Tersimpan", description: "Detail identitas diperbarui." });
      setIsEditing(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal menyimpan" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSocialLink = () => {
    if (!newSocial.platform || !newSocial.label) return;
    setSocialLinks([...socialLinks, { ...newSocial }]);
    setNewSocial({ platform: '', label: '', url: '' });
    setIsEditing(true);
  };

  const handleRemoveSocialLink = (index: number) => {
    const updated = [...socialLinks];
    updated.splice(index, 1);
    setSocialLinks(updated);
    setIsEditing(true);
  };

  return (
    <div className="space-y-8 animate-in pb-24">
      <div className="space-y-1">
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase">Profile Set</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">Identitas Publik Anda</p>
      </div>

      <div className="space-y-6">
        <Card className="glass-card border-none rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-8 space-y-6">
            <div className="flex flex-col items-center gap-6">
              <div className="relative group">
                <div className="w-32 h-32 rounded-[2.5rem] bg-white/5 flex items-center justify-center overflow-hidden border-2 border-white/10 shadow-2xl relative">
                   {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <User size={56} className="text-white/20" />}
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <label className="cursor-pointer p-3 bg-white/10 rounded-2xl backdrop-blur-xl">
                        <Upload size={24} className="text-white" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
                     </label>
                   </div>
                </div>
              </div>

              <div className="w-full space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Nama Tampilan</label>
                    <Input value={displayName} onChange={(e) => { setDisplayName(e.target.value); setIsEditing(true); }} className="bg-white/5 h-14 border-none font-bold text-sm rounded-2xl" placeholder="Nama Anda" />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Username Unik</label>
                    <div className="relative">
                      <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={14} />
                      <Input value={username} onChange={(e) => { setUsername(e.target.value); setIsEditing(true); }} className="bg-white/5 h-14 border-none pl-12 font-bold text-sm rounded-2xl" placeholder="username" />
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Bio Singkat</label>
                    <Textarea value={bio} onChange={(e) => { setBio(e.target.value); setIsEditing(true); }} className="bg-white/5 h-24 border-none text-xs font-medium rounded-2xl" placeholder="Ceritakan siapa Anda..." />
                 </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-none rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-8 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-white"><Share2 size={16} className="text-primary" /> Sosial Media</h3>
            
            <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 flex gap-4 items-start">
               <AlertCircle size={20} className="text-primary shrink-0 mt-0.5" />
               <p className="text-[10px] font-black uppercase leading-relaxed text-primary/80">Cukup masukkan username/ID saja. Sistem akan otomatis membuat link redirect yang cerdas ke profil Anda.</p>
            </div>

            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Select value={newSocial.platform} onValueChange={(v) => setNewSocial({...newSocial, platform: v})}>
                  <SelectTrigger className="bg-white/5 border-none h-12 rounded-xl text-[10px] font-black uppercase">
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-none rounded-xl">
                    {socialPlatforms.map(p => (
                      <SelectItem key={p.name} value={p.name} className="text-xs font-bold">{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input value={newSocial.label} onChange={(e) => setNewSocial({...newSocial, label: e.target.value})} placeholder="Username / ID" className="bg-white/5 border-none h-12 rounded-xl text-xs font-bold" />
              </div>
            </div>
            <Button onClick={handleAddSocialLink} className="w-full h-12 bg-white/5 hover:bg-white/10 text-white font-black rounded-xl text-[9px] uppercase tracking-widest border border-white/5">
              Hubungkan Media
            </Button>
            
            <div className="grid gap-3">
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
                        <p className="text-[10px] text-muted-foreground font-black truncate uppercase tracking-widest">@{social.label}</p>
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

        <Card className="glass-card border-none rounded-[2rem] p-6 shadow-2xl space-y-4">
           <div className="flex items-center justify-between">
              <div>
                 <p className="text-[9px] font-black uppercase text-primary tracking-widest mb-1">Public URL</p>
                 <p className="text-xs font-bold text-white truncate max-w-[200px]">{fullUrl || 'Loading...'}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCopyUrl} className="h-12 w-12 rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary shadow-xl">
                <Copy size={20} />
              </Button>
           </div>
        </Card>

        <div className="flex flex-col gap-3 pt-4">
          {isEditing && (
            <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full h-16 neon-gradient text-background font-black rounded-3xl shadow-xl uppercase tracking-widest text-sm">
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : "Simpan Identitas"}
            </Button>
          )}
          <Button variant="destructive" className="w-full h-16 rounded-3xl font-black text-xs uppercase tracking-[0.2em] bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20" onClick={handleLogout}>
            <LogOut size={16} className="mr-3" /> Keluar Sesi
          </Button>
        </div>
      </div>
      <ImageCropperModal imageSrc={tempImage} isOpen={cropperOpen} onClose={() => setCropperOpen(false)} onCropComplete={onCropComplete} />
    </div>
  );
}
