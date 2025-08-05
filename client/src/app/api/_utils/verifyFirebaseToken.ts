import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

console.log('Firebase Admin initialization - checking environment variables:');
console.log('Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'Set' : 'Missing');
console.log('Client Email:', process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL ? 'Set' : 'Missing');
console.log('Private Key:', process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY ? 'Set' : 'Missing');

if (!getApps().length) {
  try {
    const privateKey = process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    console.log('Initializing Firebase Admin with private key length:', privateKey?.length || 0);
    
    initializeApp({
      credential: cert({
        project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        client_email: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
        private_key: privateKey,
      } as any),
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
}

export async function verifyFirebaseToken(token: string) {
  try {
    console.log('Verifying token:', token.substring(0, 20) + '...');
    const decodedToken = await getAuth().verifyIdToken(token);
    console.log('Token verified successfully for user:', decodedToken.uid);
    return decodedToken;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
} 