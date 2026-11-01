/** Entrada mínima de un lugar elegido y guardado explícitamente por el usuario. */
export type SavedLocationInput = {
  label: string;
  latitude: number;
  longitude: number;
};

export function validateSavedLocation(value: unknown): SavedLocationInput {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('El lugar no tiene un formato válido.');
  }
  const data = value as Record<string, unknown>;
  const allowed = ['label', 'latitude', 'longitude'];
  if (Object.keys(data).length !== allowed.length || Object.keys(data).some((key) => !allowed.includes(key))) {
    throw new Error('El lugar contiene campos faltantes o no admitidos.');
  }
  if (typeof data.label !== 'string') throw new Error('El nombre del lugar no es válido.');
  const label = data.label.trim();
  if (label.length < 1 || label.length > 160) throw new Error('El nombre debe tener entre 1 y 160 caracteres.');
  if (typeof data.latitude !== 'number' || !Number.isFinite(data.latitude) || data.latitude < -90 || data.latitude > 90) {
    throw new Error('La latitud no es válida.');
  }
  if (typeof data.longitude !== 'number' || !Number.isFinite(data.longitude) || data.longitude < -180 || data.longitude > 180) {
    throw new Error('La longitud no es válida.');
  }
  return { label, latitude: data.latitude, longitude: data.longitude };
}
