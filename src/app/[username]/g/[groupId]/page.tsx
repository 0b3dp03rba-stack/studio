
import { notFound } from 'next/navigation';

/**
 * @fileOverview Jalur root sengaja dimatikan untuk menghindari konflik routing.
 */
export default function LegacyGroupPage() {
  return notFound();
}
