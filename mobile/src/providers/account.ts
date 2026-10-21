import { GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signOut, type User } from 'firebase/auth';
import { restoreFirebaseSession } from './firebase-auth';
import { clearGoogleSession, requestGoogleIdToken } from './google-account';

export type Account = Pick<User, 'uid' | 'displayName' | 'email'>;
const accountSummary = (user: User | null): Account | null => user
  ? { uid: user.uid, displayName: user.displayName, email: user.email } : null;

export async function observeAccount(listener: (account: Account | null) => void): Promise<() => void> {
  const auth = await restoreFirebaseSession();
  return onAuthStateChanged(auth, (user) => listener(accountSummary(user)));
}

export async function enterGoogleAccount(): Promise<'success' | 'cancelled'> {
  const auth = await restoreFirebaseSession();
  const token = await requestGoogleIdToken();
  if (token === null) return 'cancelled';
  await signInWithCredential(auth, GoogleAuthProvider.credential(token));
  return 'success';
}

export async function leaveAccount(): Promise<'success' | 'google-cleanup-failed'> {
  const auth = await restoreFirebaseSession();
  // Cerrar Firebase primero: un fallo del SDK Google no debe dejar la app autenticada.
  await signOut(auth);
  try {
    await clearGoogleSession();
    return 'success';
  } catch {
    return 'google-cleanup-failed';
  }
}
