import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultCardPreferences, validateCardPreferences, createCardPreferencesDemo } from '../src/providers/card-preferences.ts';

test('contrato estricto: faltantes, campos extra y tipos incorrectos no se guardan', () => {
  const defaults = defaultCardPreferences();
  assert.deepEqual(validateCardPreferences(defaults), defaults);
  for (const input of [null, [], {}, { ...defaults, wind: 1 }, { ...defaults, extra: true }]) {
    assert.throws(() => validateCardPreferences(input));
  }
  const { uv, ...missing } = defaults;
  assert.throws(() => validateCardPreferences(missing));
  assert.equal(validateCardPreferences({ ...defaults, wind: false }).wind, false);
});
test('cuentas independientes, copias defensivas y ausencia de sesión', () => {
  const store = createCardPreferencesDemo();
  const a = { ...defaultCardPreferences(), wind: false };
  store.save('A', a); a.uv = false;
  assert.equal(store.read('A').uv, true);
  assert.equal(store.read('A').wind, false);
  assert.equal(store.read('B').wind, true);
  const read = store.read('A'); read.pressure = false;
  assert.equal(store.read('A').pressure, true);
  assert.throws(() => store.save(null, a));
  store.save('A', defaultCardPreferences());
  assert.deepEqual(store.read('A'), defaultCardPreferences());
  assert.equal(createCardPreferencesDemo().read('A').wind, true);
});
