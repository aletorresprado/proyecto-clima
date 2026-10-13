import * as Location from 'expo-location';
import { formatGeocodedPlace } from './format-geocoded-place';

async function resolvePlaceName(latitude: number, longitude: number): Promise<string | null> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const addresses = await Promise.race([
      Location.reverseGeocodeAsync({ latitude, longitude }),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error('Geocodificación no disponible')), 8000);
      }),
    ]);
    for (const address of addresses) {
      if (!address || typeof address !== 'object') continue;
      const label = formatGeocodedPlace(address);
      if (label) return label;
    }
    return null;
  } catch {
    // Una falla al resolver el nombre no invalida las coordenadas obtenidas.
    return null;
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}

export async function suggestDeviceLocation() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) {
    throw new Error(permission.canAskAgain
      ? 'No diste permiso de ubicación. Podés elegir un lugar manualmente.'
      : 'El permiso está bloqueado. Podés elegir un lugar manualmente o habilitar ubicación para Expo Go en Ajustes.');
  }
  if (!(await Location.hasServicesEnabledAsync())) {
    throw new Error('La ubicación del teléfono está desactivada. Activala o elegí un lugar manualmente.');
  }

  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error('No pudimos obtener ubicación a tiempo. Reintentá o elegí un lugar manualmente.')), 15000);
      }),
    ]);
    const { latitude, longitude } = result.coords;
    if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
        !Number.isFinite(longitude) || Math.abs(longitude) > 180 ||
        !Number.isFinite(result.timestamp) || Math.abs(Date.now() - result.timestamp) > 120000) {
      throw new Error('La ubicación recibida no es válida o está vencida. Reintentá o elegí un lugar manualmente.');
    }
    const placeName = await resolvePlaceName(latitude, longitude);
    return { latitude, longitude, placeName };
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}
