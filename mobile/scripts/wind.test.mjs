import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateWind } from '../src/rules/wind.ts';

const now = Date.UTC(2026, 9, 14, 12);
const make = (wind = 15) => ({
  locationId: 'lugar-a', locationLabel: 'Lugar ficticio A', fetchedAt: now,
  hours: Array.from({ length: 24 }, (_, index) => ({ time: now + (index + 1) * 3600000, windKmh: wind })),
});
test('límite: debajo no alcanza, exactamente 40 y por encima generan aviso', () => {
  assert.equal(evaluateWind(make(39.999), now).state, 'below');
  for (const value of [40, 40.001, 60]) {
    const result = evaluateWind(make(value), now);
    assert.equal(result.state, 'notice');
    assert.equal(result.notice.maxWindKmh, value);
    assert.equal(result.notice.hours.length, 24);
    assert.equal(result.notice.coverage, 'complete');
  }
});
test('cero es válido, faltantes y números inválidos no significan ausencia de criterio', () => {
  assert.equal(evaluateWind(make(0), now).state, 'below');
  for (const value of [null, undefined, NaN, Infinity, -1]) {
    const input = make();
    input.hours = input.hours.map((hour) => ({ ...hour, windKmh: value }));
    assert.equal(evaluateWind(input, now).state, 'insufficient');
  }
  assert.equal(evaluateWind({ ...make(), hours: null }, now).state, 'insufficient');
});
test('una excedencia válida con cobertura parcial se conserva con esa limitación', () => {
  const input = make();
  input.hours[0].windKmh = 45;
  input.hours[1].windKmh = null;
  const result = evaluateWind(input, now);
  assert.equal(result.state, 'notice');
  assert.equal(result.notice.coverage, 'partial');
  assert.deepEqual(result.notice.hours, [now + 3600000]);
  input.hours[0].windKmh = 15;
  assert.deepEqual(evaluateWind(input, now), { state: 'insufficient', reason: 'partial' });
});
test('consulta vencida, reloj inválido y consulta futura no generan aviso', () => {
  const input = make(50);
  assert.equal(evaluateWind(input, now + 3600000).state, 'notice');
  assert.deepEqual(evaluateWind(input, now + 3600001), { state: 'insufficient', reason: 'expired' });
  assert.equal(evaluateWind(input, now - 1).state, 'insufficient');
  assert.equal(evaluateWind(input, NaN).state, 'insufficient');
});
test('no incluye horas pasadas ni fuera de las próximas 24', () => {
  const input = make();
  input.hours.unshift({ time: now, windKmh: 70 });
  input.hours.push({ time: now + 25 * 3600000, windKmh: 80 });
  assert.equal(evaluateWind(input, now).state, 'below');
  input.hours[24].windKmh = 40;
  const result = evaluateWind(input, now);
  assert.deepEqual(result.notice.hours, [now + 24 * 3600000]);
});
test('horas duplicadas o desordenadas invalidan la estructura', () => {
  const input = make(45);
  input.hours[1].time = input.hours[0].time;
  assert.equal(evaluateWind(input, now).state, 'insufficient');
});
test('al pasar la hora relevante deja de devolver el aviso', () => {
  const input = make();
  input.hours = input.hours.map((hour) => ({ ...hour, time: hour.time - 1800000 }));
  input.hours[0].windKmh = 45;
  const initial = evaluateWind(input, now);
  assert.equal(initial.notice.expiresAt, now + 1800000);
  assert.equal(evaluateWind(input, now + 1800000).state, 'insufficient');
});
test('reevaluar es determinista; actualizar conserva ID único por lugar/regla', () => {
  const input = make(40);
  const snapshot = structuredClone(input);
  const first = evaluateWind(input, now);
  assert.deepEqual(evaluateWind(input, now), first);
  assert.deepEqual(input, snapshot);
  const updated = evaluateWind({ ...input, fetchedAt: now + 1000 }, now + 1000);
  assert.equal(updated.notice.id, first.notice.id);
  assert.notEqual(evaluateWind({ ...input, locationId: 'lugar-b' }, now).notice.id, first.notice.id);
  assert.equal(evaluateWind(make(15), now).state, 'below');
});
