import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, StyleSheet, Text, View } from 'react-native';
import land from '../../assets/maps/land-rings.json';
import { referenceMap } from '@/providers/earthquake-map';
import type { Epicenter } from '@/providers/earthquakes';

export function EarthquakeMiniMap({ center, epicenter, example = false }: { center: Epicenter; epicenter: Epicenter; example?: boolean }) {
  const map = referenceMap(center, epicenter, land);
  const opacity = useRef(new Animated.Value(1)).current;
  const [reduced, setReduced] = useState(true);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (mounted) setReduced(value); }).catch(() => {});
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    const app = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    return () => { mounted = false; motion.remove(); app.remove(); };
  }, []);
  useEffect(() => {
    if (reduced || !active) { opacity.setValue(1); return; }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.35, duration: 900, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
    ]));
    animation.start();
    return () => { animation.stop(); opacity.setValue(1); };
  }, [reduced, active, opacity]);
  if (!map) return <Text style={styles.caption}>Mapa de referencia no disponible. Epicentro: {epicenter.latitude.toFixed(3)}, {epicenter.longitude.toFixed(3)}.</Text>;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200"><rect width="320" height="200" fill="#CBE7F2"/><path d="${map.paths.join(' ')}" fill="#DCE8CE" stroke="#78987D" stroke-width="0.7"/><path d="M0 100H320 M160 0V200" stroke="#8EB7C5" stroke-width="0.5" stroke-dasharray="3 5"/><text x="304" y="20" fill="#163F57" font-size="12">N</text></svg>`;
  const uri = `data:image/svg+xml;base64,${btoa(svg)}`;
  return <View style={styles.container}>
    <Text style={styles.heading}>{example ? 'Mapa de prueba · posiciones ficticias' : 'Ubicación del epicentro'}</Text>
    {!failed ? <View style={styles.map} accessible accessibilityLabel={`Mapa de referencia. Epicentro: latitud ${epicenter.latitude.toFixed(3)}, longitud ${epicenter.longitude.toFixed(3)}. Centro: latitud ${center.latitude.toFixed(3)}, longitud ${center.longitude.toFixed(3)}.`}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="fill" onError={() => setFailed(true)} />
      <View style={[styles.phone, { left: `${map.center.x / 3.2}%`, top: `${map.center.y / 2}%` }]} />
      <Animated.View style={[styles.epicenter, { left: `${map.epicenter.x / 3.2}%`, top: `${map.epicenter.y / 2}%`, opacity }]} />
    </View> : <Text style={styles.caption}>No pudimos dibujar el mapa. Las coordenadas siguen disponibles.</Text>}
    <Text style={styles.legend}>Azul: {example ? 'centro ficticio' : 'teléfono al consultar'} · Rojo pulsante: epicentro</Text>
    <Text style={styles.caption}>Epicentro: {epicenter.latitude.toFixed(3)}, {epicenter.longitude.toFixed(3)}.</Text>
    <Text style={styles.caption}>La pulsación destaca el evento seleccionado; no indica que esté ocurriendo ahora.</Text>
    <Text style={styles.caption}>Natural Earth · referencia simplificada, sin calles. No muestra intensidad ni zona afectada. Dibujo local sin servicio de mapas.</Text>
  </View>;
}
const styles = StyleSheet.create({
  container: { gap: 8 }, heading: { color: '#142F44', fontSize: 15, fontWeight: '700' },
  map: { width: '100%', aspectRatio: 1.6, borderRadius: 16, overflow: 'hidden', backgroundColor: '#CBE7F2', borderWidth: 1, borderColor: '#A9CCD0' },
  phone: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: '#2463AA', borderWidth: 2, borderColor: '#FFFFFF', marginLeft: -6, marginTop: -6 },
  epicenter: { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: '#B83239', borderWidth: 3, borderColor: '#FFFFFF', marginLeft: -9, marginTop: -9 },
  legend: { color: '#334B5D', fontSize: 13, lineHeight: 20 }, caption: { color: '#52697A', fontSize: 12, lineHeight: 18 },
});
