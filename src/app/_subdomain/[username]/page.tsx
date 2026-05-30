"use client";

import { use } from 'react';
import ProfileClient from '@/app/[username]/ProfileClient';

/**
 * @fileOverview Rute Utama Profil via Subdomain.
 * Menggunakan logic ProfileClient yang sudah stabil.
 */
export default function SubdomainProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  return <ProfileClient username={username} />;
}
