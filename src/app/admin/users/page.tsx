"use client";

import { useApp } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils-app';
import { User, Mail, Shield, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminUsersPage() {
  const { state } = useApp();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Data Pengguna</h1>
        <p className="text-muted-foreground text-sm">Lihat seluruh pengguna yang terdaftar.</p>
      </div>

      <div className="space-y-3">
        {state.users.map((u) => {
          const userSubmissions = state.batches.filter(b => b.userId === u.id).flatMap(b => b.items);
          const approvedCount = userSubmissions.filter(i => i.status === 'Disetujui').length;

          return (
            <Card key={u.id} className="glass-card border-white/5">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${u.role === 'Admin' ? 'neon-gradient text-background' : 'bg-white/5 text-muted-foreground'}`}>
                  <User size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold truncate">{u.email.split('@')[0]}</p>
                    <Badge variant={u.role === 'Admin' ? 'default' : 'outline'} className="text-[8px] h-3.5 px-1">{u.role}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                    <Mail size={10} /> {u.email}
                  </p>
                  <div className="flex gap-3 mt-2">
                    <div className="flex items-center gap-1 text-[10px] text-primary font-bold">
                      <Wallet size={10} /> {formatCurrency(u.balance)}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Shield size={10} /> {approvedCount} Gmails
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
