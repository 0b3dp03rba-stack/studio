import { Metadata } from 'next';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import GroupClient from '@/app/[username]/g/[groupId]/GroupClient';

/**
 * @fileOverview Jalur Internal untuk Render Koleksi Subdomain.
 */

export async function generateMetadata({ params }: { params: Promise<{ username: string; groupId: string }> }): Promise<Metadata> {
  const { username, groupId } = await params;
  const { firestore } = initializeFirebase();
  
  let groupData: any = null;
  try {
    const userRef = doc(firestore, 'usernames', username.toLowerCase());
    const userSnap = await getDoc(userRef);
    let userId = userSnap.exists() ? userSnap.data().userId : username;
    
    const groupRef = doc(firestore, 'userProfiles', userId, 'linkGroups', groupId);
    const groupSnap = await getDoc(groupRef);
    if (groupSnap.exists()) groupData = groupSnap.data();
  } catch (e) {
    console.error("Metadata fetch error:", e);
  }

  const title = groupData ? `${groupData.title} | @${username} Linku` : 'Collection | Linku';
  return { title, description: `Koleksi tautan di ${groupData?.title || 'Linku'}.` };
}

export default async function SubdomainGroupPage({ params }: { params: Promise<{ username: string; groupId: string }> }) {
  const { username, groupId } = await params;
  return <GroupClient username={username} groupId={groupId} />;
}
