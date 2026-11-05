import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { fetchCurrentWeather, isWeatherFresh, isForecastFresh, type CurrentWeather, type WeatherLocation } from '@/providers/current-weather';
import { useCardPreferences } from '@/components/card-preferences-context';
import { HourlyWeatherStrip } from '@/components/hourly-weather-strip';
import { WeatherSummary } from '@/components/weather-summary';
import { WindNoticeCard } from '@/components/wind-notice-card';
import { UvNoticeCard } from '@/components/uv-notice-card';
import { PrecipitationNoticeCard } from '@/components/precipitation-notice-card';
import { VisibilityNoticeCard } from '@/components/visibility-notice-card';
import { PressureTrendCard } from '@/components/pressure-trend-card';

export function WeatherPanel({ location }: { location: WeatherLocation }) {
  const cardState = useCardPreferences();
  const cards = cardState.preferences;
  const [weather, setWeather] = useState<CurrentWeather>();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [now, setNow] = useState(Date.now());
  const request = useRef<AbortController | null>(null);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    const listener = AppState.addEventListener('change', () => setNow(Date.now()));
    return () => { clearInterval(timer); listener.remove(); request.current?.abort(); };
  }, []);
  const load = useCallback(async () => {
    if (request.current && !request.current.signal.aborted) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true); setWeather(undefined); setMessage('');
    try {
      const result = await fetchCurrentWeather(location, controller.signal);
      if (!controller.signal.aborted) { setWeather(result); setNow(Date.now()); }
    } catch (error) {
      if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : 'No pudimos consultar el clima. Reintentá.');
    } finally {
      if (!controller.signal.aborted) { setBusy(false); request.current = null; }
    }
  }, [location]);
  useEffect(() => { void load(); return () => request.current?.abort(); }, [load]);
  const fresh = weather !== undefined && isWeatherFresh(weather, now);
  const forecastFresh = weather !== undefined && isForecastFresh(weather, now);
  const futureHours = weather?.hourly?.filter((hour) => hour.time > now && hour.time <= now + 24 * 3600000) ?? [];
  const formatTime = (time: number, timezone: string) => new Intl.DateTimeFormat('es-AR', { timeZone: timezone, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'shortOffset' }).format(new Date(time));
  const value = (number: number | null, unit: string) => number === null ? 'Información insuficiente' : `${number.toFixed(1)} ${unit}`;
  return (
    <View style={styles.panel}>
      <Text accessibilityRole="header" style={styles.title}>{location.label}</Text>
      <Text style={styles.caption}>Clima estimado para el lugar elegido · Open-Meteo</Text>

      <Pressable accessibilityRole="button" disabled={busy} onPress={load} style={[styles.button, busy && styles.disabled]}><Text style={styles.buttonText}>{busy ? 'Consultando…' : weather ? 'Actualizar clima' : 'Consultar clima'}</Text></Pressable>
      {busy && <ActivityIndicator color="#126271" accessibilityLabel="Consultando clima" />}
      {!!message && <Text accessibilityLiveRegion="polite" style={styles.body}>{message}</Text>}
      {weather && !fresh && <Text accessibilityLiveRegion="polite" style={styles.body}>La hora de los datos no está vigente. Información insuficiente: actualizá la consulta.</Text>}
      {weather && fresh && <WeatherSummary weather={weather} />}
      {weather && <View style={styles.panel}>
        <Text accessibilityRole="header" style={styles.title}>Próximas 24 horas</Text>
        <Text style={styles.caption}>Pronóstico horario de modelos para {location.label}. Horas locales de {weather.timezone}; no son observaciones ni alertas.</Text>
        {!forecastFresh ? <Text style={styles.body}>La consulta del pronóstico está vencida. Actualizá para consultar las próximas horas.</Text>
          : futureHours.length === 0 ? <Text style={styles.body}>Información insuficiente: no recibimos un pronóstico horario válido.</Text>
          : <>
            {futureHours.length < 24 && <Text style={styles.body}>Pronóstico incompleto: disponibles {futureHours.length} horas dentro de las próximas 24. Podés actualizar.</Text>}
            <HourlyWeatherStrip hours={futureHours} timezone={weather.timezone} />
          </>}
      </View>}
      {weather && <View style={styles.details}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: detailsOpen }} onPress={() => setDetailsOpen((open) => !open)} style={styles.detailsButton}>
          <Text style={styles.sourceText}>{detailsOpen ? 'Ocultar detalles de los datos −' : 'Ver detalles de los datos +'}</Text>
        </Pressable>
        {detailsOpen && <>
          <Text style={styles.caption}>Hora de los datos: {formatTime(weather.validAt, weather.timezone)}{'\n'}Consultado: {formatTime(weather.fetchedAt, weather.timezone)}{'\n'}Zona horaria: {weather.timezone}</Text>
          <Text style={styles.caption}>La hora de los datos no indica cuándo se ejecutó el modelo. Son estimaciones para la zona: la celda puede diferir del punto elegido. No son mediciones locales ni alertas oficiales.</Text>
          <Pressable accessibilityRole="link" onPress={() => { void Linking.openURL('https://open-meteo.com/en/docs').catch(() => setMessage('No pudimos abrir el enlace de la fuente.')); }} style={styles.source}><Text style={styles.sourceText}>Fuente y documentación: Open-Meteo · CC BY 4.0 →</Text></Pressable>
        </>}
      </View>}
      {weather && cardState.status === 'error' && <Text accessibilityLiveRegion="polite" style={styles.body}>{cardState.message}</Text>}
      {weather && cardState.status === 'loading' && <Text style={styles.caption}>Cargando preferencias. Por ahora mostramos todas las tarjetas.</Text>}
      {weather && !Object.values(cards).some(Boolean) && <Text style={styles.body}>Ocultaste las tarjetas opcionales desde tus preferencias. Esto no significa ausencia de riesgo.</Text>}
      {weather && cards.wind && <WindNoticeCard now={now} timezone={weather.timezone} input={{ locationId: `${location.latitude}:${location.longitude}`, locationLabel: location.label, fetchedAt: weather.fetchedAt, hours: weather.hourly }} />}
      {weather && cards.uv && <UvNoticeCard now={now} timezone={weather.timezone} input={{ locationId: `${location.latitude}:${location.longitude}`, locationLabel: location.label, fetchedAt: weather.fetchedAt, hours: weather.uvHourly }} />}
      {weather && cards.precipitation && <PrecipitationNoticeCard now={now} timezone={weather.timezone} input={{ locationId: `${location.latitude}:${location.longitude}`, locationLabel: location.label, fetchedAt: weather.fetchedAt, hours: weather.precipitationHourly }} />}
      {weather && cards.visibility && <VisibilityNoticeCard now={now} timezone={weather.timezone} input={{ locationId: `${location.latitude}:${location.longitude}`, locationLabel: location.label, fetchedAt: weather.fetchedAt, hours: weather.visibilityHourly }} />}
      {weather && cards.pressure && <PressureTrendCard now={now} timezone={weather.timezone} input={{ locationId: `${location.latitude}:${location.longitude}`, locationLabel: location.label, fetchedAt: weather.fetchedAt, hours: weather.hourly }} />}
      <Text style={styles.caption}>Estimación para la zona: la celda del modelo puede diferir de la ubicación elegida. Se evalúan viento experimental, UV, precipitación y visibilidad; no es una evaluación completa de riesgos.</Text>
      <Pressable accessibilityRole="link" onPress={() => { void Linking.openURL('https://open-meteo.com/en/docs').catch(() => setMessage('No pudimos abrir el enlace de la fuente.')); }} style={styles.source}><Text style={styles.sourceText}>Fuente: Open-Meteo · CC BY 4.0</Text></Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  details: { borderColor: '#D3E2E9', borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, gap: 8 },
  detailsButton: { paddingVertical: 16, minHeight: 48 },
  panel: { gap: 16 }, title: { fontSize: 24, fontWeight: '700', color: '#142F44' },
  body: { fontSize: 16, lineHeight: 24, color: '#334B5D' }, caption: { fontSize: 14, lineHeight: 21, color: '#52697A' },
  button: { padding: 16, backgroundColor: '#126271', borderRadius: 12 }, buttonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' }, disabled: { opacity: 0.6 },
  card: { padding: 20, backgroundColor: '#FFFFFF', borderRadius: 20, gap: 8 }, value: { fontSize: 28, fontWeight: '700', color: '#142F44' },
  source: { paddingVertical: 12 }, sourceText: { color: '#126271', fontSize: 15, fontWeight: '700' },
  hour: { color: '#142F44', fontSize: 17, fontWeight: '700' },
});
