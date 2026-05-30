
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { User, Mail, Trash2, ArrowLeft, Loader2, Edit3, Search, X, ShieldCheck, Key, AtSign, Info, Lock, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useAuth } from '@/firebase';
import { collection, query, limit, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export default function AdminUsersPage() {
  const { user: adminUser } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Validasi Status Admin
  const profileRef = useMemoFirebase(() => adminUser ? doc(db, 'userProfiles', adminUser.uid) : null, [db, adminUser]);
  const { data: profile } = useDoc(profileRef);
  const isAdmin = profile?.role === 'Admin' || adminUser?.email === 'creeppermoment@gmail.com';

  const { data: rawUsers, isLoading } = useCollection(useMemoFirebase(() => 
    isAdmin ? query(collection(db, 'userProfiles'), limit(1000)) : null, 
    [db, isAdmin]
  ));

  const filteredUsers = useMemo(() => {
    if (!rawUsers) return [];
    return rawUsers.filter(u => 
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rawUsers, searchQuery]);

  const handleDeleteUser = async () => {
    if (!userToDelete || isDeleting) return;
    setIsDeleting(true);
    try {
      if (userToDelete.username) {
        await deleteDoc(doc(db, 'usernames', userToDelete.username.toLowerCase()));
      }
      await deleteDoc(doc(db, 'userProfiles', userToDelete.id));
      toast({ title: "AKUN DIHAPUS", description: `@${userToDelete.username} telah dihapus selamanya.` });
    } catch (e) {
      toast({ variant: "destructive", title: "GAGAL", description: "Kesalahan akses database." });
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser || isSaving) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'userProfiles', editingUser.id);
      await updateDoc(userRef, {
        displayName: editingUser.displayName,
        username: editingUser.username.toLowerCase().trim(),
        role: editingUser.role,
        isPremium: !!editingUser.isPremium,
        bio: editingUser.bio || '',
        updatedAt: serverTimestamp()
      });
      toast({ title: "PROFIL DIPERBARUI", description: `Data @${editingUser.username} telah disimpan.` });
      setEditingUser(null);
    } catch (e) {
      toast({ variant: "destructive", title: "GAGAL", description: "Gagal memperbarui data." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendResetEmail = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: "EMAIL TERKIRIM", description: `Instruksi reset sandi telah dikirim ke ${email}.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "GAGAL", description: e.message });
    }
  };

  if (isLoading) return (
    <div className="p-20 text-center flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-primary" size={32} />
      <p className="font-black uppercase text-[10px] tracking-widest text-primary/50">Memindai Arsip User...</p>
    </div>
  );

  if (!isAdmin) return null;

  return (
    <div className="space-y-8 animate-in pb-20">
      <div className="flex flex-col gap-4">
        <Button variant="ghost" asChild className="w-fit p-0 h-auto hover:bg-transparent text-white/40 hover:text-white transition-colors">
          <Link href="/admin" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <ArrowLeft size={14} /> Kembali ke Panel
          </Link>
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase">User Control</h1>
            <p className="text-primary/70 text-[10px] font-black uppercase tracking-[0.4em]">Database & Manajemen Akses</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
            <Input 
              placeholder="Cari email/user..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border-white/10 h-12 pl-10 rounded-2xl text-xs font-bold focus-visible:ring-primary/30"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredUsers.map((u) => (
          <Card key={u.id} className="glass-card border-none rounded-[2rem] overflow-hidden group shadow-xl hover:bg-white/[0.05] transition-all">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shrink-0 ${u.role === 'Admin' ? 'neon-gradient text-background shadow-xl' : 'bg-white/5 text-muted-foreground border border-white/5'}`}>
                {u.role === 'Admin' ? <ShieldCheck size={28} /> : <User size={28} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-black truncate text-white uppercase tracking-tight">@{u.username || 'unknown'}</p>
                  {u.isPremium && (
                    <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-1.5 py-0.5 rounded-md">
                      <Crown size={8} className="fill-yellow-500" />
                      <span className="text-[7px] font-black uppercase tracking-widest">GOLD</span>
                    </div>
                  )}
                  <Badge variant={u.role === 'Admin' ? 'default' : 'outline'} className="text-[8px] h-4 px-1.5 font-black uppercase border-white/10">
                    {u.role}
                  </Badge>
                </div>
                <p className="text-[10px] text-white/40 truncate flex items-center gap-1 font-bold uppercase tracking-tight">
                  <Mail size={10} /> {u.email}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setEditingUser(u)}
                  className="h-12 w-12 rounded-2xl text-white/20 hover:text-primary hover:bg-primary/10 transition-all active:scale-95"
                >
                  <Edit3 size={18} />
                </Button>
                {u.id !== adminUser?.uid && (
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => setUserToDelete(u)}
                    className="h-12 w-12 rounded-2xl text-white/20 hover:text-destructive hover:bg-destructive/10 transition-all active:scale-95"
                  >
                    <Trash2 size={18} />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && !isSaving && setEditingUser(null)}>
        <DialogContent className="glass-card border-none rounded-[2.5rem] bg-background/95 backdrop-blur-3xl p-8 shadow-2xl max-w-[95%] sm:max-w-md mx-auto overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 neon-gradient" />
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-white">Kelola Akun</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-5 py-4 text-left">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nama Tampilan</label>
                <Input value={editingUser?.displayName || ''} onChange={(e) => setEditingUser({...editingUser, displayName: e.target.value})} className="bg-white/5 border-none h-12 rounded-xl font-bold" />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-yellow-500/5 rounded-2xl border border-yellow-500/10">
                 <div className="flex items-center gap-3 text-yellow-500">
                    <Crown size={20} />
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest leading-none">Akses Premium</p>
                       <p className="text-[8px] font-bold opacity-60 uppercase mt-1">Berikan fitur emas secara manual</p>
                    </div>
                 </div>
                 <Switch 
                   checked={editingUser?.isPremium || false} 
                   onCheckedChange={(checked) => setEditingUser({...editingUser, isPremium: checked})} 
                 />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Username</label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={12} />
                    <Input value={editingUser?.username || ''} onChange={(e) => setEditingUser({...editingUser, username: e.target.value})} className="bg-white/5 border-none h-12 rounded-xl pl-8 font-bold text-xs" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Role</label>
                  <Select value={editingUser?.role} onValueChange={(v) => setEditingUser({...editingUser, role: v})}>
                    <SelectTrigger className="bg-white/5 border-none h-12 rounded-xl font-black uppercase text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-none rounded-xl">
                      <SelectItem value="User" className="text-xs font-bold uppercase">User</SelectItem>
                      <SelectItem value="Admin" className="text-xs font-bold uppercase">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-4">
                <Button 
                  onClick={() => handleSendResetEmail(editingUser.email)}
                  className="w-full h-12 bg-primary/10 hover:bg-primary/20 text-primary font-black rounded-xl text-[10px] uppercase tracking-[0.2em] border border-primary/20"
                >
                  <Lock size={14} className="mr-2" /> RESET PASSWORD EMAIL
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-3">
            <Button variant="ghost" onClick={() => setEditingUser(null)} className="rounded-xl font-black uppercase text-[10px] flex-1">Batal</Button>
            <Button onClick={handleSaveEdit} disabled={isSaving} className="neon-gradient text-background font-black rounded-xl glow-primary px-8 uppercase text-[10px] flex-1">
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && !isDeleting && setUserToDelete(null)}>
        <AlertDialogContent className="glass-card border-none rounded-[2.5rem] bg-background/95 backdrop-blur-3xl p-8 shadow-2xl max-w-[90%] sm:max-w-md mx-auto">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-destructive" />
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter text-white">Hapus Permanen?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60 font-medium leading-relaxed">
              Konfirmasi penghapusan <strong className="text-white">@{userToDelete?.username}</strong>. Seluruh profil dan link mereka akan hilang selamanya.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 flex gap-3">
            <AlertDialogCancel disabled={isDeleting} className="bg-white/5 border-none rounded-xl text-[10px] font-black uppercase h-12 text-white hover:bg-white/10 flex-1">Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); handleDeleteUser(); }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/80 text-white rounded-xl text-[10px] font-black uppercase h-12 flex-1"
            >
              {isDeleting ? <Loader2 className="animate-spin" size={16} /> : "HAPUS"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
