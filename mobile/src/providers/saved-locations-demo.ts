import { createSavedLocationsStore, type PlacesTransport, type SavedPlace } from './saved-locations-store.ts';

// Instancia independiente por prueba/pantalla: sin disco, Auth, GPS o llamadas a red.
export function createDemoPlacesStore(currentUid: () => string | null, fail: () => boolean = () => false): PlacesTransport {
  const records = new Map<string, SavedPlace[]>();
  let sequence = 0;
  function check() { if (fail()) throw new Error('Fallo ficticio de prueba.'); }
  return createSavedLocationsStore({
    async list(uid, cursor) {
      check();
      const all = [...(records.get(uid) ?? [])].sort((a, b) => a.id.localeCompare(b.id));
      const next = all.filter((place) => !cursor || place.id > cursor);
      const page = next.slice(0, 20);
      return { places: page.map((place) => ({ ...place })), nextCursor: next.length > 20 ? page[page.length - 1].id : null };
    },
    async save(uid, place) {
      check();
      const id = `ficticio-${String(++sequence).padStart(6, '0')}`;
      records.set(uid, [...(records.get(uid) ?? []), { ...place, id }]);
    },
    async remove(uid, id) { check(); records.set(uid, (records.get(uid) ?? []).filter((place) => place.id !== id)); },
  }, currentUid);
}
