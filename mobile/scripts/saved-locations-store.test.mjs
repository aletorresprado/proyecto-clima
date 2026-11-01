import assert from 'node:assert/strict';
import test from 'node:test';
import { createSavedLocationsStore, savedPlacesMessage } from '../src/providers/saved-locations-store.ts';
import { createDemoPlacesStore } from '../src/providers/saved-locations-demo.ts';

const place = { label: 'Lugar ficticio', latitude: -26, longitude: -65 };
const row = { ...place, id: 'ficticio-1' };
const transport = (overrides = {}) => ({ list: async () => ({ places: [row], nextCursor: null }), save: async () => {}, remove: async () => {}, ...overrides });

test('sin sesión o con propietario diferente no inicia operaciones', async () => {
  let calls = 0;
  const service = createSavedLocationsStore(transport({ list: async () => { calls++; }, save: async () => { calls++; }, remove: async () => { calls++; } }), () => null);
  await assert.rejects(service.list('a'));
  await assert.rejects(service.save('a', place));
  await assert.rejects(service.remove('a', 'ficticio-1'));
  const other = createSavedLocationsStore(transport(), () => 'b');
  await assert.rejects(other.list('a'));
  assert.equal(calls, 0);
});
test('descarta lectura tardía después de cambiar usuario', async () => {
  let uid = 'a'; let release;
  const service = createSavedLocationsStore(transport({ list: () => new Promise((resolve) => { release = resolve; }) }), () => uid);
  const pending = service.list('a');
  uid = 'b'; release({ places: [row], nextCursor: null });
  await assert.rejects(pending, (error) => error.code === 'places/session-changed');
});
test('no confirma escritura tardía a una sesión diferente', async () => {
  let uid = 'a'; let release; let owner;
  const service = createSavedLocationsStore(transport({ save: (value) => { owner = value; return new Promise((resolve) => { release = resolve; }); } }), () => uid);
  const pending = service.save('a', place);
  uid = 'b'; release();
  await assert.rejects(pending, (error) => error.code === 'places/session-changed');
  assert.equal(owner, 'a');
});
test('rechaza rutas inválidas y datos extra antes de acceder al transporte', async () => {
  let calls = 0;
  const service = createSavedLocationsStore(transport({ save: async () => { calls++; }, remove: async () => { calls++; } }), () => 'a');
  await assert.rejects(service.save('a', { ...place, email: 'ficticio' }));
  for (const id of ['', '../otro', 'otro/lugar']) await assert.rejects(service.remove('a', id));
  await assert.rejects(service.list('a', '../otro'));
  assert.equal(calls, 0);
});
test('valida listas externas sin aceptar coordenadas inválidas o más de 20 filas', async () => {
  for (const places of [[{ ...row, latitude: 91 }], [{ ...row, id: '../otro' }], Array(21).fill(row)]) {
    const service = createSavedLocationsStore(transport({ list: async () => ({ places, nextCursor: null }) }), () => 'a');
    await assert.rejects(service.list('a'));
  }
});
test('demo conserva listas por usuario y paginación sin mezclar datos', async () => {
  let uid = 'a'; const service = createDemoPlacesStore(() => uid);
  for (let i = 0; i < 21; i++) await service.save('a', { ...place, label: `Lugar ficticio ${i}` });
  const first = await service.list('a'); assert.equal(first.places.length, 20);
  const second = await service.list('a', first.nextCursor); assert.equal(second.places.length, 1);
  assert.equal(second.nextCursor, null);
  assert.ok(!first.places.some((saved) => saved.id === second.places[0].id));
  uid = 'b'; assert.equal((await service.list('b')).places.length, 0);
  await assert.rejects(service.remove('a', first.places[0].id));
  uid = 'a'; await service.remove('a', first.places[0].id);
  assert.equal((await service.list('a')).places.length, 20);
});
test('fallos ficticios no confirman guardado o eliminación y permiten reintentar', async () => {
  let failed = true; const service = createDemoPlacesStore(() => 'a', () => failed);
  await assert.rejects(service.save('a', place));
  failed = false; assert.equal((await service.list('a')).places.length, 0);
  await service.save('a', place); const saved = (await service.list('a')).places[0];
  failed = true; await assert.rejects(service.remove('a', saved.id));
  failed = false; assert.equal((await service.list('a')).places.length, 1);
});
test('mensajes no imprimen detalles externos o datos privados', () => {
  assert.ok(!savedPlacesMessage(new Error('ficticio-privado')).includes('ficticio-privado'));
  assert.match(savedPlacesMessage({ code: 'places/session-changed' }), /sesión cambió/);
});
