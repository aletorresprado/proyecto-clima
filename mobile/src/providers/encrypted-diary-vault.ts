import { safeDiaryCodes } from './diary-storage-errors.ts';

export type DiaryVaultIO = {
  readCiphertext(): Promise<string | null>; writeCiphertext(value: string): Promise<void>; removeCiphertext(): Promise<void>;
  readKey(): Promise<string | null>; writeKey(value: string): Promise<void>; removeKey(): Promise<void>;
};
export type DiaryCipher = {
  generateKey(): Promise<string>;
  encrypt(plaintext: string, key: string): Promise<string>;
  decrypt(ciphertext: string, key: string): Promise<string>;
};
const FORMAT = 'clima.diary.aes-gcm.v1';
const MAX_PLAINTEXT = 262144;
function failure(code: string) {
  return Object.assign(new Error('No pudimos completar la operación local del diario. No se confirmó el cambio.'), { code });
}
function keyValid(key: string | null): key is string { return typeof key === 'string' && /^[a-f0-9]{64}$/i.test(key); }

// La interfaz nativa provee AES-GCM; aquí no se implementa criptografía propia.
// Cada instancia serializa operaciones para evitar carreras al crear la clave/escribir.
export function createEncryptedDiaryVault<T>(io: DiaryVaultIO, cipher: DiaryCipher, validate: (value: unknown) => T,
  queue: { pending: Promise<unknown> } = { pending: Promise.resolve() }) {
  function run<R>(operation: () => Promise<R>): Promise<R> {
    const result = queue.pending.then(operation).catch((error: unknown) => {
      const code = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
        && safeDiaryCodes.has(error.code) ? error.code : 'diary/storage';
      throw failure(code);
    });
    queue.pending = result.then(() => undefined, () => undefined);
    return result;
  }
  async function decode(raw: string, key: string | null): Promise<T> {
    if (!keyValid(key)) throw failure('diary/key-missing');
    try {
      if (raw.length > 1048576) throw new Error();
      const envelope: unknown = JSON.parse(raw);
      if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)
        || Object.keys(envelope).length !== 2 || !('format' in envelope) || envelope.format !== FORMAT
        || !('data' in envelope) || typeof envelope.data !== 'string' || !envelope.data) throw new Error();
      const plaintext = await cipher.decrypt(envelope.data, key);
      if (plaintext.length > MAX_PLAINTEXT) throw new Error();
      return validate(JSON.parse(plaintext));
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
      if (typeof code === 'string' && ['diary/key-import', 'diary/block-format', 'diary/decrypt', 'diary/text-decode'].includes(code)) throw failure(code);
      throw failure('diary/unreadable');
    }
  }
  return {
    read: () => run(async (): Promise<T | null> => {
      const raw = await io.readCiphertext();
      return raw === null ? null : decode(raw, await io.readKey());
    }),
    write: (value: T) => run(async () => {
      let plaintext: string;
      try {
        plaintext = JSON.stringify(validate(value));
        if (typeof plaintext !== 'string' || plaintext.length > MAX_PLAINTEXT) throw new Error();
      } catch { throw failure('diary/invalid-data'); }
      const previous = await io.readCiphertext();
      let key = await io.readKey();
      // Comprobar antes de sobrescribir: nunca convertir corrupción en diario vacío.
      if (previous !== null) await decode(previous, key);
      if (key === null) {
        key = await cipher.generateKey();
        if (!keyValid(key)) throw failure('diary/key-missing');
        await io.writeKey(key);
      }
      if (!keyValid(key)) throw failure('diary/key-missing');
      const data = await cipher.encrypt(plaintext, key);
      if (!data || data.length > 1048500) throw failure('diary/invalid-data');
      await io.writeCiphertext(JSON.stringify({ format: FORMAT, data }));
    }),
    clear: () => run(async () => {
      // Si falla borrar el bloque, conservar la clave para no volverlo irrecuperable.
      await io.removeCiphertext();
      await io.removeKey();
    }),
  };
}
