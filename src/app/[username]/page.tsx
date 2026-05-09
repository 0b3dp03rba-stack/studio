
import { Metadata } from 'next';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import ProfileClient from './ProfileClient';

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const { firestore } = initializeFirebase();
  
  let profileData: any = null;
  
  try {
    // Resolve user ID
    const userRef = doc(firestore, 'usernames', username.toLowerCase());
    const userSnap = await getDoc(userRef);
    
    let userId = username;
    if (userSnap.exists()) {
      userId = userSnap.data().userId;
    }
    
    const profileRef = doc(firestore, 'userProfiles', userId);
    const profileSnap = await getDoc(profileRef);
    
    if (profileSnap.exists()) {
      profileData = profileSnap.data();
    }
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
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: profileData?.displayName || username,
        },
      ],
      type: 'profile',
      username: username,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <ProfileClient username={username} />;
}
