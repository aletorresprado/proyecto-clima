import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function CompactEvaluation({ title, icon, summary, action, tone, place, context, example, children }: {
  title: string; icon: string; summary: string; action?: string;
  tone: 'notice' | 'information' | 'insufficient'; place: string; context: string;
  example: boolean; children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(example);
  return <View style={[styles.card, tone === 'notice' && styles.notice]}>
    <View style={styles.header}>
      <Text style={styles.icon} accessibilityElementsHidden importantForAccessibility="no">{icon}</Text>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        <Text style={styles.caption}>{example ? 'DATOS FICTICIOS · ' : ''}{place}</Text>
      </View>
    </View>
    <Text style={styles.summary}>{summary}</Text>
    {!!action && <Text style={styles.action}>{action}</Text>}
    <Text style={styles.caption}>{context}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={`${expanded ? 'Cerrar detalles de' : 'Ampliar'} ${title}`} accessibilityState={{ expanded }} onPress={() => setExpanded((open) => !open)} style={({ pressed }) => [styles.button, expanded && styles.openButton, pressed && styles.pressed]}>
      <Text style={[styles.link, expanded && styles.openText]}>{expanded ? 'Cerrar detalles' : 'Ampliar'}</Text>
      <Text style={[styles.symbol, expanded && styles.openText]} accessibilityElementsHidden importantForAccessibility="no">{expanded ? '−' : '+'}</Text>
    </Pressable>
    {expanded && <>
      {children}
      <Pressable accessibilityRole="button" accessibilityLabel={`Cerrar detalles de ${title}`} accessibilityState={{ expanded: true }} onPress={() => setExpanded(false)} style={({ pressed }) => [styles.footerButton, pressed && styles.pressed]}>
        <Text style={styles.openText}>Cerrar detalles −</Text>
      </Pressable>
    </>}
  </View>;
}
const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#D3E2E9', padding: 16, gap: 8 },
  notice: { backgroundColor: '#FFF3D5', borderColor: '#B88421' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { fontSize: 30 }, heading: { flex: 1, gap: 3 },
  title: { color: '#142F44', fontSize: 19, fontWeight: '700' },
  caption: { color: '#52697A', fontSize: 12, lineHeight: 18 },
  summary: { color: '#334B5D', fontSize: 16, lineHeight: 24 },
  action: { color: '#142F44', fontSize: 15, lineHeight: 22, fontWeight: '700' },
  button: { minHeight: 48, flexDirection: 'row', gap: 16, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 18, backgroundColor: '#126271', borderRadius: 14, borderWidth: 1, borderColor: '#126271', marginTop: 4 },
  openButton: { backgroundColor: '#E4F2F3', borderColor: '#A9CCD0' },
  pressed: { opacity: 0.75 },
  link: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', flexShrink: 1 },
  symbol: { color: '#FFFFFF', fontSize: 24, fontWeight: '600' },
  openText: { color: '#126271' },
  footerButton: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#E4F2F3', borderRadius: 12, borderWidth: 1, borderColor: '#A9CCD0' },
});
