import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { fetchCurrentWeather, isWeatherFresh, type CurrentWeather, type WeatherLocation } from '@/providers/current-weather';

export function WeatherPanel({ location }: { location: WeatherLocation }) {
  const [weather, setWeather] = useState<CurrentWeather>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [now, setNow] = useState(Date.now());
  const request = useRef<AbortController | null>(null);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    const listener = AppState.addEventListener('change', () => setNow(Date.now()));
    return () => { clearInterval(timer); listener.remove(); request.current?.abort(); };
  }, []);
  async function load() {
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
  }
  const fresh = weather !== undefined && isWeatherFresh(weather, now);
  const formatTime = (time: number, timezone: string) => new Intl.DateTimeFormat('es-AR', { timeZone: timezone, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(time));
  const value = (number: number | null, unit: string) => number === null ? 'Información insuficiente' : `${number.toFixed(1)} ${unit}`;
  return (
    <View style={styles.panel}>
      <Text accessibilityRole="header" style={styles.title}>{location.label}</Text>
      <Text style={styles.body}>Condiciones actuales estimadas por modelos. No son mediciones locales ni alertas oficiales.</Text>
      <Text style={styles.caption}>Al consultar enviamos las coordenadas del lugar elegido a Open-Meteo. No guardamos la consulta en la nube.</Text>
      <Pressable accessibilityRole="button" disabled={busy} onPress={load} style={[styles.button, busy && styles.disabled]}><Text style={styles.buttonText}>{busy ? 'Consultando…' : weather ? 'Actualizar clima' : 'Consultar clima'}</Text></Pressable>
      {busy && <ActivityIndicator color="#126271" accessibilityLabel="Consultando clima" />}
      {!!message && <Text accessibilityLiveRegion="polite" style={styles.body}>{message}</Text>}
      {weather && !fresh && <Text accessibilityLiveRegion="polite" style={styles.body}>La hora de los datos no está vigente. Información insuficiente: actualizá la consulta.</Text>}
      {weather && fresh && <>
        <View style={styles.card}><Text style={styles.caption}>Temperatura del aire a 2 m</Text><Text style={styles.value}>{value(weather.temperatureC, '°C')}</Text></View>
        <View style={styles.card}><Text style={styles.caption}>Velocidad del viento a 10 m</Text><Text style={styles.value}>{value(weather.windKmh, 'km/h')}</Text></View>
        <View style={styles.card}><Text style={styles.caption}>Presión reducida al nivel del mar</Text><Text style={styles.value}>{value(weather.seaLevelPressureHpa, 'hPa')}</Text></View>
      </>}
      {weather && <Text style={styles.caption}>Hora de los datos: {formatTime(weather.validAt, weather.timezone)}{'\n'}Consultado: {formatTime(weather.fetchedAt, weather.timezone)}{'\n'}Zona horaria: {weather.timezone}{'\n'}La hora de los datos no indica cuándo se ejecutó el modelo.</Text>}
      <Text style={styles.caption}>Estimación para la zona: la celda del modelo puede diferir de la ubicación elegida. Esta pantalla todavía no evalúa riesgos.</Text>
      <Pressable accessibilityRole="link" onPress={() => { void Linking.openURL('https://open-meteo.com/en/docs').catch(() => setMessage('No pudimos abrir el enlace de la fuente.')); }} style={styles.source}><Text style={styles.sourceText}>Fuente: Open-Meteo · CC BY 4.0</Text></Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  panel: { gap: 16 }, title: { fontSize: 24, fontWeight: '700', color: '#142F44' },
  body: { fontSize: 16, lineHeight: 24, color: '#334B5D' }, caption: { fontSize: 14, lineHeight: 21, color: '#52697A' },
  button: { padding: 16, backgroundColor: '#126271', borderRadius: 12 }, buttonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' }, disabled: { opacity: 0.6 },
  card: { padding: 20, backgroundColor: '#FFFFFF', borderRadius: 20, gap: 8 }, value: { fontSize: 28, fontWeight: '700', color: '#142F44' },
  source: { paddingVertical: 12 }, sourceText: { color: '#126271', fontSize: 15, fontWeight: '700' },
});
