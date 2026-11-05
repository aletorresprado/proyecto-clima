import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Earthquake, Epicenter } from '@/providers/earthquakes';
import { EarthquakeMiniMap } from './earthquake-mini-map';
import { magnitudeStyle } from '@/providers/earthquake-magnitude-style';

export function EarthquakeEventCard({ event, center, example = false }: { event: Earthquake; center?: Epicenter; example?: boolean }) {
  const [linkError, setLinkError] = useState(false);
  const magnitude = magnitudeStyle(event.magnitude);
  return <View style={styles.card}>
    {example && <Text style={styles.badge}>EVENTO FICTICIO · NO ES UN SISMO REAL</Text>}
    <View style={styles.row}>
      <View style={[styles.magnitude, { backgroundColor: magnitude.backgroundColor }]}>
        <Text style={styles.label}>Magnitud</Text>
        <Text style={styles.number}>{event.magnitude === null ? '—' : event.magnitude.toFixed(1)}</Text>
      </View>
      <View style={styles.description}>
        <Text style={styles.place}>{event.place}</Text>
        <Text style={styles.body}>{event.distanceKm.toFixed(0)} km del centro consultado</Text>
      </View>
    </View>
    {event.magnitude === null && <Text style={styles.body}>Magnitud no informada.</Text>}
    <Text style={styles.caption}>{magnitude.range} · Escala visual propia; no indica intensidad sentida ni daños.</Text>
    <Text style={styles.body}>{new Date(event.time).toLocaleString('es-AR')} · hora del teléfono</Text>
    <Text style={styles.body}>Profundidad: {event.depthKm === null ? 'no informada' : `${event.depthKm.toFixed(1)} km`}</Text>
    {event.epicenter && center && <EarthquakeMiniMap center={center} epicenter={event.epicenter} example={example} />}
    {example ? <Text style={styles.caption}>Sin enlace externo: este evento fue creado para probar la presentación.</Text>
      : <Pressable accessibilityRole="link" onPress={() => { void Linking.openURL(`https://earthquake.usgs.gov/earthquakes/eventpage/${encodeURIComponent(event.id)}`).catch(() => setLinkError(true)); }} style={styles.button}><Text style={styles.link}>Ver evento en USGS →</Text></Pressable>}
    {linkError && <Text accessibilityLiveRegion="polite" style={styles.body}>No pudimos abrir el evento en USGS. Reintentá.</Text>}
  </View>;
}
const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: '#D3E2E9', backgroundColor: '#F3F7FA', borderRadius: 18, padding: 16, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  magnitude: { backgroundColor: '#163F57', borderRadius: 16, padding: 12, alignItems: 'center' },
  label: { color: '#D3E8F0', fontSize: 12 }, number: { color: '#FFFFFF', fontSize: 30, fontWeight: '800' },
  description: { flex: 1, gap: 6 }, place: { color: '#142F44', fontSize: 18, fontWeight: '700' },
  body: { color: '#334B5D', fontSize: 14, lineHeight: 21 }, caption: { color: '#52697A', fontSize: 13, lineHeight: 20 },
  badge: { color: '#725000', fontSize: 12, fontWeight: '800' },
  button: { minHeight: 44, justifyContent: 'center', paddingVertical: 10 },
  link: { color: '#126271', fontSize: 15, fontWeight: '700' },
});
