export type SearchPlace = {
  id: number;
  label: string;
  latitude: number;
  longitude: number;
  timezone: string | null;
};

const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);

export function parseLocationResults(payload: unknown): SearchPlace[] {
  if (!record(payload) || payload.error === true) throw new Error('El proveedor no pudo responder la búsqueda.');
  if (payload.results === undefined) return [];
  if (!Array.isArray(payload.results)) throw new Error('La respuesta de localidades no es válida.');
  const places: SearchPlace[] = [];
  for (const item of payload.results) {
    if (!record(item)) continue;
    const { id, latitude, longitude } = item;
    const name = text(item.name);
    if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0 || !name ||
        typeof latitude !== 'number' || !Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
        typeof longitude !== 'number' || !Number.isFinite(longitude) || Math.abs(longitude) > 180) continue;
    if (places.some((place) => place.id === id)) continue;
    const parts = [name, text(item.admin1), text(item.country) || text(item.country_code)].filter(Boolean);
    const label = parts.filter((part, index) => parts.findIndex((other) => other.toLowerCase() === part.toLowerCase()) === index).join(', ');
    let timezone: string | null = text(item.timezone) || null;
    if (timezone) {
      try { new Intl.DateTimeFormat('es', { timeZone: timezone }); } catch { timezone = null; }
    }
    places.push({ id, label, latitude, longitude, timezone });
    if (places.length === 10) break;
  }
  if (payload.results.length > 0 && places.length === 0) throw new Error('El proveedor devolvió localidades sin datos válidos. Reintentá.');
  return places;
}

export async function searchLocations(query: string, signal: AbortSignal): Promise<SearchPlace[]> {
  const name = query.trim();
  if (name.length < 3 || name.length > 100) throw new Error('Escribí entre 3 y 100 caracteres para buscar.');
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal.addEventListener('abort', cancel, { once: true });
  if (signal.aborted) controller.abort();
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 10000);
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=10&language=es&format=json`;
    let response: Response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } catch (error) {
      // Android puede rechazar fetch con Error nativo, no solo TypeError.
      if (controller.signal.aborted) throw error;
      throw new Error('No pudimos conectar. Revisá tu conexión y reintentá.');
    }
    if (!response.ok) throw new Error(response.status === 429
      ? 'Se alcanzó el límite de consultas. Esperá antes de reintentar.'
      : 'El proveedor no está disponible. Reintentá más tarde.');
    const payload: unknown = await response.json();
    return parseLocationResults(payload);
  } catch (error) {
    if (signal.aborted) throw error;
    if (timedOut) throw new Error('La búsqueda tardó demasiado. Revisá tu conexión y reintentá.');
    if (error instanceof TypeError || error instanceof SyntaxError) throw new Error('No pudimos consultar localidades. Revisá tu conexión y reintentá.');
    throw error;
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', cancel);
  }
}
