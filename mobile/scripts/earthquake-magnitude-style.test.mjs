import test from 'node:test';
import assert from 'node:assert/strict';
import { magnitudeStyle } from '../src/providers/earthquake-magnitude-style.ts';

test('límites de escala visual: menor de 3, entre 3 y 6 inclusive, mayor de 6', () => {
  const blue = magnitudeStyle(2.999).backgroundColor;
  const orange = magnitudeStyle(3).backgroundColor;
  const red = magnitudeStyle(6.001).backgroundColor;
  assert.notEqual(blue, orange); assert.notEqual(orange, red);
  assert.equal(magnitudeStyle(0).backgroundColor, blue);
  assert.equal(magnitudeStyle(-1).backgroundColor, blue);
  assert.equal(magnitudeStyle(6).backgroundColor, orange);
  assert.equal(magnitudeStyle(7).backgroundColor, red);
});
test('ausente o inválido no se presenta como magnitud baja', () => {
  for (const value of [null, NaN, Infinity]) assert.equal(magnitudeStyle(value).range, 'Magnitud no informada');
  assert.notEqual(magnitudeStyle(null).backgroundColor, magnitudeStyle(0).backgroundColor);
});
