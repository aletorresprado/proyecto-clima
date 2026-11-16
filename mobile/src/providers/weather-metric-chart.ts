import type { CurrentWeather } from './current-weather.ts';

export type WeatherMetric = 'wind' | 'probability' | 'amount';
export type MetricPoint = { time: number; value: number | null };

export function metricPoints(weather: Pick<CurrentWeather, 'hourly' | 'precipitationHourly'>, metric: WeatherMetric, now: number): MetricPoint[] {
  if (!Number.isFinite(now)) return [];
  if (metric === 'wind') return (weather.hourly ?? [])
    .filter((h) => h.time > now && h.time <= now + 86400000)
    .map((h) => ({ time: h.time, value: h.windKmh }));
  return (weather.precipitationHourly ?? [])
    .filter((h) => h.time - 3600000 >= now && h.time <= now + 86400000)
    .map((h) => ({ time: h.time, value: metric === 'probability' ? h.probability : h.amountMm }));
}

export function buildMetricChart(input: readonly MetricPoint[], metric: WeatherMetric) {
  if (!input.length || input.length > 24 || input.some((p, i) => !Number.isFinite(p.time) || p.time <= 0
    || (i > 0 && p.time <= input[i - 1].time))) return null;
  const normalized = input.map((p) => ({ ...p, value: typeof p.value === 'number' && Number.isFinite(p.value)
    && p.value >= 0 && (metric !== 'probability' || p.value <= 100) ? p.value : null }));
  const values = normalized.flatMap((p) => p.value === null ? [] : [p.value]);
  if (!values.length) return null;
  const maximum = Math.max(...values);
  const upper = metric === 'probability' ? 100 : Math.max(1, Math.ceil(maximum * 1.15));
  const first = input[0].time, last = input[input.length - 1].time;
  const width = Math.max(340, 64 + Math.max(1, (last - first) / 3600000) * 48);
  if (!Number.isFinite(upper) || !Number.isFinite(width) || width > 1300) return null;
  const bottom = 180, top = 22, height = 224;
  const points = normalized.map((p) => ({ ...p,
    x: first === last ? width / 2 : 44 + (p.time - first) / (last - first) * (width - 68),
    y: p.value === null ? null : bottom - p.value / upper * (bottom - top) }));
  return { width, height, bottom, top, maximum, upper, points,
    missing: points.filter((p) => p.value === null).length,
    ticks: [upper, upper / 2, 0].map((value) => ({ value, y: bottom - value / upper * (bottom - top) })) };
}
