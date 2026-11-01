import { validateSavedLocation, type SavedLocationInput } from './saved-locations.ts';

export type SavedPlace = SavedLocationInput & { id: string };
export type PlacesPage = { places: SavedPlace[]; nextCursor: string | null };
export type PlacesTransport = {
  list(uid: string, cursor?: string): Promise<PlacesPage>;
  save(uid: string, place: SavedLocationInput): Promise<void>;
  remove(uid: string, id: string): Promise<void>;
};

function identifier(value: string) {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(value)) throw new Error('Identificador de lugar inválido.');
}

// Esta comprobación evita respuestas tardías en el cliente; las reglas autorizan en servidor.
export function createSavedLocationsStore(transport: PlacesTransport, currentUid: () => string | null): PlacesTransport {
  function ensure(uid: string) {
    if (!uid || uid.includes('/') || uid !== currentUid()) {
      throw Object.assign(new Error('La sesión cambió. Volvé a cargar tus lugares.'), { code: 'places/session-changed' });
    }
  }
  return {
    async list(uid, cursor) {
      ensure(uid);
      if (cursor !== undefined) identifier(cursor);
      const page = await transport.list(uid, cursor);
      ensure(uid);
      if (page.places.length > 20) throw new Error('Lista de lugares inválida.');
      if (page.nextCursor !== null) identifier(page.nextCursor);
      return { places: page.places.map((place) => {
        identifier(place.id);
        return { id: place.id, ...validateSavedLocation({ label: place.label, latitude: place.latitude, longitude: place.longitude }) };
      }), nextCursor: page.nextCursor };
    },
    async save(uid, value) {
      ensure(uid);
      const place = validateSavedLocation(value);
      await transport.save(uid, place);
      ensure(uid);
    },
    async remove(uid, id) {
      ensure(uid); identifier(id);
      await transport.remove(uid, id);
      ensure(uid);
    },
  };
}

export function savedPlacesMessage(error: unknown): string {
  const code = error !== null && typeof error === 'object' && 'code' in error ? error.code : undefined;
  if (code === 'places/session-changed') return 'La sesión cambió. Volvé a abrir tus lugares.';
  if (code === 'permission-denied') return 'No pudimos acceder a tus lugares. Revisá la sesión y reintentá.';
  return 'No pudimos completar la operación. Revisá la conexión y reintentá.';
}
