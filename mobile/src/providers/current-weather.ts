export type WeatherLocation = { label: string; latitude: number; longitude: number; timezone?: string | null };
export type ForecastHour = { time: number; temperatureC: number | null; windKmh: number | null; seaLevelPressureHpa: number | null };
export type UvHour = { time: number; uvIndex: number | null };
export type PrecipitationHour = { time: number; probability: number | null; amountMm: number | null };
export type CurrentWeather = {
  temperatureC: number | null;
  windKmh: number | null;
  seaLevelPressureHpa: number | null;
  validAt: number;
  fetchedAt: number;
  timezone: string;
  hourly: ForecastHour[] | null;
  uvHourly: UvHour[] | null;
  precipitationHourly: PrecipitationHour[] | null;
};
// Criterio provisional de presentación; no es un umbral de riesgo meteorológico.
export const WEATHER_MAX_AGE_MS = 60 * 60 * 1000;
export function isWeatherFresh(weather: CurrentWeather, now = Date.now()) {
  const age = now - weather.validAt;
  return age >= -300000 && age <= WEATHER_MAX_AGE_MS;
}
const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const numeric = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : null;
export function parsePrecipitationForecast(payload: unknown, now: number): PrecipitationHour[] | null {
  if (!Number.isFinite(now) || !record(payload) || !record(payload.hourly) || !record(payload.hourly_units)) return null;
  const units = payload.hourly_units;
  if (units.time !== 'unixtime' || units.precipitation_probability !== '%') return null;
  const { time, precipitation_probability: probabilities, precipitation: amounts } = payload.hourly;
  if (!Array.isArray(time) || !Array.isArray(probabilities) || time.length !== probabilities.length) return null;
  const validAmounts = units.precipitation === 'mm' && Array.isArray(amounts) && amounts.length === time.length;
  const hours: PrecipitationHour[] = [];
  for (let i = 0; i < time.length; i++) {
    const seconds = numeric(time[i]);
    if (seconds === null || seconds <= 0 || seconds * 1000 > 8640000000000000 || (i > 0 && seconds - time[i - 1] !== 3600)) return null;
    const end = seconds * 1000;
    if (end - 3600000 < now || end > now + 24 * 3600000) continue;
    const probability = numeric(probabilities[i]);
    const amount = validAmounts ? numeric((amounts as unknown[])[i]) : null;
    hours.push({ time: end, probability: probability !== null && probability >= 0 && probability <= 100 ? probability : null, amountMm: amount !== null && amount >= 0 ? amount : null });
  }
  return hours;
}
export function parseUvForecast(payload: unknown, now: number): UvHour[] | null {
  if (!Number.isFinite(now) || !record(payload) || !record(payload.hourly) || !record(payload.hourly_units)) return null;
  if (payload.hourly_units.time !== 'unixtime' || payload.hourly_units.uv_index !== '') return null;
  const { time, uv_index: values } = payload.hourly;
  if (!Array.isArray(time) || !Array.isArray(values) || time.length !== values.length) return null;
  const hours: UvHour[] = [];
  for (let index = 0; index < time.length; index++) {
    const seconds = numeric(time[index]);
    if (seconds === null || seconds <= 0 || seconds * 1000 > 8640000000000000 || (index > 0 && seconds - time[index - 1] !== 3600)) return null;
    const timestamp = seconds * 1000;
    if (timestamp <= now || timestamp > now + 24 * 3600000) continue;
    const uv = numeric(values[index]);
    hours.push({ time: timestamp, uvIndex: uv !== null && uv >= 0 ? uv : null });
  }
  return hours;
}
export function parseHourlyForecast(payload: unknown, now: number): ForecastHour[] | null {
  if (!record(payload) || !record(payload.hourly) || !record(payload.hourly_units)) return null;
  const units = payload.hourly_units;
  if (units.time !== 'unixtime' || units.temperature_2m !== '°C' || units.wind_speed_10m !== 'km/h' || units.pressure_msl !== 'hPa') return null;
  const { time, temperature_2m: temperatures, wind_speed_10m: winds, pressure_msl: pressures } = payload.hourly;
  if (!Array.isArray(time) || !Array.isArray(temperatures) || !Array.isArray(winds) || !Array.isArray(pressures) ||
      time.length !== temperatures.length || time.length !== winds.length || time.length !== pressures.length) return null;
  const hours: ForecastHour[] = [];
  let previous: number | undefined;
  for (let index = 0; index < time.length; index++) {
    const seconds = numeric(time[index]);
    if (seconds === null || seconds <= 0 || seconds * 1000 > 8640000000000000 ||
        (previous !== undefined && seconds - previous !== 3600)) return null;
    previous = seconds;
    const timestamp = seconds * 1000;
    if (timestamp <= now || timestamp > now + 24 * 3600000) continue;
    const wind = numeric(winds[index]);
    const pressure = numeric(pressures[index]);
    hours.push({ time: timestamp, temperatureC: numeric(temperatures[index]),
      windKmh: wind !== null && wind >= 0 ? wind : null,
      seaLevelPressureHpa: pressure !== null && pressure > 0 ? pressure : null });
  }
  return hours;
}
export function isForecastFresh(weather: CurrentWeather, now = Date.now()) {
  const age = now - weather.fetchedAt;
  return age >= 0 && age <= WEATHER_MAX_AGE_MS;
}
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
    hourly: parseHourlyForecast(payload, fetchedAt),
    uvHourly: parseUvForecast(payload, fetchedAt),
    precipitationHourly: parsePrecipitationForecast(payload, fetchedAt),
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
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,wind_speed_10m,pressure_msl&hourly=temperature_2m,wind_speed_10m,pressure_msl,uv_index,precipitation_probability,precipitation&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm&timezone=auto&timeformat=unixtime&forecast_hours=25`;
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
