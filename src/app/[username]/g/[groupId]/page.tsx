import { notFound } from 'next/navigation';

/**
 * @fileOverview Fallback rute group di domain utama.
 * Dipindah ke _subdomain agar struktur lebih bersih.
 */
export default function LegacyGroupPage() {
  return notFound();
}
