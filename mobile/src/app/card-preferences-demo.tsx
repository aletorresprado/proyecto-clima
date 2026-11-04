import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { cardOptions, createCardPreferencesDemo, defaultCardPreferences, type CardPreferences } from '@/providers/card-preferences';

export default function CardPreferencesDemo() {
  const [store] = useState(createCardPreferencesDemo);
  const [uid, setUid] = useState<string | null>('A');
  const [draft, setDraft] = useState<CardPreferences>(defaultCardPreferences);
  const [failed, setFailed] = useState(false);
  const [message, setMessage] = useState('');
  function selectUser(next: string | null) {
    setUid(next); setDraft(next ? store.read(next) : defaultCardPreferences()); setMessage('');
  }
  function save() {
    if (!uid) return;
    if (failed) { setMessage('No pudimos guardar. Revisá la conexión ficticia y reintentá.'); return; }
    store.save(uid, draft); setMessage('Preferencias ficticias guardadas.');
  }
  return <ScrollView contentContainerStyle={styles.page}>
    <Text accessibilityRole="header" style={styles.title}>Elegí tus tarjetas</Text>
    <Text style={styles.text}>DEMOSTRACIÓN · Usuarios ficticios. Solo memoria: se reinicia al salir. No modifica tu cuenta ni el clima real.</Text>
    <View style={styles.row}>{(['A', 'B', null] as const).map((user) => <Pressable key={user ?? 'none'} accessibilityRole="button" accessibilityState={{ selected: uid === user }} onPress={() => selectUser(user)} style={styles.button}><Text style={styles.buttonText}>{user ? `Usuario ${user}` : 'Sin sesión'}</Text></Pressable>)}</View>
    <Text style={styles.text}>Cuenta ficticia: {uid ?? 'sin sesión'}</Text>
    {!uid ? <Text style={styles.text}>Iniciá sesión para guardar preferencias. El clima básico sigue disponible.</Text> : <>
      {cardOptions.map(({ id, label }) => <View style={styles.row} key={id}><Text style={styles.text}>{label}</Text><Switch accessibilityLabel={`Mostrar tarjeta de ${label}`} value={draft[id]} onValueChange={(value) => { setDraft((previous) => ({ ...previous, [id]: value })); setMessage('Cambios sin guardar.'); }} /></View>)}
      <Pressable accessibilityRole="button" onPress={() => { setDraft(defaultCardPreferences()); setMessage('Todas seleccionadas. Tocá Guardar para conservarlo.'); }} style={styles.secondary}><Text style={styles.text}>Restablecer todas</Text></Pressable>
      <View style={styles.row}><Text style={styles.text}>Simular conexión fallida</Text><Switch accessibilityLabel="Simular conexión fallida" value={failed} onValueChange={setFailed} /></View>
      <Pressable accessibilityRole="button" onPress={save} style={styles.button}><Text style={styles.buttonText}>Guardar preferencias ficticias</Text></Pressable>
      <Text accessibilityLiveRegion="polite" style={styles.text}>{message}</Text>
      <Text accessibilityRole="header" style={styles.title}>Vista previa de la selección</Text>
      <Text style={styles.text}>Son etiquetas de prueba, sin datos meteorológicos. Ocultar una tarjeta no significa ausencia de riesgo.</Text>
      {cardOptions.filter(({ id }) => draft[id]).map(({ id, label }) => <View key={id} style={styles.card}><Text style={styles.text}>{label} · tarjeta de ejemplo</Text></View>)}
      {!cardOptions.some(({ id }) => draft[id]) && <Text style={styles.text}>Todas las tarjetas opcionales están ocultas. El resumen y el pronóstico seguirán disponibles.</Text>}
      <Text style={styles.text}>Sismos conserva su control de monitoreo independiente.</Text>
    </>}
  </ScrollView>;
}
const styles = StyleSheet.create({
  page: { padding: 24, gap: 16, backgroundColor: '#F3F7FA', maxWidth: 640, width: '100%', alignSelf: 'center' },
  title: { fontSize: 22, color: '#142F44', fontWeight: '700' },
  text: { fontSize: 16, lineHeight: 24, color: '#334B5D', flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  button: { backgroundColor: '#126271', borderRadius: 12, padding: 14 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  secondary: { borderColor: '#126271', borderWidth: 1, padding: 14, borderRadius: 12 },
  card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16 },
});
