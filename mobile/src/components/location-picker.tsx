import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { suggestDeviceLocation } from '@/providers/device-location';
import { searchLocations, type SearchPlace } from '@/providers/search-locations';
import type { WeatherLocation } from '@/providers/current-weather';

export function LocationPicker({ onSelect, selected }: { onSelect: (place: WeatherLocation) => void; selected?: WeatherLocation }) {
  const [query, setQuery] = useState('');
  const [suggestion, setSuggestion] = useState<{ label: string; hasPlaceName: boolean; latitude: number; longitude: number }>();
  const [results, setResults] = useState<SearchPlace[]>([]);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [searchMessage, setSearchMessage] = useState('');
  const searchController = useRef<AbortController | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);
  const requesting = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; searchController.current?.abort(); }; }, []);

  function changeQuery(value: string) {
    searchController.current?.abort();
    setQuery(value);
    setResults([]);
    setSearchStatus('idle');
    setSearchMessage('');
  }

  async function search() {
    if (busy || query.trim().length < 3 || searchStatus === 'loading') return;
    searchController.current?.abort();
    const controller = new AbortController();
    searchController.current = controller;
    setSearchStatus('loading');
    setSearchMessage('');
    setResults([]);
    try {
      const places = await searchLocations(query, controller.signal);
      if (mounted.current && !controller.signal.aborted) {
        setResults(places);
        setSearchStatus('done');
      }
    } catch (error) {
      if (mounted.current && !controller.signal.aborted) {
        setSearchStatus('error');
        setSearchMessage(error instanceof Error ? error.message : 'No pudimos buscar. Reintentá.');
      }
    }
  }

  async function requestLocation() {
    if (requesting.current) return;
    requesting.current = true;
    setBusy(true);
    setSuggestion(undefined);
    setMessage('');
    try {
      const coordinates = await suggestDeviceLocation();
      if (mounted.current) setSuggestion({
        label: coordinates.placeName ?? `Ubicación del dispositivo (${coordinates.latitude.toFixed(3)}, ${coordinates.longitude.toFixed(3)})`,
        hasPlaceName: coordinates.placeName !== null,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });
    } catch (error) {
      if (mounted.current) setMessage(error instanceof Error ? error.message : 'No pudimos obtener ubicación. Probá la selección manual.');
    } finally {
      requesting.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>Elegí tu ubicación</Text>
      <Text style={styles.body}>Consultamos la ubicación solo cuando lo pedís. Para sugerir el nombre usamos el servicio del sistema. Después de elegir un lugar podés consultar su clima; las coordenadas se enviarán a Open-Meteo al tocar Consultar clima.</Text>
      <Pressable accessibilityRole="button" disabled={busy || searchStatus === 'loading'} onPress={requestLocation} style={[styles.button, (busy || searchStatus === 'loading') && styles.disabled]}>
        <Text style={styles.buttonText}>{busy ? 'Buscando ubicación y localidad…' : 'Usar mi ubicación'}</Text>
      </Pressable>
      {busy && <ActivityIndicator accessibilityLabel="Obteniendo ubicación" color="#126271" />}
      {message !== '' && <Text accessibilityLiveRegion="polite" style={styles.body}>{message}</Text>}
      {suggestion && (
        <View style={styles.suggestion}>
          <Text style={styles.body}>Sugerencia: {suggestion.label}</Text>
          <Text style={styles.body}>{suggestion.hasPlaceName
            ? 'Nombre sugerido por el servicio del sistema. Confirmá si corresponde al lugar que querés consultar; si no, descartalo y usá la selección manual.'
            : 'Obtuvimos coordenadas, pero no pudimos resolver una localidad. Podés confirmarlas, reintentar con conexión o elegir un lugar manualmente.'}</Text>
          <Pressable accessibilityRole="button" style={styles.button} onPress={() => { onSelect(suggestion); setSuggestion(undefined); }}>
            <Text style={styles.buttonText}>Confirmar esta ubicación</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setSuggestion(undefined)} style={styles.secondary}>
            <Text style={styles.action}>Descartar sugerencia</Text>
          </Pressable>
        </View>
      )}
      <Text style={styles.label}>O buscá una localidad</Text>
      <Text style={styles.caption}>Al tocar Buscar enviamos el texto a Open-Meteo. No hace falta permiso de ubicación para esta búsqueda.</Text>
      <TextInput accessibilityLabel="Buscar localidad" placeholder="Ej.: Córdoba o Madrid" placeholderTextColor="#52697A" value={query} onChangeText={changeQuery} editable={!busy} style={styles.input} autoCorrect={false} maxLength={100} returnKeyType="search" onSubmitEditing={search} />
      <Pressable accessibilityRole="button" disabled={busy || searchStatus === 'loading' || query.trim().length < 3} onPress={search} style={[styles.button, (busy || searchStatus === 'loading' || query.trim().length < 3) && styles.disabled]}>
        <Text style={styles.buttonText}>{searchStatus === 'loading' ? 'Buscando localidades…' : 'Buscar'}</Text>
      </Pressable>
      {searchStatus === 'loading' && <ActivityIndicator color="#126271" accessibilityLabel="Buscando localidades" />}
      {searchMessage !== '' && <Text accessibilityLiveRegion="polite" style={styles.body}>{searchMessage}</Text>}
      {results.map((place) => (
        <Pressable key={place.id} accessibilityRole="button" disabled={busy} style={styles.secondary} onPress={() => { onSelect(place); setSuggestion(undefined); setMessage(''); changeQuery(''); }}>
          <Text style={styles.action}>Elegir {place.label}</Text>
        </Pressable>
      ))}
      {searchStatus === 'done' && results.length === 0 && <Text accessibilityLiveRegion="polite" style={styles.caption}>No encontramos coincidencias. Probá otro nombre o agregá el país después de una coma.</Text>}
      {query.trim().length < 3 && <Text style={styles.caption}>Escribí al menos 3 caracteres.</Text>}
      <Pressable accessibilityRole="link" style={styles.secondary} onPress={() => { void Linking.openURL('https://open-meteo.com/en/docs/geocoding-api').catch(() => setSearchMessage('No pudimos abrir el enlace de la fuente.')); }}>
        <Text style={styles.action}>Localidades: Open-Meteo · datos de GeoNames (CC BY 4.0)</Text>
      </Pressable>
      {selected && <Text accessibilityLiveRegion="polite" style={styles.body}>Ubicación elegida: {selected.label}. Consultá las condiciones estimadas con el botón de abajo.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, gap: 12 },
  title: { color: '#142F44', fontSize: 22, fontWeight: '700' },
  body: { color: '#334B5D', fontSize: 15, lineHeight: 23 },
  caption: { color: '#52697A', fontSize: 14, lineHeight: 21 },
  label: { color: '#142F44', fontWeight: '700', fontSize: 16 },
  button: { backgroundColor: '#126271', padding: 16, borderRadius: 12 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16, textAlign: 'center' },
  disabled: { opacity: 0.6 },
  input: { borderWidth: 1, borderColor: '#8BA6B7', borderRadius: 12, padding: 14, fontSize: 16, color: '#142F44' },
  secondary: { paddingVertical: 12 },
  action: { color: '#126271', fontWeight: '700', fontSize: 16 },
  suggestion: { gap: 12, padding: 12, backgroundColor: '#EAF4F5', borderRadius: 12 },
});
