import { notFound } from 'next/navigation';

/**
 * @fileOverview Jalur ini dimatikan total.
 * Semua akses diarahkan ke subdomain via middleware.
 */
export default function LegacyGroupPage() {
  return notFound();
}
