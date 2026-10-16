import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateUv } from '../src/rules/uv.ts';
import { parseUvForecast, parseCurrentWeather } from '../src/providers/current-weather.ts';
const now = Date.UTC(2026, 9, 16, 15);
const input = (value = 0) => ({ locationId: 'a', locationLabel: 'Prueba', fetchedAt: now, hours: Array.from({ length: 24 }, (_, i) => ({ time: now + (i + 1) * 3600000, uvIndex: value })) });
test('límites UV 3 y 8 sin redondeo previo', () => {
  assert.equal(evaluateUv(input(2.999), now).state, 'below');
  for (const value of [3, 3.001, 7.999, 8, 8.001]) {
    const result = evaluateUv(input(value), now);
    assert.equal(result.state, 'notice'); assert.equal(result.maxUv, value);
    assert.equal(result.reinforcedHours.length, value >= 8 ? 24 : 0);
  }
});
test('cero válido; ausentes, negativos, NaN e infinito no indican ausencia', () => {
  assert.equal(evaluateUv(input(0), now).state, 'below');
  for (const value of [null, undefined, -1, NaN, Infinity]) {
    const sample = input(); sample.hours = sample.hours.map((h) => ({ ...h, uvIndex: value }));
    assert.equal(evaluateUv(sample, now).state, 'insufficient');
  }
});
test('evidencia UV parcial muestra limitación; parcial sin excedencia es insuficiente', () => {
  const sample = input(null); sample.hours[0].uvIndex = 3;
  assert.equal(evaluateUv(sample, now).partial, true);
  sample.hours[0].uvIndex = 2;
  assert.equal(evaluateUv(sample, now).state, 'insufficient');
});
test('vigencia, futuro, horas fuera del horizonte y series inválidas', () => {
  assert.equal(evaluateUv(input(8), now + 3600000).state, 'notice');
  assert.equal(evaluateUv(input(8), now + 3600001).reason, 'expired');
  assert.equal(evaluateUv(input(8), now - 1).reason, 'invalid');
  const sample = input(0); sample.hours.unshift({ time: now, uvIndex: 20 }); sample.hours.push({ time: now + 25 * 3600000, uvIndex: 20 });
  assert.equal(evaluateUv(sample, now).state, 'below');
  sample.hours[1].time = sample.hours[0].time;
  assert.equal(evaluateUv(sample, now).reason, 'invalid');
});
test('identidad estable, sin mutación y cierre al pasar la única hora relevante', () => {
  const sample = input(); sample.hours[0] = { time: now + 1000, uvIndex: 8 };
  sample.hours = sample.hours.map((h, i) => ({ ...h, time: now + 1000 + i * 3600000 }));
  const before = structuredClone(sample);
  const result = evaluateUv(sample, now);
  assert.equal(result.expiresAt, now + 1000);
  assert.deepEqual(evaluateUv(sample, now), result); assert.deepEqual(sample, before);
  assert.equal(evaluateUv(sample, now + 1000).state, 'insufficient');
  assert.notEqual(evaluateUv({ ...sample, locationId: 'b' }, now).id, result.id);
});
const payload = () => ({ hourly_units: { time: 'unixtime', uv_index: '' }, hourly: { time: Array.from({ length: 26 }, (_, i) => now / 1000 + i * 3600), uv_index: Array(26).fill(0) } });
test('parser UV respeta unidad, ventana, ausentes, orden y alineación', () => {
  const p = payload(); p.hourly.uv_index[1] = null; p.hourly.uv_index[2] = -1;
  const result = parseUvForecast(p, now);
  assert.equal(result.length, 24); assert.equal(result[0].time, now + 3600000);
  assert.equal(result[0].uvIndex, null); assert.equal(result[1].uvIndex, null); assert.equal(result[2].uvIndex, 0);
  p.hourly_units.uv_index = '°C'; assert.equal(parseUvForecast(p, now), null);
  p.hourly_units.uv_index = ''; p.hourly.uv_index.pop(); assert.equal(parseUvForecast(p, now), null);
  const duplicate = payload(); duplicate.hourly.time[1] = duplicate.hourly.time[0]; assert.equal(parseUvForecast(duplicate, now), null);
});
test('UV ausente no invalida condiciones actuales válidas', () => {
  const current = { timezone: 'UTC', current_units: { time: 'unixtime', temperature_2m: '°C', wind_speed_10m: 'km/h', pressure_msl: 'hPa' }, current: { time: now / 1000, temperature_2m: 20, wind_speed_10m: 10, pressure_msl: 1010 } };
  const result = parseCurrentWeather(current, now);
  assert.equal(result.uvHourly, null); assert.equal(result.temperatureC, 20);
});
