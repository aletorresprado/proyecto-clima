export function accountErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
  if (code === 'auth/network-request-failed') return 'No pudimos conectar. Revisá tu conexión y reintentá.';
  if (code === 'PLAY_SERVICES_NOT_AVAILABLE') return 'Google Play Services no está disponible o necesita actualizarse.';
  if (code === 'auth/too-many-requests') return 'Hubo demasiados intentos. Esperá un momento antes de reintentar.';
  if (code === 'auth/user-disabled') return 'Esta cuenta está inhabilitada para acceder a la app.';
  return 'No pudimos completar la operación. Reintentá; podés seguir consultando el clima sin cuenta.';
}

export function readGoogleIdToken(response: { type: string; data: { idToken?: unknown } | null }): string | null {
  if (response.type === 'cancelled') return null;
  if (response.type !== 'success' || typeof response.data?.idToken !== 'string' || !response.data.idToken.trim()) {
    throw new Error('Google no entregó una credencial válida.');
  }
  return response.data.idToken;
}
