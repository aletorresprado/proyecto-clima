import { isRunningInExpoGo } from 'expo';
import { Link } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { accountErrorMessage } from '@/providers/account-messages';
import type { Account } from '@/providers/account';

export default function AccountScreen() {
  const available = Platform.OS === 'android' && !isRunningInExpoGo();
  const [account, setAccount] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [attempt, setAttempt] = useState(0);
  const locked = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    let active = true;
    let unsubscribe: (() => void) | undefined;
    if (available) {
      setReady(false);
      setMessage('');
      void import('@/providers/account').then((service) => service.observeAccount((user) => {
        if (active) { setAccount(user); setReady(true); }
      })).then((stop) => { if (active) unsubscribe = stop; else stop(); })
        .catch((error: unknown) => { if (active) setMessage(accountErrorMessage(error)); });
    }
    return () => { active = false; mounted.current = false; unsubscribe?.(); };
  }, [available, attempt]);

  async function act(kind: 'enter' | 'leave') {
    if (locked.current || !ready || !available) return;
    locked.current = true;
    setBusy(true);
    setMessage('');
    try {
      const service = await import('@/providers/account');
      const result = kind === 'enter' ? await service.enterGoogleAccount() : await service.leaveAccount();
      if (mounted.current) setMessage(result === 'cancelled' ? 'Acceso cancelado. Podés seguir sin cuenta.'
        : result === 'google-cleanup-failed' ? 'La sesión de la app se cerró. No pudimos limpiar la selección de cuenta de Google; comprobá la cuenta al volver a entrar.'
        : kind === 'leave' ? 'Sesión cerrada.' : 'Sesión iniciada.');
    } catch (error) {
      if (mounted.current) setMessage(accountErrorMessage(error));
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
    <Text accessibilityRole="header" style={styles.title}>Tu cuenta</Text>
    <Text style={styles.body}>El clima y los sismos se pueden consultar sin iniciar sesión.</Text>
    <View style={styles.card}>
      {!available ? <Text style={styles.body}>El acceso con Google se probará en la app de desarrollo para Android. En Expo Go podés seguir usando el clima sin cuenta.</Text>
        : !ready ? <>
          {!message && <ActivityIndicator accessibilityLabel="Restaurando sesión" />}
          <Text style={styles.body}>{message ? 'No pudimos recuperar el estado de la cuenta.' : 'Comprobando tu sesión…'}</Text>
          {!!message && <Pressable accessibilityRole="button" style={styles.button} onPress={() => setAttempt((value) => value + 1)}><Text style={styles.buttonText}>Reintentar</Text></Pressable>}
        </> : account ? <>
          <Text style={styles.heading}>Sesión iniciada</Text>
          <Text style={styles.body}>{account.displayName || 'Cuenta de Google'}</Text>
          {!!account.email && <Text selectable style={styles.body}>{account.email}</Text>}
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy }} disabled={busy} style={[styles.button, busy && styles.disabled]} onPress={() => void act('leave')}><Text style={styles.buttonText}>Cerrar sesión</Text></Pressable>
        </> : <>
          <Text style={styles.heading}>Acceso opcional</Text>
          <Text style={styles.body}>Al continuar, Google y Firebase usarán tu cuenta para identificarte y conservar la sesión en este dispositivo. Todavía no se guardan lugares ni preferencias en la nube.</Text>
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy }} disabled={busy} style={[styles.button, busy && styles.disabled]} onPress={() => void act('enter')}><Text style={styles.buttonText}>Entrar con Google</Text></Pressable>
        </>}
      {busy && <ActivityIndicator accessibilityLabel="Procesando cuenta" />}
      {!!message && <Text accessibilityLiveRegion="polite" style={styles.body}>{message}</Text>}
    </View>
    <Text style={styles.caption}>Esta función no solicita datos de salud ni permisos de ubicación. Cerrar sesión no elimina tu cuenta de Google.</Text>
    <Link href="/" style={styles.link}>Volver al clima</Link>
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F3F7FA' },
  content: { padding: 24, gap: 20, maxWidth: 640, width: '100%', alignSelf: 'center' },
  title: { color: '#142F44', fontSize: 28, fontWeight: '800' },
  heading: { color: '#142F44', fontSize: 20, fontWeight: '700' },
  body: { color: '#334B5D', fontSize: 16, lineHeight: 24 },
  caption: { color: '#52697A', fontSize: 14, lineHeight: 21 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, gap: 16 },
  button: { backgroundColor: '#163F57', borderRadius: 12, padding: 16, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  link: { color: '#126271', fontSize: 16, fontWeight: '700', paddingVertical: 12 },
});
