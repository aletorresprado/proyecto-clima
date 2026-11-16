import { isRunningInExpoGo } from 'expo';
import { Redirect } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { diaryStorageMessage } from '@/providers/diary-storage-errors';

const SAMPLE = 'Prueba ficticia de cifrado: energía 🌤️';
function validateSample(value: unknown): { note: string; createdAt: number } {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== 2
    || !('note' in value) || value.note !== SAMPLE || !('createdAt' in value)
    || typeof value.createdAt !== 'number' || !Number.isFinite(value.createdAt) || value.createdAt <= 0) throw new Error('Prueba inválida.');
  return { note: SAMPLE, createdAt: value.createdAt };
}

export default function DiaryStorageTest() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Todavía no se ejecutó ninguna operación de almacenamiento.');
  const [confirm, setConfirm] = useState(false);
  const [diagnostic, setDiagnostic] = useState('');
  const lock = useRef(false), mounted = useRef(true);
  const supported = Platform.OS === 'android' && !isRunningInExpoGo();
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  if (!__DEV__) return <Redirect href="/" />;
  async function run(action: 'write' | 'read' | 'clear') {
    if (lock.current || !supported) return;
    lock.current = true; setBusy(true); setConfirm(false);
    try {
      const { createAndroidDiaryVault } = await import('@/providers/encrypted-diary-android');
      const vault = await createAndroidDiaryVault(validateSample, 'test');
      let result: string;
      if (action === 'write') {
        await vault.write({ note: SAMPLE, createdAt: Date.now() });
        result = 'Prueba ficticia cifrada guardada. Cerrá la app, reabrí y tocá Comprobar lectura.';
      } else if (action === 'read') {
        const record = await vault.read();
        result = record ? 'Lectura y descifrado de la prueba ficticia correctos.' : 'No hay prueba cifrada guardada.';
      } else {
        await vault.clear(); result = 'Prueba cifrada y su clave de prueba eliminadas.';
      }
      if (mounted.current) setMessage(result);
    } catch (error) {
      if (mounted.current) setMessage(diaryStorageMessage(error));
    } finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  async function diagnose() {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    try {
      const { diagnoseDiaryModules } = await import('@/providers/encrypted-diary-android');
      const modules = diagnoseDiaryModules();
      const yes = (value: boolean) => value ? 'sí' : 'no';
      if (mounted.current) setDiagnostic(`Android propio: ${yes(modules.androidOwnApp)} · AES: ${yes(modules.aes)} · SecureStore: ${yes(modules.secureStore)} · Codificación de texto: ${yes(modules.textEncoding)}.`);
    } catch { if (mounted.current) setDiagnostic('No se pudo cargar el diagnóstico local. No se modificó el almacenamiento.'); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  return <ScrollView contentContainerStyle={styles.page}>
    <Text style={styles.badge}>PRUEBA TÉCNICA · SOLO DATOS FICTICIOS</Text>
    <Text accessibilityRole="header" style={styles.title}>Cifrado local del diario</Text>
    <Text style={styles.body}>Esta pantalla usa un texto inventado fijo, sin datos personales, cuenta, GPS o Firebase. La clave y el bloque cifrado están separados de los del futuro diario real.</Text>
    <Text style={styles.body}>A diferencia de la demo anterior, esta prueba sí persiste en el teléfono. Necesita una app Android recompilada con Expo Crypto y SecureStore; la instalada previamente puede no incluirlos.</Text>
    {!supported && <Text style={styles.body}>Prueba disponible solo en la app Android propia, no Expo Go ni web.</Text>}
    <Pressable accessibilityRole="button" disabled={busy} onPress={() => void diagnose()} style={styles.secondary}><Text style={styles.link}>Diagnosticar módulos (sin guardar)</Text></Pressable>
    {!!diagnostic && <Text accessibilityLiveRegion="polite" style={styles.body}>{diagnostic}</Text>}
    {(['write', 'read'] as const).map((action) => <Pressable key={action} accessibilityRole="button" disabled={busy || !supported} onPress={() => void run(action)} style={[styles.button, (busy || !supported) && styles.disabled]}><Text style={styles.buttonText}>{action === 'write' ? 'Guardar prueba cifrada' : 'Comprobar lectura'}</Text></Pressable>)}
    <Text accessibilityLiveRegion="polite" style={styles.body}>{busy ? 'Procesando prueba…' : message}</Text>
    {confirm ? <>
      <Text style={styles.body}>¿Eliminar únicamente el bloque y la clave de esta prueba ficticia?</Text>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => void run('clear')} style={styles.button}><Text style={styles.buttonText}>Confirmar eliminación de prueba</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => setConfirm(false)} style={styles.secondary}><Text style={styles.link}>Cancelar</Text></Pressable>
    </> : <Pressable accessibilityRole="button" disabled={busy || !supported} onPress={() => setConfirm(true)} style={styles.secondary}><Text style={styles.link}>Eliminar solo la prueba cifrada</Text></Pressable>}
    <Text style={styles.body}>Prueba propuesta: guardar, salir/reabrir y leer; borrar y comprobar que ya no existe. Todavía no se habilita el diario con notas personales reales.</Text>
  </ScrollView>;
}
const styles = StyleSheet.create({
  page: { padding: 24, gap: 16, backgroundColor: '#F3F7FA', maxWidth: 640, width: '100%', alignSelf: 'center' },
  badge: { color: '#725000', fontWeight: '800', fontSize: 12 }, title: { color: '#142F44', fontWeight: '700', fontSize: 24 },
  body: { color: '#334B5D', fontSize: 16, lineHeight: 24 }, button: { padding: 16, minHeight: 48, backgroundColor: '#126271', borderRadius: 14 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }, secondary: { minHeight: 44, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#A9CCD0' },
  link: { color: '#126271', fontWeight: '700', fontSize: 15 }, disabled: { opacity: 0.5 },
});
