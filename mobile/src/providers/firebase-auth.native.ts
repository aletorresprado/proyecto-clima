import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseError } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';

import { getFirebaseClient } from './firebase';

let auth: Auth | undefined;

// Solo llamar desde la función de cuenta; el clima no necesita inicializar Auth.
export function getFirebaseSessionAuth(): Auth {
  if (auth) return auth;
  const app = getFirebaseClient();
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    // Fast Refresh puede conservar la instancia de Firebase al recargar este módulo.
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
