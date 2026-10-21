import { readGoogleIdToken } from './account-messages';

async function googleClient() {
  // No importar el paquete nativo al cargar pantallas en Expo Go.
  const { GoogleOneTapSignIn } = await import('react-native-nitro-google-signin');
  GoogleOneTapSignIn.configure({ webClientId: 'autoDetect', offlineAccess: false });
  return GoogleOneTapSignIn;
}

export async function requestGoogleIdToken(): Promise<string | null> {
  const google = await googleClient();
  await google.checkPlayServices();
  try {
    return readGoogleIdToken(await google.presentExplicitSignIn());
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'SIGN_IN_CANCELLED') return null;
    throw error;
  }
}

export async function clearGoogleSession(): Promise<void> {
  await (await googleClient()).signOut();
}
