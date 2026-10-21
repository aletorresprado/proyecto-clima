import assert from 'node:assert/strict';
import test from 'node:test';
import { accountErrorMessage, readGoogleIdToken } from '../src/providers/account-messages.ts';

test('cancelación no entrega una credencial a Firebase', () => {
  assert.equal(readGoogleIdToken({ type: 'cancelled', data: null }), null);
});
test('rechaza respuesta incompleta o no reconocida', () => {
  for (const response of [
    { type: 'success', data: null },
    { type: 'success', data: { idToken: ' ' } },
    { type: 'success', data: { idToken: 42 } },
    { type: 'noSavedCredentialFound', data: null },
    { type: 'unknown', data: { idToken: 'ficticio' } },
  ]) assert.throws(() => readGoogleIdToken(response));
});
test('entrega la credencial solo en una respuesta exitosa completa', () => {
  assert.equal(readGoogleIdToken({ type: 'success', data: { idToken: 'token-ficticio' } }), 'token-ficticio');
});
test('los mensajes no exponen errores externos ni datos de cuenta', () => {
  for (const error of [null, 'dato-ficticio-privado', new Error('dato-ficticio-privado'),
    { code: 'auth/network-request-failed', message: 'dato-ficticio-privado' },
    { code: 'DEVELOPER_ERROR', userInfo: { token: 'dato-ficticio-privado' } }]) {
    assert.ok(!accountErrorMessage(error).includes('dato-ficticio-privado'));
  }
  assert.match(accountErrorMessage({ code: 'auth/network-request-failed' }), /conexión/);
  assert.match(accountErrorMessage({ code: 'PLAY_SERVICES_NOT_AVAILABLE' }), /Google Play Services/);
});
