import { notFound } from 'next/navigation';

/**
 * @fileOverview Fallback rute [username] di domain utama.
 * Middleware harusnya melakukan redirect 301 ke subdomain sebelum rute ini tercapai.
 * File ini dikosongkan agar tidak ada render di domain utama/username.
 */
export default function LegacyProfilePage() {
  return notFound();
}
