import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { PrecipitationNoticeCard } from '@/components/precipitation-notice-card';
const scenarios = ['50 % con aviso', 'Debajo del criterio', 'Cantidad ausente', 'Datos faltantes', 'Consulta vencida'] as const;
export default function PrecipitationDemo() {
  const [scenario, setScenario] = useState<(typeof scenarios)[number]>('50 % con aviso');
  const [now] = useState(() => Math.floor(Date.now() / 3600000) * 3600000);
  const hours = Array.from({ length: 24 }, (_, i) => ({ time: now + (i + 1) * 3600000, probability: scenario === 'Datos faltantes' ? null : i === 2 && (scenario === '50 % con aviso' || scenario === 'Cantidad ausente') ? 50 : 10, amountMm: scenario === 'Cantidad ausente' ? null : i === 2 ? 1.2 : 0 }));
  return <ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.title}>Precipitación ficticia</Text>
    <Text style={styles.text}>Escenarios locales, sin GPS ni consultas de clima. Reloj de prueba fijo al inicio de una hora UTC; no describe condiciones reales.</Text>
    {scenarios.map((item) => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: scenario === item }} style={styles.button} onPress={() => setScenario(item)}><Text style={styles.text}>{scenario === item ? '✓ ' : ''}{item}</Text></Pressable>)}
    <PrecipitationNoticeCard example now={now} timezone="UTC" input={{ locationId: 'demo', locationLabel: 'Lugar ficticio de prueba', fetchedAt: scenario === 'Consulta vencida' ? now - 61 * 60000 : now, hours }} />
  </ScrollView>;
}
const styles = StyleSheet.create({ content: { padding: 24, gap: 16, backgroundColor: '#F3F7FA' }, title: { color: '#142F44', fontSize: 26, fontWeight: '700' }, text: { color: '#334B5D', fontSize: 16, lineHeight: 24 }, button: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12 } });
