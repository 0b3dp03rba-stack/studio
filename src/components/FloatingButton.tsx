"use client";

import { useApp } from '@/lib/store';
import { Plane } from 'lucide-react';

export default function FloatingButton() {
  const { state } = useApp();
  if (!state.currentUser) return null;

  return (
    <a 
      href={state.settings.floatingBtnLink} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="floating-btn glow-primary"
    >
      <Plane className="rotate-45" size={24} />
    </a>
  );
}
