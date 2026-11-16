import test from 'node:test';
import assert from 'node:assert/strict';
import { diaryBase64Bytes } from '../src/providers/diary-binary.ts';

test('reconstruye todos los valores de byte sin tratarlos como texto UTF-8', () => {
  const original = Uint8Array.from({ length: 256 }, (_, index) => index);
  assert.deepEqual(diaryBase64Bytes(Buffer.from(original).toString('base64')), original);
  assert.throws(() => diaryBase64Bytes('!base64 inválido!'));
});
