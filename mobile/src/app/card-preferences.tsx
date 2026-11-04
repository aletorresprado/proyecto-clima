import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useCardPreferences } from '@/components/card-preferences-context';
import { cardOptions, defaultCardPreferences } from '@/providers/card-preferences';

export default function CardPreferencesScreen() {
  const state = useCardPreferences();
  return <ScrollView contentContainerStyle={styles.page}>
    <Text accessibilityRole="header" style={styles.title}>Tus tarjetas del clima</Text>
    <Text style={styles.text}>Elegí qué evaluaciones mostrar. Ocultar una tarjeta no significa ausencia de riesgo. El resumen y el pronóstico siguen disponibles; sismos conserva su propio control.</Text>
    {state.status === 'disabled' ? <Text style={styles.text}>Preferencias por cuenta todavía no habilitadas en esta instalación. Podés seguir usando el clima y la demo ficticia.</Text>
      : state.status === 'session' || state.status === 'loading' ? <ActivityIndicator accessibilityLabel="Cargando preferencias" color="#126271" />
        : state.status === 'anonymous' ? <><Text style={styles.text}>Iniciá sesión para guardar tus preferencias por cuenta.</Text><Link href="/account" style={styles.link}>Abrir tu cuenta →</Link></>
          : state.status === 'ready' ? <PreferencesEditor key={state.uid} />
            : <><Text accessibilityLiveRegion="polite" style={styles.text}>{state.message}</Text>{state.uid && <Pressable accessibilityRole="button" onPress={() => void state.reload()} style={styles.button}><Text style={styles.buttonText}>Reintentar carga</Text></Pressable>}</>}
  </ScrollView>;
}

function PreferencesEditor() {
  const state = useCardPreferences();
  const [draft, setDraft] = useState(state.preferences);
  useEffect(() => { setDraft(state.preferences); }, [state.preferences]);
  const dirty = cardOptions.some(({ id }) => draft[id] !== state.preferences[id]);
  return <>
    <Text style={styles.text}>Al guardar, enviamos estas cinco opciones a Firebase asociadas a tu cuenta. Se aplican después de confirmar el guardado.</Text>
    {cardOptions.map(({ id, label }) => <View style={styles.row} key={id}><Text style={styles.text}>{label}</Text><Switch disabled={state.busy} accessibilityLabel={`Mostrar tarjeta de ${label}`} value={draft[id]} onValueChange={(value) => setDraft((previous) => ({ ...previous, [id]: value }))} /></View>)}
    <Pressable accessibilityRole="button" disabled={state.busy} onPress={() => setDraft(defaultCardPreferences())} style={styles.secondary}><Text style={styles.text}>Restablecer todas</Text></Pressable>
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: state.busy || !dirty }} disabled={state.busy || !dirty} onPress={() => void state.save(draft)} style={[styles.button, (state.busy || !dirty) && styles.disabled]}><Text style={styles.buttonText}>{state.busy ? 'Guardando…' : 'Guardar preferencias'}</Text></Pressable>
    {dirty && <Text style={styles.text}>Cambios sin guardar. Si salís de esta pantalla se descartarán.</Text>}
    {!!state.message && <Text accessibilityLiveRegion="polite" style={styles.text}>{state.message}</Text>}
  </>;
}
const styles = StyleSheet.create({
  page: { padding: 24, gap: 16, backgroundColor: '#F3F7FA', maxWidth: 640, width: '100%', alignSelf: 'center' },
  title: { fontSize: 24, color: '#142F44', fontWeight: '700' },
  text: { fontSize: 16, lineHeight: 24, color: '#334B5D', flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  button: { padding: 16, backgroundColor: '#126271', borderRadius: 12 },
  buttonText: { fontSize: 16, color: '#FFFFFF', fontWeight: '700', textAlign: 'center' },
  secondary: { borderColor: '#126271', borderWidth: 1, padding: 16, borderRadius: 12 },
  link: { color: '#126271', paddingVertical: 12, fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.6 },
});
