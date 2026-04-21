"use client";

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils-app';
import { Mail, Wallet, Users, Clock } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useDoc, useUser } from '@/firebase';
import { collection, query, limit, doc } from 'firebase/firestore';

export default function AdminDashboard() {
  const { user } = useUser();
  const db = useFirestore();

  // Admin Verification
  const profileRef = useMemoFirebase(() => user ? doc(db, 'userProfiles', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(profileRef);
  const isAdmin = profile?.role === 'Admin';

  const { data: batches } = useCollection(useMemoFirebase(() => isAdmin ? collection(db, 'gmailBatches') : null, [db, isAdmin]));
  const { data: withdrawals } = useCollection(useMemoFirebase(() => isAdmin ? collection(db, 'withdrawalRequests') : null, [db, isAdmin]));
  const { data: allUsers } = useCollection(useMemoFirebase(() => isAdmin ? query(collection(db, 'userProfiles'), limit(500)) : null, [db, isAdmin]));
  const { data: config } = useDoc(useMemoFirebase(() => doc(db, 'appConfig', 'singletonConfig'), [db]));

  if (!isAdmin) return <div className="p-20 text-center opacity-20 font-black uppercase tracking-widest">Akses Ditolak</div>;

  const totalGmails = (batches || []).reduce((acc, b) => acc + (b.totalCount || 0), 0);
  const pendingWithdrawals = (withdrawals || []).filter(w => w.status === 'Pending').length;
  const totalUserCount = (allUsers || []).filter(u => u.role === 'User').length;

  return (
    <div className="space-y-6 animate-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest">Monitor seluruh aktivitas platform.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card border-none rounded-[1.5rem] relative overflow-hidden group">
          <CardContent className="p-5 space-y-3">
            <Mail size={20} className="text-primary group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-2xl font-black">{totalGmails}</div>
              <div className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">Total Akun Masuk</div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-none rounded-[1.5rem] relative overflow-hidden group">
          <CardContent className="p-5 space-y-3">
            <Clock size={20} className="text-secondary group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-2xl font-black">{(batches || []).filter(b => b.status === 'Pending').length}</div>
              <div className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">Batch Pending</div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-none rounded-[1.5rem] relative overflow-hidden group">
          <CardContent className="p-5 space-y-3">
            <Wallet size={20} className="text-primary group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-2xl font-black">{pendingWithdrawals}</div>
              <div className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">WD Pending</div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-none rounded-[1.5rem] relative overflow-hidden group">
          <CardContent className="p-5 space-y-3">
            <Users size={20} className="text-secondary group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-2xl font-black">{totalUserCount}</div>
              <div className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">Total Pengguna</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Parameter Aktif</h3>
        <Card className="glass-card border-none rounded-[1.5rem]">
          <CardContent className="p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-bold">Rate Gmail</span>
              <span className="font-black text-primary">{formatCurrency(config?.gmailRate || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-bold">Min. WD</span>
              <span className="font-black">{formatCurrency(config?.minWithdraw || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-bold">Admin Fee</span>
              <span className="font-black">{formatCurrency(config?.adminFee || 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
