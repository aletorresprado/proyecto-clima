export type FirebaseClientConfig = { apiKey: string; authDomain: string; projectId: string; appId: string };
export function readFirebaseConfig(env: Record<string, string | undefined>): FirebaseClientConfig {
  const get = (key: string) => {
    const value = env[key]?.trim();
    if (!value || /\s/.test(value) || /^(?:your|example|replace|tu[_-])/i.test(value)) throw new Error(`Completá ${key} con la configuración Web de Firebase.`);
    return value;
  };
  const config = {
    apiKey: get('EXPO_PUBLIC_FIREBASE_API_KEY'),
    authDomain: get('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: get('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
    appId: get('EXPO_PUBLIC_FIREBASE_APP_ID'),
  };
  if (config.projectId !== 'proyecto-clima-dev') throw new Error('La configuración no corresponde al proyecto de desarrollo acordado.');
  if (config.authDomain !== `${config.projectId}.firebaseapp.com`) throw new Error('Revisá authDomain en la configuración Web del proyecto de desarrollo.');
  if (!/^1:\d+:web:[a-f\d]+$/i.test(config.appId)) throw new Error('Usá el appId de la app Web, no el de Android.');
  return config;
}
