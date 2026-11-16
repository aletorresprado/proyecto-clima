import { weatherCode } from './weather-condition.ts';

export type ForecastDay = { date: string; weatherCode: number | null; minimumC: number | null; maximumC: number | null; probabilityMax: number | null };
const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const number = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : null;
export function localCalendarDate(time: number, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(time);
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function parseDailyForecast(payload: unknown, now: number): ForecastDay[] | null {
  if (!record(payload) || !record(payload.daily) || !record(payload.daily_units) || !Number.isFinite(now)) return null;
  const offset = number(payload.utc_offset_seconds);
  if (offset === null || !Number.isInteger(offset) || Math.abs(offset) > 64800 || typeof payload.timezone !== 'string' || payload.daily_units.time !== 'unixtime') return null;
  const daily = payload.daily, units = payload.daily_units;
  let today: string;
  try {
    today = localCalendarDate(now, payload.timezone);
  } catch { return null; }
  const time = payload.daily.time;
  if (!Array.isArray(time) || time.length > 16) return null;
  const values = (field: string, unit: string) => {
    const series = daily[field];
    return units[field] === unit && Array.isArray(series) && series.length === time.length ? series : null;
  };
  const maxima = values('temperature_2m_max', '°C'), minima = values('temperature_2m_min', '°C');
  const codes = values('weather_code', 'wmo code'), probabilities = values('precipitation_probability_max', '%');
  const todayOrdinal = Date.parse(`${today}T00:00:00Z`);
  let previous = -Infinity;
  const days: ForecastDay[] = [];
  for (let i = 0; i < time.length; i++) {
    const seconds = number(time[i]);
    if (seconds === null || seconds <= 0 || !Number.isInteger(seconds)) return null;
    // Open-Meteo usa su offset fijo en los límites diarios. La fecha es de calendario,
    // no se formatea el timestamp con otro offset al cruzar horario de verano.
    const adjusted = new Date((seconds + offset) * 1000);
    if (!Number.isFinite(adjusted.getTime()) || adjusted.getUTCHours() !== 0 || adjusted.getUTCMinutes() !== 0 || adjusted.getUTCSeconds() !== 0) return null;
    const ordinal = adjusted.getTime();
    if (ordinal <= previous || (previous !== -Infinity && ordinal - previous !== 86400000)) return null;
    previous = ordinal;
    if (ordinal < todayOrdinal || ordinal >= todayOrdinal + 7 * 86400000) continue;
    let maximumC = maxima ? number(maxima[i]) : null, minimumC = minima ? number(minima[i]) : null;
    if (maximumC !== null && minimumC !== null && maximumC < minimumC) { maximumC = null; minimumC = null; }
    const probability = probabilities ? number(probabilities[i]) : null;
    days.push({ date: adjusted.toISOString().slice(0, 10), weatherCode: codes ? weatherCode(codes[i]) : null,
      minimumC, maximumC, probabilityMax: probability !== null && probability >= 0 && probability <= 100 ? probability : null });
  }
  return days;
}
