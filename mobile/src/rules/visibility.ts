export type VisibilityInput = { locationId: string; locationLabel: string; fetchedAt: number; hours: ReadonlyArray<{ time: number; visibilityM: number | null }> | null };
export type VisibilityEvaluation =
  | { state: 'insufficient'; reason: 'invalid' | 'expired' | 'missing' | 'partial' }
  | { state: 'not-reached'; evaluatedHours: number }
  | { state: 'notice'; id: string; minVisibilityM: number; hours: number[]; partial: boolean; expiresAt: number };
// Regla pura: umbral estricto sobre valores sin redondear.
export function evaluateVisibility(input: VisibilityInput, now: number): VisibilityEvaluation {
  if (!input.locationId.trim() || !input.locationLabel.trim() || !Number.isFinite(now) || !Number.isFinite(input.fetchedAt) || now < input.fetchedAt) return { state: 'insufficient', reason: 'invalid' };
  if (now - input.fetchedAt > 3600000) return { state: 'insufficient', reason: 'expired' };
  if (!input.hours?.length) return { state: 'insufficient', reason: 'missing' };
  if (input.hours.some((h, i) => !Number.isFinite(h.time) || h.time <= 0 || (i > 0 && h.time - input.hours![i - 1].time !== 3600000))) return { state: 'insufficient', reason: 'invalid' };
  const future = input.hours.filter((h) => h.time > now && h.time <= now + 24 * 3600000);
  const valid = future.filter((h): h is { time: number; visibilityM: number } => typeof h.visibilityM === 'number' && Number.isFinite(h.visibilityM) && h.visibilityM >= 0);
  const partial = future.length !== 24 || valid.length !== 24;
  const matching = valid.filter((h) => h.visibilityM < 1000);
  if (!matching.length) return partial ? { state: 'insufficient', reason: 'partial' } : { state: 'not-reached', evaluatedHours: valid.length };
  return { state: 'notice', id: `visibility-v1:${input.locationId}`, minVisibilityM: Math.min(...matching.map((h) => h.visibilityM)), hours: matching.map((h) => h.time), partial, expiresAt: Math.min(input.fetchedAt + 3600000, matching[matching.length - 1].time) };
}
