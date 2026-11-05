import { Link } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LocationPicker } from '@/components/location-picker';
import { WeatherPanel } from '@/components/weather-panel';
import { EarthquakeCard } from '@/components/earthquake-monitor';
import { AccountLink } from '@/components/account-link';
import { SavedLocationsCard } from '@/components/saved-locations-card';
import type { WeatherLocation } from '@/providers/current-weather';

export default function HomeScreen() {
  const [location, setLocation] = useState<WeatherLocation>();
  const [choosing, setChoosing] = useState(true);
  const [toolsOpen, setToolsOpen] = useState(false);
  const savedOwner = useRef<string | null>(null);
  const onSessionChange = useCallback((uid: string | null) => {
    if (savedOwner.current && savedOwner.current !== uid) {
      savedOwner.current = null; setLocation(undefined); setChoosing(true);
    }
  }, []);
  function select(place: WeatherLocation, uid: string | null = null) {
    savedOwner.current = uid; setLocation(place); setChoosing(false); setToolsOpen(false);
  }
  return <SafeAreaView style={styles.page}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View style={{ flex: 1 }}><Text style={styles.eyebrow}>TU DÍA, CON CONTEXTO</Text><Text accessibilityRole="header" style={styles.title}>Proyecto Clima</Text></View>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: toolsOpen }} onPress={() => { Keyboard.dismiss(); setToolsOpen((open) => !open); }} style={({ pressed }) => [styles.spaceButton, toolsOpen && styles.spaceButtonOpen, pressed && { opacity: 0.7 }]}><Text style={styles.link}>Mi espacio {toolsOpen ? '−' : '+'}</Text></Pressable>
      </View>
      <View style={[styles.spacePanel, { display: toolsOpen ? 'flex' : 'none' }]}>
        <Text accessibilityRole="header" style={styles.spaceTitle}>Mi espacio</Text>
        {__DEV__ && <Link href="/development-tests" asChild>
          <Pressable accessibilityRole="link" style={styles.testsButton}>
            <Text style={styles.testsButtonText}>Pruebas de desarrollo →</Text>
            <Text style={styles.testsCaption}>Sismos y clima con datos ficticios</Text>
          </Pressable>
        </Link>}
        <AccountLink />
        <Link href="/card-preferences" style={styles.link}>Elegir tarjetas del clima →</Link>
        <Text style={styles.caption}>Al elegir un lugar guardado consultaremos su clima en Open-Meteo enviando las coordenadas de ese lugar.</Text>
        <SavedLocationsCard selected={location} onSessionChange={onSessionChange} onSelect={(place, uid) => select(place, uid)} />
      </View>
      {location && <Pressable accessibilityRole="button" accessibilityState={{ expanded: choosing }} onPress={() => setChoosing((open) => !open)} style={styles.control}><Text style={styles.link}>{choosing ? 'Cerrar selector' : 'Cambiar localidad'} →</Text></Pressable>}
      <View style={{ display: choosing || !location ? 'flex' : 'none', gap: 12 }}>
        <Text style={styles.caption}>Al elegir o confirmar una localidad consultaremos su clima enviando sus coordenadas a Open-Meteo. El GPS se usa solo cuando lo solicitás.</Text>
        <LocationPicker selected={location} onSelect={(place) => select(place)} />
      </View>
      {location ? <WeatherPanel key={`${location.latitude}:${location.longitude}:${location.label}`} location={location} />
        : <View style={styles.welcome}><Text style={styles.welcomeIcon} accessibilityElementsHidden>🌤️</Text><Text style={styles.title}>Tu clima, de un vistazo</Text><Text style={styles.caption}>Buscá una localidad o confirmá tu ubicación para ver datos reales. La ilustración es decorativa.</Text></View>}
      <EarthquakeCard />
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F3F7FA' },
  content: { padding: 20, gap: 12, maxWidth: 640, width: '100%', alignSelf: 'center' },
  spaceButton: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#E4F2F3', borderWidth: 1, borderColor: '#A9CCD0', borderRadius: 14, justifyContent: 'center' },
  spaceButtonOpen: { borderColor: '#126271' },
  spacePanel: { gap: 16, padding: 16, backgroundColor: '#EAF2F5', borderRadius: 20, borderWidth: 1, borderColor: '#C8DDE4' },
  spaceTitle: { color: '#142F44', fontSize: 20, fontWeight: '700' },
  testsButton: { backgroundColor: '#163F57', borderRadius: 14, padding: 16, gap: 6, minHeight: 48 },
  testsButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  testsCaption: { color: '#D3E8F0', fontSize: 13 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrow: { color: '#256A6B', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  title: { color: '#142F44', fontSize: 25, fontWeight: '800' },
  caption: { color: '#52697A', fontSize: 14, lineHeight: 21 },
  control: { paddingVertical: 10, minHeight: 44 },
  link: { color: '#126271', fontSize: 15, fontWeight: '700', paddingVertical: 6 },
  welcome: { padding: 24, backgroundColor: '#E1EFF4', borderRadius: 24, gap: 12 },
  welcomeIcon: { fontSize: 48 },
});
