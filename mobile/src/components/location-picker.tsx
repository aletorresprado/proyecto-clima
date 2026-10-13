import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { suggestDeviceLocation } from '@/providers/device-location';

const examplePlaces = ['Yerba Buena, Tucumán', 'Buenos Aires, Argentina', 'Córdoba, Argentina', 'Madrid, España'];
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export function LocationPicker() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string>();
  const [suggestion, setSuggestion] = useState<{ label: string; hasPlaceName: boolean }>();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);
  const requesting = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const matches = query.trim() ? examplePlaces.filter((place) => normalize(place).includes(normalize(query))) : [];

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
      <Text style={styles.body}>Consultamos la ubicación solo cuando lo pedís. Para sugerir el nombre usamos el servicio de geocodificación del sistema, que puede necesitar conexión. No guardamos tu ubicación ni la enviamos a un proveedor de clima.</Text>
      <Pressable accessibilityRole="button" disabled={busy} onPress={requestLocation} style={[styles.button, busy && styles.disabled]}>
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
          <Pressable accessibilityRole="button" style={styles.button} onPress={() => { setSelected(suggestion.label); setSuggestion(undefined); }}>
            <Text style={styles.buttonText}>Confirmar esta ubicación</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => setSuggestion(undefined)} style={styles.secondary}>
            <Text style={styles.action}>Descartar sugerencia</Text>
          </Pressable>
        </View>
      )}
      <Text style={styles.label}>O buscá un lugar de prueba</Text>
      <TextInput accessibilityLabel="Buscar lugar de prueba" placeholder="Ej.: Córdoba o Madrid" placeholderTextColor="#52697A" value={query} onChangeText={setQuery} editable={!busy} style={styles.input} autoCorrect={false} maxLength={100} />
      <Text style={styles.caption}>Lista local de ejemplo. La búsqueda de cualquier localidad se incorporará en el siguiente paso.</Text>
      {matches.map((place) => (
        <Pressable key={place} accessibilityRole="button" disabled={busy} style={styles.secondary} onPress={() => { setSelected(`${place} (selección manual de prueba)`); setSuggestion(undefined); setMessage(''); setQuery(''); }}>
          <Text style={styles.action}>Elegir {place}</Text>
        </Pressable>
      ))}
      {query.trim() && matches.length === 0 && <Text style={styles.caption}>No está en la lista de prueba. Probá Córdoba, Madrid, Buenos Aires o Yerba Buena.</Text>}
      {selected && <Text accessibilityLiveRegion="polite" style={styles.body}>Ubicación elegida: {selected}. Los datos meteorológicos de abajo siguen siendo ficticios y no corresponden a esta selección.</Text>}
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
