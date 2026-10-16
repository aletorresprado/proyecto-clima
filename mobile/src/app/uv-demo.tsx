import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { UvNoticeCard } from '@/components/uv-notice-card';
const scenarios = ['UV 3', 'UV 8', 'Debajo del criterio', 'Datos faltantes', 'Consulta vencida'] as const;
export default function UvDemoScreen() {
  const [scenario, setScenario] = useState<(typeof scenarios)[number]>('UV 3');
  const [now] = useState(Date.now);
  const hours = Array.from({ length: 24 }, (_, index) => ({ time: now + (index + 1) * 3600000, uvIndex: scenario === 'Datos faltantes' ? null : index === 0 && scenario === 'UV 3' ? 3 : index === 0 && scenario === 'UV 8' ? 8 : 0 }));
  return <ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.title}>Ejemplos ficticios de UV</Text>
    <Text style={styles.text}>No describen una localidad real ni consultan el clima.</Text>
    {scenarios.map((item) => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: item === scenario }} style={styles.button} onPress={() => setScenario(item)}><Text style={styles.text}>{item === scenario ? '✓ ' : ''}{item}</Text></Pressable>)}
    <UvNoticeCard example now={now} timezone="UTC" input={{ locationId: 'uv-demo', locationLabel: 'Lugar ficticio de prueba', fetchedAt: scenario === 'Consulta vencida' ? now - 61 * 60000 : now, hours }} />
  </ScrollView>;
}
const styles = StyleSheet.create({ content: { padding: 24, gap: 16, backgroundColor: '#F3F7FA' }, title: { color: '#142F44', fontSize: 26, fontWeight: '700' }, text: { color: '#334B5D', fontSize: 16, lineHeight: 24 }, button: { padding: 16, borderRadius: 12, backgroundColor: '#FFFFFF' } });
