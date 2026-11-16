// Base64 es un formato de transporte; AES nativo recibe los bytes originales.
export function diaryBase64Bytes(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}
