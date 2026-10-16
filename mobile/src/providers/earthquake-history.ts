type Storage = { getItem: (key: string) => Promise<string | null>; setItem: (key: string, value: string) => Promise<void> };

export async function readEarthquakeIds(storage: Storage, key: string): Promise<Set<string>> {
  const raw = await storage.getItem(key);
  if (raw === null) return new Set();
  const ids: unknown = JSON.parse(raw);
  if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string' && id.trim().length > 0)) throw new Error('IDs guardados inválidos.');
  return new Set(ids);
}

export async function writeEarthquakeIds(storage: Storage, key: string, ids: ReadonlySet<string>) {
  await storage.setItem(key, JSON.stringify([...ids]));
}
