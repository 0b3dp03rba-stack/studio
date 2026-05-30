"use client";

import { use } from 'react';
import ProfileClient from '@/app/[username]/ProfileClient';

/**
 * @fileOverview Unified Public Profile Viewer
 * Melayani rute internal hasil rewrite dari Middleware.
 * username param format: "u:username" atau "d:domain.com"
 */
export default function UnifiedProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  // Decode param jika mengandung karakter khusus domain (misal: titik atau titik dua)
  const decodedUsername = decodeURIComponent(username);
  return <ProfileClient username={decodedUsername} />;
}
