
"use client";

import { use } from 'react';
import ProfileClient from '@/app/[username]/ProfileClient';

/**
 * @fileOverview Unified Public Profile Resolver
 * Menggantikan _view (karena underscore diabaikan routing Next.js).
 */
export default function UnifiedProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const decodedUsername = decodeURIComponent(username);
  
  return <ProfileClient username={decodedUsername} />;
}
