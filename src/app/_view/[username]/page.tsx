
"use client";

import { use } from 'react';
import ProfileClient from '@/app/[username]/ProfileClient';

/**
 * @fileOverview Unified Public Profile Viewer
 * Melayani rute internal hasil rewrite dari Middleware.
 * Parameter username akan berisi "u:username" atau "d:domain.com"
 */
export default function UnifiedProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  // Decode URL karena parameter mungkin mengandung karakter khusus atau titik pada domain
  const decodedUsername = decodeURIComponent(username);
  
  return <ProfileClient username={decodedUsername} />;
}
