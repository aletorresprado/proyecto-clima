import { isRunningInExpoGo } from 'expo';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { defaultCardPreferences, type CardPreferences } from '@/providers/card-preferences';
import type { createPreferencesStore } from '@/providers/card-preferences-store';

type Store = ReturnType<typeof createPreferencesStore>;
type State = { uid: string | null; status: 'disabled' | 'session' | 'anonymous' | 'loading' | 'ready' | 'error';
  preferences: CardPreferences; message: string; busy: boolean };
type Context = State & { reload: () => Promise<void>; save: (input: CardPreferences) => Promise<boolean> };
const PreferencesContext = createContext<Context | null>(null);
const defaults = () => ({ uid: null, preferences: defaultCardPreferences(), message: '', busy: false });

export function CardPreferencesProvider({ children }: { children: ReactNode }) {
  const enabled = process.env.EXPO_PUBLIC_CARD_PREFERENCES_ENABLED === '1'
    && Platform.OS === 'android' && !isRunningInExpoGo();
  const [state, setState] = useState<State>(() => ({ ...defaults(), status: enabled ? 'session' : 'disabled' }));
  const store = useRef<Store | null>(null);
  const owner = useRef<string | null>(null);
  const generation = useRef(0);
  const locked = useRef(false);
  const alive = useRef(false);

  const reload = useCallback(async () => {
    const uid = owner.current;
    if (!uid || !store.current || locked.current) return;
    const token = ++generation.current; locked.current = true;
    setState({ uid, status: 'loading', preferences: defaultCardPreferences(), message: '', busy: true });
    try {
      const preferences = await store.current.read(uid);
      if (alive.current && token === generation.current) setState({ uid, status: 'ready', preferences, message: '', busy: false });
    } catch {
      if (alive.current && token === generation.current) setState({ uid, status: 'error', preferences: defaultCardPreferences(),
        message: 'No pudimos cargar tus preferencias. Mostramos todas las tarjetas mientras tanto. Reintentá.', busy: false });
    } finally { if (token === generation.current) locked.current = false; }
  }, []);

  useEffect(() => {
    alive.current = true;
    if (!enabled) return () => { alive.current = false; };
    let active = true; let stop: (() => void) | undefined;
    void Promise.all([import('@/providers/account'), import('@/providers/card-preferences-cloud')])
      .then(async ([account, cloud]) => {
        if (!active) return;
        store.current = cloud.createCloudPreferencesStore();
        const unsubscribe = await account.observeAccount((user) => {
          if (!active) return;
          ++generation.current; locked.current = false; owner.current = user?.uid ?? null;
          setState({ ...defaults(), uid: owner.current, status: user ? 'loading' : 'anonymous' });
          if (user) void reload();
        });
        if (active) stop = unsubscribe; else unsubscribe();
      }).catch(() => { if (active) setState({ ...defaults(), status: 'error', message: 'No pudimos comprobar la sesión. Volvé a abrir la app para reintentar.' }); });
    return () => { active = false; alive.current = false; ++generation.current; locked.current = false;
      owner.current = null; store.current = null; stop?.(); };
  }, [enabled, reload]);

  const save = useCallback(async (input: CardPreferences) => {
    const uid = owner.current;
    if (!uid || !store.current || locked.current) return false;
    const token = ++generation.current; locked.current = true;
    setState((previous) => ({ ...previous, busy: true, message: '' }));
    try {
      await store.current.save(uid, input);
      if (!alive.current || token !== generation.current) return false;
      setState({ uid, status: 'ready', preferences: { ...input }, busy: false, message: 'Preferencias guardadas.' });
      return true;
    } catch {
      if (alive.current && token === generation.current) setState((previous) => ({ ...previous, busy: false,
        message: 'No pudimos guardar las preferencias. Revisá la conexión y reintentá. Tus cambios no se aplicaron.' }));
      return false;
    } finally { if (token === generation.current) locked.current = false; }
  }, []);

  return <PreferencesContext.Provider value={{ ...state, reload, save }}>{children}</PreferencesContext.Provider>;
}

export function useCardPreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('Falta el proveedor de preferencias.');
  return context;
}
