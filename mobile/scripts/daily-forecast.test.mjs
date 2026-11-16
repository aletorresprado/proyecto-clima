import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDailyForecast } from '../src/providers/daily-forecast.ts';
import { parseCurrentWeather } from '../src/providers/current-weather.ts';

const now = Date.UTC(2026, 10, 16, 12);
function payload() {
  return { timezone: 'UTC', utc_offset_seconds: 0,
    daily_units: { time: 'unixtime', weather_code: 'wmo code', temperature_2m_max: '°C', temperature_2m_min: '°C', precipitation_probability_max: '%' },
    daily: { time: Array.from({ length: 7 }, (_, i) => Date.UTC(2026, 10, 16 + i) / 1000), weather_code: [0, 2, 3, 45, 61, 95, 0],
      temperature_2m_max: [0, 10, 11, 12, 13, 14, 15], temperature_2m_min: [-3, 0, 1, 2, 3, 4, 5], precipitation_probability_max: [0, 100, 20, 30, 40, 50, 60] } };
}
test('siete fechas ordenadas, hoy incluido, negativos y cero conservados', () => {
  const days = parseDailyForecast(payload(), now);
  assert.equal(days.length, 7); assert.equal(days[0].date, '2026-11-16');
  assert.equal(days[0].weatherCode, 0); assert.equal(days[0].minimumC, -3);
  assert.equal(days[0].maximumC, 0); assert.equal(days[0].probabilityMax, 0);
  assert.equal(days[1].probabilityMax, 100);
});
test('unidades y series inválidas por variable conservan el resto; extremos invertidos ausentes', () => {
  const p = payload(); p.daily_units.temperature_2m_max = '°F'; p.daily.weather_code = [2];
  p.daily.precipitation_probability_max[0] = 101;
  const days = parseDailyForecast(p, now);
  assert.equal(days[0].maximumC, null); assert.equal(days[0].minimumC, -3);
  assert.equal(days[0].weatherCode, null); assert.equal(days[0].probabilityMax, null);
  const inverted = payload(); inverted.daily.temperature_2m_min[0] = 20;
  assert.equal(parseDailyForecast(inverted, now)[0].maximumC, null);
  assert.equal(parseDailyForecast(inverted, now)[0].minimumC, null);
});
test('rechaza duplicados, saltos, fechas no diarias y zona inválida', () => {
  for (const change of [p => p.daily.time[1] = p.daily.time[0], p => p.daily.time[1] += 3600,
    p => p.timezone = 'not/a-zone', p => p.daily_units.time = 'iso8601']) {
    const p = payload(); change(p); assert.equal(parseDailyForecast(p, now), null);
  }
  assert.equal(parseDailyForecast({}, now), null);
});
test('calendario del lugar y offset diario fijo no desplazan fechas al cambiar horario de verano', () => {
  const p = payload(); p.timezone = 'America/New_York'; p.utc_offset_seconds = -14400;
  p.daily.time = Array.from({ length: 7 }, (_, i) => Date.UTC(2026, 9, 31 + i, 4) / 1000);
  const days = parseDailyForecast(p, Date.UTC(2026, 9, 31, 14));
  assert.deepEqual(days.map(d => d.date), ['2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06']);
  const west = payload(); west.timezone = 'America/Argentina/Tucuman'; west.utc_offset_seconds = -10800;
  west.daily.time = west.daily.time.map(t => t + 10800);
  assert.equal(parseDailyForecast(west, Date.UTC(2026, 10, 17, 1))[0].date, '2026-11-16');
});
test('diario ausente no invalida condiciones actuales; días anteriores no se conservan', () => {
  const p = payload();
  assert.equal(parseDailyForecast(p, now + 86400000).length, 6);
  const current = parseCurrentWeather({ timezone: 'UTC', current_units: { time: 'unixtime', temperature_2m: '°C', wind_speed_10m: 'km/h', pressure_msl: 'hPa' },
    current: { time: now / 1000, temperature_2m: 20, wind_speed_10m: 10, pressure_msl: 1000 } }, now);
  assert.equal(current.temperatureC, 20); assert.equal(current.daily, null);
});
