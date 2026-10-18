import { Link } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { evaluateVisibility, type VisibilityInput } from '@/rules/visibility';
export function VisibilityNoticeCard({ input, now, timezone, example = false }: { input: VisibilityInput; now: number; timezone: string; example?: boolean }) {
  const result = evaluateVisibility(input, now);
  const [linkError, setLinkError] = useState(false);
  const time = (t: number) => new Intl.DateTimeFormat('es-AR', { timeZone: timezone, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'shortOffset' }).format(t);
  return <View style={styles.card}>
    {example && <Text style={styles.label}>DATOS FICTICIOS · PRUEBA</Text>}
    <Text accessibilityRole="header" style={styles.title}>{result.state === 'notice' ? 'Visibilidad reducida prevista' : 'Evaluación de visibilidad'}</Text>
    <Text style={styles.text}>Lugar: {input.locationLabel}</Text>
    {result.state === 'notice' ? <>
      <Text style={styles.text}>Visibilidad mínima prevista en las horas evaluadas: {result.minVisibilityM} m.</Text>
      <Text style={styles.action}>Revisá las condiciones locales y planificá tus desplazamientos con precaución.</Text>
      <Text style={styles.text}>Horas con visibilidad prevista menor de 1.000 m: {result.hours.map(time).join(' · ')}</Text>
      {result.partial && <Text style={styles.text}>Cobertura incompleta: faltan horas o valores. Se muestra la evidencia disponible.</Text>}
      <Text style={styles.meta}>Evaluación vigente hasta {time(result.expiresAt)}, o hasta actualizar el pronóstico.</Text>
      <Text style={styles.meta}>Son puntos horarios del modelo, sin continuidad confirmada entre ellos.</Text>
    </> : result.state === 'not-reached' ? <Text style={styles.text}>No se prevé visibilidad menor de 1.000 m en las {result.evaluatedHours} horas evaluadas. Esto no garantiza buena visibilidad ni ausencia de riesgo.</Text>
      : <Text style={styles.text}>{result.reason === 'expired' ? 'La consulta está vencida. Actualizá el clima.' : 'Información insuficiente para evaluar visibilidad en las próximas 24 horas: faltan datos válidos.'}</Text>}
    <Text style={styles.meta}>Criterio experimental propio: menos de 1.000 m, sin calibración local. La visibilidad reducida puede tener distintas causas; este dato no confirma niebla ni las condiciones de una carretera concreta. No es una alerta oficial.</Text>
    <Text style={styles.meta}>{example ? 'Fuente: escenario ficticio local.' : 'Datos: Open-Meteo · CC BY 4.0 · estimaciones de modelos, no mediciones locales.'} Consulta: {time(input.fetchedAt)}. Zona: {timezone}.</Text>
    <Pressable accessibilityRole="link" onPress={() => { void Linking.openURL('https://open-meteo.com/en/docs').catch(() => setLinkError(true)); }}><Text style={styles.link}>Fuente de visibilidad · Open-Meteo</Text></Pressable>
    {linkError && <Text style={styles.meta}>No pudimos abrir la fuente.</Text>}
    {!example && __DEV__ && <Link href="./visibility-demo" style={styles.link}>Probar visibilidad con datos ficticios</Link>}
  </View>;
}
const styles = StyleSheet.create({ card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#B4C9D1', gap: 12 }, title: { fontSize: 22, fontWeight: '700', color: '#142F44' }, text: { fontSize: 16, lineHeight: 24, color: '#334B5D' }, action: { fontSize: 17, lineHeight: 25, fontWeight: '700', color: '#142F44' }, meta: { fontSize: 14, lineHeight: 21, color: '#52697A' }, label: { color: '#725000', fontWeight: '800' }, link: { color: '#126271', fontSize: 15, fontWeight: '700', paddingVertical: 8 } });
