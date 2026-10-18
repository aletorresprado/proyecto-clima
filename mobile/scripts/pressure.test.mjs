import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePressure } from '../src/rules/pressure.ts';
const H = 3600000;
const now = Date.UTC(2026, 9, 18, 23);
const input = () => ({ locationId: 'a', locationLabel: 'Prueba', fetchedAt: now, hours: Array.from({ length: 24 }, (_, i) => ({ time: now + (i + 1) * H, seaLevelPressureHpa: 1012 + i * 0.5 })) });
test('compara primera hora futura y +3h, cruza medianoche, valores y diferencia en hPa', () => {
  const r = evaluatePressure(input(), now);
  assert.equal(r.state, 'ready'); assert.equal(r.start, Date.UTC(2026, 9, 19, 0)); assert.equal(r.end - r.start, 3 * H);
  assert.equal(r.initialHpa, 1012); assert.equal(r.finalHpa, 1013.5); assert.equal(r.deltaHpa, 1.5); assert.equal(r.direction, 'increase');
});
test('descenso y redondeo simétrico, cero sin signo negativo', () => {
  for (const [delta, expected, direction] of [[-1.5,-1.5,'decrease'], [0.05,0.1,'increase'],[-0.05,-0.1,'decrease'],[0.049,0,'unchanged'],[-0.049,0,'unchanged'],[0,0,'unchanged']]) {
    const sample = input(); sample.hours[3].seaLevelPressureHpa = 1012 + delta;
    const r = evaluatePressure(sample, now); assert.equal(r.deltaHpa, expected); assert.equal(r.direction, direction);
    assert.equal(Object.is(r.deltaHpa, -0), false);
  }
});
test('valores inválidos, incluso intermedios, no saltan a otra ventana válida', () => {
  for (const value of [null, undefined, 0, -1, NaN, Infinity]) {
    for (const i of [0,1,2,3]) {
      const sample = input(); sample.hours[i].seaLevelPressureHpa = value;
      assert.equal(evaluatePressure(sample, now).state, 'insufficient');
    }
  }
});
test('huecos, duplicados, serie corta o primera hora muy lejana no se interpolan', () => {
  const gap = input(); gap.hours.splice(1, 1); assert.equal(evaluatePressure(gap, now).reason, 'invalid');
  const duplicate = input(); duplicate.hours[1].time = duplicate.hours[0].time; assert.equal(evaluatePressure(duplicate, now).reason, 'invalid');
  const short = input(); short.hours = short.hours.slice(0, 3); assert.equal(evaluatePressure(short, now).reason, 'missing');
  const late = input(); late.hours.shift(); assert.equal(evaluatePressure(late, now).reason, 'missing');
  assert.equal(evaluatePressure({ ...input(), hours: null }, now).reason, 'missing');
});
test('vigencia exacta, futuro inválido y ventana siguiente al pasar inicio', () => {
  const sample = input();
  const first = evaluatePressure(sample, now);
  assert.equal(first.expiresAt, now + H);
  const next = evaluatePressure(sample, now + H);
  assert.equal(next.state, 'ready'); assert.equal(next.start, now + 2 * H); assert.equal(next.end, now + 5 * H);
  assert.equal(evaluatePressure(sample, now + H + 1).reason, 'expired');
  assert.equal(evaluatePressure(sample, now - 1).reason, 'invalid');
});
test('determinista, no muta y conserva identidad de tarjeta por lugar', () => {
  const sample = input(); const before = structuredClone(sample); const r = evaluatePressure(sample, now);
  assert.deepEqual(evaluatePressure(sample, now), r); assert.deepEqual(sample, before);
  assert.equal(evaluatePressure(sample, now + H).id, r.id);
  assert.notEqual(evaluatePressure({ ...sample, locationId: 'b' }, now).id, r.id);
});
