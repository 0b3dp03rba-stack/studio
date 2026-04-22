
"use client";

import { MessageCircle } from 'lucide-react';
import { useUser } from '@/firebase';
import Link from 'next/link';

export default function FloatingButton() {
  const { user } = useUser();

  if (!user) return null;

  return (
    <Link 
      href="/dashboard/chat" 
      className="floating-btn shadow-2xl active:scale-95 transition-transform duration-300 animate-in group"
    >
      <div className="relative">
        <MessageCircle className="text-black group-hover:scale-110 transition-transform" size={28} strokeWidth={3} />
        {/* Pulsing indicator to show it's active */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-primary animate-pulse shadow-[0_0_8px_white]" />
      </div>
    </Link>
  );
}
