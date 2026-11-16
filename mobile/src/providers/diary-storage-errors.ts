const messages: Record<string, string> = {
  'diary/platform': 'Esta prueba requiere la app Android propia, no Expo Go.',
  'diary/aes-unavailable': 'El APK abierto no tiene disponible el módulo AES. Verificá que instalaste la actualización de desarrollo.',
  'diary/secure-store-unavailable': 'SecureStore no está disponible en la app abierta. Revisemos la instalación del APK.',
  'diary/native-initialization': 'No se pudieron inicializar los módulos de cifrado de esta instalación.',
  'diary/key-generation': 'Falló la generación de la clave de prueba. No se confirmó el guardado.',
  'diary/key-read': 'No se pudo leer la clave protegida. No se modificaron los datos.',
  'diary/key-write': 'No se pudo guardar la clave protegida. No se confirmó el guardado.',
  'diary/key-delete': 'No se pudo eliminar la clave de prueba.',
  'diary/ciphertext-read': 'No se pudo leer el bloque cifrado del dispositivo.',
  'diary/ciphertext-write': 'No se pudo guardar el bloque cifrado. No se confirmó el guardado.',
  'diary/ciphertext-delete': 'No se pudo eliminar el bloque de prueba. Se conservó su clave.',
  'diary/encrypt': 'Falló el cifrado del texto ficticio. No se confirmó el guardado.',
  'diary/key-missing': 'La clave necesaria falta o no es válida. Se conservó el bloque existente, sin reemplazarlo.',
  'diary/unreadable': 'No se pudo descifrar o validar el bloque existente. Se conservó sin reemplazarlo.',
  'diary/key-import': 'No se pudo preparar la clave para leer. Se conservó el bloque.',
  'diary/block-format': 'No se pudo reconstruir el bloque cifrado. Se conservó sin reemplazarlo.',
  'diary/decrypt': 'El motor AES no pudo descifrar el bloque. Se conservó sin reemplazarlo.',
  'diary/text-decode': 'No se pudo interpretar el texto descifrado. Se conservó el bloque.',
  'diary/invalid-data': 'Los datos de la prueba no cumplen el formato esperado.',
  'diary/storage': 'La operación local no se pudo completar. No se confirmó el cambio.',
};
export const safeDiaryCodes = new Set(Object.keys(messages));
export function diaryStorageError(code: string) {
  return Object.assign(new Error('No se confirmó la operación del diario.'), { code });
}
export function diaryStorageMessage(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
    && safeDiaryCodes.has(error.code) ? error.code : 'diary/storage';
  return `${messages[code]} Código: ${code}.`;
}
