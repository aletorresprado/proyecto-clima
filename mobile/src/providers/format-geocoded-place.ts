// No usamos calle, número, dirección completa ni nombres de edificios.
export function formatGeocodedPlace(address: {
  city?: string | null;
  district?: string | null;
  subregion?: string | null;
  region?: string | null;
  country?: string | null;
}): string | null {
  const clean = (value: unknown) => typeof value === 'string' ? value.trim() : '';
  const city = clean(address.city);
  const area = clean(address.district) || clean(address.subregion);
  if (!city && !area) return null;
  const parts = [city || area, clean(address.region), clean(address.country)].filter(Boolean);
  const unique = parts.filter((part, index) => parts.findIndex((other) => other.toLocaleLowerCase() === part.toLocaleLowerCase()) === index);
  return `${city ? '' : 'Zona: '}${unique.join(', ')}`;
}
