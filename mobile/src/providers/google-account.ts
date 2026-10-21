// Esta primera entrega de acceso se limita a Android con development build.
export async function requestGoogleIdToken(): Promise<string | null> {
  throw new Error('Acceso Google disponible en la app Android.');
}
export async function clearGoogleSession(): Promise<void> {}
