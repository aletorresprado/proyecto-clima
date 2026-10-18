import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { VisibilityNoticeCard } from '@/components/visibility-notice-card';
const scenarios = ['800 m con aviso', '1.000 m sin aviso', 'Datos faltantes', 'Cobertura parcial', 'Consulta vencida'] as const;
export default function VisibilityDemoScreen() {
  const [scenario, setScenario] = useState<(typeof scenarios)[number]>('800 m con aviso');
  const [now] = useState(Date.now);
  const hours = Array.from({ length: 24 }, (_, i) => ({ time: now + (i + 1) * 3600000, visibilityM: scenario === 'Datos faltantes' || (scenario === 'Cobertura parcial' && i > 0) ? null : i === 0 && (scenario === '800 m con aviso' || scenario === 'Cobertura parcial') ? 800 : 1000 }));
  return <ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.title}>Visibilidad ficticia</Text>
    <Text style={styles.text}>Ejemplos locales, sin GPS ni consultas meteorológicas. No describen una localidad real.</Text>
    {scenarios.map((item) => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: scenario === item }} style={styles.button} onPress={() => setScenario(item)}><Text style={styles.text}>{scenario === item ? '✓ ' : ''}{item}</Text></Pressable>)}
    <VisibilityNoticeCard example now={now} timezone="UTC" input={{ locationId: 'demo', locationLabel: 'Lugar ficticio de prueba', fetchedAt: scenario === 'Consulta vencida' ? now - 61 * 60000 : now, hours }} />
  </ScrollView>;
}
const styles = StyleSheet.create({ content: { padding: 24, gap: 16, backgroundColor: '#F3F7FA' }, title: { color: '#142F44', fontSize: 26, fontWeight: '700' }, text: { color: '#334B5D', fontSize: 16, lineHeight: 24 }, button: { padding: 16, borderRadius: 12, backgroundColor: '#FFFFFF' } });
