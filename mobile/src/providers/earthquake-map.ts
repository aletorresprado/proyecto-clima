import type { Epicenter } from './earthquakes.ts';

export function referenceMap(center: Epicenter, epicenter: Epicenter, rings: number[][][]) {
  const valid = (p: Epicenter) => Number.isFinite(p.latitude) && Math.abs(p.latitude) <= 90
    && Number.isFinite(p.longitude) && Math.abs(p.longitude) <= 180;
  if (!valid(center) || !valid(epicenter)) return null;
  // Proyección local equirectangular. Se declara su carácter esquemático.
  if (Math.abs(center.latitude) > 80 || Math.abs(epicenter.latitude) > 80) return null;
  const wrap = (difference: number) => ((difference + 540) % 360) - 180;
  const cosine = Math.cos(center.latitude * Math.PI / 180);
  const dx = wrap(epicenter.longitude - center.longitude) * cosine;
  const dy = epicenter.latitude - center.latitude;
  const width = 320, height = 200;
  const span = Math.max(14, Math.abs(dx) * 2.8, Math.abs(dy) * 2.8 * width / height);
  const scale = width / span;
  const project = (latitude: number, longitude: number) => ({
    x: width / 2 + wrap(longitude - center.longitude) * cosine * scale,
    y: height / 2 - (latitude - center.latitude) * scale,
  });
  const paths: string[] = [];
  for (const ring of rings) {
    const points = ring.map(([lon, lat]) => project(lat, lon));
    // No dibujar polígonos que cruzan la discontinuidad del meridiano opuesto.
    if (points.some((p, i) => i > 0 && Math.abs(p.x - points[i - 1].x) > 180 * cosine * scale)) continue;
    if (Math.max(...points.map(p => p.x)) < 0 || Math.min(...points.map(p => p.x)) > width
      || Math.max(...points.map(p => p.y)) < 0 || Math.min(...points.map(p => p.y)) > height) continue;
    paths.push(points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ') + 'Z');
  }
  return { center: project(center.latitude, center.longitude), epicenter: project(epicenter.latitude, epicenter.longitude), paths };
}
