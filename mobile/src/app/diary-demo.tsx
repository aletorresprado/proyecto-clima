import { Redirect } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { createDemoDiaryEntry, demoDiaryContext, DEMO_NOTE_LIMIT, type DiaryScenario, type DemoDiaryEntry } from '@/providers/diary-demo';
import { describeWeather } from '@/providers/weather-condition';

const scenarios = [{ id: 'clear', label: 'Despejado' }, { id: 'rain', label: 'Lluvia' },
  { id: 'missing', label: 'Sin datos' }, { id: 'expired', label: 'Vencido' }] as const;
type Row = DemoDiaryEntry & { id: number };
const date = (time: number) => time > 0 ? new Date(time).toLocaleString('es-AR') : 'No disponible';

export default function DiaryDemoScreen() {
  const [note, setNote] = useState('Nota ficticia: hoy me siento con energía.');
  const [scenario, setScenario] = useState<DiaryScenario>('clear');
  const [context, setContext] = useState(() => demoDiaryContext('clear', Date.now()));
  const [confirmed, setConfirmed] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [message, setMessage] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [controlsOpen, setControlsOpen] = useState(false);
  const sequence = useRef(0);
  if (!__DEV__) return <Redirect href="/" />;
  const preview = createDemoDiaryEntry('Vista previa ficticia', context, Date.now(), true).weather;
  function save() {
    try {
      const entry = createDemoDiaryEntry(note, context, Date.now(), confirmed);
      if (rows.length >= 10) { setMessage('La demo admite diez registros. Eliminá uno para continuar.'); return; }
      const id = ++sequence.current;
      setRows((previous) => [{ ...entry, id }, ...previous]);
      setNote(''); setMessage('Registro ficticio guardado solo en memoria.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No pudimos guardar la prueba.'); }
  }
  return <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Text style={styles.badge}>DEMOSTRACIÓN · NO INGRESES DATOS PERSONALES REALES</Text>
    <Text accessibilityRole="header" style={styles.title}>¿Cómo me siento hoy?</Text>
    <Text style={styles.caption}>Probá con una nota inventada. Esta pantalla no usa GPS, tu cuenta ni el clima real. Todo se borra al salir; no se envía a Firebase.</Text>
    <Text accessibilityRole="header" style={styles.label}>Mi nota ficticia</Text>
    <TextInput accessibilityLabel="Nota ficticia de cómo me siento hoy" multiline maxLength={DEMO_NOTE_LIMIT} value={note} onChangeText={setNote} style={styles.input} placeholder="Ejemplo ficticio: hoy me siento con energía." placeholderTextColor="#647888" textAlignVertical="top" autoCorrect={false} autoComplete="off" />
    <Text style={styles.caption}>{note.length}/{DEMO_NOTE_LIMIT} caracteres · límite provisional de la demo</Text>
    <View style={styles.context}>
      <Text style={styles.label}>Contexto que se copiará al guardar</Text>
      <WeatherContext weather={preview} />
      <View style={styles.row}><Text style={[styles.caption, { flex: 1 }]}>Confirmo este lugar ficticio para el registro</Text><Switch accessibilityLabel="Confirmar lugar ficticio del registro" value={confirmed} onValueChange={setConfirmed} /></View>
    </View>
    <Pressable accessibilityRole="button" onPress={save} style={styles.button}><Text style={styles.buttonText}>Guardar registro ficticio</Text></Pressable>
    {!!message && <Text accessibilityLiveRegion="polite" style={styles.body}>{message}</Text>}
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: controlsOpen }} onPress={() => setControlsOpen((open) => !open)} style={styles.secondary}><Text style={styles.link}>{controlsOpen ? 'Cerrar escenarios −' : 'Cambiar clima ficticio para probar +'}</Text></Pressable>
    {controlsOpen && <View style={styles.controls}>
      {scenarios.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: scenario === item.id }} onPress={() => { setScenario(item.id); setContext(demoDiaryContext(item.id, Date.now())); setConfirmed(false); setMessage('Escenario cambiado. Los registros anteriores conservan su copia.'); }} style={styles.secondary}><Text style={styles.link}>{item.label}</Text></Pressable>)}
    </View>}
    <Text accessibilityRole="header" style={styles.title}>Registros ficticios ({rows.length})</Text>
    {!rows.length && <Text style={styles.caption}>Todavía no guardaste registros de prueba.</Text>}
    {rows.map((entry) => <View style={styles.record} key={entry.id}>
      <Text style={styles.badge}>REGISTRO FICTICIO</Text>
      <Text style={styles.caption}>Registrado: {date(entry.recordedAt)} · hora del teléfono</Text>
      <Text style={styles.body}>{entry.note}</Text>
      <WeatherContext weather={entry.weather} />
      {deleteId === entry.id ? <View style={{ gap: 8 }}>
        <Text style={styles.body}>¿Eliminar este registro ficticio?</Text>
        <Pressable accessibilityRole="button" onPress={() => { setRows((previous) => previous.filter((row) => row.id !== entry.id)); setDeleteId(null); setMessage('Registro ficticio eliminado.'); }} style={styles.secondary}><Text style={styles.link}>Confirmar eliminación</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => setDeleteId(null)} style={styles.secondary}><Text style={styles.link}>Cancelar</Text></Pressable>
      </View> : <Pressable accessibilityRole="button" onPress={() => setDeleteId(entry.id)} style={styles.secondary}><Text style={styles.link}>Eliminar registro ficticio</Text></Pressable>}
    </View>)}
    <Text style={styles.caption}>Registro descriptivo de prueba: no diagnostica ni atribuye al clima cómo te sentís. Consentimiento, conservación, exportación y guardado real todavía pendientes.</Text>
  </ScrollView>;
}

function WeatherContext({ weather }: { weather: DemoDiaryEntry['weather'] }) {
  const condition = describeWeather(weather.conditionCode, true);
  const value = (v: number | null, unit: string) => v === null ? 'No disponible' : `${v.toFixed(1)} ${unit}`;
  return <View style={{ gap: 6 }}>
    <Text style={styles.label}>{weather.place}</Text>
    <Text style={styles.body}>{weather.state === 'expired' ? 'Contexto vencido: valores no presentados como vigentes.' : weather.state === 'unavailable' ? 'Contexto meteorológico no disponible.' : weather.state === 'partial' ? 'Contexto parcial: hay datos faltantes.' : 'Contexto ficticio disponible.'}</Text>
    <Text style={styles.body}>{condition.icon} {condition.label}</Text>
    <Text style={styles.body}>Temperatura a 2 m: {value(weather.temperatureC, '°C')}</Text>
    <Text style={styles.body}>Presión al nivel del mar: {value(weather.seaLevelPressureHpa, 'hPa')}</Text>
    <Text style={styles.caption}>Hora de los datos: {date(weather.validAt)}{'\n'}Consulta ficticia: {date(weather.fetchedAt)}{'\n'}Fuente: {weather.source} · No son mediciones reales.</Text>
  </View>;
}

const styles = StyleSheet.create({
  page: { padding: 24, gap: 16, backgroundColor: '#F3F7FA', maxWidth: 640, width: '100%', alignSelf: 'center' },
  title: { color: '#142F44', fontSize: 24, fontWeight: '700' }, label: { color: '#142F44', fontSize: 16, fontWeight: '700' },
  body: { color: '#334B5D', fontSize: 16, lineHeight: 24 }, caption: { color: '#52697A', fontSize: 13, lineHeight: 20 },
  badge: { color: '#725000', fontSize: 12, fontWeight: '800' },
  input: { backgroundColor: '#FFFFFF', borderColor: '#A9CCD0', borderWidth: 1, borderRadius: 16, minHeight: 110, padding: 16, color: '#142F44', fontSize: 16, lineHeight: 24 },
  context: { backgroundColor: '#E4F2F3', padding: 16, gap: 12, borderRadius: 18 }, record: { backgroundColor: '#FFFFFF', padding: 18, gap: 12, borderRadius: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'space-between' },
  button: { backgroundColor: '#126271', padding: 16, borderRadius: 14, minHeight: 48 }, buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  secondary: { minHeight: 44, justifyContent: 'center', padding: 12, borderWidth: 1, borderColor: '#A9CCD0', borderRadius: 12 }, link: { color: '#126271', fontSize: 14, fontWeight: '700' },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
