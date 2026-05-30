"use client";

import { use } from 'react';
import GroupClient from '@/app/[username]/g/[groupId]/GroupClient';

/**
 * @fileOverview Unified Public Group Viewer
 * Melayani rute internal hasil rewrite dari Middleware.
 */
export default function UnifiedGroupPage({ params }: { params: Promise<{ slug: string; groupId: string }> }) {
  const { slug, groupId } = use(params);
  const decodedSlug = decodeURIComponent(slug);
  return <GroupClient username={decodedSlug} groupId={groupId} />;
}
