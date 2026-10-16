import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link } from 'expo-router';
import * as Location from 'expo-location';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { fetchEarthquakes, unseenEarthquakes, type Earthquake, type Epicenter } from '@/providers/earthquakes';
import { readEarthquakeIds, writeEarthquakeIds } from '@/providers/earthquake-history';

const STORAGE_KEY = 'clima:earthquakes:seen:v1';
const INTERVAL = 120000;
type Snapshot = { events: Earthquake[]; center: Epicenter; checkedAt: number };
type Monitor = { enabled: boolean; busy: boolean; error: string; storageError: string; snapshot?: Snapshot; newCount: number; start: () => Promise<void>; stop: () => void; dismiss: () => void };
const Context = createContext<Monitor | null>(null);

export function EarthquakeMonitorProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [storageError, setStorageError] = useState('');
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [newCount, setNewCount] = useState(0);
  const seen = useRef(new Set<string>());
  const starting = useRef(false);
  async function start() {
    if (starting.current || enabled) return;
    starting.current = true; setBusy(true); setError(''); setStorageError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) throw new Error('Falta permiso de ubicación para consultar sismos cerca del teléfono. El clima manual sigue disponible.');
      // Cargar antes del primer ciclo para no volver a resaltar eventos ya mostrados.
      try {
        const ids = await readEarthquakeIds(AsyncStorage, STORAGE_KEY);
        ids.forEach((id) => seen.current.add(id));
      } catch { throw new Error('No pudimos leer los IDs guardados. Reintentá antes de iniciar para evitar avisos repetidos.'); }
      setEnabled(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'No pudimos iniciar el monitoreo.'); }
    finally { starting.current = false; setBusy(false); }
  }
  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    let running = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let request: AbortController | undefined;
    async function poll() {
      if (disposed || running || AppState.currentState !== 'active') return;
      running = true; setBusy(true); setError('');
      const controller = new AbortController(); request = controller;
      const timeout = setTimeout(() => controller.abort(), 20000);
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        if (!permission.granted) throw new Error('El permiso de ubicación no está disponible. Detené y volvé a iniciar después de habilitarlo en Ajustes.');
        if (!(await Location.hasServicesEnabledAsync())) throw new Error('La ubicación del teléfono está apagada. Activala para continuar.');
        const position = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<never>((_, reject) => {
            if (controller.signal.aborted) reject(new Error('Consulta cancelada.'));
            else controller.signal.addEventListener('abort', () => reject(new Error('No pudimos completar la consulta a tiempo.')), { once: true });
          }),
        ]);
        if (disposed || controller.signal.aborted || AppState.currentState !== 'active') return;
        if (Math.abs(Date.now() - position.timestamp) > 120000) throw new Error('La ubicación recibida está vencida.');
        const center = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        const events = await fetchEarthquakes(center, controller.signal);
        if (disposed || controller.signal.aborted || AppState.currentState !== 'active') return;
        const fresh = unseenEarthquakes(events, seen.current);
        events.forEach((event) => seen.current.add(event.id));
        setSnapshot({ center, events, checkedAt: Date.now() });
        setNewCount((count) => count + fresh.length);
        try { await writeEarthquakeIds(AsyncStorage, STORAGE_KEY, seen.current); setStorageError(''); }
        catch { setStorageError('No pudimos guardar los IDs. Evitamos repeticiones en esta sesión, pero podrían repetirse al reiniciar.'); }
      } catch (e) {
        if (!disposed && AppState.currentState === 'active') setError(e instanceof Error ? e.message : 'No pudimos consultar los sismos.');
      } finally {
        clearTimeout(timeout); running = false;
        if (!disposed) {
          setBusy(false);
          if (AppState.currentState === 'active') timer = setTimeout(() => { void poll(); }, INTERVAL);
        }
      }
    }
    const listener = AppState.addEventListener('change', (state) => {
      clearTimeout(timer);
      if (state !== 'active') { request?.abort(); setBusy(false); }
      else { void poll(); }
    });
    void poll();
    return () => { disposed = true; clearTimeout(timer); request?.abort(); listener.remove(); };
  }, [enabled]);
  const stop = () => { setEnabled(false); setNewCount(0); setBusy(false); };
  return <Context.Provider value={{ enabled, busy, error, storageError, snapshot, newCount, start, stop, dismiss: () => setNewCount(0) }}>{children}</Context.Provider>;
}

export function EarthquakeCard() {
  const monitor = useContext(Context);
  if (!monitor) throw new Error('Falta EarthquakeMonitorProvider');
  const { enabled, busy, snapshot, error, storageError, newCount } = monitor;
  const date = (time: number) => new Date(time).toLocaleString('es-AR');
  return <View style={styles.card}>
    <Text accessibilityRole="header" style={styles.title}>Sismos recientes cerca del teléfono</Text>
    <Text style={styles.text}>USGS · últimas 24 horas · radio aproximado de 200 km (1,8°).</Text>
    <Text style={styles.meta}>Consulta cada 2 minutos mientras la app está activa. Son eventos ya publicados, con posibles demoras y revisiones; no es alerta temprana ni predicción. La cobertura puede ser incompleta.</Text>
    <Text style={styles.meta}>Al iniciar enviamos tu ubicación puntual a USGS en cada ciclo. Solo guardamos IDs de eventos en este dispositivo para evitar repeticiones; no guardamos coordenadas. La búsqueda de clima es independiente.</Text>
    {__DEV__ && <Link href="/earthquake-demo" style={styles.link}>Probar eventos ficticios</Link>}
    <Pressable accessibilityRole="button" disabled={busy && !enabled} style={styles.button} onPress={() => { if (enabled) monitor.stop(); else void monitor.start(); }}><Text style={styles.buttonText}>{enabled ? 'Detener monitoreo sísmico' : busy ? 'Iniciando…' : 'Iniciar con mi ubicación'}</Text></Pressable>
    <Text style={styles.meta}>{enabled ? busy ? 'Consultando…' : 'Monitoreo activo solo en primer plano.' : 'Monitoreo detenido.'}</Text>
    {!!error && <Text accessibilityLiveRegion="polite" style={styles.text}>{error} La información no está actualizada.</Text>}
    {!!storageError && <Text style={styles.text}>{storageError}</Text>}
    {enabled && newCount > 0 && <View style={styles.notice}>
      <Text accessibilityLiveRegion="polite" style={styles.text}>{newCount} evento(s) publicado(s) que no habíamos mostrado. Pueden haber ocurrido antes de iniciar la consulta.</Text>
      <Pressable accessibilityRole="button" onPress={monitor.dismiss}><Text style={styles.link}>Entendido</Text></Pressable>
    </View>}
    {snapshot && <>
      <Text style={styles.meta}>Centro consultado: {snapshot.center.latitude.toFixed(3)}, {snapshot.center.longitude.toFixed(3)}. Última consulta exitosa: {date(snapshot.checkedAt)}. Horarios del teléfono.</Text>
      {snapshot.events.length === 0 ? <Text style={styles.text}>USGS no devolvió eventos para este radio y periodo. No significa ausencia de actividad o riesgo.</Text> : <>
        <Text style={styles.meta}>{snapshot.events.length} evento(s) devuelto(s). Se muestran los 5 más recientes.</Text>
        {snapshot.events.slice(0, 5).map((event) => <View key={event.id} style={styles.event}>
          <Text style={styles.text}>Magnitud {event.magnitude === null ? 'no informada' : event.magnitude.toFixed(1)} · {event.distanceKm.toFixed(0)} km del centro consultado</Text>
          <Text style={styles.text}>{event.place}</Text>
          <Text style={styles.meta}>{date(event.time)} · profundidad: {event.depthKm === null ? 'no informada' : `${event.depthKm.toFixed(1)} km`}</Text>
          <Pressable accessibilityRole="link" onPress={() => { void Linking.openURL(`https://earthquake.usgs.gov/earthquakes/eventpage/${encodeURIComponent(event.id)}`).catch(() => {}); }}><Text style={styles.link}>Ver evento en USGS</Text></Pressable>
        </View>)}
      </>}
    </>}
  </View>;
}
const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, gap: 12, borderColor: '#B4C9D1', borderWidth: 1 },
  title: { color: '#142F44', fontSize: 22, fontWeight: '700' }, text: { color: '#334B5D', fontSize: 16, lineHeight: 24 },
  meta: { color: '#52697A', fontSize: 14, lineHeight: 21 }, button: { backgroundColor: '#126271', padding: 16, borderRadius: 12 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', textAlign: 'center', fontSize: 16 },
  notice: { backgroundColor: '#FFF3D5', padding: 16, borderRadius: 12, gap: 8 },
  event: { borderTopColor: '#DCE6EA', borderTopWidth: 1, paddingTop: 12, gap: 6 }, link: { color: '#126271', fontWeight: '700', paddingVertical: 8 },
});
