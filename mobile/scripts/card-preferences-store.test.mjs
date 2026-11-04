import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultCardPreferences } from '../src/providers/card-preferences.ts';
import { createPreferencesStore } from '../src/providers/card-preferences-store.ts';

test('documento ausente usa todas; valida respuestas y entradas antes de escribir', async () => {
  let response = null; let writes = 0;
  const store = createPreferencesStore({ read: async () => response, save: async () => { writes++; } }, () => 'A');
  assert.deepEqual(await store.read('A'), defaultCardPreferences());
  response = { ...defaultCardPreferences(), wind: false };
  assert.equal((await store.read('A')).wind, false);
  response = { wind: false };
  await assert.rejects(store.read('A'));
  await assert.rejects(store.save('A', response));
  assert.equal(writes, 0);
  await store.save('A', defaultCardPreferences());
  assert.equal(writes, 1);
});
test('bloquea cuentas ajenas, sesión ausente e identificadores con rutas', async () => {
  let calls = 0;
  const store = createPreferencesStore({ read: async () => { calls++; return null; }, save: async () => { calls++; } }, () => 'A');
  for (const uid of ['', 'B', 'A/other']) {
    await assert.rejects(store.read(uid));
    await assert.rejects(store.save(uid, defaultCardPreferences()));
  }
  assert.equal(calls, 0);
  const anonymous = createPreferencesStore({ read: async () => null, save: async () => {} }, () => null);
  await assert.rejects(anonymous.read('A'));
});
test('descarta lectura y confirmación de escritura si la sesión cambia durante la operación', async () => {
  for (const operation of ['read', 'save']) {
    let uid = 'A'; let finish;
    const pending = new Promise((resolve) => { finish = resolve; });
    const store = createPreferencesStore({ read: async () => { await pending; return defaultCardPreferences(); }, save: async () => { await pending; } }, () => uid);
    const result = operation === 'read' ? store.read('A') : store.save('A', defaultCardPreferences());
    const rejected = assert.rejects(result, { code: 'preferences/session-changed' });
    uid = 'B'; finish(); await rejected;
  }
});
test('error de conexión requiere otra operación explícita, sin confirmación de guardado', async () => {
  let failed = true; let writes = 0;
  const store = createPreferencesStore({ read: async () => null, save: async () => { writes++; if (failed) throw new Error('offline'); } }, () => 'A');
  await assert.rejects(store.save('A', defaultCardPreferences()));
  failed = false;
  assert.equal(writes, 1);
  await store.save('A', defaultCardPreferences());
  assert.equal(writes, 2);
});
