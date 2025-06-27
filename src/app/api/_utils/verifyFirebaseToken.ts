import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      client_email: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
      private_key: process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    } as any),
  });
}

export async function verifyFirebaseToken(token: string) {
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    return decodedToken;
  } catch {
    return null;
  }
} 