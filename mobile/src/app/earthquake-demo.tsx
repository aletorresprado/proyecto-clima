import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { readEarthquakeIds, writeEarthquakeIds } from '@/providers/earthquake-history';
import { unseenEarthquakes, type Earthquake } from '@/providers/earthquakes';

// Clave exclusiva de pruebas: nunca lee ni modifica el historial real.
const KEY = 'clima:earthquakes:demo-seen:v1';
export default function EarthquakeDemoScreen() {
  const seen = useRef(new Set<string>());
  const lock = useRef(false);
  const mounted = useRef(true);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState(0);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [event, setEvent] = useState<Earthquake>();
  useEffect(() => {
    mounted.current = true;
    void readEarthquakeIds(AsyncStorage, KEY).then((ids) => {
      if (!mounted.current) return;
      seen.current = ids; setCount(ids.size); setReady(true);
    }).catch(() => { if (mounted.current) setError('No pudimos leer el historial ficticio. Volvé a abrir esta pantalla.'); });
    return () => { mounted.current = false; };
  }, []);
  async function receive(id: string) {
    if (!ready || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    const sample: Earthquake = { id, place: 'Epicentro ficticio de prueba', time: Date.now() - 60000, magnitude: id.endsWith('a') ? 3.2 : 4.1, depthKm: 10, distanceKm: 75 };
    const fresh = unseenEarthquakes([sample], seen.current);
    const next = new Set([...seen.current, id]);
    try {
      await writeEarthquakeIds(AsyncStorage, KEY, next);
      if (!mounted.current) return;
      seen.current = next; setCount(next.size); setEvent(sample);
      setNotice(fresh.length ? `Evento nuevo ficticio: ${id}. Aviso mostrado una vez.` : 'Evento ya visto: no se repite el aviso.');
    } catch { if (mounted.current) setError('No pudimos guardar el ID ficticio. No se confirmó esta prueba.'); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  async function reset() {
    if (!ready || lock.current) return;
    lock.current = true; setBusy(true);
    try {
      await writeEarthquakeIds(AsyncStorage, KEY, new Set());
      if (!mounted.current) return;
      seen.current = new Set(); setCount(0); setEvent(undefined); setNotice('Prueba reiniciada. El historial real se conserva.'); setError('');
    } catch { if (mounted.current) setError('No pudimos reiniciar la prueba.'); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  const button = (title: string, onPress: () => void) => <Pressable accessibilityRole="button" disabled={!ready || busy} style={[styles.button, (!ready || busy) && { opacity: 0.5 }]} onPress={onPress}><Text style={styles.buttonText}>{title}</Text></Pressable>;
  return <ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.badge}>DATOS FICTICIOS · PRUEBA</Text>
    <Text style={styles.title}>Eventos sísmicos de prueba</Text>
    <Text style={styles.text}>No describen sismos reales. Esta pantalla no usa GPS ni consulta USGS. Guarda únicamente IDs ficticios, separados del monitoreo real.</Text>
    <Text style={styles.text}>IDs ficticios guardados: {count}{!ready && !error ? ' · cargando…' : ''}</Text>
    {button('Recibir evento A / repetir A', () => { void receive('demo-a'); })}
    {button('Recibir evento B / repetir B', () => { void receive('demo-b'); })}
    {!!notice && <View style={styles.notice}><Text accessibilityLiveRegion="polite" style={styles.text}>{notice}</Text></View>}
    {event && <View style={styles.card}>
      <Text style={styles.text}>{event.place}</Text>
      <Text style={styles.text}>Magnitud ficticia {event.magnitude} · distancia ficticia {event.distanceKm} km · profundidad ficticia {event.depthKm} km</Text>
      <Text style={styles.text}>ID: {event.id}</Text>
    </View>}
    {!!error && <Text accessibilityLiveRegion="polite" style={styles.text}>{error}</Text>}
    <Text style={styles.text}>Para comprobar persistencia: recibí A, volvé con Atrás, entrá otra vez y repetí A. Debe decir «Evento ya visto». Repetí después de recargar la app. B debe generar un aviso nuevo la primera vez.</Text>
    {button('Reiniciar solo la prueba ficticia', () => { void reset(); })}
  </ScrollView>;
}
const styles = StyleSheet.create({
  content: { padding: 24, gap: 16, backgroundColor: '#F3F7FA' }, badge: { color: '#725000', fontWeight: '800' },
  title: { color: '#142F44', fontSize: 26, fontWeight: '700' }, text: { color: '#334B5D', fontSize: 16, lineHeight: 24 },
  button: { backgroundColor: '#126271', padding: 16, borderRadius: 12 }, buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  notice: { padding: 16, backgroundColor: '#FFF3D5', borderRadius: 12 }, card: { padding: 20, backgroundColor: '#FFFFFF', borderRadius: 20, gap: 8 },
});
