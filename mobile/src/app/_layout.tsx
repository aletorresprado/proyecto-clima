import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { EarthquakeMonitorProvider } from '@/components/earthquake-monitor';
export default function RootLayout() {
  return (
    <EarthquakeMonitorProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerStyle: { backgroundColor: '#F3F7FA' }, headerTintColor: '#142F44' }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="explore" options={{ title: 'Detalle del ejemplo' }} />
        <Stack.Screen name="account" options={{ title: 'Tu cuenta' }} />
        <Stack.Screen name="wind-demo" options={{ title: 'Pruebas ficticias de viento' }} />
        <Stack.Screen name="earthquake-demo" options={{ title: 'Pruebas ficticias de sismos' }} />
        <Stack.Screen name="uv-demo" options={{ title: 'Pruebas ficticias de UV' }} />
        <Stack.Screen name="precipitation-demo" options={{ title: 'Pruebas ficticias de precipitación' }} />
        <Stack.Screen name="visibility-demo" options={{ title: 'Pruebas ficticias de visibilidad' }} />
        <Stack.Screen name="pressure-demo" options={{ title: 'Pruebas ficticias de presión' }} />
      </Stack>
    </EarthquakeMonitorProvider>
  );
}
