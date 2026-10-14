import assert from 'node:assert/strict';
import test from 'node:test';
import { parseCurrentWeather, isWeatherFresh, parseHourlyForecast, isForecastFresh, fetchCurrentWeather, WEATHER_MAX_AGE_MS } from '../src/providers/current-weather.ts';

const now = Date.UTC(2026, 9, 13, 15);
const payload = {
  timezone: 'America/Argentina/Tucuman',
  current_units: { time: 'unixtime', temperature_2m: '°C', wind_speed_10m: 'km/h', pressure_msl: 'hPa' },
  current: { time: now / 1000, temperature_2m: 0, wind_speed_10m: 0, pressure_msl: 1013 },
};
const location = { label: 'Lugar de prueba', latitude: -26, longitude: -65 };
const hourlyPayload = {
  ...payload,
  hourly_units: payload.current_units,
  hourly: {
    time: Array.from({ length: 27 }, (_, index) => now / 1000 + index * 3600),
    temperature_2m: Array(27).fill(0),
    wind_speed_10m: Array(27).fill(10),
    pressure_msl: Array(27).fill(1013),
  },
};

test('pronóstico incluye solo las siguientes 24 horas y cruza medianoche sin desplazar timestamps', () => {
  const hours = parseHourlyForecast(hourlyPayload, now + 15 * 60000);
  assert.equal(hours.length, 24);
  assert.equal(hours[0].time, now + 3600000);
  assert.equal(hours.at(-1).time, now + 24 * 3600000);
  assert.equal(hours[0].temperatureC, 0);
  assert.equal(new Date(hours.at(-1).time).getUTCDate(), 14);
});
test('el límite exacto excluye la hora actual y conserva la de +24 horas', () => {
  const hours = parseHourlyForecast(hourlyPayload, now);
  assert.equal(hours.length, 24);
  assert.equal(hours[0].time, now + 3600000);
  assert.equal(hours.at(-1).time, now + 24 * 3600000);
});
test('series desalineadas, unidades distintas y tiempos duplicados no mezclan valores', () => {
  assert.equal(parseHourlyForecast({ ...hourlyPayload, hourly: { ...hourlyPayload.hourly, wind_speed_10m: [] } }, now), null);
  assert.equal(parseHourlyForecast({ ...hourlyPayload, hourly_units: { ...payload.current_units, pressure_msl: 'Pa' } }, now), null);
  const times = [...hourlyPayload.hourly.time];
  times[2] = times[1];
  assert.equal(parseHourlyForecast({ ...hourlyPayload, hourly: { ...hourlyPayload.hourly, time: times } }, now), null);
  assert.equal(parseCurrentWeather({ ...payload, hourly: {} }, now).temperatureC, 0);
});
test('horas o valores ausentes no se rellenan con datos inventados', () => {
  const partial = Object.fromEntries(Object.entries(hourlyPayload.hourly).map(([key, values]) => [key, values.slice(0, 3)]));
  partial.temperature_2m[1] = null;
  partial.wind_speed_10m[1] = -1;
  const hours = parseHourlyForecast({ ...hourlyPayload, hourly: partial }, now);
  assert.equal(hours.length, 2);
  assert.equal(hours[0].temperatureC, null);
  assert.equal(hours[0].windKmh, null);
  assert.equal(parseHourlyForecast({}, now), null);
});
test('vigencia del pronóstico depende de consulta, no de horas futuras que aún no ocurrieron', () => {
  const weather = parseCurrentWeather(hourlyPayload, now);
  assert.equal(isForecastFresh(weather, now + WEATHER_MAX_AGE_MS), true);
  assert.equal(isForecastFresh(weather, now + WEATHER_MAX_AGE_MS + 1), false);
  assert.equal(isForecastFresh(weather, now - 1), false);
});

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
