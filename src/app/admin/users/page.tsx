"use client";

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils-app';
import { User, Mail, Wallet, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, limit, doc } from 'firebase/firestore';

export default function AdminUsersPage() {
  const { user } = useUser();
  const db = useFirestore();

  const profileRef = useMemoFirebase(() => user ? doc(db, 'userProfiles', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(profileRef);
  const isAdmin = profile?.role === 'Admin';

  const { data: users, isLoading } = useCollection(useMemoFirebase(() => 
    isAdmin ? query(collection(db, 'userProfiles'), limit(200)) : null, 
    [db, isAdmin]
  ));

  if (isLoading) return <div className="p-20 text-center animate-pulse font-black uppercase">Memuat User...</div>;
  if (!isAdmin) return null;

  return (
    <div className="space-y-6 animate-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight">Database User</h1>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest">Total terdaftar: {users?.length || 0} pengguna.</p>
      </div>

      <div className="space-y-3">
        {(users || []).map((u) => (
          <Card key={u.id} className="glass-card border-none rounded-[1.5rem] overflow-hidden group">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${u.role === 'Admin' ? 'neon-gradient text-background glow-primary' : 'bg-white/5 text-muted-foreground group-hover:bg-white/10'}`}>
                <User size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-black truncate">{u.email.split('@')[0]}</p>
                  <Badge variant={u.role === 'Admin' ? 'default' : 'outline'} className="text-[8px] h-4 px-1.5 font-black uppercase">
                    {u.role}
                  </Badge>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1 font-bold">
                    <Mail size={10} /> {u.email}
                  </p>
                  <div className="flex gap-4 mt-1">
                    <div className="flex items-center gap-1 text-[10px] text-primary font-black uppercase">
                      <Wallet size={10} /> {formatCurrency(u.balance || 0)}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase">
                      <ShieldCheck size={10} /> Verified
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
