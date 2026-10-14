import { Link } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { evaluateWind, WIND_THRESHOLD_KMH, type WindInput } from '@/rules/wind';

export function WindNoticeCard({ input, now, timezone, example = false }: { input: WindInput; now: number; timezone: string; example?: boolean }) {
  const result = evaluateWind(input, now);
  const [linkError, setLinkError] = useState(false);
  const time = (timestamp: number) => new Intl.DateTimeFormat('es-AR', {
    timeZone: timezone, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'shortOffset',
  }).format(timestamp);
  return (
    <View style={[styles.card, result.state === 'notice' && styles.notice]}>
      {example && <Text style={styles.label}>DATOS FICTICIOS · PRUEBA</Text>}
      <Text accessibilityRole="header" style={styles.title}>{result.state === 'notice' ? 'Aviso experimental de viento' : 'Evaluación experimental de viento'}</Text>
      <Text style={styles.text}>Lugar: {input.locationLabel}</Text>
      {result.state === 'notice' ? <>
        <Text style={styles.text}>Se prevén valores de viento de hasta {result.notice.maxWindKmh.toFixed(1)} km/h en las horas indicadas.</Text>
        <Text style={styles.action}>Considerá asegurar objetos sueltos del exterior.</Text>
        <Text style={styles.text}>Horas que alcanzan {WIND_THRESHOLD_KMH} km/h: {result.notice.hours.map(time).join(' · ')}</Text>
        <Text style={styles.text}>Son puntos horarios del pronóstico; no confirman viento continuo entre ellos.</Text>
        {result.notice.coverage === 'partial' && <Text style={styles.text}>Cobertura incompleta: hay horas o valores faltantes. El aviso usa solo evidencia disponible.</Text>}
        <Text style={styles.meta}>Evaluación vigente hasta {time(result.notice.expiresAt)}, o hasta que cambie el pronóstico. Zona: {timezone}.</Text>
      </> : result.state === 'below' ? <Text style={styles.text}>No se alcanza este criterio en las {result.evaluatedHours} horas evaluadas. Esto no significa ausencia de riesgo.</Text>
        : <Text style={styles.text}>{result.reason === 'expired' ? 'La consulta está vencida. Actualizá el clima.' : 'Información insuficiente para evaluar las próximas 24 horas: faltan datos válidos.'}</Text>}
      <Text style={styles.meta}>Criterio propio de prueba: viento previsto a 10 m ≥{WIND_THRESHOLD_KMH} km/h, sin calibración local. No evalúa ráfagas ni es una alerta oficial.</Text>
      <Text style={styles.meta}>{example ? 'Fuente: escenario ficticio local.' : 'Fuente de datos: Open-Meteo, estimaciones de modelos.'} Consulta: {time(input.fetchedAt)}.</Text>
      <Pressable accessibilityRole="link" onPress={() => { void Linking.openURL('https://www.weather.gov/tbw/beaufort').catch(() => setLinkError(true)); }} style={styles.link}>
        <Text style={styles.linkText}>Referencia descriptiva: Beaufort · NWS</Text>
      </Pressable>
      {linkError && <Text style={styles.meta}>No pudimos abrir el enlace de referencia.</Text>}
      {!example && __DEV__ && <Link href="/wind-demo" style={styles.linkText}>Probar con datos ficticios</Link>}
    </View>
  );
}
const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderColor: '#B4C9D1', borderWidth: 1, borderRadius: 20, padding: 20, gap: 12 },
  notice: { backgroundColor: '#FFF3D5', borderColor: '#B88421' },
  label: { color: '#725000', fontWeight: '800', fontSize: 13 },
  title: { color: '#142F44', fontSize: 22, fontWeight: '700' },
  text: { color: '#334B5D', fontSize: 16, lineHeight: 24 },
  action: { color: '#142F44', fontSize: 17, fontWeight: '700', lineHeight: 25 },
  meta: { color: '#52697A', fontSize: 14, lineHeight: 21 },
  link: { paddingVertical: 8 }, linkText: { color: '#126271', fontWeight: '700', fontSize: 15 },
});
