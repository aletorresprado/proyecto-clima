import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerStyle: { backgroundColor: '#F3F7FA' }, headerTintColor: '#142F44' }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="explore" options={{ title: 'Detalle del ejemplo' }} />
        <Stack.Screen name="wind-demo" options={{ title: 'Pruebas ficticias de viento' }} />
      </Stack>
    </>
  );
}
