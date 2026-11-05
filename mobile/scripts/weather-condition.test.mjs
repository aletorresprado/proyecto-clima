import test from 'node:test';
import assert from 'node:assert/strict';
import { describeWeather, daylight, weatherCode } from '../src/providers/weather-condition.ts';
import { parseCurrentWeather } from '../src/providers/current-weather.ts';

test('cero es despejado, día y noche no comparten sol; desconocidos no inventan cielo', () => {
  assert.equal(weatherCode(0), 0);
  assert.equal(describeWeather(0, true).icon, '☀️');
  assert.equal(describeWeather(0, false).icon, '🌙');
  assert.equal(describeWeather(0, null).icon, '◌');
  assert.equal(describeWeather(45, true).label, 'Niebla');
  for (const value of [undefined, null, '0', -1, 4, 2.5, NaN, Infinity]) {
    assert.equal(weatherCode(value), null);
    assert.equal(describeWeather(value).label, 'Estado no disponible');
  }
  assert.equal(daylight(0), false); assert.equal(daylight(1), true);
  for (const value of [true, '1', null, 2]) assert.equal(daylight(value), null);
  assert.match(describeWeather(96, true).label, /modelo/);
});

const now = Date.UTC(2026, 10, 5, 12);
function payload() {
  return { timezone: 'UTC', current_units: { time: 'unixtime', temperature_2m: '°C', wind_speed_10m: 'km/h', pressure_msl: 'hPa', weather_code: 'wmo code', is_day: '' },
    current: { time: now / 1000, temperature_2m: 0, wind_speed_10m: 0, pressure_msl: 1000, weather_code: 0, is_day: 1 },
    hourly_units: { time: 'unixtime', temperature_2m: '°C', wind_speed_10m: 'km/h', pressure_msl: 'hPa', weather_code: 'wmo code', is_day: '' },
    hourly: { time: [now / 1000 + 3600, now / 1000 + 7200], temperature_2m: [0, 1], wind_speed_10m: [0, 2], pressure_msl: [1000, 1001], weather_code: [2, 45], is_day: [1, 0] } };
}
test('estado actual y horario conservan alineación y valores cero', () => {
  const parsed = parseCurrentWeather(payload(), now);
  assert.equal(parsed.weatherCode, 0); assert.equal(parsed.isDay, true);
  assert.equal(parsed.hourly[0].weatherCode, 2); assert.equal(parsed.hourly[1].weatherCode, 45);
  assert.equal(parsed.hourly[1].isDay, false); assert.equal(parsed.temperatureC, 0);
});
test('códigos faltantes, unidades inválidas y series cortas no eliminan otras variables', () => {
  const input = payload(); input.hourly.weather_code = [2]; input.current.weather_code = 200;
  input.hourly_units.is_day = 'invalid';
  const parsed = parseCurrentWeather(input, now);
  assert.equal(parsed.weatherCode, null); assert.equal(parsed.temperatureC, 0);
  assert.equal(parsed.hourly.length, 2);
  assert.equal(parsed.hourly[0].weatherCode, null); assert.equal(parsed.hourly[0].isDay, null);
  delete input.hourly.weather_code; delete input.current.is_day;
  assert.equal(parseCurrentWeather(input, now).isDay, null);
});
