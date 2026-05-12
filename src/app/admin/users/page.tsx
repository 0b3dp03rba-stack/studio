
"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils-app';
import { User, Mail, Wallet, ShieldCheck, Trash2, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, limit, doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function AdminUsersPage() {
  const { user: adminUser } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const profileRef = useMemoFirebase(() => adminUser ? doc(db, 'userProfiles', adminUser.uid) : null, [db, adminUser]);
  const { data: profile } = useDoc(profileRef);
  const isAdmin = profile?.role === 'Admin' || adminUser?.email === 'creeppermoment@gmail.com';

  const { data: users, isLoading } = useCollection(useMemoFirebase(() => 
    isAdmin ? query(collection(db, 'userProfiles'), limit(200)) : null, 
    [db, isAdmin]
  ));

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      // 1. Hapus username mapping agar username tersedia lagi
      if (userToDelete.username) {
        await deleteDoc(doc(db, 'usernames', userToDelete.username.toLowerCase()));
      }
      
      // 2. Hapus profil user
      await deleteDoc(doc(db, 'userProfiles', userToDelete.id));
      
      toast({ title: "User Dihapus", description: `Akun @${userToDelete.username} telah dihapus dari sistem.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal Menghapus", description: "Terjadi kesalahan database." });
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  if (isLoading) return (
    <div className="p-20 text-center flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-primary" size={32} />
      <p className="font-black uppercase text-[10px] tracking-widest text-primary/50">Memindai Database User...</p>
    </div>
  );

  if (!isAdmin) return null;

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Button variant="ghost" asChild className="p-0 h-auto hover:bg-transparent -ml-1 text-white/40 hover:text-white transition-colors">
            <Link href="/admin" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
              <ArrowLeft size={14} /> Back to Panel
            </Link>
          </Button>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase">User Database</h1>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">Total terdaftar: {users?.length || 0} entitas.</p>
        </div>
      </div>

      <div className="space-y-3">
        {(users || []).map((u) => (
          <Card key={u.id} className="glass-card border-none rounded-[1.5rem] overflow-hidden group shadow-xl hover:bg-white/[0.05] transition-all">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shrink-0 ${u.role === 'Admin' ? 'neon-gradient text-background glow-primary' : 'bg-white/5 text-muted-foreground'}`}>
                <User size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-black truncate text-white uppercase">@{u.username || 'unknown'}</p>
                  <Badge variant={u.role === 'Admin' ? 'default' : 'outline'} className="text-[8px] h-4 px-1.5 font-black uppercase border-white/10">
                    {u.role}
                  </Badge>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] text-white/40 truncate flex items-center gap-1 font-bold uppercase tracking-tight">
                    <Mail size={10} /> {u.email}
                  </p>
                  <div className="flex gap-4 mt-1">
                    <div className="flex items-center gap-1 text-[10px] text-primary font-black uppercase">
                      <Wallet size={10} /> {formatCurrency(u.balance || 0)}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-white/20 font-bold uppercase">
                      <ShieldCheck size={10} /> {u.views || 0} Views
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Admin tidak bisa hapus diri sendiri di daftar ini untuk keamanan */}
              {u.id !== adminUser?.uid && (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => setUserToDelete(u)}
                  className="h-12 w-12 rounded-2xl text-white/20 hover:text-destructive hover:bg-destructive/10 transition-all shadow-xl active:scale-95"
                >
                  <Trash2 size={20} />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}

        {users?.length === 0 && (
          <div className="text-center py-24 opacity-20 font-black uppercase text-[10px] tracking-widest border border-dashed border-white/10 rounded-[2.5rem]">
            Database Kosong
          </div>
        )}
      </div>

      <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 flex gap-4 items-start">
         <AlertCircle size={20} className="text-primary shrink-0 mt-0.5" />
         <p className="text-[10px] font-black uppercase leading-relaxed text-primary/70">Peringatan: Menghapus user akan menghilangkan profil publik dan statistik mereka secara permanen. Akun autentikasi Firebase tidak akan terpengaruh secara otomatis.</p>
      </div>

      {/* POPUP KONFIRMASI HAPUS USER */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => !isDeleting && setUserToDelete(null)}>
        <AlertDialogContent className="glass-card border-none rounded-[2.5rem] bg-background/95 backdrop-blur-3xl p-8 shadow-2xl max-w-[90%] sm:max-w-md mx-auto">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-destructive" />
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter text-white">Eliminasi User?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60 font-medium leading-relaxed">
              Konfirmasi penghapusan data untuk <strong className="text-white">@{userToDelete?.username}</strong>. Tindakan ini akan menghapus semua link dan statistik profil mereka secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 flex gap-3">
            <AlertDialogCancel className="bg-white/5 border-none rounded-xl text-[10px] font-black uppercase h-12 text-white hover:bg-white/10 flex-1">Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); handleDeleteUser(); }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/80 text-white rounded-xl text-[10px] font-black uppercase h-12 flex-1 shadow-lg shadow-destructive/20"
            >
              {isDeleting ? <Loader2 className="animate-spin" size={16} /> : "HAPUS PERMANEN"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
