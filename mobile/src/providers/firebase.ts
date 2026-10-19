import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';

import { readFirebaseConfig } from './firebase-config';

// Inicialización explícita: importar este módulo no abre una sesión ni crea servicios.
export function getFirebaseClient(): FirebaseApp {
  const existing = getApps().find((app) => app.name === 'proyecto-clima');
  if (existing) return existing;

  return initializeApp(readFirebaseConfig({
    EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  }), 'proyecto-clima');
}
