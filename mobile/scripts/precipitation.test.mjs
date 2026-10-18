import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePrecipitation } from '../src/rules/precipitation.ts';
import { parsePrecipitationForecast, parseCurrentWeather } from '../src/providers/current-weather.ts';
const H = 3600000;
const now = Date.UTC(2026, 9, 18, 23);
const input = (probability = 0) => ({ locationId: 'a', locationLabel: 'Prueba', fetchedAt: now, hours: Array.from({ length: 24 }, (_, i) => ({ time: now + (i + 1) * H, probability, amountMm: 0 })) });
test('50% exacto genera aviso; 49.999 no; cantidades no determinan el criterio', () => {
  assert.equal(evaluatePrecipitation(input(49.999), now).state, 'below');
  for (const p of [50, 50.001, 100]) {
    const result = evaluatePrecipitation(input(p), now);
    assert.equal(result.state, 'notice'); assert.equal(result.intervals[0].probability, p);
    assert.equal(result.intervals[0].amountMm, 0);
  }
  const sample = input(10); sample.hours[0].amountMm = 100;
  assert.equal(evaluatePrecipitation(sample, now).state, 'below');
});
test('cero válido; probabilidad ausente, negativa, mayor a 100 o infinita no indica ausencia', () => {
  assert.equal(evaluatePrecipitation(input(0), now).state, 'below');
  for (const p of [null, undefined, -1, 101, NaN, Infinity]) {
    const sample = input(); sample.hours = sample.hours.map((h) => ({ ...h, probability: p }));
    assert.equal(evaluatePrecipitation(sample, now).state, 'insufficient');
  }
});
test('cantidad ausente no bloquea probabilidad; huecos de probabilidad se informan', () => {
  const sample = input(null); sample.hours[2] = { ...sample.hours[2], probability: 50, amountMm: null };
  const result = evaluatePrecipitation(sample, now);
  assert.equal(result.state, 'notice'); assert.equal(result.partial, true); assert.equal(result.intervals[0].amountMm, null);
  sample.hours[2].probability = 10;
  assert.equal(evaluatePrecipitation(sample, now).state, 'insufficient');
});
test('intervalos precedentes cruzan medianoche y excluyen primera fracción y última fuera de ventana', () => {
  const sample = input(50); sample.fetchedAt = now + H / 2;
  const result = evaluatePrecipitation(sample, now + H / 2);
  assert.equal(result.intervals.length, 23); assert.equal(result.partial, false);
  assert.equal(result.intervals[0].start, now + H); assert.equal(result.intervals[0].end, now + 2 * H);
  assert.equal(result.intervals[0].start, Date.UTC(2026, 9, 19, 0));
  const edge = input(0); edge.hours[0].probability = 100; edge.hours.push({ time: now + 25 * H, probability: 100, amountMm: 1 }); edge.fetchedAt = now + H / 2;
  assert.equal(evaluatePrecipitation(edge, now + H / 2).state, 'below');
});
test('fase de media hora, series truncadas y duplicadas', () => {
  const sample = input(0); sample.hours = sample.hours.map((h) => ({ ...h, time: h.time + H / 2 }));
  assert.equal(evaluatePrecipitation(sample, now).state, 'below');
  sample.hours.shift(); assert.equal(evaluatePrecipitation(sample, now).state, 'insufficient');
  sample.hours[1].time = sample.hours[0].time; assert.equal(evaluatePrecipitation(sample, now).reason, 'invalid');
});
test('vigencia, cierre al comenzar intervalo, identidad y pureza', () => {
  const sample = input(0); sample.hours[2].probability = 50;
  const before = structuredClone(sample); const result = evaluatePrecipitation(sample, now);
  assert.equal(result.id, 'precipitation-v1:a'); assert.equal(result.expiresAt, now + H);
  assert.deepEqual(evaluatePrecipitation(sample, now), result); assert.deepEqual(sample, before);
  assert.notEqual(evaluatePrecipitation({ ...sample, locationId: 'b' }, now).id, result.id);
  assert.equal(evaluatePrecipitation(sample, now - 1).reason, 'invalid');
  assert.equal(evaluatePrecipitation(sample, now + H + 1).reason, 'expired');
  sample.hours[0].probability = 50; sample.hours[2].probability = 0;
  assert.equal(evaluatePrecipitation(sample, now + 1).state, 'below');
});
const payload = () => ({ hourly_units: { time: 'unixtime', precipitation_probability: '%', precipitation: 'mm' }, hourly: { time: Array.from({ length: 26 }, (_, i) => now / 1000 + i * 3600), precipitation_probability: Array(26).fill(50), precipitation: Array(26).fill(0) } });
test('parser valida unidades, alineación, rango y conserva ausencia de cantidad independientemente', () => {
  const p = payload(); const parsed = parsePrecipitationForecast(p, now + H / 2);
  assert.equal(parsed.length, 23); assert.equal(parsed[0].time, now + 2 * H); assert.equal(parsed[0].amountMm, 0);
  p.hourly.precipitation_probability[2] = 101; assert.equal(parsePrecipitationForecast(p, now + H / 2)[0].probability, null);
  p.hourly_units.precipitation = 'inch'; assert.equal(parsePrecipitationForecast(p, now)[0].amountMm, null);
  p.hourly_units.precipitation_probability = 'mm'; assert.equal(parsePrecipitationForecast(p, now), null);
  const bad = payload(); bad.hourly.precipitation_probability.pop(); assert.equal(parsePrecipitationForecast(bad, now), null);
  const duplicate = payload(); duplicate.hourly.time[1] = duplicate.hourly.time[0]; assert.equal(parsePrecipitationForecast(duplicate, now), null);
});
test('precipitación ausente no invalida condiciones actuales', () => {
  const result = parseCurrentWeather({ timezone: 'UTC', current_units: { time: 'unixtime', temperature_2m: '°C', wind_speed_10m: 'km/h', pressure_msl: 'hPa' }, current: { time: now / 1000, temperature_2m: 20, wind_speed_10m: 0, pressure_msl: 1010 } }, now);
  assert.equal(result.precipitationHourly, null); assert.equal(result.temperatureC, 20);
});
