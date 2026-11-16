import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import { createEncryptedDiaryVault } from '../src/providers/encrypted-diary-vault.ts';

// Prueba del contrato con AES-256-GCM real de Node. No prueba módulos Android.
function setup() {
  const state = { raw: null, key: null, failWrite: false, failRemove: false, generated: 0 };
  const io = {
    readCiphertext: async () => state.raw,
    writeCiphertext: async (value) => { if (state.failWrite) throw Error('error ficticio'); state.raw = value; },
    removeCiphertext: async () => { if (state.failRemove) throw Error('error ficticio'); state.raw = null; },
    readKey: async () => state.key, writeKey: async (value) => { state.key = value; }, removeKey: async () => { state.key = null; },
  };
  const cipher = {
    generateKey: async () => { state.generated++; return randomBytes(32).toString('hex'); },
    encrypt: async (text, key) => {
      const iv = randomBytes(12); const aes = createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
      const encrypted = Buffer.concat([aes.update(text, 'utf8'), aes.final()]);
      return Buffer.concat([iv, encrypted, aes.getAuthTag()]).toString('base64');
    },
    decrypt: async (text, key) => {
      const data = Buffer.from(text, 'base64');
      const aes = createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), data.subarray(0, 12));
      aes.setAuthTag(data.subarray(-16));
      return Buffer.concat([aes.update(data.subarray(12, -16)), aes.final()]).toString('utf8');
    },
  };
  const validate = (value) => {
    if (!value || typeof value.note !== 'string' || Object.keys(value).length !== 1 || value.note.length > 300) throw Error('dato inválido');
    return { note: value.note };
  };
  const rebuild = () => createEncryptedDiaryVault(io, cipher, validate);
  return { state, vault: rebuild(), rebuild };
}
test('cifrado sin nota legible, Unicode recuperable tras reconstruir y nonce distinto', async () => {
  const { state, vault, rebuild } = setup();
  const value = { note: 'Nota ficticia: energía y ánimo 🌤️' };
  assert.equal(await vault.read(), null); assert.equal(state.key, null);
  await vault.write(value); const first = state.raw;
  assert.ok(!first.includes(value.note)); assert.ok(!first.includes(state.key));
  assert.deepEqual(await rebuild().read(), value);
  await vault.write(value); assert.notEqual(state.raw, first); assert.equal(state.generated, 1);
});
test('manipulación se rechaza y no se sobrescribe el contenido previo', async () => {
  const { state, vault } = setup(); await vault.write({ note: 'Ficticio' });
  const envelope = JSON.parse(state.raw); const data = Buffer.from(envelope.data, 'base64'); data[15] ^= 1;
  envelope.data = data.toString('base64'); state.raw = JSON.stringify(envelope); const corrupt = state.raw;
  await assert.rejects(vault.read(), { code: 'diary/unreadable' });
  await assert.rejects(vault.write({ note: 'Otro ficticio' }), { code: 'diary/unreadable' });
  assert.equal(state.raw, corrupt);
});
test('clave ausente no crea otra ni reemplaza diario existente', async () => {
  const { state, vault } = setup(); await vault.write({ note: 'Ficticio' });
  const previous = state.raw; state.key = null;
  await assert.rejects(vault.read(), { code: 'diary/key-missing' });
  await assert.rejects(vault.write({ note: 'Otro ficticio' }), { code: 'diary/key-missing' });
  assert.equal(state.generated, 1); assert.equal(state.raw, previous);
});
test('escritura/eliminación fallidas no se confirman ni borran clave necesaria', async () => {
  const { state, vault } = setup(); await vault.write({ note: 'Ficticio' }); const previous = state.raw;
  state.failWrite = true; await assert.rejects(vault.write({ note: 'Nuevo ficticio' })); assert.equal(state.raw, previous);
  state.failRemove = true; await assert.rejects(vault.clear()); assert.ok(state.key);
  state.failRemove = false; await vault.clear(); assert.equal(state.raw, null); assert.equal(state.key, null);
});
test('operaciones simultáneas usan una clave y datos inválidos no llegan a disco', async () => {
  const { state, vault } = setup();
  await Promise.all([vault.write({ note: 'Ficticio A' }), vault.write({ note: 'Ficticio B' })]);
  assert.equal(state.generated, 1); assert.deepEqual(await vault.read(), { note: 'Ficticio B' });
  const previous = state.raw;
  await assert.rejects(vault.write({ note: 'x'.repeat(301) }), { code: 'diary/invalid-data' }); assert.equal(state.raw, previous);
  state.raw = '{'; await assert.rejects(vault.read(), { code: 'diary/unreadable' });
});
