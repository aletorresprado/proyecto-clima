import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ForecastHour } from '@/providers/current-weather';
import { describeWeather } from '@/providers/weather-condition';

export function HourlyWeatherStrip({ hours, timezone }: { hours: ForecastHour[]; timezone: string }) {
  const [selected, setSelected] = useState<number | null>(null);
  const hour = hours.find((item) => item.time === selected);
  const value = (number: number | null, unit: string) => number === null ? 'Información insuficiente' : `${number.toFixed(1)} ${unit}`;
  const time = (timestamp: number) => new Intl.DateTimeFormat('es-AR', { timeZone: timezone, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(timestamp);
  return <View style={{ gap: 12 }}>
    <Text style={styles.caption}>Deslizá para recorrer las horas; tocá una para ampliar.</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.strip}>
      {hours.map((item) => {
        const condition = describeWeather(item.weatherCode, item.isDay);
        return <Pressable key={item.time} accessibilityRole="button" accessibilityState={{ expanded: selected === item.time }} onPress={() => setSelected(selected === item.time ? null : item.time)} style={[styles.card, selected === item.time && styles.selected]}>
          <Text style={styles.caption}>{time(item.time)}</Text>
          <Text style={styles.icon} accessibilityElementsHidden>{condition.icon}</Text>
          <Text style={styles.temperature}>{value(item.temperatureC, '°C')}</Text>
          <Text style={styles.caption}>{condition.label}</Text>
        </Pressable>;
      })}
    </ScrollView>
    {hour && <View style={styles.details}>
      <Text style={styles.title}>Detalle · {time(hour.time)}</Text>
      <Text style={styles.caption}>{describeWeather(hour.weatherCode, hour.isDay).label} · Pronóstico del modelo</Text>
      <Text style={styles.body}>Temperatura a 2 m: {value(hour.temperatureC, '°C')}</Text>
      <Text style={styles.body}>Viento a 10 m: {value(hour.windKmh, 'km/h')}</Text>
      <Text style={styles.body}>Presión al nivel del mar: {value(hour.seaLevelPressureHpa, 'hPa')}</Text>
      <Text style={styles.caption}>Hora local de {timezone} · Fuente: Open-Meteo</Text>
    </View>}
  </View>;
}
const styles = StyleSheet.create({
  strip: { gap: 10, paddingBottom: 8 },
  card: { width: 134, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 14, alignItems: 'center', gap: 8, borderWidth: 2, borderColor: '#FFFFFF' },
  selected: { borderColor: '#126271', backgroundColor: '#E4F2F3' },
  icon: { fontSize: 36 }, temperature: { color: '#142F44', fontSize: 22, fontWeight: '800' },
  caption: { color: '#52697A', fontSize: 13, lineHeight: 20 },
  details: { padding: 18, gap: 8, borderRadius: 18, backgroundColor: '#E4F2F3' },
  title: { color: '#142F44', fontSize: 18, fontWeight: '700' },
  body: { color: '#334B5D', fontSize: 16, lineHeight: 24 },
});
