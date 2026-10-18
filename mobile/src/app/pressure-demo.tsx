import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { PressureTrendCard } from '@/components/pressure-trend-card';
const scenarios = ['Aumento', 'Descenso', 'Sin cambio apreciable', 'Datos faltantes', 'Consulta vencida'] as const;
export default function PressureDemoScreen() {
  const [scenario, setScenario] = useState<(typeof scenarios)[number]>('Aumento');
  const [now] = useState(Date.now);
  const hours = Array.from({ length: 24 }, (_, i) => ({ time: now + (i + 1) * 3600000, seaLevelPressureHpa: scenario === 'Datos faltantes' && i === 1 ? null : 1012 + i * (scenario === 'Aumento' ? 0.5 : scenario === 'Descenso' ? -0.5 : -0.01) }));
  return <ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.title}>Presión ficticia</Text>
    <Text style={styles.text}>Ejemplos locales, sin GPS ni consultas meteorológicas. No describen una localidad real ni anticipan síntomas.</Text>
    {scenarios.map((item) => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: scenario === item }} style={styles.button} onPress={() => setScenario(item)}><Text style={styles.text}>{scenario === item ? '✓ ' : ''}{item}</Text></Pressable>)}
    <PressureTrendCard example now={now} timezone="UTC" input={{ locationId: 'demo', locationLabel: 'Lugar ficticio de prueba', fetchedAt: scenario === 'Consulta vencida' ? now - 61 * 60000 : now, hours }} />
  </ScrollView>;
}
const styles = StyleSheet.create({ content: { padding: 24, gap: 16, backgroundColor: '#F3F7FA' }, title: { color: '#142F44', fontSize: 26, fontWeight: '700' }, text: { color: '#334B5D', fontSize: 16, lineHeight: 24 }, button: { padding: 16, borderRadius: 12, backgroundColor: '#FFFFFF' } });
