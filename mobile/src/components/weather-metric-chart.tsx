import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { CurrentWeather } from '@/providers/current-weather';
import { buildMetricChart, metricPoints, type WeatherMetric } from '@/providers/weather-metric-chart';
import { FixedChartAxis } from './fixed-chart-axis';

const metrics = [
  { id: 'wind', label: 'Viento', unit: 'km/h', title: 'Viento previsto a 10 m' },
  { id: 'probability', label: 'Probabilidad', unit: '%', title: 'Probabilidad de precipitación' },
  { id: 'amount', label: 'Cantidad', unit: 'mm', title: 'Cantidad de precipitación prevista' },
] as const;

export function WeatherMetricChart({ weather, now, place }: { weather: CurrentWeather; now: number; place: string }) {
  const [metric, setMetric] = useState<WeatherMetric>('wind');
  return <View style={styles.card}>
    <View style={styles.tabs}>
      {metrics.map((item) => <Pressable key={item.id} accessibilityRole="tab" accessibilityState={{ selected: metric === item.id }} onPress={() => setMetric(item.id)} style={[styles.tab, metric === item.id && styles.activeTab]}><Text style={[styles.tabText, metric === item.id && styles.activeText]}>{item.label} ({item.unit})</Text></Pressable>)}
    </View>
    <MetricPlot key={`${metric}:${weather.fetchedAt}`} weather={weather} now={now} place={place} metric={metric} />
  </View>;
}

function MetricPlot({ weather, now, place, metric }: { weather: CurrentWeather; now: number; place: string; metric: WeatherMetric }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const config = metrics.find((m) => m.id === metric)!;
  const chart = buildMetricChart(metricPoints(weather, metric, now), metric);
  const time = (t: number) => new Intl.DateTimeFormat('es-AR', { timeZone: weather.timezone, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(t);
  const value = (v: number | null) => v === null ? 'Información insuficiente' : `${v.toLocaleString('es-AR', { maximumFractionDigits: 2 })} ${config.unit}`;
  const interval = (t: number) => metric === 'wind' ? time(t) : `Desde ${time(t - 3600000)} hasta ${time(t)}`;
  const context = metric === 'wind' ? 'Velocidad a 10 m, no ráfagas. Cada barra corresponde al horario indicado.'
    : metric === 'probability' ? 'Probabilidad de más de 0,1 mm en cada intervalo. No es cantidad de lluvia, duración ni certeza.'
      : 'Cantidad prevista en cada intervalo horario, no acumulado diario. Puede incluir lluvia y nieve en equivalente de agua.';
  if (!chart) return <><Text accessibilityRole="header" style={styles.title}>{config.title}</Text><Text style={styles.caption}>{context}</Text><Text style={styles.caption}>Información insuficiente para este gráfico. Podés consultar las otras vistas.</Text></>;
  const chosen = chart.points.find((p) => p.time === selected);
  const color = metric === 'wind' ? '#147E91' : metric === 'probability' ? '#4261B1' : '#237E65';
  const grid = chart.ticks.map((tick) => `<line x1="40" x2="${chart.width - 16}" y1="${tick.y}" y2="${tick.y}" stroke="#BCD2DE" stroke-dasharray="3 5"/>`).join('');
  const bars = chart.points.map((p) => p.y === null
    ? `<text x="${p.x}" y="173" text-anchor="middle" font-size="13" fill="#52697A">?</text>`
    : p.value === 0 ? `<circle cx="${p.x}" cy="180" r="3" fill="${color}"/>`
      : `<rect x="${p.x - 10}" y="${p.y}" width="20" height="${chart.bottom - p.y}" rx="5" fill="${p.time === selected ? '#B45A17' : color}"/>`).join('');
  const labels = chart.points.filter((_, i) => i % 3 === 0 || i === chart.points.length - 1).map((p) => `<text x="${p.x}" y="208" text-anchor="middle" font-size="11" fill="#52697A">${new Intl.DateTimeFormat('es-AR', { timeZone: weather.timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(p.time)}</text>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${chart.width}" height="224"><rect width="100%" height="100%" rx="16" fill="#F3F8FB"/>${grid}${bars}${labels}</svg>`;
  return <>
    <Text accessibilityRole="header" style={styles.title}>{config.title}</Text>
    <Text style={styles.caption}>{place} · {config.unit} · {metric === 'probability' ? 'Escala fija 0–100 %' : 'Escala automática desde cero'}</Text>
    <Text style={styles.caption}>{context}</Text>
    <Text style={styles.stat}>Máximo entre datos disponibles: {value(chart.maximum)}</Text>
    {!failed ? <View style={styles.plotRow}><FixedChartAxis ticks={chart.ticks} height={chart.height} unit={config.unit} /><ScrollView horizontal showsHorizontalScrollIndicator style={{ flex: 1 }}><View style={{ width: chart.width, height: chart.height }}>
      <Image source={{ uri: `data:image/svg+xml;base64,${btoa(svg)}` }} style={StyleSheet.absoluteFill} contentFit="fill" onError={() => setFailed(true)} accessible={false} />
      {chart.points.map((p) => <Pressable key={p.time} accessibilityRole="button" accessibilityState={{ selected: selected === p.time }} accessibilityLabel={`${interval(p.time)}: ${value(p.value)}`} onPress={() => setSelected(p.time)} style={{ position: 'absolute', left: p.x - 22, top: 0, width: 44, height: chart.height }} />)}
    </View></ScrollView></View> : <Text style={styles.caption}>No pudimos dibujar este gráfico. Los detalles del pronóstico siguen disponibles.</Text>}
    <Text style={styles.caption}>Deslizá y tocá una barra para ampliar. Un punto en la base representa cero; ? indica dato no disponible.</Text>
    {chosen && <View style={styles.selection}><Text accessibilityLiveRegion="polite" style={styles.stat}>{interval(chosen.time)}{'\n'}{value(chosen.value)}</Text></View>}
    {chart.missing > 0 && <Text style={styles.caption}>Faltan {chart.missing} valores: no se convierten en cero.</Text>}
    <Text style={styles.caption}>Fuente: Open-Meteo · Pronóstico del modelo, no medición ni alerta oficial. Consulta: {time(weather.fetchedAt)}. Zona: {weather.timezone}. Solo horas futuras; en precipitación se excluyen intervalos que ya comenzaron.</Text>
  </>;
}
const styles = StyleSheet.create({
  plotRow: { flexDirection: 'row', borderRadius: 16, overflow: 'hidden', backgroundColor: '#F3F8FB' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, gap: 12, borderWidth: 1, borderColor: '#D3E2E9' },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tab: { minHeight: 44, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#A9CCD0', backgroundColor: '#F3F8FB' },
  activeTab: { backgroundColor: '#163F57', borderColor: '#163F57' },
  tabText: { color: '#126271', fontSize: 14, fontWeight: '700' }, activeText: { color: '#FFFFFF' },
  title: { color: '#142F44', fontSize: 20, fontWeight: '700' }, caption: { color: '#52697A', fontSize: 13, lineHeight: 20 },
  stat: { color: '#163F57', fontSize: 16, fontWeight: '700', lineHeight: 24 },
  selection: { backgroundColor: '#E4F2F3', padding: 12, borderRadius: 12 },
});
