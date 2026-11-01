import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { WeatherLocation } from '@/providers/current-weather';
import { savedPlacesMessage, type PlacesPage, type PlacesTransport } from '@/providers/saved-locations-store';

type Props = { uid: string | null; store: PlacesTransport; selected?: WeatherLocation;
  onSelect: (place: WeatherLocation) => void; fictitious?: boolean };

export function SavedLocationsPanel({ uid, store, selected, onSelect, fictitious = false }: Props) {
  const [view, setView] = useState<PlacesPage & { owner: string | null }>({ owner: null, places: [], nextCursor: null });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const generation = useRef(0);
  const owner = useRef(uid);
  owner.current = uid;
  const locked = useRef(false);
  const places = view.owner === uid ? view.places : [];
  const cursor = view.owner === uid ? view.nextCursor : null;
  const duplicate = !!selected && places.some((place) => place.latitude === selected.latitude && place.longitude === selected.longitude);

  useEffect(() => {
    const current = ++generation.current;
    locked.current = false; setBusy(false); setMessage(''); setNotice(''); setConfirmDelete(null);
    setView({ owner: uid, places: [], nextCursor: null });
    if (uid) {
      locked.current = true; setBusy(true);
      void store.list(uid).then((page) => {
        if (generation.current === current && owner.current === uid) setView({ ...page, owner: uid });
      }).catch((error: unknown) => {
        if (generation.current === current && owner.current === uid) setMessage(savedPlacesMessage(error));
      }).finally(() => {
        if (generation.current === current) { locked.current = false; setBusy(false); }
      });
    }
    return () => { ++generation.current; };
  }, [uid, store]);

  async function act(kind: 'refresh' | 'more' | 'save' | 'remove', id?: string) {
    if (!uid || locked.current) return;
    const current = generation.current;
    const stillCurrent = () => generation.current === current && owner.current === uid;
    locked.current = true; setBusy(true); setMessage(''); setNotice('');
    let committed = false;
    try {
      if (kind === 'save') {
        if (!selected || duplicate) return;
        await store.save(uid, { label: selected.label, latitude: selected.latitude, longitude: selected.longitude });
        committed = true;
      } else if (kind === 'remove') {
        if (!id) return;
        await store.remove(uid, id); committed = true;
      }
      if (!stillCurrent()) return;
      if (committed) {
        setNotice(kind === 'save' ? 'Lugar guardado.' : 'Lugar eliminado.');
        setConfirmDelete(null);
        // Retirar inmediatamente lo eliminado aunque falle la actualización de lista.
        if (kind === 'remove') setView((previous) => ({ ...previous, places: previous.places.filter((place) => place.id !== id) }));
      }
      const page = await store.list(uid, kind === 'more' ? cursor ?? undefined : undefined);
      if (stillCurrent()) setView((previous) => ({ owner: uid, nextCursor: page.nextCursor,
        places: kind === 'more' ? [...previous.places, ...page.places.filter((place) => !previous.places.some((saved) => saved.id === place.id))] : page.places }));
    } catch (error) {
      if (stillCurrent()) setMessage(committed ? 'La operación se completó, pero no pudimos actualizar la lista. Tocá Actualizar lugares.' : savedPlacesMessage(error));
    } finally {
      if (stillCurrent()) { locked.current = false; setBusy(false); }
    }
  }

  return <View style={styles.card}>
    <Text accessibilityRole="header" style={styles.title}>Lugares guardados{fictitious ? ' · prueba ficticia' : ''}</Text>
    {!uid ? <Text style={styles.body}>Iniciá sesión para ver tus lugares. El clima sigue disponible sin cuenta.</Text> : <>
      <Text style={styles.body}>{fictitious ? 'Esta prueba se guarda solo en memoria y se reinicia al salir de la pantalla.' : 'Al guardar, el nombre y las coordenadas del lugar se enviarán a Firebase y quedarán asociados a tu cuenta. Podés eliminarlos desde esta lista.'}</Text>
      <Text style={styles.body}>{selected ? `Lugar elegido: ${selected.label}` : 'Elegí primero una localidad para guardarla.'}</Text>
      <Pressable accessibilityRole="button" disabled={busy || !selected || duplicate} style={[styles.button, (busy || !selected || duplicate) && styles.disabled]} onPress={() => void act('save')}>
        <Text style={styles.buttonText}>{duplicate ? 'Ya está en esta lista' : 'Guardar lugar elegido'}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" disabled={busy} style={styles.action} onPress={() => void act('refresh')}><Text style={styles.link}>Actualizar lugares</Text></Pressable>
      {busy && <ActivityIndicator accessibilityLabel="Actualizando lugares" />}
      {!!notice && <Text accessibilityLiveRegion="polite" style={styles.body}>{notice}</Text>}
      {!!message && <Text accessibilityLiveRegion="polite" style={styles.body}>{message}</Text>}
      {!busy && !message && places.length === 0 && <Text style={styles.caption}>Todavía no hay lugares guardados.</Text>}
      {places.map((place) => <View key={place.id} style={styles.row}>
        <Pressable accessibilityRole="button" disabled={busy} style={styles.action} onPress={() => onSelect(place)}><Text style={styles.link}>Elegir {place.label}</Text></Pressable>
        {confirmDelete === place.id ? <>
          <Text style={styles.caption}>¿Eliminar {place.label} de tus lugares guardados?</Text>
          <Pressable accessibilityRole="button" disabled={busy} style={styles.action} onPress={() => void act('remove', place.id)}><Text style={styles.link}>Confirmar eliminación</Text></Pressable>
          <Pressable accessibilityRole="button" disabled={busy} style={styles.action} onPress={() => setConfirmDelete(null)}><Text style={styles.link}>Cancelar</Text></Pressable>
        </> : <Pressable accessibilityRole="button" disabled={busy} style={styles.action} onPress={() => setConfirmDelete(place.id)}><Text style={styles.link}>Eliminar</Text></Pressable>}
      </View>)}
      {cursor && <Pressable accessibilityRole="button" disabled={busy} style={styles.action} onPress={() => void act('more')}><Text style={styles.link}>Ver más lugares</Text></Pressable>}
    </>}
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, gap: 12 },
  title: { color: '#142F44', fontSize: 22, fontWeight: '700' },
  body: { color: '#334B5D', fontSize: 15, lineHeight: 23 },
  caption: { color: '#52697A', fontSize: 14, lineHeight: 21 },
  button: { backgroundColor: '#126271', padding: 16, borderRadius: 12 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16, textAlign: 'center' },
  disabled: { opacity: 0.5 },
  action: { paddingVertical: 12 },
  link: { color: '#126271', fontWeight: '700', fontSize: 16 },
  row: { borderTopWidth: 1, borderTopColor: '#D7E4EC', paddingTop: 8 },
});
