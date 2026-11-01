import { isRunningInExpoGo } from 'expo';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import type { WeatherLocation } from '@/providers/current-weather';
import type { Account } from '@/providers/account';
import type { PlacesTransport } from '@/providers/saved-locations-store';
import { SavedLocationsPanel } from './saved-locations-panel';

type Props = { selected?: WeatherLocation; onSelect: (place: WeatherLocation, uid: string) => void;
  onSessionChange: (uid: string | null) => void };

export function SavedLocationsCard(props: Props) {
  const enabled = process.env.EXPO_PUBLIC_SAVED_LOCATIONS_ENABLED === '1'
    && Platform.OS === 'android' && !isRunningInExpoGo();
  const [account, setAccount] = useState<Account | null>();
  const [store, setStore] = useState<PlacesTransport>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let active = true; let unsubscribe: (() => void) | undefined;
    void Promise.all([import('@/providers/account'), import('@/providers/saved-locations-cloud')])
      .then(async ([session, cloud]) => {
        if (!active) return;
        setStore(cloud.createCloudPlacesStore());
        const stop = await session.observeAccount((user) => {
          if (active) { setAccount(user); props.onSessionChange(user?.uid ?? null); }
        });
        if (active) unsubscribe = stop; else stop();
      }).catch(() => { if (active) { setAccount(undefined); setFailed(true); } });
    return () => { active = false; unsubscribe?.(); };
  }, [enabled, props.onSessionChange]);

  return <View style={{ gap: 12 }}>
    {enabled && (failed ? <Text>No pudimos recuperar tus lugares. Volvé a abrir la app para reintentar.</Text>
      : account === undefined || !store ? <Text>Comprobando tus lugares…</Text>
        : <SavedLocationsPanel uid={account?.uid ?? null} store={store} selected={props.selected}
          onSelect={(place) => { if (account) props.onSelect(place, account.uid); }} />)}
    {__DEV__ && <Link href="/saved-locations-demo" style={{ color: '#126271', fontWeight: '700', paddingVertical: 12 }}>Probar lugares guardados con datos ficticios →</Link>}
  </View>;
}
