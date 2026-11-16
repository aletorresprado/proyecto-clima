import test from 'node:test';
import assert from 'node:assert/strict';
import { diaryStorageMessage } from '../src/providers/diary-storage-errors.ts';
test('distingue módulo faltante, cifrado y escritura sin exponer errores internos', () => {
  assert.match(diaryStorageMessage({ code: 'diary/aes-unavailable' }), /módulo AES/);
  assert.match(diaryStorageMessage({ code: 'diary/encrypt' }), /Falló el cifrado/);
  assert.match(diaryStorageMessage({ code: 'diary/key-write' }), /clave protegida/);
  for (const error of [new Error('secreto ficticio'), { code: 'diary/secreto ficticio', message: 'secreto ficticio' }]) {
    const message = diaryStorageMessage(error);
    assert.ok(!message.includes('secreto ficticio')); assert.match(message, /diary\/storage/);
  }
});
