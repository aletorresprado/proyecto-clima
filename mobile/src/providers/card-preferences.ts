export const cardOptions = [
  { id: 'wind', label: 'Viento' },
  { id: 'uv', label: 'Índice UV' },
  { id: 'precipitation', label: 'Precipitación' },
  { id: 'visibility', label: 'Visibilidad' },
  { id: 'pressure', label: 'Presión' },
] as const;

export type CardId = typeof cardOptions[number]['id'];
export type CardPreferences = Record<CardId, boolean>;

export function defaultCardPreferences(): CardPreferences {
  return { wind: true, uv: true, precipitation: true, visibility: true, pressure: true };
}

export function validateCardPreferences(input: unknown): CardPreferences {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Preferencias inválidas.');
  const data = input as Record<string, unknown>;
  if (Object.keys(data).length !== cardOptions.length
    || cardOptions.some(({ id }) => !Object.hasOwn(data, id) || typeof data[id] !== 'boolean')) {
    throw new Error('Preferencias inválidas.');
  }
  return { wind: data.wind as boolean, uv: data.uv as boolean, precipitation: data.precipitation as boolean,
    visibility: data.visibility as boolean, pressure: data.pressure as boolean };
}

// Almacenamiento ficticio: cada pantalla crea su instancia y la descarta al salir.
export function createCardPreferencesDemo() {
  const users = new Map<string, CardPreferences>();
  return {
    read(uid: string): CardPreferences { return { ...(users.get(uid) ?? defaultCardPreferences()) }; },
    save(uid: string | null, input: unknown): void {
      if (!uid) throw new Error('Iniciá sesión para guardar preferencias.');
      users.set(uid, validateCardPreferences(input));
    },
  };
}
