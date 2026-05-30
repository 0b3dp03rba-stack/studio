"use client";

import { use } from 'react';
import GroupClient from '@/app/[username]/g/[groupId]/GroupClient';

/**
 * @fileOverview Rute Utama Koleksi via Subdomain.
 */
export default function SubdomainGroupPage({ params }: { params: Promise<{ username: string; groupId: string }> }) {
  const { username, groupId } = use(params);
  return <GroupClient username={username} groupId={groupId} />;
}
