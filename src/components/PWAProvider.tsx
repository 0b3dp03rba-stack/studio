"use client";

import { useEffect } from 'react';

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('Linku ServiceWorker registration successful with scope: ', registration.scope);
          },
          (err) => {
            console.log('Linku ServiceWorker registration failed: ', err);
          }
        );
      });
    }
  }, []);

  return <>{children}</>;
}