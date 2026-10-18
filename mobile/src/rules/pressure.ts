export type PressureInput = { locationId: string; locationLabel: string; fetchedAt: number; hours: ReadonlyArray<{ time: number; seaLevelPressureHpa: number | null }> | null };
export type PressureEvaluation =
  | { state: 'insufficient'; reason: 'invalid' | 'expired' | 'missing' }
  | { state: 'ready'; id: string; start: number; end: number; initialHpa: number; finalHpa: number; deltaHpa: number; direction: 'increase' | 'decrease' | 'unchanged'; expiresAt: number };
const HOUR = 3600000;
export function evaluatePressure(input: PressureInput, now: number): PressureEvaluation {
  if (!input.locationId.trim() || !input.locationLabel.trim() || !Number.isFinite(now) || !Number.isFinite(input.fetchedAt) || now < input.fetchedAt) return { state: 'insufficient', reason: 'invalid' };
  if (now - input.fetchedAt > HOUR) return { state: 'insufficient', reason: 'expired' };
  if (!input.hours?.length) return { state: 'insufficient', reason: 'missing' };
  if (input.hours.some((h, i) => !Number.isFinite(h.time) || h.time <= 0 || (i > 0 && h.time - input.hours![i - 1].time !== HOUR))) return { state: 'insufficient', reason: 'invalid' };
  const first = input.hours.findIndex((h) => h.time > now);
  if (first < 0) return { state: 'insufficient', reason: 'missing' };
  const points = input.hours.slice(first, first + 4);
  if (points.length !== 4 || points[0].time - now > HOUR || points[3].time > now + 24 * HOUR || points.some((h) => typeof h.seaLevelPressureHpa !== 'number' || !Number.isFinite(h.seaLevelPressureHpa) || h.seaLevelPressureHpa <= 0)) return { state: 'insufficient', reason: 'missing' };
  const initialHpa = points[0].seaLevelPressureHpa!;
  const finalHpa = points[3].seaLevelPressureHpa!;
  const delta = finalHpa - initialHpa;
  // Redondeo simétrico a una décima para presentación, no umbral de peligro.
  const tenths = Math.round(Math.abs(delta) * 10 + 1e-9);
  const deltaHpa = tenths === 0 ? 0 : Math.sign(delta) * tenths / 10;
  return { state: 'ready', id: `pressure-v1:${input.locationId}`, start: points[0].time, end: points[3].time, initialHpa, finalHpa, deltaHpa,
    direction: deltaHpa > 0 ? 'increase' : deltaHpa < 0 ? 'decrease' : 'unchanged', expiresAt: Math.min(input.fetchedAt + HOUR, points[0].time) };
}
