import { defaultCardPreferences, validateCardPreferences, type CardPreferences } from './card-preferences.ts';

export type PreferencesTransport = {
  read(uid: string): Promise<CardPreferences | null>;
  save(uid: string, preferences: CardPreferences): Promise<void>;
};

export function createPreferencesStore(transport: PreferencesTransport, currentUid: () => string | null) {
  function ensure(uid: string) {
    if (!uid || uid.includes('/') || currentUid() !== uid) {
      throw Object.assign(new Error('La sesión cambió. Volvé a cargar tus preferencias.'), { code: 'preferences/session-changed' });
    }
  }
  return {
    async read(uid: string): Promise<CardPreferences> {
      ensure(uid);
      const result = await transport.read(uid);
      ensure(uid);
      return result === null ? defaultCardPreferences() : validateCardPreferences(result);
    },
    async save(uid: string, input: CardPreferences): Promise<void> {
      ensure(uid);
      const preferences = validateCardPreferences(input);
      await transport.save(uid, preferences);
      ensure(uid);
    },
  };
}
