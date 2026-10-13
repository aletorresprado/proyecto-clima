import assert from 'node:assert/strict';
import test from 'node:test';
import { parseLocationResults, searchLocations } from '../src/providers/search-locations.ts';

const valid = { id: 1, name: 'Lugar de prueba', latitude: -26, longitude: -65, admin1: 'Provincia de prueba', country: 'Argentina', timezone: 'America/Argentina/Tucuman' };

test('una respuesta sin coincidencias se distingue de una respuesta rota', () => {
  assert.deepEqual(parseLocationResults({}), []);
  assert.deepEqual(parseLocationResults({ results: [] }), []);
  for (const payload of [null, [], { results: null }, { error: true }]) assert.throws(() => parseLocationResults(payload));
});
test('coordenadas ausentes, no numéricas o fuera de rango no se pueden elegir', () => {
  for (const latitude of [undefined, '26', NaN, 91, -91]) {
    assert.throws(() => parseLocationResults({ results: [{ ...valid, latitude }] }));
  }
  assert.throws(() => parseLocationResults({ results: [{ ...valid, longitude: 181 }] }));
  const places = parseLocationResults({ results: [{ ...valid, latitude: 91 }, valid, valid] });
  assert.equal(places.length, 1);
  assert.equal(places[0].label, 'Lugar de prueba, Provincia de prueba, Argentina');
});
test('una zona horaria inválida queda ausente, sin inventar una sustituta', () => {
  assert.equal(parseLocationResults({ results: [{ ...valid, timezone: 'zona-inexistente' }] })[0].timezone, null);
  assert.equal(parseLocationResults({ results: [valid] })[0].timezone, valid.timezone);
});
test('la cancelación evita aceptar una respuesta pendiente', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (_url, options) => new Promise((resolve, reject) => {
    const cancel = () => reject(new DOMException('Cancelado', 'AbortError'));
    if (options.signal.aborted) cancel();
    else options.signal.addEventListener('abort', cancel, { once: true });
  });
  try {
    const controller = new AbortController();
    const request = searchLocations('Lugar de prueba', controller.signal);
    controller.abort();
    await assert.rejects(request, { name: 'AbortError' });
  } finally { globalThis.fetch = originalFetch; }
});

test('un error nativo de Android muestra un mensaje claro y permite reintentar', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('fetch failed: java.net.UnknownHostException: servidor de prueba'); };
  try {
    await assert.rejects(searchLocations('Lugar de prueba', new AbortController().signal), {
      message: 'No pudimos conectar. Revisá tu conexión y reintentá.',
    });
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ results: [valid] }) });
    const places = await searchLocations('Lugar de prueba', new AbortController().signal);
    assert.equal(places.length, 1);
  } finally { globalThis.fetch = originalFetch; }
});
