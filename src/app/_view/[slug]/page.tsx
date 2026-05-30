"use client";

import { use } from 'react';
import ProfileClient from '@/app/[username]/ProfileClient';

/**
 * @fileOverview Unified Public Profile Viewer
 * Melayani rute internal hasil rewrite dari Middleware.
 * slug format: "u:username" atau "d:domain.com"
 */
export default function UnifiedProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  // Decode slug jika mengandung karakter khusus domain
  const decodedSlug = decodeURIComponent(slug);
  return <ProfileClient username={decodedSlug} />;
}
