"use client";

import { Plane } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function FloatingButton() {
  const { user } = useUser();
  const db = useFirestore();
  
  const configRef = useMemoFirebase(() => doc(db, 'appConfig', 'singletonConfig'), [db]);
  const { data: config } = useDoc(configRef);

  if (!user) return null;

  return (
    <a 
      href={config?.floatingBtnLink || "#"} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="floating-btn shadow-2xl active:scale-95 transition-transform duration-300"
    >
      <Plane className="rotate-45 text-black" size={28} strokeWidth={3} />
    </a>
  );
}
