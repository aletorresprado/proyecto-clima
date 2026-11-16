export type TemperaturePoint = { time: number; temperatureC: number | null };

// Preparación visual pura: no modifica pronósticos ni evalúa riesgos.
export function buildTemperatureChart(hours: readonly TemperaturePoint[]) {
  if (!hours.length || hours.length > 24 || hours.some((h, i) => !Number.isFinite(h.time)
    || h.time <= 0 || (i > 0 && h.time <= hours[i - 1].time))) return null;
  const valid = hours.filter((h) => typeof h.temperatureC === 'number' && Number.isFinite(h.temperatureC));
  if (!valid.length) return null;
  const values = valid.map((h) => h.temperatureC as number);
  const minimum = Math.min(...values), maximum = Math.max(...values);
  const padding = Math.max(1, (maximum - minimum) * 0.15);
  const lower = Math.floor(minimum - padding), upper = Math.ceil(maximum + padding);
  if (!Number.isFinite(upper - lower) || upper <= lower) return null;
  const first = hours[0].time, last = hours[hours.length - 1].time;
  const width = Math.max(340, 64 + Math.max(1, (last - first) / 3600000) * 48);
  if (!Number.isFinite(width) || width > 1300) return null;
  const height = 224, top = 22, bottom = 180;
  const points = hours.map((h) => {
    const value = typeof h.temperatureC === 'number' && Number.isFinite(h.temperatureC) ? h.temperatureC : null;
    return { time: h.time, value,
      x: last === first ? width / 2 : 44 + (h.time - first) / (last - first) * (width - 68),
      y: value === null ? null : bottom - (value - lower) / (upper - lower) * (bottom - top) };
  });
  const segments: Array<Array<{ x: number; y: number }>> = [];
  let current: Array<{ x: number; y: number }> = [];
  points.forEach((point, i) => {
    if (point.y === null || (i > 0 && point.time - points[i - 1].time !== 3600000)) {
      if (current.length) segments.push(current);
      current = [];
    }
    if (point.y !== null) current.push({ x: point.x, y: point.y });
  });
  if (current.length) segments.push(current);
  return { width, height, top, bottom, points, segments, minimum, maximum,
    ticks: [upper, (lower + upper) / 2, lower].map((value) => ({ value, y: bottom - (value - lower) / (upper - lower) * (bottom - top) })),
    missing: points.filter((p) => p.value === null).length };
}
