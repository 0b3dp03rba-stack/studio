"use client";

import { useApp } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function ProfilPage() {
  const { state, dispatch } = useApp();
  const router = useRouter();

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    router.push('/login');
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4 py-6">
        <div className="mx-auto w-24 h-24 rounded-full neon-gradient flex items-center justify-center glow-primary border-4 border-background">
          <User size={48} className="text-background" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{state.currentUser?.email.split('@')[0]}</h1>
          <p className="text-primary text-sm font-medium uppercase tracking-widest">{state.currentUser?.role}</p>
        </div>
      </div>

      <div className="space-y-4">
        <Card className="glass-card border-white/5">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/5 rounded-lg">
                <Mail size={18} className="text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Email</p>
                <p className="text-sm font-medium">{state.currentUser?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/5 rounded-lg">
                <Shield size={18} className="text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Role Akun</p>
                <p className="text-sm font-medium">{state.currentUser?.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          variant="destructive" 
          className="w-full h-12 rounded-2xl glow-destructive"
          onClick={handleLogout}
        >
          <LogOut size={18} className="mr-2" />
          Keluar dari Akun
        </Button>
      </div>

      <div className="text-center pt-8">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">GmailKu v1.0.0</p>
      </div>
    </div>
  );
}
