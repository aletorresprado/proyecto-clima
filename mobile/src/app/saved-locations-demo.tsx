import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SavedLocationsPanel } from '@/components/saved-locations-panel';
import { createDemoPlacesStore } from '@/providers/saved-locations-demo';
import type { WeatherLocation } from '@/providers/current-weather';

const samples = [
  { label: 'Lugar ficticio A', latitude: -26, longitude: -65 },
  { label: 'Lugar ficticio B', latitude: 10, longitude: 20 },
];

export default function SavedLocationsDemo() {
  const [uid, setUid] = useState<string | null>('usuario-ficticio-a');
  const [selected, setSelected] = useState<WeatherLocation>(samples[0]);
  const [failed, setFailed] = useState(false);
  const current = useRef(uid); current.current = uid;
  const fail = useRef(failed); fail.current = failed;
  const store = useMemo(() => createDemoPlacesStore(() => current.current, () => fail.current), []);
  return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
    <Text style={styles.badge}>DEMOSTRACIÓN · USUARIOS Y LUGARES FICTICIOS</Text>
    <Text style={styles.body}>No usa tu cuenta Google ni envía datos a Firebase. Al cambiar usuario se limpia la lista visible; al volver puede recuperar sus lugares ficticios mientras esta pantalla siga abierta.</Text>
    <Text style={styles.body}>Usuario actual: {uid ?? 'Sin sesión ficticia'}</Text>
    {['usuario-ficticio-a', 'usuario-ficticio-b', null].map((user) => <Pressable key={user ?? 'none'} accessibilityRole="button" style={styles.action} onPress={() => { setUid(user); setSelected(samples[0]); }}><Text style={styles.link}>Cambiar a {user ?? 'sin sesión'}</Text></Pressable>)}
    {samples.map((place) => <Pressable key={place.label} accessibilityRole="button" style={styles.action} onPress={() => setSelected(place)}><Text style={styles.link}>Elegir {place.label}</Text></Pressable>)}
    <Pressable accessibilityRole="button" style={styles.action} onPress={() => setFailed((value) => !value)}><Text style={styles.link}>Conexión ficticia: {failed ? 'fallida' : 'disponible'} · cambiar</Text></Pressable>
    <SavedLocationsPanel uid={uid} store={store} selected={selected} onSelect={setSelected} fictitious />
  </ScrollView>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F3F7FA' },
  content: { padding: 24, gap: 12, maxWidth: 640, width: '100%', alignSelf: 'center' },
  body: { color: '#334B5D', fontSize: 16, lineHeight: 24 },
  badge: { color: '#725000', backgroundColor: '#FFF3D5', padding: 12, fontWeight: '700' },
  action: { paddingVertical: 12 },
  link: { color: '#126271', fontSize: 16, fontWeight: '700' },
});
