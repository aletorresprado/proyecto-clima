import { Link } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { evaluatePressure, type PressureInput } from '@/rules/pressure';
export function PressureTrendCard({ input, now, timezone, example = false }: { input: PressureInput; now: number; timezone: string; example?: boolean }) {
  const result = evaluatePressure(input, now);
  const [linkError, setLinkError] = useState(false);
  const time = (t: number) => new Intl.DateTimeFormat('es-AR', { timeZone: timezone, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'shortOffset' }).format(t);
  const number = (value: number) => value.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return <View style={styles.card}>
    {example && <Text style={styles.label}>DATOS FICTICIOS · PRUEBA</Text>}
    <Text accessibilityRole="header" style={styles.title}>Variación prevista de presión en 3 horas</Text>
    <Text style={styles.text}>Lugar: {input.locationLabel}</Text>
    <Text style={styles.meta}>Presión reducida al nivel del mar, en hPa. Comparación de pronóstico, no medición ni tendencia observada de las últimas tres horas.</Text>
    {result.state === 'ready' ? <>
      <Text style={styles.text}>Inicio: {time(result.start)} · {number(result.initialHpa)} hPa</Text>
      <Text style={styles.text}>Final: {time(result.end)} · {number(result.finalHpa)} hPa</Text>
      <Text style={styles.value}>Diferencia: {result.deltaHpa > 0 ? '+' : ''}{number(result.deltaHpa)} hPa</Text>
      <Text style={styles.text}>{result.direction === 'increase' ? 'Aumento previsto entre ambos horarios.' : result.direction === 'decrease' ? 'Disminución prevista entre ambos horarios.' : 'Sin cambio apreciable a la precisión mostrada.'}</Text>
      <Text style={styles.meta}>La diferencia compara los extremos; no afirma un cambio continuo o uniforme entre ellos. Los números se muestran a una décima, sin garantizar esa exactitud local.</Text>
      <Text style={styles.meta}>Ventana evaluada hasta {time(result.expiresAt)} como máximo; al pasar el inicio se elige la siguiente ventana futura si la consulta sigue vigente.</Text>
    </> : <Text style={styles.text}>{result.reason === 'expired' ? 'La consulta está vencida. Actualizá el clima.' : 'Información insuficiente: necesitamos cuatro puntos horarios consecutivos con presión válida, desde la primera hora futura.'}</Text>}
    <Text style={styles.text}>Interpretá esta información junto con el resto del pronóstico.</Text>
    <Text style={styles.meta}>No hay umbral de peligro ni alerta por presión. Esta variación por sí sola no confirma tormentas o frentes, ni permite inferir dolor o síntomas.</Text>
    <Text style={styles.meta}>{example ? 'Fuente: escenario ficticio local.' : 'Fuente: Open-Meteo · CC BY 4.0 · estimaciones de modelos.'} Consulta: {time(input.fetchedAt)}. Zona: {timezone}.</Text>
    <Pressable accessibilityRole="link" onPress={() => { void Linking.openURL('https://open-meteo.com/en/docs').catch(() => setLinkError(true)); }}><Text style={styles.link}>Fuente de presión · Open-Meteo</Text></Pressable>
    {linkError && <Text style={styles.meta}>No pudimos abrir la fuente.</Text>}
    {!example && __DEV__ && <Link href="./pressure-demo" style={styles.link}>Probar presión con datos ficticios</Link>}
  </View>;
}
const styles = StyleSheet.create({ card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#B4C9D1', gap: 12 }, title: { color: '#142F44', fontSize: 22, fontWeight: '700' }, text: { color: '#334B5D', fontSize: 16, lineHeight: 24 }, meta: { color: '#52697A', fontSize: 14, lineHeight: 21 }, value: { color: '#142F44', fontSize: 24, fontWeight: '700' }, label: { color: '#725000', fontWeight: '800' }, link: { color: '#126271', fontWeight: '700', fontSize: 15, paddingVertical: 8 } });
