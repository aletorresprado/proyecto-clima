import AsyncStorage from '@react-native-async-storage/async-storage';
import { isRunningInExpoGo, requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';
import { createEncryptedDiaryVault } from './encrypted-diary-vault';
import { diaryStorageError } from './diary-storage-errors';
import { diaryBase64Bytes } from './diary-binary';

const CIPHERTEXT_KEY = 'clima:diary:encrypted:v1';
const SECRET_KEY = 'clima.diary.key.v1';
const queue: { pending: Promise<unknown> } = { pending: Promise.resolve() };

export function diagnoseDiaryModules() {
  const present = (name: string) => { try { return requireOptionalNativeModule(name) !== null; } catch { return false; } };
  return { androidOwnApp: Platform.OS === 'android' && !isRunningInExpoGo(),
    aes: present('ExpoCryptoAES'), secureStore: present('ExpoSecureStore'),
    textEncoding: typeof TextEncoder === 'function' && typeof TextDecoder === 'function' };
}
async function stage<T>(code: string, operation: () => Promise<T>): Promise<T> {
  try { return await operation(); } catch { throw diaryStorageError(code); }
}

// Requiere APK que incluya ambos módulos nativos. Importación diferida desde prueba.
export async function createAndroidDiaryVault<T>(validate: (input: unknown) => T, mode: 'diary' | 'test' = 'diary') {
  const modules = diagnoseDiaryModules();
  if (!modules.androidOwnApp) throw diaryStorageError('diary/platform');
  if (!modules.aes) throw diaryStorageError('diary/aes-unavailable');
  if (!modules.secureStore) throw diaryStorageError('diary/secure-store-unavailable');
  if (!modules.textEncoding) throw diaryStorageError('diary/native-initialization');
  let Crypto: typeof import('expo-crypto');
  let SecureStore: typeof import('expo-secure-store');
  try {
    [Crypto, SecureStore] = await Promise.all([import('expo-crypto'), import('expo-secure-store')]);
    if (!await SecureStore.isAvailableAsync()) throw new Error();
  } catch { throw diaryStorageError('diary/native-initialization'); }
  const suffix = mode === 'test' ? '.test' : '';
  const options = { keychainService: `clima.diary${suffix}.v1`, requireAuthentication: false };
  const aad = new TextEncoder().encode(`clima.diary${suffix}.aes-gcm.v1`);
  return createEncryptedDiaryVault({
    readCiphertext: () => stage('diary/ciphertext-read', () => AsyncStorage.getItem(CIPHERTEXT_KEY + suffix)),
    writeCiphertext: (value) => stage('diary/ciphertext-write', () => AsyncStorage.setItem(CIPHERTEXT_KEY + suffix, value)),
    removeCiphertext: () => stage('diary/ciphertext-delete', () => AsyncStorage.removeItem(CIPHERTEXT_KEY + suffix)),
    readKey: () => stage('diary/key-read', () => SecureStore.getItemAsync(SECRET_KEY + suffix, options)),
    writeKey: (value) => stage('diary/key-write', () => SecureStore.setItemAsync(SECRET_KEY + suffix, value, options)),
    removeKey: () => stage('diary/key-delete', () => SecureStore.deleteItemAsync(SECRET_KEY + suffix, options)),
  }, {
    async generateKey() { return stage('diary/key-generation', async () => (await Crypto.AESEncryptionKey.generate(Crypto.AESKeySize.AES256)).encoded('hex')); },
    async encrypt(plaintext, hex) {
      return stage('diary/encrypt', async () => {
      const key = await Crypto.AESEncryptionKey.import(hex, 'hex');
      const sealed = await Crypto.aesEncryptAsync(new TextEncoder().encode(plaintext), key,
        { nonce: { length: 12 }, tagLength: 16, additionalData: aad });
      return sealed.combined('base64');
      });
    },
    async decrypt(ciphertext, hex) {
      const key = await stage('diary/key-import', () => Crypto.AESEncryptionKey.import(hex, 'hex'));
      const sealed = await stage('diary/block-format', async () =>
        Crypto.AESSealedData.fromCombined(diaryBase64Bytes(ciphertext), { ivLength: 12, tagLength: 16 }));
      const bytes = await stage('diary/decrypt', () => Crypto.aesDecryptAsync(sealed, key, { output: 'bytes', additionalData: aad }));
      return stage('diary/text-decode', async () => new TextDecoder().decode(bytes));
    },
  }, validate, queue);
}
