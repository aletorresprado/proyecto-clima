import { weatherCode } from './weather-condition.ts';

export const DEMO_NOTE_LIMIT = 300;
export type DemoContext = { place: string; conditionCode: number | null; temperatureC: number | null;
  seaLevelPressureHpa: number | null; validAt: number; fetchedAt: number };
export type DemoDiaryEntry = { note: string; recordedAt: number; weather: DemoContext & {
  state: 'available' | 'partial' | 'expired' | 'unavailable'; source: 'Escenario ficticio local' } };

// Solo demostración, sin red/disco/cuenta. Nunca recibe ubicación ni clima reales.
export function createDemoDiaryEntry(note: unknown, context: DemoContext, now: number, placeConfirmed: boolean): DemoDiaryEntry {
  if (typeof note !== 'string' || !note.trim() || Array.from(note.trim()).length > DEMO_NOTE_LIMIT) {
    throw new Error('Escribí una nota ficticia breve, de hasta 300 caracteres.');
  }
  if (!Number.isFinite(now) || now <= 0 || !context.place.trim() || !placeConfirmed) {
    throw new Error('Confirmá el lugar ficticio antes de guardar.');
  }
  const validDates = Number.isFinite(context.validAt) && context.validAt > 0 && context.validAt <= now + 300000
    && Number.isFinite(context.fetchedAt) && context.fetchedAt > 0 && context.fetchedAt <= now;
  const expired = validDates && (now - context.validAt > 3600000 || now - context.fetchedAt > 3600000);
  const usable = validDates && !expired;
  const conditionCode = usable ? weatherCode(context.conditionCode) : null;
  const temperatureC = usable && typeof context.temperatureC === 'number' && Number.isFinite(context.temperatureC) ? context.temperatureC : null;
  const seaLevelPressureHpa = usable && typeof context.seaLevelPressureHpa === 'number' && Number.isFinite(context.seaLevelPressureHpa) && context.seaLevelPressureHpa > 0 ? context.seaLevelPressureHpa : null;
  const missing = [conditionCode, temperatureC, seaLevelPressureHpa].filter((value) => value === null).length;
  return { note: note.trim(), recordedAt: now, weather: {
    place: context.place.trim(), conditionCode, temperatureC, seaLevelPressureHpa,
    validAt: validDates ? context.validAt : 0, fetchedAt: validDates ? context.fetchedAt : 0,
    state: expired ? 'expired' : missing === 3 ? 'unavailable' : missing ? 'partial' : 'available',
    source: 'Escenario ficticio local',
  } };
}

export type DiaryScenario = 'clear' | 'rain' | 'missing' | 'expired';
export function demoDiaryContext(scenario: DiaryScenario, now: number): DemoContext {
  const base = { place: 'Lugar ficticio de prueba', validAt: now - 300000, fetchedAt: now - 30000 };
  if (scenario === 'missing') return { ...base, conditionCode: null, temperatureC: null, seaLevelPressureHpa: null };
  if (scenario === 'rain') return { ...base, conditionCode: 61, temperatureC: 18, seaLevelPressureHpa: 1008 };
  if (scenario === 'expired') return { ...base, validAt: now - 7200000, fetchedAt: now - 7200000, conditionCode: 3, temperatureC: 20, seaLevelPressureHpa: 1010 };
  return { ...base, conditionCode: 0, temperatureC: 24, seaLevelPressureHpa: 1015 };
}
