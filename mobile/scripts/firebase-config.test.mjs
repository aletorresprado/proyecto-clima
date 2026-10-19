import assert from 'node:assert/strict';
import test from 'node:test';
import { readFirebaseConfig } from '../src/providers/firebase-config.ts';

const valid = {
  EXPO_PUBLIC_FIREBASE_API_KEY: 'fictitious-key',
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: 'proyecto-clima-dev.firebaseapp.com',
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'proyecto-clima-dev',
  EXPO_PUBLIC_FIREBASE_APP_ID: '1:123456:web:abcdef',
};

test('acepta configuración Web de desarrollo ficticia', () => {
  assert.equal(readFirebaseConfig(valid).projectId, 'proyecto-clima-dev');
});

test('rechaza cada campo ausente sin revelar los otros valores', () => {
  for (const field of Object.keys(valid)) {
    assert.throws(() => readFirebaseConfig({ ...valid, [field]: '' }), (error) => {
      assert.ok(error.message.includes(field));
      assert.ok(!error.message.includes(valid.EXPO_PUBLIC_FIREBASE_API_KEY));
      return true;
    });
  }
});

test('rechaza proyecto, dominio y tipo de app incorrectos', () => {
  for (const [field, value] of [
    ['EXPO_PUBLIC_FIREBASE_PROJECT_ID', 'otro-proyecto'],
    ['EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', 'otro.firebaseapp.com'],
    ['EXPO_PUBLIC_FIREBASE_APP_ID', '1:123456:android:abcdef'],
  ]) assert.throws(() => readFirebaseConfig({ ...valid, [field]: value }));
});
