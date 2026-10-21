import { FirebaseError } from 'firebase/app';
import { browserLocalPersistence, getAuth, initializeAuth, type Auth } from 'firebase/auth';

import { getFirebaseClient } from './firebase';

let auth: Auth | undefined;

// Variante web. Metro elige firebase-auth.native.ts en Android/iOS.
export function getFirebaseSessionAuth(): Auth {
  if (auth) return auth;
  const app = getFirebaseClient();
  try {
    auth = initializeAuth(app, { persistence: browserLocalPersistence });
  } catch (error) {
    if (!(error instanceof FirebaseError) || error.code !== 'auth/already-initialized') throw error;
    auth = getAuth(app);
  }
  return auth;
}

export async function restoreFirebaseSession(): Promise<Auth> {
  const session = getFirebaseSessionAuth();
  await session.authStateReady();
  return session;
}
