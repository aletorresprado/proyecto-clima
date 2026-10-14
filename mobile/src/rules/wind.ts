export const WIND_RULE_VERSION = 'wind-v1';
export const WIND_THRESHOLD_KMH = 40;
const MAX_AGE_MS = 3600000;
const HORIZON_MS = 24 * 3600000;

export type WindInput = {
  locationId: string;
  locationLabel: string;
  fetchedAt: number;
  hours: ReadonlyArray<{ time: number; windKmh: number | null }> | null;
};
export type WindNotice = {
  id: string;
  locationLabel: string;
  maxWindKmh: number;
  hours: number[];
  fetchedAt: number;
  expiresAt: number;
  coverage: 'complete' | 'partial';
};
export type WindEvaluation =
  | { state: 'notice'; notice: WindNotice }
  | { state: 'below'; evaluatedHours: number }
  | { state: 'insufficient'; reason: 'missing' | 'expired' | 'invalid' | 'partial' };

// Función pura: no consulta red, reloj, ubicación ni almacenamiento.
export function evaluateWind(input: WindInput, now: number): WindEvaluation {
  const insufficient = (reason: 'missing' | 'expired' | 'invalid' | 'partial'): WindEvaluation => ({ state: 'insufficient', reason });
  if (!input.locationId.trim() || !input.locationLabel.trim() || !Number.isFinite(now) || !Number.isFinite(input.fetchedAt) || now < input.fetchedAt) return insufficient('invalid');
  if (now - input.fetchedAt > MAX_AGE_MS) return insufficient('expired');
  if (!input.hours || input.hours.length === 0) return insufficient('missing');
  if (input.hours.some((hour, index) => !Number.isFinite(hour.time) || hour.time <= 0 ||
      (index > 0 && hour.time - input.hours![index - 1].time !== 3600000))) return insufficient('invalid');

  const future = input.hours.filter((hour) => hour.time > now && hour.time <= now + HORIZON_MS);
  const valid = future.filter((hour): hour is { time: number; windKmh: number } =>
    typeof hour.windKmh === 'number' && Number.isFinite(hour.windKmh) && hour.windKmh >= 0);
  const complete = future.length === 24 && valid.length === 24;
  const matching = valid.filter((hour) => hour.windKmh >= WIND_THRESHOLD_KMH);
  if (matching.length === 0) return complete ? { state: 'below', evaluatedHours: valid.length } : insufficient('partial');
  return {
    state: 'notice',
    notice: {
      id: `${WIND_RULE_VERSION}:${input.locationId}`,
      locationLabel: input.locationLabel,
      maxWindKmh: Math.max(...matching.map((hour) => hour.windKmh)),
      hours: matching.map((hour) => hour.time),
      fetchedAt: input.fetchedAt,
      expiresAt: Math.min(input.fetchedAt + MAX_AGE_MS, matching[matching.length - 1].time),
      coverage: complete ? 'complete' : 'partial',
    },
  };
}
