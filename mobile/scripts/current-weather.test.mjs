import assert from 'node:assert/strict';
import test from 'node:test';
import { parseCurrentWeather, isWeatherFresh, fetchCurrentWeather, WEATHER_MAX_AGE_MS } from '../src/providers/current-weather.ts';

const now = Date.UTC(2026, 9, 13, 15);
const payload = {
  timezone: 'America/Argentina/Tucuman',
  current_units: { time: 'unixtime', temperature_2m: '°C', wind_speed_10m: 'km/h', pressure_msl: 'hPa' },
  current: { time: now / 1000, temperature_2m: 0, wind_speed_10m: 0, pressure_msl: 1013 },
};
const location = { label: 'Lugar de prueba', latitude: -26, longitude: -65 };

test('cero es un dato; valores ausentes o inválidos son información insuficiente', () => {
  const weather = parseCurrentWeather(payload, now);
  assert.equal(weather.temperatureC, 0);
  assert.equal(weather.windKmh, 0);
  const missing = parseCurrentWeather({ ...payload, current: { time: now / 1000, temperature_2m: null, wind_speed_10m: -1, pressure_msl: '1013' } }, now);
  assert.equal(missing.temperatureC, null);
  assert.equal(missing.windKmh, null);
  assert.equal(missing.seaLevelPressureHpa, null);
});
test('no acepta unidades, zona horaria o fecha equivocadas', () => {
  for (const units of [{ ...payload.current_units, pressure_msl: 'Pa' }, { ...payload.current_units, wind_speed_10m: 'm/s' }, { ...payload.current_units, time: 'iso8601' }]) {
    assert.throws(() => parseCurrentWeather({ ...payload, current_units: units }, now));
  }
  assert.throws(() => parseCurrentWeather({ ...payload, timezone: 'zona-inexistente' }, now));
  assert.throws(() => parseCurrentWeather({ ...payload, current: { ...payload.current, time: null } }, now));
  assert.throws(() => parseCurrentWeather({ error: true }, now));
});
test('fecha Unix se convierte sin desplazarla por el huso horario', () => {
  const weather = parseCurrentWeather(payload, now);
  assert.equal(weather.validAt, now);
  assert.equal(weather.fetchedAt, now);
  assert.equal(weather.timezone, payload.timezone);
});
test('vigencia conserva límites y rechaza pasado vencido o futuro no verificable', () => {
  const weather = parseCurrentWeather(payload, now);
  assert.equal(isWeatherFresh(weather, now + WEATHER_MAX_AGE_MS), true);
  assert.equal(isWeatherFresh(weather, now + WEATHER_MAX_AGE_MS + 1), false);
  assert.equal(isWeatherFresh(weather, now - 300001), false);
});
test('errores nativos de conexión permiten un reintento exitoso', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => { throw new Error('java.net.UnknownHostException'); };
    await assert.rejects(fetchCurrentWeather(location, new AbortController().signal), { message: 'No pudimos conectar. Revisá tu conexión y reintentá.' });
    globalThis.fetch = async () => ({ ok: true, json: async () => payload });
    assert.equal((await fetchCurrentWeather(location, new AbortController().signal)).temperatureC, 0);
  } finally { globalThis.fetch = original; }
});
test('cancelar la consulta al cambiar de lugar impide aceptar la respuesta pendiente', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = (_url, options) => new Promise((_resolve, reject) => {
      const abort = () => reject(new DOMException('Cancelado', 'AbortError'));
      if (options.signal.aborted) abort();
      else options.signal.addEventListener('abort', abort, { once: true });
    });
    const controller = new AbortController();
    const request = fetchCurrentWeather(location, controller.signal);
    controller.abort();
    await assert.rejects(request, { name: 'AbortError' });
  } finally { globalThis.fetch = original; }
});
