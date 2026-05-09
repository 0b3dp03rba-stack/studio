
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Link as LinkIcon, Users, MousePointer2, Settings } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useDoc, useUser } from '@/firebase';
import { collection, query, limit, doc } from 'firebase/firestore';

export default function AdminDashboard() {
  const { user } = useUser();
  const db = useFirestore();

  // Admin Verification
  const profileRef = useMemoFirebase(() => user ? doc(db, 'userProfiles', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(profileRef);
  const isAdmin = profile?.role === 'Admin';

  const usersQuery = useMemoFirebase(() => 
    isAdmin ? query(collection(db, 'userProfiles'), limit(500)) : null, 
    [db, isAdmin]
  );
  const { data: allUsers, isLoading: isUsersLoading } = useCollection(usersQuery);

  // Stats
  const totalUsers = allUsers?.filter(u => u.role === 'User').length || 0;
  const totalAdmins = allUsers?.filter(u => u.role === 'Admin').length || 0;

  if (isUsersLoading) return <div className="p-20 text-center animate-pulse font-black uppercase tracking-widest text-primary">Memuat Statistik Linku...</div>;
  if (!isAdmin) return <div className="p-20 text-center opacity-20 font-black uppercase tracking-widest">Akses Ditolak</div>;

  return (
    <div className="space-y-6 animate-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight">Linku Admin</h1>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest">Monitor pertumbuhan platform tautan.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card border-none rounded-[1.5rem] relative overflow-hidden group">
          <CardContent className="p-5 space-y-3">
            <Users size={20} className="text-primary group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-2xl font-black">{totalUsers}</div>
              <div className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">Total Pengguna</div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-none rounded-[1.5rem] relative overflow-hidden group">
          <CardContent className="p-5 space-y-3">
            <LinkIcon size={20} className="text-secondary group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-2xl font-black">{totalAdmins}</div>
              <div className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">Total Admin</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Kontrol Cepat</h3>
        <div className="grid grid-cols-1 gap-3">
          <Card className="glass-card border-none rounded-[1.5rem] hover:bg-white/5 cursor-pointer">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings size={20} className="text-primary" />
                <span className="text-sm font-black uppercase">Pengaturan Global</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
