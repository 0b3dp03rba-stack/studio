
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * @fileOverview Legacy Transactions Page
 * Halaman ini dinonaktifkan karena redundansi (transaksi hanya 1x seumur hidup).
 * Pengguna akan diarahkan kembali ke Dashboard.
 */
export default function RiwayatPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return null;
}
