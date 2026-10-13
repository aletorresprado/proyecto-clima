export type WeatherLocation = { label: string; latitude: number; longitude: number; timezone?: string | null };
export type CurrentWeather = {
  temperatureC: number | null;
  windKmh: number | null;
  seaLevelPressureHpa: number | null;
  validAt: number;
  fetchedAt: number;
  timezone: string;
};
// Criterio provisional de presentación; no es un umbral de riesgo meteorológico.
export const WEATHER_MAX_AGE_MS = 60 * 60 * 1000;
export function isWeatherFresh(weather: CurrentWeather, now = Date.now()) {
  const age = now - weather.validAt;
  return age >= -300000 && age <= WEATHER_MAX_AGE_MS;
}
const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const numeric = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : null;
export function parseCurrentWeather(payload: unknown, fetchedAt = Date.now()): CurrentWeather {
  if (!record(payload) || payload.error === true || !record(payload.current) || !record(payload.current_units)) throw new Error('El proveedor devolvió información meteorológica insuficiente.');
  const units = payload.current_units;
  if (units.temperature_2m !== '°C' || units.wind_speed_10m !== 'km/h' || units.pressure_msl !== 'hPa' || units.time !== 'unixtime') throw new Error('Las unidades recibidas no coinciden con las esperadas.');
  const time = numeric(payload.current.time);
  if (time === null || time <= 0 || !Number.isFinite(time * 1000) || time * 1000 > 8640000000000000 || typeof payload.timezone !== 'string') throw new Error('No pudimos verificar la hora de los datos.');
  try { new Intl.DateTimeFormat('es', { timeZone: payload.timezone }); }
  catch { throw new Error('La zona horaria recibida no es válida.'); }
  const wind = numeric(payload.current.wind_speed_10m);
  const pressure = numeric(payload.current.pressure_msl);
  return {
    temperatureC: numeric(payload.current.temperature_2m),
    windKmh: wind !== null && wind >= 0 ? wind : null,
    seaLevelPressureHpa: pressure !== null && pressure > 0 ? pressure : null,
    validAt: time * 1000, fetchedAt, timezone: payload.timezone,
  };
}
export async function fetchCurrentWeather(location: WeatherLocation, signal: AbortSignal): Promise<CurrentWeather> {
  if (!Number.isFinite(location.latitude) || Math.abs(location.latitude) > 90 || !Number.isFinite(location.longitude) || Math.abs(location.longitude) > 180) throw new Error('Elegí una ubicación válida antes de consultar.');
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal.addEventListener('abort', cancel, { once: true });
  if (signal.aborted) controller.abort();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 10000);
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,wind_speed_10m,pressure_msl&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto&timeformat=unixtime&forecast_days=1`;
    let response: Response;
    try { response = await fetch(url, { signal: controller.signal }); }
    catch (error) {
      if (controller.signal.aborted) throw error;
      throw new Error('No pudimos conectar. Revisá tu conexión y reintentá.');
    }
    if (!response.ok) throw new Error(response.status === 429 ? 'Se alcanzó el límite de consultas. Esperá antes de reintentar.' : 'El proveedor meteorológico no está disponible. Reintentá más tarde.');
    const payload: unknown = await response.json();
    return parseCurrentWeather(payload);
  } catch (error) {
    if (signal.aborted) throw error;
    if (timedOut) throw new Error('La consulta tardó demasiado. Revisá tu conexión y reintentá.');
    if (error instanceof SyntaxError || error instanceof TypeError) throw new Error('No pudimos leer los datos meteorológicos. Reintentá.');
    throw error;
  } finally { clearTimeout(timer); signal.removeEventListener('abort', cancel); }
}
