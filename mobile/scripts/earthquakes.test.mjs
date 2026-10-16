import test from 'node:test';
import assert from 'node:assert/strict';
import { readEarthquakeIds, writeEarthquakeIds } from '../src/providers/earthquake-history.ts';
import { earthquakeUrl, parseEarthquakes, distanceKm, unseenEarthquakes, fetchEarthquakes } from '../src/providers/earthquakes.ts';
const now = Date.UTC(2026, 9, 16, 15);
const center = { latitude: -26, longitude: -65 };
const feature = (id = 'a', time = now - 1000, coords = [-65, -26, 10]) => ({ type: 'Feature', id, properties: { type: 'earthquake', time, mag: 0, place: 'Ejemplo ficticio' }, geometry: { type: 'Point', coordinates: coords } });
const payload = (...features) => ({ type: 'FeatureCollection', features });
test('IDs persisten al reconstruir estado; claves ficticia y real quedan aisladas', async () => {
  const memory = new Map();
  const storage = { getItem: async (key) => memory.get(key) ?? null, setItem: async (key, value) => { memory.set(key, value); } };
  const first = await readEarthquakeIds(storage, 'demo');
  assert.equal(first.size, 0);
  first.add('a'); await writeEarthquakeIds(storage, 'demo', first);
  const restored = await readEarthquakeIds(storage, 'demo');
  const events = parseEarthquakes(payload(feature('a'), feature('b')), center, now);
  assert.deepEqual(unseenEarthquakes(events, restored).map((e) => e.id), ['b']);
  assert.equal((await readEarthquakeIds(storage, 'real')).size, 0);
  await writeEarthquakeIds(storage, 'real', new Set(['real-id']));
  await writeEarthquakeIds(storage, 'demo', new Set());
  assert.deepEqual([...(await readEarthquakeIds(storage, 'real'))], ['real-id']);
});
test('historial corrupto y fallos de almacenamiento no se convierten en historial vacío', async () => {
  for (const raw of ['invalid', '{}', '[null]', '[""]', '[42]']) {
    await assert.rejects(readEarthquakeIds({ getItem: async () => raw }, 'demo'));
  }
  await assert.rejects(readEarthquakeIds({ getItem: async () => { throw new Error('lectura fallida'); } }, 'demo'), /lectura/);
  await assert.rejects(writeEarthquakeIds({ setItem: async () => { throw new Error('escritura fallida'); } }, 'demo', new Set(['a'])), /escritura/);
});
test('consulta radio en grados, ventana de 24 horas, tipo y orden', () => {
  const url = new URL(earthquakeUrl(center, now));
  assert.equal(url.searchParams.get('maxradius'), '1.8');
  assert.equal(url.searchParams.get('maxradiuskm'), null);
  assert.equal(url.searchParams.get('starttime'), new Date(now - 86400000).toISOString());
  assert.equal(url.searchParams.get('eventtype'), 'earthquake');
  assert.throws(() => earthquakeUrl({ latitude: 91, longitude: 0 }, now));
});
test('GeoJSON longitud/latitud, cero real, ausentes, distancia y orden', () => {
  const a = feature('a', now - 1000); a.properties.mag = null;
  const events = parseEarthquakes(payload(feature('b', now - 2000), a), center, now);
  assert.equal(events[0].id, 'a'); assert.equal(events[0].magnitude, null);
  assert.equal(events[1].magnitude, 0); assert.equal(events[0].distanceKm, 0);
  assert.ok(Math.abs(distanceKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1.8 }) - 200.15) < 0.1);
});
test('excluye pasado fuera de ventana, futuro, duplicados y epicentro lejano', () => {
  const events = parseEarthquakes(payload(feature(), feature(), feature('past', now - 86400001), feature('future', now + 1), feature('far', now - 1000, [0, 0, 1])), center, now);
  assert.deepEqual(events.map((e) => e.id), ['a']);
});
test('respuesta vacía válida vs datos inválidos no se equiparan', () => {
  assert.deepEqual(parseEarthquakes(payload(), center, now), []);
  assert.throws(() => parseEarthquakes({}, center, now));
  assert.throws(() => parseEarthquakes(payload(feature('bad', NaN)), center, now));
  assert.throws(() => parseEarthquakes(payload(feature('bad', now - 1000, [200, 0])), center, now));
});
test('IDs vistos no repiten aviso; publicación tardía de otro ID sí aparece', () => {
  const events = parseEarthquakes(payload(feature('new'), feature('late', now - 3600000)), center, now);
  const seen = new Set(['new']);
  assert.deepEqual(unseenEarthquakes(events, seen).map((e) => e.id), ['late']);
  assert.deepEqual([...seen], ['new']);
  assert.deepEqual(unseenEarthquakes(events, new Set(['new', 'late'])), []);
});
test('204 vacío, fallo nativo y recuperación sin confundir error con ausencia', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ status: 204 });
    assert.deepEqual(await fetchEarthquakes(center, new AbortController().signal, now), []);
    globalThis.fetch = async () => { throw new Error('java.net.UnknownHostException'); };
    await assert.rejects(fetchEarthquakes(center, new AbortController().signal, now), /conectar/);
    globalThis.fetch = async () => ({ status: 200, ok: true, json: async () => payload(feature()) });
    assert.equal((await fetchEarthquakes(center, new AbortController().signal, now)).length, 1);
  } finally { globalThis.fetch = original; }
});
