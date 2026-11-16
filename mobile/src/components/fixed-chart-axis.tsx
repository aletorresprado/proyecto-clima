import { StyleSheet, Text, View } from 'react-native';

export function FixedChartAxis({ ticks, height, unit }: {
  ticks: readonly { value: number; y: number }[]; height: number; unit: string;
}) {
  return <View style={[styles.axis, { height }]}>
    {ticks.map((tick, index) => <Text key={index} accessibilityLabel={`${tick.value.toLocaleString('es-AR', { maximumFractionDigits: 2 })} ${unit}`} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={[styles.value, { top: tick.y - 8 }]}>{tick.value.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</Text>)}
    <Text style={styles.unit}>{unit}</Text>
  </View>;
}
const styles = StyleSheet.create({
  axis: { width: 56, flexShrink: 0, position: 'relative', backgroundColor: '#F3F8FB', borderRightWidth: 1, borderRightColor: '#BCD2DE' },
  value: { position: 'absolute', left: 2, right: 8, textAlign: 'right', color: '#52697A', fontSize: 11, lineHeight: 16 },
  unit: { position: 'absolute', bottom: 8, left: 0, right: 8, textAlign: 'right', color: '#52697A', fontSize: 11, fontWeight: '700' },
});
