import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { buildTemperatureChart, type TemperaturePoint } from '@/providers/temperature-chart';
import { FixedChartAxis } from './fixed-chart-axis';

export function TemperatureForecastChart({ hours, timezone, place, fetchedAt }: {
  hours: readonly TemperaturePoint[]; timezone: string; place: string; fetchedAt: number;
}) {
  const chart = buildTemperatureChart(hours);
  const [selected, setSelected] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const formatTime = (time: number) => new Intl.DateTimeFormat('es-AR', {
    timeZone: timezone, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(time);
  if (!chart) return <Text style={styles.caption}>Información insuficiente para dibujar la temperatura. Los datos horarios disponibles siguen en las tarjetas.</Text>;
  const chosen = chart.points.find((point) => point.time === selected);
  const paths = chart.segments.filter((s) => s.length > 1).map((segment) => segment.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' '));
  const grid = chart.ticks.map((tick) => `<line x1="40" y1="${tick.y}" x2="${chart.width - 16}" y2="${tick.y}" stroke="#BCD2DE" stroke-dasharray="3 5"/>`).join('');
  const lines = paths.map((d) => `<path d="${d}" fill="none" stroke="#147E91" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  const dots = chart.points.filter((p) => p.y !== null).map((p) => `<circle cx="${p.x}" cy="${p.y}" r="${p.time === selected ? 6 : 4}" fill="${p.time === selected ? '#D37626' : '#147E91'}" stroke="white" stroke-width="2"/>`).join('');
  const labels = chart.points.filter((_, index) => index % 3 === 0 || index === chart.points.length - 1).map((p) => {
    const label = new Intl.DateTimeFormat('es-AR', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(p.time);
    return `<text x="${p.x}" y="208" text-anchor="middle" font-size="11" fill="#52697A">${label}</text>`;
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${chart.width}" height="${chart.height}" viewBox="0 0 ${chart.width} ${chart.height}"><rect width="100%" height="100%" rx="16" fill="#F3F8FB"/>${grid}${lines}${dots}${labels}</svg>`;
  return <View style={styles.card}>
    <Text accessibilityRole="header" style={styles.title}>Temperatura prevista</Text>
    <Text style={styles.caption}>{place} · Aire a 2 m · °C</Text>
    <View style={styles.stats}>
      <Text style={styles.stat}>Mín. {chart.minimum.toFixed(1)} °C</Text>
      <Text style={styles.stat}>Máx. {chart.maximum.toFixed(1)} °C</Text>
    </View>
    <Text style={styles.caption}>Extremos entre las horas disponibles, no máxima y mínima diarias. Escala vertical automática.</Text>
    {!failed ? <View style={styles.plotRow}>
      <FixedChartAxis ticks={chart.ticks} height={chart.height} unit="°C" />
      <ScrollView horizontal showsHorizontalScrollIndicator style={{ flex: 1 }}>
      <View style={{ width: chart.width, height: chart.height }}>
        <Image source={{ uri: `data:image/svg+xml;base64,${btoa(svg)}` }} style={StyleSheet.absoluteFill} contentFit="fill" onError={() => setFailed(true)} accessible={false} />
        {chart.points.map((point) => <Pressable key={point.time} accessibilityRole="button" accessibilityState={{ selected: point.time === selected }} accessibilityLabel={`${formatTime(point.time)}: ${point.value === null ? 'temperatura no disponible' : `${point.value.toFixed(1)} grados Celsius`}`} onPress={() => setSelected(point.time)} style={{ position: 'absolute', left: point.x - 22, top: 0, width: 44, height: chart.height }} />)}
      </View>
    </ScrollView></View> : <Text style={styles.caption}>No pudimos dibujar el gráfico. Podés consultar los valores en las tarjetas horarias.</Text>}
    <Text style={styles.caption}>Deslizá para recorrer el gráfico y tocá una hora para ver su valor.</Text>
    {chosen && <View style={styles.selection}><Text accessibilityLiveRegion="polite" style={styles.stat}>{formatTime(chosen.time)} · {chosen.value === null ? 'Información insuficiente' : `${chosen.value.toFixed(1)} °C`}</Text></View>}
    {chart.missing > 0 && <Text style={styles.caption}>Faltan {chart.missing} valores. Los cortes de la curva representan datos ausentes.</Text>}
    <Text style={styles.caption}>Pronóstico de Open-Meteo · Consulta: {formatTime(fetchedAt)} · Zona: {timezone}. Los segmentos unen puntos horarios para facilitar la lectura; no son mediciones ni detalle continuo entre horas.</Text>
  </View>;
}
const styles = StyleSheet.create({
  plotRow: { flexDirection: 'row', borderRadius: 16, overflow: 'hidden', backgroundColor: '#F3F8FB' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, gap: 12, borderWidth: 1, borderColor: '#D3E2E9' },
  title: { color: '#142F44', fontSize: 20, fontWeight: '700' },
  caption: { color: '#52697A', fontSize: 13, lineHeight: 20 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: { color: '#163F57', fontSize: 16, fontWeight: '700', lineHeight: 24 },
  selection: { backgroundColor: '#E4F2F3', borderRadius: 12, padding: 12 },
});
