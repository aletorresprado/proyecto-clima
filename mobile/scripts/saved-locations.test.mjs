import assert from 'node:assert/strict';
import test from 'node:test';
import { validateSavedLocation } from '../src/providers/saved-locations.ts';

const place = { label: 'Localidad ficticia', latitude: -26, longitude: -65 };

test('normaliza nombre sin modificar entrada ni coordenadas', () => {
  const input = { ...place, label: '  Localidad ficticia  ' };
  assert.deepEqual(validateSavedLocation(input), place);
  assert.equal(input.label, '  Localidad ficticia  ');
});
test('admite cero y extremos geográficos inclusivos', () => {
  for (const latitude of [-90, 0, 90]) for (const longitude of [-180, 0, 180]) {
    assert.deepEqual(validateSavedLocation({ ...place, latitude, longitude }), { ...place, latitude, longitude });
  }
});
test('rechaza números no finitos, coordenadas fuera de rango y tipos incorrectos', () => {
  for (const field of ['latitude', 'longitude']) for (const value of [NaN, Infinity, -Infinity, null, undefined, '0', true]) {
    assert.throws(() => validateSavedLocation({ ...place, [field]: value }));
  }
  for (const latitude of [-90.0001, 90.0001]) assert.throws(() => validateSavedLocation({ ...place, latitude }));
  for (const longitude of [-180.0001, 180.0001]) assert.throws(() => validateSavedLocation({ ...place, longitude }));
});
test('valida nombre vacío, tipo y límite de longitud', () => {
  for (const label of ['', '  \t\n ', null, 42, 'a'.repeat(161)]) assert.throws(() => validateSavedLocation({ ...place, label }));
  assert.equal(validateSavedLocation({ ...place, label: 'a'.repeat(160) }).label.length, 160);
});
test('rechaza formatos inválidos y campos no previstos, sin filtrar su contenido', () => {
  for (const value of [null, undefined, [], 'lugar', 1, {}, { label: place.label, latitude: 0 }]) assert.throws(() => validateSavedLocation(value));
  for (const field of ['uid', 'email', 'symptoms', 'createdAt', 'updatedAt', 'timezone']) {
    assert.throws(() => validateSavedLocation({ ...place, [field]: 'dato-ficticio-privado' }), (error) => {
      assert.ok(!error.message.includes('dato-ficticio-privado'));
      return true;
    });
  }
});
