export type UvInput = {
  locationId: string; locationLabel: string; fetchedAt: number;
  hours: ReadonlyArray<{ time: number; uvIndex: number | null }> | null;
};
export type UvEvaluation =
  | { state: 'insufficient'; reason: 'invalid' | 'expired' | 'missing' | 'partial' }
  | { state: 'below'; evaluatedHours: number }
  | { state: 'notice'; id: string; maxUv: number; hours: number[]; reinforcedHours: number[]; partial: boolean; expiresAt: number };

// Regla pura; los valores se comparan sin redondear contra 3 y 8.
export function evaluateUv(input: UvInput, now: number): UvEvaluation {
  if (!input.locationId.trim() || !input.locationLabel.trim() || !Number.isFinite(now) || !Number.isFinite(input.fetchedAt) || now < input.fetchedAt) return { state: 'insufficient', reason: 'invalid' };
  if (now - input.fetchedAt > 3600000) return { state: 'insufficient', reason: 'expired' };
  if (!input.hours?.length) return { state: 'insufficient', reason: 'missing' };
  if (input.hours.some((hour, index) => !Number.isFinite(hour.time) || hour.time <= 0 || (index > 0 && hour.time - input.hours![index - 1].time !== 3600000))) return { state: 'insufficient', reason: 'invalid' };
  const future = input.hours.filter((hour) => hour.time > now && hour.time <= now + 24 * 3600000);
  const valid = future.filter((hour): hour is { time: number; uvIndex: number } => typeof hour.uvIndex === 'number' && Number.isFinite(hour.uvIndex) && hour.uvIndex >= 0);
  const partial = future.length !== 24 || valid.length !== 24;
  const matching = valid.filter((hour) => hour.uvIndex >= 3);
  if (!matching.length) return partial ? { state: 'insufficient', reason: 'partial' } : { state: 'below', evaluatedHours: valid.length };
  return { state: 'notice', id: `uv-v1:${input.locationId}`, maxUv: Math.max(...matching.map((hour) => hour.uvIndex)),
    hours: matching.map((hour) => hour.time), reinforcedHours: matching.filter((hour) => hour.uvIndex >= 8).map((hour) => hour.time), partial,
    expiresAt: Math.min(input.fetchedAt + 3600000, matching[matching.length - 1].time) };
}
