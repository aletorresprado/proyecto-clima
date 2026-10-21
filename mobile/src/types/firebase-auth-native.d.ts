import type { AsyncStorageStatic } from '@react-native-async-storage/async-storage';
import type { Persistence } from 'firebase/auth';

// Firebase 13 expone esta función en su entrada react-native, pero su entrada
// pública de tipos omite la exportación. Mantener junto al adaptador .native.ts
// y revisar al actualizar Firebase. No usar esta función desde la variante web.
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: AsyncStorageStatic): Persistence;
}
