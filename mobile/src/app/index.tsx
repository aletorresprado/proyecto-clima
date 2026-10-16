import { Link } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { demoWeather } from '@/data/demo-weather';
import { LocationPicker } from '@/components/location-picker';
import { WeatherPanel } from '@/components/weather-panel';
import { EarthquakeCard } from '@/components/earthquake-monitor';
import type { WeatherLocation } from '@/providers/current-weather';

export default function HomeScreen() {
  const [location, setLocation] = useState<WeatherLocation>();
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>TU DÍA, CON CONTEXTO</Text>
        <Text accessibilityRole="header" style={styles.title}>Proyecto Clima</Text>
        {!location && <View style={styles.demo}>
          <Text style={styles.badge}>DEMOSTRACIÓN · DATOS FICTICIOS</Text>
          <Text style={styles.body}>Estos valores sirven para probar la app. No describen el clima real ni son alertas oficiales.</Text>
        </View>}
        <LocationPicker onSelect={setLocation} />
        <EarthquakeCard />
        {location ? <WeatherPanel key={`${location.latitude}:${location.longitude}:${location.label}`} location={location} /> : <>
        <Text style={styles.place}>Escenario ficticio: {demoWeather.place}</Text>
        <Text style={styles.caption}>Datos de demostración independientes de la ubicación elegida</Text>
        <View style={styles.hero}>
          <Text style={styles.temperature}>{demoWeather.temperatureC} °C</Text>
          <Text style={styles.heroText}>{demoWeather.condition}</Text>
          <Text style={styles.heroText}>Escenario simulado</Text>
        </View>
        <View style={styles.card}><Text style={styles.caption}>Viento simulado</Text><Text style={styles.value}>{demoWeather.windKmh} km/h</Text></View>
        <View style={styles.card}><Text style={styles.caption}>Presión al nivel del mar</Text><Text style={styles.value}>{demoWeather.seaLevelPressureHpa} hPa</Text></View>
        <Text accessibilityRole="header" style={styles.section}>Para anticiparte</Text>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>AVISO DE EJEMPLO</Text>
          <Text style={styles.cardTitle}>{demoWeather.notice.title}</Text>
          <Text style={styles.body}>{demoWeather.notice.action}</Text>
          <Text style={styles.caption}>{demoWeather.notice.validity}</Text>
          <Link href="/explore" style={styles.link}>Ver motivo y fuente →</Link>
        </View>
        <Text style={styles.caption}>Fuente: {demoWeather.source}{'\n'}Actualización ficticia: {demoWeather.updated}</Text>
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F3F7FA' },
  content: { padding: 24, gap: 16, maxWidth: 640, width: '100%', alignSelf: 'center' },
  eyebrow: { color: '#256A6B', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  title: { color: '#142F44', fontSize: 32, fontWeight: '800' },
  demo: { backgroundColor: '#FFF3D5', borderRadius: 16, padding: 16, gap: 8 },
  badge: { color: '#725000', fontSize: 12, fontWeight: '800' },
  body: { color: '#334B5D', fontSize: 16, lineHeight: 24 },
  place: { color: '#142F44', fontSize: 22, fontWeight: '700' },
  caption: { color: '#52697A', fontSize: 14, lineHeight: 21 },
  hero: { backgroundColor: '#163F57', borderRadius: 24, padding: 24, gap: 8 },
  temperature: { color: '#FFFFFF', fontSize: 52, fontWeight: '700' },
  heroText: { color: '#E0F3F7', fontSize: 16 },
  value: { color: '#142F44', fontSize: 24, fontWeight: '700' },
  section: { color: '#142F44', fontSize: 22, fontWeight: '700' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, gap: 12 },
  cardTitle: { color: '#142F44', fontSize: 20, fontWeight: '700' },
  link: { color: '#126271', fontSize: 16, fontWeight: '700', paddingVertical: 12 },
});
