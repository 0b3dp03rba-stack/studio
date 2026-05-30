
import { notFound } from 'next/navigation';

/**
 * @fileOverview Jalur root sengaja dimatikan untuk menghindari konflik routing 
 * dengan sistem unified/middleware.
 */
export default function LegacyProfilePage() {
  return notFound();
}
