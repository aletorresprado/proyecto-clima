export type PrecipitationInput = { locationId: string; locationLabel: string; fetchedAt: number; hours: ReadonlyArray<{ time: number; probability: number | null; amountMm: number | null }> | null };
export type PrecipitationInterval = { start: number; end: number; probability: number; amountMm: number | null };
export type PrecipitationEvaluation =
  | { state: 'insufficient'; reason: 'invalid' | 'expired' | 'missing' | 'partial' }
  | { state: 'below'; evaluatedHours: number }
  | { state: 'notice'; id: string; intervals: PrecipitationInterval[]; partial: boolean; expiresAt: number };
const HOUR = 3600000;
export function evaluatePrecipitation(input: PrecipitationInput, now: number): PrecipitationEvaluation {
  if (!input.locationId.trim() || !input.locationLabel.trim() || !Number.isFinite(now) || !Number.isFinite(input.fetchedAt) || now < input.fetchedAt) return { state: 'insufficient', reason: 'invalid' };
  if (now - input.fetchedAt > HOUR) return { state: 'insufficient', reason: 'expired' };
  if (!input.hours?.length) return { state: 'insufficient', reason: 'missing' };
  if (input.hours.some((h, i) => !Number.isFinite(h.time) || h.time <= HOUR || (i > 0 && h.time - input.hours![i - 1].time !== HOUR))) return { state: 'insufficient', reason: 'invalid' };
  const future = input.hours.filter((h) => h.time - HOUR >= now && h.time <= now + 24 * HOUR);
  // La fase de los timestamps admite husos con desfase de media hora.
  const phase = ((input.hours[0].time - now) % HOUR + HOUR) % HOUR;
  const expected = Math.floor((24 * HOUR - phase) / HOUR);
  const valid = future.filter((h): h is { time: number; probability: number; amountMm: number | null } => typeof h.probability === 'number' && Number.isFinite(h.probability) && h.probability >= 0 && h.probability <= 100);
  const partial = future.length !== expected || valid.length !== expected;
  const matching = valid.filter((h) => h.probability >= 50);
  if (!matching.length) return partial ? { state: 'insufficient', reason: 'partial' } : { state: 'below', evaluatedHours: valid.length };
  return { state: 'notice', id: `precipitation-v1:${input.locationId}`, partial,
    intervals: matching.map((h) => ({ start: h.time - HOUR, end: h.time, probability: h.probability, amountMm: typeof h.amountMm === 'number' && Number.isFinite(h.amountMm) && h.amountMm >= 0 ? h.amountMm : null })),
    expiresAt: Math.min(input.fetchedAt + HOUR, matching[matching.length - 1].time - HOUR) };
}
