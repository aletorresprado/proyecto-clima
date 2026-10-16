import { useState } from 'react';
import { Link } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { evaluateUv, type UvInput } from '@/rules/uv';

export function UvNoticeCard({ input, now, timezone, example = false }: { input: UvInput; now: number; timezone: string; example?: boolean }) {
  const result = evaluateUv(input, now);
  const [linkError, setLinkError] = useState(false);
  const time = (value: number) => new Intl.DateTimeFormat('es-AR', { timeZone: timezone, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'shortOffset' }).format(value);
  return <View style={styles.card}>
    {example && <Text style={styles.label}>DATOS FICTICIOS · PRUEBA</Text>}
    <Text accessibilityRole="header" style={styles.title}>{result.state === 'notice' ? 'Protección solar recomendada' : 'Evaluación de índice UV'}</Text>
    <Text style={styles.text}>Lugar: {input.locationLabel}</Text>
    {result.state === 'notice' ? <>
      <Text style={styles.text}>Índice UV máximo previsto en las horas evaluadas: {result.maxUv}. Es un índice sin unidad; no es temperatura.</Text>
      <Text style={styles.action}>Buscá sombra y usá ropa protectora, sombrero, anteojos y protector solar.</Text>
      <Text style={styles.text}>Horas previstas con UV ≥3: {result.hours.map(time).join(' · ')}</Text>
      {result.reinforcedHours.length > 0 && <>
        <Text style={styles.action}>Se prevé UV ≥8. Evitá la exposición al sol alrededor del mediodía y reforzá las medidas de protección.</Text>
        <Text style={styles.text}>Horas previstas con UV ≥8: {result.reinforcedHours.map(time).join(' · ')}</Text>
      </>}
      {result.partial && <Text style={styles.text}>Cobertura incompleta: faltan horas o valores. Se muestra la evidencia disponible.</Text>}
      <Text style={styles.meta}>Evaluación vigente hasta {time(result.expiresAt)}, o hasta actualizar el pronóstico.</Text>
      <Text style={styles.meta}>Son puntos horarios del modelo, no exposición medida ni intervalos continuos confirmados.</Text>
    </> : result.state === 'below' ? <Text style={styles.text}>No se prevé UV ≥3 en las {result.evaluatedHours} horas evaluadas. Esto no significa ausencia general de riesgo.</Text>
      : <Text style={styles.text}>{result.reason === 'expired' ? 'La consulta está vencida. Actualizá el clima.' : 'Información insuficiente para evaluar UV en las próximas 24 horas: faltan datos válidos.'}</Text>}
    <Text style={styles.meta}>{example ? 'Fuente: escenario ficticio local.' : 'Datos: Open-Meteo · CC BY 4.0 · estimaciones de modelos.'} Consulta: {time(input.fetchedAt)}. Zona: {timezone}.</Text>
    <Text style={styles.meta}>Criterios de protección desde UV 3 y refuerzo desde UV 8 basados en la OMS. Recomendación general; no es una alerta oficial ni calcula tiempos personales seguros de exposición.</Text>
    <Pressable accessibilityRole="link" onPress={() => { void Linking.openURL('https://www.who.int/news-room/questions-and-answers/item/radiation-the-ultraviolet-(uv)-index').catch(() => setLinkError(true)); }}><Text style={styles.link}>Referencia: índice UV · OMS</Text></Pressable>
    {linkError && <Text style={styles.meta}>No pudimos abrir la referencia.</Text>}
    {!example && __DEV__ && <Link href="/uv-demo" style={styles.link}>Probar UV con datos ficticios</Link>}
  </View>;
}
const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, gap: 12, borderWidth: 1, borderColor: '#B4C9D1' },
  label: { color: '#725000', fontWeight: '800' }, title: { color: '#142F44', fontSize: 22, fontWeight: '700' },
  text: { color: '#334B5D', fontSize: 16, lineHeight: 24 }, action: { color: '#142F44', fontWeight: '700', fontSize: 17, lineHeight: 25 },
  meta: { color: '#52697A', fontSize: 14, lineHeight: 21 }, link: { color: '#126271', fontWeight: '700', fontSize: 15, paddingVertical: 8 },
});
