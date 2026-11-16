import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoDiaryEntry, demoDiaryContext } from '../src/providers/diary-demo.ts';

const now = Date.UTC(2026, 10, 16, 12);
test('nota breve y lugar confirmado; errores no filtran texto', () => {
  const context = demoDiaryContext('clear', now);
  for (const note of ['', '   ', null, 'x'.repeat(301)]) assert.throws(() => createDemoDiaryEntry(note, context, now, true));
  assert.throws(() => createDemoDiaryEntry('Nota ficticia', context, now, false));
  assert.equal(createDemoDiaryEntry('x'.repeat(300), context, now, true).note.length, 300);
  try { createDemoDiaryEntry('texto-ficticio-no-filtrar'.repeat(30), context, now, true); }
  catch (error) { assert.ok(!error.message.includes('texto-ficticio-no-filtrar')); }
});
test('copia conserva fecha y contexto aunque cambien las condiciones después', () => {
  const context = demoDiaryContext('clear', now);
  const entry = createDemoDiaryEntry(' Nota ficticia ', context, now, true);
  context.temperatureC = 99; context.place = 'Otro lugar ficticio';
  assert.equal(entry.weather.temperatureC, 24);
  assert.equal(entry.weather.place, 'Lugar ficticio de prueba');
  assert.equal(entry.note, 'Nota ficticia'); assert.equal(entry.recordedAt, now);
  assert.equal(entry.weather.source, 'Escenario ficticio local');
});
test('cero no es ausente; parciales y vencidos no inventan contexto', () => {
  const zero = { ...demoDiaryContext('clear', now), temperatureC: 0, conditionCode: 0 };
  assert.equal(createDemoDiaryEntry('Ficticio', zero, now, true).weather.state, 'available');
  const partial = createDemoDiaryEntry('Ficticio', { ...zero, seaLevelPressureHpa: -1 }, now, true);
  assert.equal(partial.weather.state, 'partial'); assert.equal(partial.weather.seaLevelPressureHpa, null);
  const expired = createDemoDiaryEntry('Ficticio', demoDiaryContext('expired', now), now, true);
  assert.equal(expired.weather.state, 'expired'); assert.equal(expired.weather.temperatureC, null);
  assert.equal(createDemoDiaryEntry('Ficticio', demoDiaryContext('missing', now), now, true).weather.state, 'unavailable');
  assert.equal(createDemoDiaryEntry('Ficticio', { ...zero, fetchedAt: now + 1 }, now, true).weather.state, 'unavailable');
});
