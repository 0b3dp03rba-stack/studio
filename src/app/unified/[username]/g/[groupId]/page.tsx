
"use client";

import { use } from 'react';
import GroupClient from '@/app/[username]/g/[groupId]/GroupClient';

/**
 * @fileOverview Unified Public Group Viewer
 * Menangani tampilan koleksi link untuk subdomain dan domain kustom.
 */
export default function UnifiedGroupPage({ params }: { params: Promise<{ username: string; groupId: string }> }) {
  const { username, groupId } = use(params);
  const decodedUsername = decodeURIComponent(username);
  
  return <GroupClient username={decodedUsername} groupId={groupId} />;
}
