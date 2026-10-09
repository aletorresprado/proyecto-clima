import { ScrollView, StyleSheet, Text } from 'react-native';
import { demoWeather } from '@/data/demo-weather';
export default function NoticeDetailScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.page}>
      <Text style={styles.badge}>DEMOSTRACIÓN · DATOS FICTICIOS</Text>
      <Text accessibilityRole="header" style={styles.title}>{demoWeather.notice.title}</Text>
      <Text style={styles.text}>Lugar: {demoWeather.place}</Text>
      <Text style={styles.text}>{demoWeather.notice.validity}</Text>
      <Text style={styles.heading}>Motivo del ejemplo</Text>
      <Text style={styles.text}>{demoWeather.notice.reason}</Text>
      <Text style={styles.heading}>Acción sugerida de ejemplo</Text>
      <Text style={styles.text}>{demoWeather.notice.action}</Text>
      <Text style={styles.text}>Fuente: {demoWeather.source}</Text>
      <Text style={styles.text}>Actualización ficticia: {demoWeather.updated}</Text>
      <Text style={styles.text}>Esta pantalla no informa un riesgo real. La app admitirá otras ubicaciones; Yerba Buena es solo el lugar de este ejemplo.</Text>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F3F7FA' },
  content: { padding: 24, gap: 20, maxWidth: 640, width: '100%', alignSelf: 'center' },
  badge: { color: '#725000', backgroundColor: '#FFF3D5', padding: 12, fontWeight: '700' },
  title: { color: '#142F44', fontSize: 28, fontWeight: '800' },
  heading: { color: '#142F44', fontSize: 20, fontWeight: '700' },
  text: { color: '#334B5D', fontSize: 16, lineHeight: 25 },
});
