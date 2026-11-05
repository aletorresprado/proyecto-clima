import { StyleSheet, Text, View } from 'react-native';
import type { CurrentWeather } from '@/providers/current-weather';
import { describeWeather } from '@/providers/weather-condition';

export function WeatherSummary({ weather }: { weather: CurrentWeather }) {
  const condition = describeWeather(weather.weatherCode, weather.isDay);
  const value = (number: number | null, unit: string) => number === null
    ? 'Información insuficiente' : `${number.toFixed(1)} ${unit}`;
  return <View style={styles.card}>
    <Text style={styles.eyebrow}>AHORA · ESTIMACIÓN DEL MODELO</Text>
    <Text style={styles.note}>Datos: {new Intl.DateTimeFormat('es-AR', { timeZone: weather.timezone, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(weather.validAt)}</Text>
    <View style={styles.temperatureRow}>
      <Text style={styles.icon} accessibilityElementsHidden importantForAccessibility="no">{condition.icon}</Text>
      <View style={styles.temperatureContent}>
        <Text style={styles.label}>{condition.label}</Text>
        <Text style={[styles.temperature, weather.temperatureC === null && styles.missing]}>{value(weather.temperatureC, '°C')}</Text>
        <Text style={styles.note}>Temperatura del aire a 2 m</Text>
      </View>
    </View>
    <View style={styles.metrics}>
      <View style={styles.metric}>
        <Text style={styles.metricIcon} accessibilityElementsHidden importantForAccessibility="no">〰</Text>
        <Text style={styles.label}>Viento</Text>
        <Text style={styles.value}>{value(weather.windKmh, 'km/h')}</Text>
        <Text style={styles.note}>A 10 m de altura</Text>
      </View>
      <View style={styles.metric}>
        <Text style={styles.metricIcon} accessibilityElementsHidden importantForAccessibility="no">◴</Text>
        <Text style={styles.label}>Presión</Text>
        <Text style={styles.value}>{value(weather.seaLevelPressureHpa, 'hPa')}</Text>
        <Text style={styles.note}>Reducida al nivel del mar</Text>
      </View>
    </View>
    <Text style={styles.note}>Fuente: Open-Meteo · No son mediciones locales ni alertas oficiales.</Text>
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#163F57', borderRadius: 24, padding: 22, gap: 20 },
  eyebrow: { color: '#BDE7E9', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  temperatureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: { fontSize: 42 }, temperatureContent: { flex: 1, gap: 6 },
  label: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  temperature: { color: '#FFFFFF', fontSize: 48, fontWeight: '800', flexShrink: 1 },
  missing: { fontSize: 22 },
  note: { color: '#D3E8F0', fontSize: 13, lineHeight: 20 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metric: { flexGrow: 1, flexBasis: 130, backgroundColor: '#234F66', borderRadius: 16, padding: 14, gap: 6 },
  metricIcon: { color: '#BDE7E9', fontSize: 26 },
  value: { color: '#FFFFFF', fontSize: 21, fontWeight: '700' },
});
