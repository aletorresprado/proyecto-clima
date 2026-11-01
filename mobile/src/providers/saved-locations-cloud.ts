import { collection, deleteDoc, doc, documentId, getDocs, getFirestore, limit, orderBy, query,
  serverTimestamp, setDoc, startAfter, type QueryConstraint } from 'firebase/firestore/lite';
import { getFirebaseClient } from './firebase';
import { getFirebaseSessionAuth } from './firebase-auth';
import { createSavedLocationsStore, type PlacesTransport } from './saved-locations-store';
import { validateSavedLocation } from './saved-locations';

export function createCloudPlacesStore(): PlacesTransport {
  // Activar solo después de autorizar y verificar base/región/reglas desplegadas.
  if (process.env.EXPO_PUBLIC_SAVED_LOCATIONS_ENABLED !== '1') throw new Error('Lugares en nube aún no habilitados.');
  const places = (uid: string) => collection(getFirestore(getFirebaseClient()), 'users', uid, 'locations');
  return createSavedLocationsStore({
    async list(uid, cursor) {
      const constraints: QueryConstraint[] = [orderBy(documentId()), limit(20)];
      if (cursor) constraints.push(startAfter(cursor));
      const snapshot = await getDocs(query(places(uid), ...constraints));
      return { places: snapshot.docs.map((entry) => {
        const data = entry.data();
        return { id: entry.id, ...validateSavedLocation({ label: data.label, latitude: data.latitude, longitude: data.longitude }) };
      }), nextCursor: snapshot.size === 20 ? snapshot.docs[snapshot.size - 1].id : null };
    },
    async save(uid, place) {
      await setDoc(doc(places(uid)), { ...place, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    },
    async remove(uid, id) { await deleteDoc(doc(places(uid), id)); },
  }, () => getFirebaseSessionAuth().currentUser?.uid ?? null);
}
