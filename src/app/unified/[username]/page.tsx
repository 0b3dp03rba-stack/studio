
"use client";

import { use } from 'react';
import ProfileClient from '@/app/[username]/ProfileClient';

/**
 * @fileOverview Unified Public Profile Resolver
 * Menjadi gerbang tunggal untuk melihat profil (Subdomain & Custom Domain).
 */
export default function UnifiedProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  
  // Decode URL karena parameter mungkin mengandung karakter khusus (u: atau d:)
  const decodedUsername = decodeURIComponent(username);
  
  return <ProfileClient username={decodedUsername} />;
}
