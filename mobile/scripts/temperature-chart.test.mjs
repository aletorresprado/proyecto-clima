import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTemperatureChart } from '../src/providers/temperature-chart.ts';

const start = Date.UTC(2026, 10, 16, 23);
const samples = (values) => values.map((temperatureC, i) => ({ time: start + i * 3600000, temperatureC }));
test('escala conserva negativos y cero, orden temporal y extremos', () => {
  const input = samples([-4, 0, 6]); const before = structuredClone(input);
  const chart = buildTemperatureChart(input);
  assert.equal(chart.minimum, -4); assert.equal(chart.maximum, 6);
  assert.equal(chart.points[1].value, 0);
  assert.ok(chart.points[0].y > chart.points[1].y && chart.points[1].y > chart.points[2].y);
  assert.ok(chart.points[0].x < chart.points[1].x);
  assert.equal(chart.segments.length, 1);
  assert.deepEqual(input, before);
});
test('datos ausentes o inválidos cortan curva sin convertirse en cero', () => {
  const chart = buildTemperatureChart(samples([3, null, 4, NaN, 5]));
  assert.equal(chart.missing, 2); assert.equal(chart.segments.length, 3);
  assert.equal(chart.points[1].value, null); assert.equal(chart.points[1].y, null);
  const gap = samples([1, 2]); gap[1].time += 3600000;
  assert.equal(buildTemperatureChart(gap).segments.length, 2);
});
test('constante y único punto tienen escala válida; vacíos o tiempos inválidos no dibujan', () => {
  for (const values of [[0], [2, 2, 2]]) {
    const chart = buildTemperatureChart(samples(values));
    assert.ok(chart.points.every((p) => Number.isFinite(p.y)));
    assert.ok(chart.ticks[0].value > chart.ticks[2].value);
  }
  for (const input of [[], samples([null, null]), samples([1, 2]).reverse(), [{ time: NaN, temperatureC: 1 }], samples(Array(25).fill(1))]) assert.equal(buildTemperatureChart(input), null);
});
