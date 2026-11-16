import test from 'node:test';
import assert from 'node:assert/strict';
import { metricPoints, buildMetricChart } from '../src/providers/weather-metric-chart.ts';

const now = Date.UTC(2026, 10, 16, 23, 30);
const data = (values) => values.map((value, i) => ({ time: now + (i + 1) * 3600000, value }));
test('probabilidad: escala fija hasta 100, extremos válidos y fuera de rango ausentes', () => {
  const chart = buildMetricChart(data([0, 50, 100, 101, -1, null]), 'probability');
  assert.equal(chart.upper, 100); assert.equal(chart.maximum, 100);
  assert.equal(chart.points[0].y, chart.bottom); assert.equal(chart.points[2].y, chart.top);
  assert.equal(chart.missing, 3);
});
test('viento/mm: cero válido, escala positiva, negativos/no finitos ausentes, sin mutación', () => {
  for (const metric of ['wind', 'amount']) {
    const input = data([0, 0]); const copy = structuredClone(input);
    const chart = buildMetricChart(input, metric);
    assert.equal(chart.upper, 1); assert.equal(chart.maximum, 0); assert.equal(chart.missing, 0);
    assert.deepEqual(input, copy);
    assert.equal(buildMetricChart(data([-1, Infinity, NaN]), metric), null);
    assert.equal(buildMetricChart(data([1, null]), metric).missing, 1);
  }
});
test('tiempos inválidos no dibujan; huecos conservan su distancia temporal', () => {
  assert.equal(buildMetricChart([], 'wind'), null);
  assert.equal(buildMetricChart(data([1, 2]).reverse(), 'wind'), null);
  assert.equal(buildMetricChart(data(Array(25).fill(1)), 'wind'), null);
  const input = data([1, 2, 3]); input[2].time += 3600000;
  const chart = buildMetricChart(input, 'wind');
  assert.ok(chart.points[2].x - chart.points[1].x > chart.points[1].x - chart.points[0].x);
});
test('precipitación separa probabilidad/mm, excluye intervalo comenzado y conserva medianoche', () => {
  const weather = { hourly: [{ time: now + 3600000, windKmh: 0 }], precipitationHourly: [
    { time: now + 1800000, probability: 20, amountMm: 1 },
    { time: now + 5400000, probability: 60, amountMm: null },
    { time: now + 9000000, probability: null, amountMm: 2 },
  ] };
  assert.equal(metricPoints(weather, 'wind', now)[0].value, 0);
  assert.deepEqual(metricPoints(weather, 'probability', now).map(p => p.value), [60, null]);
  assert.deepEqual(metricPoints(weather, 'amount', now).map(p => p.value), [null, 2]);
  assert.equal(metricPoints(weather, 'probability', now + 6000000).length, 0);
});
