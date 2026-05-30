import { notFound } from 'next/navigation';

/**
 * @fileOverview FILE INI DIHAPUS TOTAL UNTUK MENGHINDARI KONFLIK RUTE.
 * Next.js tidak mengizinkan dua folder dinamis [slug] dan [username] 
 * berada di level yang sama.
 */
export default function DeletedSlugPage() {
  return notFound();
}
