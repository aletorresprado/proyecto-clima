export type Epicenter = { latitude: number; longitude: number };
export type Earthquake = { id: string; place: string; time: number; magnitude: number | null; depthKm: number | null; distanceKm: number };
export const EARTHQUAKE_WINDOW_MS = 24 * 3600000;
const record = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export function distanceKm(a: Epicenter, b: Epicenter) {
  const rad = Math.PI / 180;
  const h = Math.sin((b.latitude - a.latitude) * rad / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin((b.longitude - a.longitude) * rad / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}
export function earthquakeUrl(center: Epicenter, now: number) {
  if (!finite(center.latitude) || Math.abs(center.latitude) > 90 || !finite(center.longitude) || Math.abs(center.longitude) > 180 || !finite(now)) throw new Error('Ubicación u hora inválida.');
  return `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${center.latitude}&longitude=${center.longitude}&maxradius=1.8&starttime=${encodeURIComponent(new Date(now - EARTHQUAKE_WINDOW_MS).toISOString())}&endtime=${encodeURIComponent(new Date(now).toISOString())}&orderby=time&eventtype=earthquake&limit=1000`;
}
export function parseEarthquakes(payload: unknown, center: Epicenter, now: number): Earthquake[] {
  if (!record(payload) || payload.type !== 'FeatureCollection' || !Array.isArray(payload.features)) throw new Error('USGS devolvió información insuficiente.');
  const events: Earthquake[] = [];
  const ids = new Set<string>();
  for (const feature of payload.features) {
    if (!record(feature) || feature.type !== 'Feature' || typeof feature.id !== 'string' || !feature.id.trim() || !record(feature.properties) || !record(feature.geometry)) throw new Error('No pudimos validar los eventos de USGS.');
    const p = feature.properties;
    const c = feature.geometry.coordinates;
    if (feature.geometry.type !== 'Point' || !Array.isArray(c) || !finite(c[0]) || Math.abs(c[0]) > 180 || !finite(c[1]) || Math.abs(c[1]) > 90 || !finite(p.time) || p.time <= 0) throw new Error('USGS devolvió coordenadas u horarios inválidos.');
    if (p.type !== 'earthquake' || p.time > now || p.time < now - EARTHQUAKE_WINDOW_MS || ids.has(feature.id)) continue;
    const distance = distanceKm(center, { latitude: c[1], longitude: c[0] });
    if (distance > 6371 * Math.PI / 180 * 1.8 + 0.1) continue;
    ids.add(feature.id);
    events.push({ id: feature.id, time: p.time, place: typeof p.place === 'string' && p.place.trim() ? p.place : 'Lugar no informado', magnitude: finite(p.mag) ? p.mag : null, depthKm: finite(c[2]) ? c[2] : null, distanceKm: distance });
  }
  // No presentar una respuesta truncada como catálogo completo.
  if (payload.features.length >= 1000) throw new Error('Hay demasiados eventos para esta consulta. Información incompleta.');
  return events.sort((a, b) => b.time - a.time);
}
export function unseenEarthquakes(events: Earthquake[], seen: ReadonlySet<string>) {
  return events.filter((event) => !seen.has(event.id));
}
export async function fetchEarthquakes(center: Epicenter, signal: AbortSignal, now = Date.now()) {
  const url = earthquakeUrl(center, now);
  let response: Response;
  try { response = await fetch(url, { signal }); }
  catch (error) { if (signal.aborted) throw error; throw new Error('No pudimos conectar con USGS. Revisá tu conexión; reintentaremos en el próximo ciclo.'); }
  if (response.status === 204) return [];
  if (!response.ok) throw new Error(response.status === 429 ? 'USGS limitó las consultas. Esperá al próximo ciclo.' : 'USGS no está disponible. Información insuficiente.');
  return parseEarthquakes(await response.json(), center, now);
}
