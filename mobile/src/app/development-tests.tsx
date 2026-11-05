import { Link, Redirect } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';

const scenarios = [
  { href: '/wind-demo', label: 'Viento', description: 'Umbral experimental, datos faltantes y consulta vencida.' },
  { href: '/uv-demo', label: 'Índice UV', description: 'Protección, refuerzo y estados sin información suficiente.' },
  { href: '/precipitation-demo', label: 'Precipitación', description: 'Probabilidades e intervalos horarios ficticios.' },
  { href: '/visibility-demo', label: 'Visibilidad', description: 'Criterio experimental, datos parciales y vencimiento.' },
  { href: '/pressure-demo', label: 'Variación de presión', description: 'Aumento, descenso, datos ausentes y vencimiento.' },
  { href: '/earthquake-demo', label: 'Sismos', description: 'Eventos simulados y repetición del aviso visual.' },
  { href: '/saved-locations-demo', label: 'Lugares guardados', description: 'Usuarios ficticios, almacenamiento en memoria y fallos simulados.' },
  { href: '/card-preferences-demo', label: 'Preferencias', description: 'Selección por usuario ficticio, restablecimiento y fallos simulados.' },
] as const;

export default function DevelopmentTestsScreen() {
  if (!__DEV__) return <Redirect href="/" />;
  return <ScrollView contentContainerStyle={styles.page}>
    <Text accessibilityRole="header" style={styles.title}>Pruebas de desarrollo</Text>
    <Text style={styles.body}>Escenarios con datos ficticios para comprobar la app. No describen el clima real ni son alertas oficiales. Cada pantalla conserva sus controles de prueba.</Text>
    {scenarios.map(({ href, label, description }) => <Link key={href} href={href} style={styles.link}>
      {label} →{'\n'}<Text style={styles.caption}>{description}</Text>
    </Link>)}
  </ScrollView>;
}
const styles = StyleSheet.create({
  page: { padding: 24, gap: 16, backgroundColor: '#F3F7FA', maxWidth: 640, width: '100%', alignSelf: 'center' },
  title: { color: '#142F44', fontSize: 24, fontWeight: '700' },
  body: { color: '#334B5D', fontSize: 16, lineHeight: 24 },
  link: { color: '#126271', fontSize: 18, fontWeight: '700', padding: 18, backgroundColor: '#FFFFFF', borderRadius: 16 },
  caption: { color: '#52697A', fontSize: 14, fontWeight: '400', lineHeight: 22 },
});
