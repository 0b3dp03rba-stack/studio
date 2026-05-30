"use client";

import { use } from 'react';
import GroupClient from '@/app/[username]/g/[groupId]/GroupClient';

/**
 * @fileOverview Unified Public Group Viewer
 */
export default function UnifiedGroupPage({ params }: { params: Promise<{ slug: string; groupId: string }> }) {
  const { slug, groupId } = use(params);
  return <GroupClient username={slug} groupId={groupId} />;
}
