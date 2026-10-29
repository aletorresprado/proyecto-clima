import { isRunningInExpoGo } from 'expo';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Account } from '@/providers/account';

export function AccountLink() {
  const available = Platform.OS === 'android' && !isRunningInExpoGo();
  const [account, setAccount] = useState<Account | null>();
  const [failed, setFailed] = useState(false);

  useFocusEffect(useCallback(() => {
    if (!available) return;
    let active = true;
    let unsubscribe: (() => void) | undefined;
    setAccount(undefined);
    setFailed(false);
    void import('@/providers/account').then((service) => service.observeAccount((user) => {
      if (active) setAccount(user);
    })).then((stop) => { if (active) unsubscribe = stop; else stop(); })
      .catch(() => { if (active) { setAccount(undefined); setFailed(true); } });
    return () => { active = false; unsubscribe?.(); };
  }, [available]));

  const name = account?.displayName?.trim() || 'Tu cuenta';
  const initials = account?.displayName?.trim().split(/\s+/).slice(0, 2)
    .map((part) => Array.from(part)[0]).join('').toLocaleUpperCase('es') || '✓';
  const status = account ? 'Sesión iniciada' : !available || account === null
    ? 'Acceso opcional' : failed ? 'Ver estado de sesión' : 'Comprobando sesión…';

  return <Link href="/account" asChild>
    <Pressable accessibilityRole="link" accessibilityLabel={`${name}. ${status}. Abrir tu cuenta.`} style={styles.card}>
      <View style={[styles.avatar, account && styles.signedIn]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Text style={styles.initials}>{account ? initials : '○'}</Text>
      </View>
      <View style={styles.details}>
        <Text numberOfLines={1} style={styles.name}>{name}</Text>
        <Text style={styles.status}>{status}</Text>
      </View>
      <Text style={styles.arrow} accessibilityElementsHidden>→</Text>
    </Pressable>
  </Link>;
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: '#FFFFFF', borderRadius: 18 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#52697A', alignItems: 'center', justifyContent: 'center' },
  signedIn: { backgroundColor: '#256A6B' },
  initials: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  details: { flex: 1, gap: 3 },
  name: { color: '#142F44', fontSize: 16, fontWeight: '700' },
  status: { color: '#52697A', fontSize: 14 },
  arrow: { color: '#126271', fontSize: 22 },
});
