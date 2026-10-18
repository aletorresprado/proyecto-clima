import { Link } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { evaluatePrecipitation, type PrecipitationInput } from '@/rules/precipitation';
export function PrecipitationNoticeCard({ input, now, timezone, example = false }: { input: PrecipitationInput; now: number; timezone: string; example?: boolean }) {
  const result = evaluatePrecipitation(input, now);
  const [linkError, setLinkError] = useState(false);
  const time = (t: number) => new Intl.DateTimeFormat('es-AR', { timeZone: timezone, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'shortOffset' }).format(t);
  return <View style={styles.card}>
    {example && <Text style={styles.label}>DATOS FICTICIOS · PRUEBA</Text>}
    <Text accessibilityRole="header" style={styles.title}>{result.state === 'notice' ? 'Posibilidad de precipitación' : 'Evaluación de precipitación'}</Text>
    <Text style={styles.text}>Lugar: {input.locationLabel}</Text>
    <Text style={styles.meta}>Se evalúan solo intervalos horarios completos y futuros dentro de las próximas 24 horas. Se excluyen las fracciones de hora de los extremos.</Text>
    {result.state === 'notice' ? <>
      <Text style={styles.action}>Considerá llevar protección para la lluvia y revisar tus actividades al aire libre.</Text>
      {result.intervals.map((interval) => <View key={interval.end} style={styles.interval}>
        <Text style={styles.text}>Desde {time(interval.start)} hasta {time(interval.end)}</Text>
        <Text style={styles.text}>Probabilidad: {interval.probability} %</Text>
        <Text style={styles.text}>Cantidad prevista en ese intervalo: {interval.amountMm === null ? 'no disponible' : `${interval.amountMm} mm`}</Text>
      </View>)}
      {result.partial && <Text style={styles.text}>Cobertura incompleta: faltan intervalos o probabilidades válidas. Se muestra la evidencia disponible.</Text>}
      <Text style={styles.meta}>Evaluación vigente hasta {time(result.expiresAt)} como máximo. Al comenzar un intervalo deja de evaluarse como completamente futuro; actualizá para consultar nuevos datos.</Text>
    </> : result.state === 'below' ? <Text style={styles.text}>No se alcanza el criterio del 50 % en los {result.evaluatedHours} intervalos completos evaluados. Esto no significa ausencia de precipitación o de riesgo.</Text>
      : <Text style={styles.text}>{result.reason === 'expired' ? 'La consulta está vencida. Actualizá el clima.' : 'Información insuficiente: faltan intervalos o probabilidades válidas.'}</Text>}
    <Text style={styles.meta}>El porcentaje es la probabilidad de más de 0,1 mm en el intervalo; no indica cantidad, duración ni certeza de lluvia. Los mm son una estimación distinta. La precipitación total puede incluir lluvia y nieve en equivalente de agua.</Text>
    <Text style={styles.meta}>Umbral práctico propio ≥50 %, sin calibración local. No es alerta oficial ni permite inferir tormenta, granizo o inundación.</Text>
    <Text style={styles.meta}>{example ? 'Fuente: escenario ficticio local.' : 'Fuente: Open-Meteo · CC BY 4.0 · estimaciones de modelos.'} Consulta: {time(input.fetchedAt)}. Zona: {timezone}.</Text>
    <Pressable accessibilityRole="link" onPress={() => { void Linking.openURL('https://open-meteo.com/en/docs').catch(() => setLinkError(true)); }}><Text style={styles.link}>Fuente y definición de precipitación · Open-Meteo</Text></Pressable>
    {linkError && <Text style={styles.meta}>No pudimos abrir la fuente.</Text>}
    {!example && __DEV__ && <Link href="./precipitation-demo" style={styles.link}>Probar precipitación con datos ficticios</Link>}
  </View>;
}
const styles = StyleSheet.create({ card: { padding: 20, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#B4C9D1', gap: 12 }, title: { fontSize: 22, fontWeight: '700', color: '#142F44' }, text: { fontSize: 16, lineHeight: 24, color: '#334B5D' }, action: { fontSize: 17, lineHeight: 25, fontWeight: '700', color: '#142F44' }, meta: { fontSize: 14, lineHeight: 21, color: '#52697A' }, label: { fontWeight: '800', color: '#725000' }, link: { fontSize: 15, fontWeight: '700', color: '#126271', paddingVertical: 8 }, interval: { paddingVertical: 8, gap: 4 } });
