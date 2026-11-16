import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { localCalendarDate, type ForecastDay } from '@/providers/daily-forecast';
import { describeWeather } from '@/providers/weather-condition';

export function DailyForecast({ days: receivedDays, timezone, place, fetchedAt, now }: { days: ForecastDay[] | null | undefined; timezone: string; place: string; fetchedAt: number; now: number }) {
  const days = receivedDays?.filter((day) => day.date >= localCalendarDate(now, timezone));
  const [selected, setSelected] = useState<string | null>(null);
  const chosen = days?.find((day) => day.date === selected);
  const formatDate = (date: string) => new Intl.DateTimeFormat('es-AR', { timeZone: 'UTC', weekday: 'short', day: '2-digit', month: '2-digit' }).format(new Date(`${date}T12:00:00Z`));
  const value = (v: number | null) => v === null ? 'No disponible' : `${v.toFixed(1)} °C`;
  return <View style={styles.section}>
    <Text accessibilityRole="header" style={styles.title}>Próximos 7 días</Text>
    <Text style={styles.caption}>{place} · Días del lugar, incluido hoy. Pronóstico de modelos.</Text>
    {!days?.length ? <Text style={styles.body}>Información insuficiente: no recibimos un pronóstico diario válido.</Text> : <>
      {days.length < 7 && <Text style={styles.caption}>Pronóstico incompleto: disponibles {days.length} de los 7 días.</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ gap: 10, paddingBottom: 8 }}>
        {days.map((day) => {
          const condition = describeWeather(day.weatherCode, true);
          return <Pressable key={day.date} accessibilityRole="button" accessibilityState={{ expanded: selected === day.date }} onPress={() => setSelected(selected === day.date ? null : day.date)} style={[styles.card, selected === day.date && styles.selected]}>
            <Text style={styles.day}>{formatDate(day.date)}</Text>
            <Text style={styles.icon} accessibilityElementsHidden>{condition.icon}</Text>
            <Text style={styles.condition}>{condition.label}</Text>
            <Text style={styles.maximum}>Máx. {value(day.maximumC)}</Text>
            <Text style={styles.caption}>Mín. {value(day.minimumC)}</Text>
            <Text style={styles.caption}>Prob. máx.: {day.probabilityMax === null ? 'No disponible' : `${day.probabilityMax} %`}</Text>
          </Pressable>;
        })}
      </ScrollView>
      <Text style={styles.caption}>Deslizá y tocá un día para ampliar. El icono resume la condición más significativa prevista: no implica que dure todo el día.</Text>
      {chosen && <View style={styles.details}>
        <Text style={styles.day}>{formatDate(chosen.date)} · {place}</Text>
        <Text style={styles.body}>{describeWeather(chosen.weatherCode, true).label}</Text>
        <Text style={styles.body}>Temperatura diaria a 2 m: máxima {value(chosen.maximumC)}; mínima {value(chosen.minimumC)}.</Text>
        <Text style={styles.body}>Máxima probabilidad horaria de precipitación del día: {chosen.probabilityMax === null ? 'No disponible' : `${chosen.probabilityMax} %`}. No indica cantidad, duración ni certeza de lluvia durante todo el día.</Text>
        <Text style={styles.caption}>El resumen de hoy corresponde al día completo, no solo a las horas restantes. Estas estimaciones pueden cambiar al actualizar el pronóstico.</Text>
        <Text style={styles.caption}>Fuente: Open-Meteo · No es una alerta oficial.</Text>
        <Pressable accessibilityRole="button" onPress={() => setSelected(null)} style={styles.close}><Text style={styles.closeText}>Cerrar detalles −</Text></Pressable>
      </View>}
    </>}
    <Text style={styles.caption}>Zona: {timezone} · Consulta: {new Intl.DateTimeFormat('es-AR', { timeZone: timezone, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(fetchedAt)} · Open-Meteo.</Text>
  </View>;
}
const styles = StyleSheet.create({
  section: { gap: 12 }, title: { color: '#142F44', fontSize: 24, fontWeight: '700' },
  caption: { color: '#52697A', fontSize: 13, lineHeight: 20 }, body: { color: '#334B5D', fontSize: 16, lineHeight: 24 },
  card: { width: 164, padding: 16, gap: 8, borderRadius: 20, borderWidth: 2, borderColor: '#FFFFFF', backgroundColor: '#FFFFFF' },
  selected: { borderColor: '#126271', backgroundColor: '#E4F2F3' }, day: { color: '#142F44', fontSize: 16, fontWeight: '700' },
  icon: { fontSize: 36 }, condition: { color: '#334B5D', fontSize: 14, lineHeight: 20 },
  maximum: { color: '#163F57', fontSize: 17, fontWeight: '700' }, details: { padding: 18, gap: 10, backgroundColor: '#E4F2F3', borderRadius: 18 },
  close: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', padding: 12, borderRadius: 12, backgroundColor: '#126271' },
  closeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
