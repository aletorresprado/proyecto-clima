import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { WindNoticeCard } from '@/components/wind-notice-card';

const scenarios = ['Con aviso', 'Debajo del criterio', 'Datos faltantes', 'Consulta vencida'] as const;
export default function WindDemoScreen() {
  const [scenario, setScenario] = useState<(typeof scenarios)[number]>('Con aviso');
  const [now] = useState(Date.now);
  const hours = Array.from({ length: 24 }, (_, index) => ({
    time: now + (index + 1) * 3600000,
    windKmh: scenario === 'Datos faltantes' ? null : scenario === 'Con aviso' && index < 2 ? 40 + index * 5 : 15,
  }));
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Ejemplos ficticios de viento</Text>
      <Text style={styles.text}>Estos escenarios no describen ninguna localidad real ni consultan el clima. Sirven para probar la regla.</Text>
      {scenarios.map((item) => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: item === scenario }} onPress={() => setScenario(item)} style={[styles.button, item === scenario && styles.selected]}>
        <Text style={styles.text}>{item === scenario ? '✓ ' : ''}{item}</Text>
      </Pressable>)}
      <WindNoticeCard example timezone="UTC" now={now} input={{ locationId: 'demo', locationLabel: 'Lugar ficticio de prueba', fetchedAt: scenario === 'Consulta vencida' ? now - 61 * 60000 : now, hours }} />
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  content: { padding: 24, gap: 16, backgroundColor: '#F3F7FA' }, title: { color: '#142F44', fontSize: 26, fontWeight: '700' },
  text: { color: '#334B5D', fontSize: 16, lineHeight: 24 }, button: { padding: 16, borderRadius: 12, backgroundColor: '#FFFFFF' }, selected: { backgroundColor: '#DCEFF0' },
});
