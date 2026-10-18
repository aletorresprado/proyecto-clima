import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateVisibility } from '../src/rules/visibility.ts';
import { parseVisibilityForecast, parseCurrentWeather } from '../src/providers/current-weather.ts';
const H = 3600000;
const now = Date.UTC(2026, 9, 18, 23);
const input = (visibilityM = 1000) => ({ locationId: 'a', locationLabel: 'Prueba', fetchedAt: now, hours: Array.from({ length: 24 }, (_, i) => ({ time: now + (i + 1) * H, visibilityM })) });
test('umbral estricto antes de redondear: debajo genera aviso, 1000 y encima no', () => {
  for (const value of [0, 800, 999.999]) {
    const r = evaluateVisibility(input(value), now); assert.equal(r.state, 'notice'); assert.equal(r.minVisibilityM, value);
  }
  for (const value of [1000, 1000.001, 10000]) assert.equal(evaluateVisibility(input(value), now).state, 'not-reached');
});
test('ausentes, negativos e infinitos no se convierten en cero ni buena visibilidad', () => {
  for (const value of [null, undefined, -1, NaN, Infinity]) {
    const sample = input(); sample.hours = sample.hours.map((h) => ({ ...h, visibilityM: value }));
    assert.equal(evaluateVisibility(sample, now).state, 'insufficient');
  }
});
test('parcial con evidencia conserva aviso con limitación, sin evidencia es insuficiente', () => {
  const sample = input(null); sample.hours[0].visibilityM = 800;
  const r = evaluateVisibility(sample, now); assert.equal(r.state, 'notice'); assert.equal(r.partial, true);
  sample.hours[0].visibilityM = 1000; assert.equal(evaluateVisibility(sample, now).state, 'insufficient');
});
test('ventana futura cruza medianoche, excluye pasado y +25h, rechaza duplicados', () => {
  const sample = input(1000); sample.hours.unshift({ time: now, visibilityM: 0 }); sample.hours.push({ time: now + 25 * H, visibilityM: 0 });
  assert.equal(evaluateVisibility(sample, now).state, 'not-reached');
  sample.hours[1].visibilityM = 800;
  const r = evaluateVisibility(sample, now); assert.deepEqual(r.hours, [Date.UTC(2026, 9, 19, 0)]);
  sample.hours[1].time = sample.hours[0].time; assert.equal(evaluateVisibility(sample, now).reason, 'invalid');
});
test('vigencia y reloj, cierre por tiempo, identidad y ausencia de mutación', () => {
  assert.equal(evaluateVisibility(input(800), now + H).state, 'notice');
  assert.equal(evaluateVisibility(input(800), now + H + 1).reason, 'expired');
  assert.equal(evaluateVisibility(input(800), now - 1).reason, 'invalid');
  const sample = input(); sample.hours[0].visibilityM = 800; const before = structuredClone(sample);
  const r = evaluateVisibility(sample, now); assert.equal(r.expiresAt, now + H);
  assert.deepEqual(evaluateVisibility(sample, now), r); assert.deepEqual(sample, before);
  assert.notEqual(evaluateVisibility({ ...sample, locationId: 'b' }, now).id, r.id);
  assert.equal(evaluateVisibility(sample, now + H).state, 'insufficient');
});
const payload = () => ({ hourly_units: { time: 'unixtime', visibility: 'm' }, hourly: { time: Array.from({ length: 26 }, (_, i) => now / 1000 + i * 3600), visibility: Array(26).fill(0) } });
test('parser valida unidades, alineación, timestamps y valores sin inventar datos', () => {
  const p = payload(); p.hourly.visibility[1] = null; p.hourly.visibility[2] = -1;
  const r = parseVisibilityForecast(p, now); assert.equal(r.length, 24); assert.equal(r[0].time, now + H);
  assert.equal(r[0].visibilityM, null); assert.equal(r[1].visibilityM, null); assert.equal(r[2].visibilityM, 0);
  p.hourly_units.visibility = 'km'; assert.equal(parseVisibilityForecast(p, now), null);
  const bad = payload(); bad.hourly.visibility.pop(); assert.equal(parseVisibilityForecast(bad, now), null);
  const duplicate = payload(); duplicate.hourly.time[1] = duplicate.hourly.time[0]; assert.equal(parseVisibilityForecast(duplicate, now), null);
});
test('visibilidad ausente no invalida condiciones actuales', () => {
  const r = parseCurrentWeather({ timezone: 'UTC', current_units: { time: 'unixtime', temperature_2m: '°C', wind_speed_10m: 'km/h', pressure_msl: 'hPa' }, current: { time: now / 1000, temperature_2m: 20, wind_speed_10m: 10, pressure_msl: 1010 } }, now);
  assert.equal(r.visibilityHourly, null); assert.equal(r.temperatureC, 20);
});
