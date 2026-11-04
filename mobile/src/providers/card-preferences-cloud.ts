import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore/lite';
import { getFirebaseClient } from './firebase';
import { getFirebaseSessionAuth } from './firebase-auth';
import { createPreferencesStore } from './card-preferences-store';
import { validateCardPreferences } from './card-preferences';

export function createCloudPreferencesStore() {
  // No activar hasta publicar las reglas probadas y autorizar el uso real.
  if (process.env.EXPO_PUBLIC_CARD_PREFERENCES_ENABLED !== '1') throw new Error('Preferencias en nube aún no habilitadas.');
  const target = (uid: string) => doc(getFirestore(getFirebaseClient()), 'users', uid, 'preferences', 'main');
  return createPreferencesStore({
    async read(uid) {
      const snapshot = await getDoc(target(uid));
      if (!snapshot.exists()) return null;
      const { updatedAt, ...preferences } = snapshot.data();
      if (!updatedAt || typeof updatedAt.toMillis !== 'function' || !Number.isFinite(updatedAt.toMillis())) {
        throw new Error('Preferencias inválidas.');
      }
      return validateCardPreferences(preferences);
    },
    async save(uid, preferences) {
      await setDoc(target(uid), { ...preferences, updatedAt: serverTimestamp() });
    },
  }, () => getFirebaseSessionAuth().currentUser?.uid ?? null);
}
