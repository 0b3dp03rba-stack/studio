import { Metadata } from 'next';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import ProfileClient from '@/app/[username]/ProfileClient';

/**
 * @fileOverview Jalur Internal untuk Render Profil Subdomain.
 * Middleware memetakan user.linku.biz.id ke sini.
 */

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const { firestore } = initializeFirebase();
  
  let profileData: any = null;
  
  try {
    const userRef = doc(firestore, 'usernames', username.toLowerCase());
    const userSnap = await getDoc(userRef);
    let userId = username;
    if (userSnap.exists()) userId = userSnap.data().userId;
    
    const profileRef = doc(firestore, 'userProfiles', userId);
    const profileSnap = await getDoc(profileRef);
    if (profileSnap.exists()) profileData = profileSnap.data();
  } catch (e) {
    console.error("Metadata fetch error:", e);
  }

  const title = profileData ? `${profileData.displayName || profileData.username} | Linku` : 'Linku Profile';
  const description = profileData?.bio || `Lihat profil @${username} di Linku - Premium Link Hub.`;
  const image = profileData?.avatarUrl || 'https://picsum.photos/seed/linku-logo/1200/630';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 630 }],
      type: 'profile',
      username: username,
    },
  };
}

export default async function SubdomainProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <ProfileClient username={username} />;
}
